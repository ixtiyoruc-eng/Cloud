"use strict";
/* =========================================================
   PODO MASTER — pedolog CRM server
   Node.js >= 22.13, tashqi kutubxonasiz (node:http + node:sqlite)
   ========================================================= */
process.env.TZ = process.env.TZ || "Asia/Tashkent";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const PORT = +process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const DATA = path.resolve(process.env.DATA_DIR || path.join(__dirname, "data"));
const PHOTOS = path.join(DATA, "photos");
const TRUST_PROXY = process.env.TRUST_PROXY !== "0";
const SESSION_DAYS = +process.env.SESSION_DAYS || 14;
fs.mkdirSync(PHOTOS, { recursive: true });

/* ---------- database ---------- */
const db = new DatabaseSync(path.join(DATA, "podo.db"));
db.exec(`
PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;
CREATE TABLE IF NOT EXISTS docs(coll TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, updated INTEGER NOT NULL, PRIMARY KEY(coll,id));
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL, created INTEGER NOT NULL, last INTEGER NOT NULL, ip TEXT, ua TEXT);
CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE IF NOT EXISTS audit(ts INTEGER NOT NULL, user_id TEXT, action TEXT, coll TEXT, doc_id TEXT, info TEXT);
CREATE INDEX IF NOT EXISTS audit_ts ON audit(ts);
`);
const Q = {
  all: db.prepare("SELECT data FROM docs WHERE coll=?"),
  get: db.prepare("SELECT data FROM docs WHERE coll=? AND id=?"),
  put: db.prepare("INSERT INTO docs(coll,id,data,updated) VALUES(?,?,?,?) ON CONFLICT(coll,id) DO UPDATE SET data=excluded.data, updated=excluded.updated"),
  del: db.prepare("DELETE FROM docs WHERE coll=? AND id=?"),
  delColl: db.prepare("DELETE FROM docs WHERE coll=?"),
  metaGet: db.prepare("SELECT v FROM meta WHERE k=?"),
  metaSet: db.prepare("INSERT INTO meta(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v"),
  sesGet: db.prepare("SELECT * FROM sessions WHERE token=?"),
  sesPut: db.prepare("INSERT INTO sessions(token,user_id,created,last,ip,ua) VALUES(?,?,?,?,?,?)"),
  sesTouch: db.prepare("UPDATE sessions SET last=? WHERE token=?"),
  sesDel: db.prepare("DELETE FROM sessions WHERE token=?"),
  sesDelUser: db.prepare("DELETE FROM sessions WHERE user_id=? AND token<>?"),
  sesClean: db.prepare("DELETE FROM sessions WHERE created<?"),
  audit: db.prepare("INSERT INTO audit(ts,user_id,action,coll,doc_id,info) VALUES(?,?,?,?,?,?)"),
  auditList: db.prepare("SELECT * FROM audit ORDER BY ts DESC LIMIT ?"),
  auditClean: db.prepare("DELETE FROM audit WHERE ts<?")
};
const all = c => Q.all.all(c).map(r => JSON.parse(r.data));
const get = (c, id) => { const r = Q.get.get(c, String(id)); return r ? JSON.parse(r.data) : null; };
const put = (c, o) => Q.put.run(c, String(o.id), JSON.stringify(o), Date.now());
const del = (c, id) => Q.del.run(c, String(id));
function tx(fn) { db.exec("BEGIN"); try { const r = fn(); db.exec("COMMIT"); return r; } catch (e) { db.exec("ROLLBACK"); throw e; } }
let VERSION = +((Q.metaGet.get("version") || {}).v || 1);
function bump() { VERSION++; Q.metaSet.run("version", String(VERSION)); }
const audit = (u, action, coll, id, info = "") => Q.audit.run(Date.now(), u ? u.id : null, action, coll || null, id ? String(id) : null, String(info).slice(0, 300));

/* ---------- helpers ---------- */
const uid = () => Date.now().toString(36) + crypto.randomBytes(5).toString("hex");
const pad = n => String(n).padStart(2, "0");
const dstr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => dstr(new Date());
const addDays = (ds, n) => { const d = new Date(ds + "T00:00"); d.setDate(d.getDate() + n); return dstr(d); };
const tsOf = (date, time) => new Date(`${date}T${time || "00:00"}`).getTime();
class HttpErr extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const fail = (code, msg) => { throw new HttpErr(code, msg); };
const str = (v, max = 500) => String(v ?? "").trim().slice(0, max);
const digits = s => String(s || "").replace(/\D/g, "");
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s);
const isTime = s => /^\d{2}:\d{2}$/.test(s);
const safeId = s => /^[A-Za-z0-9_\-]{1,64}$/.test(String(s));

function hashPass(p) { const salt = crypto.randomBytes(16); const h = crypto.scryptSync(String(p), salt, 64); return "s1$" + salt.toString("hex") + "$" + h.toString("hex"); }
function checkPass(p, stored) {
  try { const [, s, h] = String(stored).split("$"); const calc = crypto.scryptSync(String(p), Buffer.from(s, "hex"), 64); return crypto.timingSafeEqual(calc, Buffer.from(h, "hex")); } catch (e) { return false; }
}

const STATUSES = ["kutilmoqda", "keldi", "tugadi", "kelmadi", "bekor"];
const PAYS = ["naqd", "karta", "click"];
const settings = () => get("settings", "main") || {};
const openShift = () => all("shifts").find(s => !s.closedAt) || null;

/* ---------- first run ---------- */
function seedIfEmpty() {
  if (all("users").length) return;
  tx(() => {
    put("users", { id: "u1", name: "Administrator", login: "admin", pass: hashPass(process.env.ADMIN_PASSWORD || "admin123"), role: "admin", active: true, mustChange: !process.env.ADMIN_PASSWORD });
    put("users", { id: "u2", name: "Resepshn", login: "resepshn", pass: hashPass(process.env.RECEPTION_PASSWORD || "1234"), role: "reception", active: true, mustChange: true });
    [["Tibbiy pedikyur", 150000, 60], ["Tirnoq o‘sib kirishini davolash", 250000, 45], ["Zamburug‘li tirnoqni tozalash", 180000, 40], ["Qadoq / natoptishni olib tashlash", 120000, 30], ["Tovon yoriqlarini davolash", 160000, 50], ["Titan ip bilan korreksiya", 300000, 40], ["Ortopedik ortoz (qistirma)", 200000, 30]]
      .forEach(([name, price, dur], i) => put("services", { id: "s" + (i + 1), name, price, dur }));
    put("settings", { id: "main", clinic: "PODO MASTER", phone: "+998 90 123 45 67", lockMin: 20, sms: "Assalomu alaykum, {ism}! PODO MASTER pedikyur va podologiya markazidan bezovta qilyapmiz. Oxirgi muolajangizdan {kun} kun o‘tdi — nazorat ko‘rigi vaqti keldi. Qulay vaqtga yozilish uchun: {tel}" });
    if (process.env.DEMO === "1") seedDemo();
  });
  console.log("Birinchi ishga tushirish: foydalanuvchilar yaratildi (admin, resepshn).");
}
function seedDemo() {
  const t = today();
  const C = [["Dilnoza Karimova", "+998 90 345 12 78", ["Zamburug‘ (onixomikoz)"], "Davolash kursi: har 2 haftada nazorat."], ["Rustam Toshmatov", "+998 93 512 44 09", ["Qandli diabet", "Qadoq / natoptish"], "Diabet! Faqat apparat usuli, tig‘ ishlatilmasin."], ["Nodira Yusupova", "+998 97 220 61 15", ["Tirnoq o‘sib kirishi"], "O‘ng oyoq bosh barmog‘i."], ["Gulnora Rahimova", "+998 91 404 18 62", ["Tovon yorilishi"], ""]];
  C.forEach(([name, phone, diag, notes], i) => put("clients", { id: "c" + (i + 1), name, phone, birth: "", diag, notes, createdAt: Date.now() - 60 * 864e5, demo: true }));
  const mk = (cid, date, time, sid, status, extra = {}) => put("appts", Object.assign({ id: uid(), clientId: cid, date, time, serviceId: sid, status, price: get("services", sid).price, pay: "naqd", notes: "", remindDays: 14, createdBy: "u1", demo: true }, extra));
  const p = tsOf(addDays(t, -14), "11:00");
  mk("c1", addDays(t, -14), "11:00", "s3", "tugadi", { arrivedAt: p, leftAt: p + 40 * 6e4, notes: "Yaxshilanish bor.", shiftId: "demo_old" });
  mk("c1", t, "15:00", "s3", "kutilmoqda"); mk("c2", t, "16:00", "s4", "kutilmoqda"); mk("c3", t, "17:30", "s6", "kutilmoqda");
  put("reminders", { id: uid(), clientId: "c4", date: t, reason: "Tovon yoriqlari — nazorat (7 kun)", done: false, demo: true });
  put("shifts", { id: "demo_old", openedBy: "u2", openedAt: p - 3600e3, openCash: 0, closedAt: p + 8 * 3600e3, closedBy: "u2", counted: 180000, expected: 180000, note: "", demo: true });
}
seedIfEmpty();

/* ---------- state for client (filtered by role) ---------- */
function stateFor(u) {
  const admin = u.role === "admin";
  const users = all("users").map(x => admin ? { id: x.id, name: x.name, login: x.login, role: x.role, active: x.active } : { id: x.id, name: x.name, role: x.role });
  const shifts = admin ? all("shifts") : all("shifts").filter(s => !s.closedAt);
  return { v: VERSION, users, services: all("services"), clients: all("clients"), appts: all("appts"), photos: all("photos"), reminders: all("reminders"), shifts, settings: settings(), lastClose: +((Q.metaGet.get("lastClose") || {}).v || 0) };
}
const meOf = u => ({ id: u.id, name: u.name, login: u.login, role: u.role, mustChange: !!u.mustChange });

/* ---------- business rules ---------- */
function syncReminder(a) {
  all("reminders").filter(r => r.apptId === a.id && r.auto && !r.done).forEach(r => del("reminders", r.id));
  if (a.status === "tugadi" && a.remindDays > 0) {
    const s = get("services", a.serviceId) || { name: "Muolaja" };
    put("reminders", { id: uid(), clientId: a.clientId, apptId: a.id, date: addDays(dstr(new Date(a.leftAt || Date.now())), a.remindDays), reason: `${s.name} — nazorat (${a.remindDays} kun)`, done: false, auto: true });
  }
}
function deletePhoto(p) { del("photos", p.id); fs.rm(path.join(PHOTOS, p.id + ".jpg"), () => { }); }

const PUT_RULES = {
  clients(u, id, b, old) {
    const c = old ? { ...old } : { id, createdAt: Date.now(), createdBy: u.id };
    c.name = str(b.name, 120); c.phone = str(b.phone, 40); c.birth = isDate(b.birth) ? b.birth : ""; c.notes = str(b.notes, 4000);
    c.diag = Array.isArray(b.diag) ? b.diag.map(x => str(x, 60)).filter(Boolean).slice(0, 20) : [];
    if (!c.name) fail(400, "Ismni kiriting");
    if (digits(c.phone).length < 9) fail(400, "Telefon raqamini to‘liq kiriting");
    const dup = all("clients").find(x => x.id !== id && digits(x.phone) === digits(c.phone));
    if (dup) fail(409, `Bu raqam ${dup.name} nomida allaqachon bor`);
    return c;
  },
  appts(u, id, b, old) {
    const admin = u.role === "admin";
    const a = old ? { ...old } : { id, status: "kutilmoqda", pay: "naqd", remindDays: 14, createdBy: u.id, createdAt: Date.now() };
    const oldShift = old && old.shiftId ? get("shifts", old.shiftId) : null;
    const locked = old && old.status === "tugadi" && oldShift && oldShift.closedAt && !admin;
    const fields = locked ? ["notes", "remindDays"] : ["clientId", "date", "time", "serviceId", "status", "price", "pay", "notes", "remindDays"];
    for (const k of fields) if (k in b) a[k] = b[k];
    if (!get("clients", a.clientId)) fail(400, "Mijoz topilmadi");
    if (!get("services", a.serviceId)) fail(400, "Xizmat topilmadi");
    if (!isDate(a.date) || !isTime(a.time)) fail(400, "Sana yoki vaqt noto‘g‘ri");
    if (!STATUSES.includes(a.status)) fail(400, "Holat noto‘g‘ri");
    if (!PAYS.includes(a.pay)) a.pay = "naqd";
    a.price = Math.max(0, Math.round(+a.price || 0)); a.remindDays = Math.max(0, Math.min(365, Math.round(+a.remindDays || 0))); a.notes = str(a.notes, 4000);
    const prev = old ? old.status : null;
    if (a.status !== prev) {
      if (prev === "tugadi" && locked) fail(403, "Smena yopilgan — faqat administrator o‘zgartira oladi");
      if (a.status === "keldi" || a.status === "tugadi") {
        const sh = openShift(); if (!sh) fail(409, "Smena ochilmagan. Avval smenani oching.");
        if (a.status === "keldi") { if (prev !== "tugadi" || !a.arrivedAt) a.arrivedAt = Date.now(); delete a.leftAt; delete a.doneBy; }
        else { if (!a.arrivedAt) a.arrivedAt = Date.now(); a.leftAt = Date.now(); a.doneBy = u.id; }
        a.shiftId = sh.id;
      } else { delete a.arrivedAt; delete a.leftAt; delete a.doneBy; if (a.status === "kutilmoqda") delete a.shiftId; }
    }
    return a;
  },
  reminders(u, id, b, old) {
    const r = old ? { ...old } : { id, createdBy: u.id, done: false };
    if ("clientId" in b) r.clientId = b.clientId;
    if ("date" in b) r.date = b.date;
    if ("reason" in b) r.reason = str(b.reason, 300) || "Nazorat ko‘rigi";
    if (!get("clients", r.clientId)) fail(400, "Mijoz topilmadi");
    if (!isDate(r.date)) fail(400, "Sana noto‘g‘ri");
    if ("done" in b && !!b.done !== !!r.done) { r.done = !!b.done; if (r.done) { r.doneAt = Date.now(); r.doneBy = u.id; } else { delete r.doneAt; delete r.doneBy; } }
    return r;
  },
  services(u, id, b, old) {
    if (u.role !== "admin") fail(403, "Faqat administrator");
    const s = { id, name: str(b.name, 120), price: Math.max(0, Math.round(+b.price || 0)), dur: Math.max(5, Math.min(600, Math.round(+b.dur || 30))) };
    if (!s.name) fail(400, "Xizmat nomini kiriting");
    return s;
  },
  settings(u, id, b, old) {
    if (u.role !== "admin") fail(403, "Faqat administrator");
    if (id !== "main") fail(400, "Noto‘g‘ri");
    return { id: "main", clinic: str(b.clinic, 120), phone: str(b.phone, 40), lockMin: Math.max(1, Math.min(240, Math.round(+b.lockMin || 20))), sms: str(b.sms, 1000) };
  },
  users(u, id, b, old, token) {
    if (u.role !== "admin") fail(403, "Faqat administrator");
    const x = old ? { ...old } : { id };
    x.name = str(b.name, 80); x.login = str(b.login, 40).toLowerCase(); x.role = b.role === "admin" ? "admin" : "reception"; x.active = !!b.active;
    if (!x.name || !x.login) fail(400, "Ism va loginni kiriting");
    if (!/^[a-z0-9._-]{3,40}$/.test(x.login)) fail(400, "Login 3–40 ta lotin harfi yoki raqamdan iborat bo‘lsin");
    if (all("users").some(o => o.id !== id && o.login === x.login)) fail(409, "Bu login band");
    if (b.password) { if (String(b.password).length < 6) fail(400, "Parol kamida 6 belgidan iborat bo‘lsin"); x.pass = hashPass(b.password); x.mustChange = id !== u.id; }
    if (!x.pass) fail(400, "Parolni kiriting");
    if (!all("users").some(o => o.id !== id && o.role === "admin" && o.active) && !(x.role === "admin" && x.active)) fail(400, "Kamida bitta faol administrator qolishi kerak");
    if (old && (b.password || !x.active)) Q.sesDelUser.run(id, id === u.id ? token : "");
    return x;
  }
};

/* ---------- http utils ---------- */
function send(res, code, obj, headers = {}) {
  const body = typeof obj === "string" || Buffer.isBuffer(obj) ? obj : JSON.stringify(obj);
  res.writeHead(code, Object.assign({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, headers));
  res.end(body);
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on("data", c => { n += c.length; if (n > limit) { reject(new HttpErr(413, "Fayl juda katta")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
async function readJson(req, limit = 2e6) { const b = await readBody(req, limit); try { return b.length ? JSON.parse(b.toString("utf8")) : {}; } catch (e) { fail(400, "Noto‘g‘ri so‘rov"); } }
const cookies = req => Object.fromEntries(String(req.headers.cookie || "").split(";").map(s => s.trim().split("=")).filter(p => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join("="))]));
const ipOf = req => (TRUST_PROXY && req.headers["x-forwarded-for"] ? String(req.headers["x-forwarded-for"]).split(",")[0].trim() : req.socket.remoteAddress) || "";
const isHttps = req => req.socket.encrypted || (TRUST_PROXY && req.headers["x-forwarded-proto"] === "https") || process.env.COOKIE_SECURE === "1";
function setCookie(req, res, token, maxAge) {
  res.setHeader("Set-Cookie", `sid=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${isHttps(req) ? "; Secure" : ""}`);
}
function auth(req) {
  const t = cookies(req).sid; if (!t) return null;
  const s = Q.sesGet.get(t); if (!s) return null;
  if (s.created < Date.now() - SESSION_DAYS * 864e5) { Q.sesDel.run(t); return null; }
  const u = get("users", s.user_id); if (!u || !u.active) { Q.sesDel.run(t); return null; }
  if (Date.now() - s.last > 60000) Q.sesTouch.run(Date.now(), t);
  return { u, token: t };
}
const FAILS = new Map();
function loginLimited(ip) { const f = FAILS.get(ip); return f && f.n >= 8 && Date.now() - f.t < 15 * 60000; }
function loginFail(ip) { const f = FAILS.get(ip) || { n: 0, t: 0 }; if (Date.now() - f.t > 15 * 60000) f.n = 0; f.n++; f.t = Date.now(); FAILS.set(ip, f); }

const SEC_HEADERS = {
  "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "same-origin",
  "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
};
const INDEX = path.join(__dirname, "public", "index.html");

/* ---------- routes ---------- */
async function handle(req, res) {
  const url = new URL(req.url, "http://x");
  const p = url.pathname, m = req.method;

  if (m === "GET" && (p === "/" || p === "/index.html")) {
    return fs.readFile(INDEX, (e, buf) => e ? send(res, 500, "index.html topilmadi") : send(res, 200, buf, Object.assign({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" }, SEC_HEADERS)));
  }
  if (m === "GET" && p === "/healthz") return send(res, 200, { ok: true, v: VERSION });
  if (!p.startsWith("/api/")) return send(res, 404, { error: "Topilmadi" });

  // CSRF: every state-changing request must come from our page
  if (m !== "GET" && req.headers["x-podo"] !== "1") fail(403, "Ruxsat yo‘q");

  if (m === "POST" && p === "/api/login") {
    const ip = ipOf(req);
    if (loginLimited(ip)) fail(429, "Juda ko‘p urinish. 15 daqiqadan keyin qayta urinib ko‘ring.");
    const b = await readJson(req);
    const u = all("users").find(x => x.login === str(b.login, 40).toLowerCase());
    if (!u || !checkPass(b.password, u.pass)) { loginFail(ip); audit(null, "login_fail", "users", null, str(b.login, 40) + " · " + ip); fail(401, "Login yoki parol noto‘g‘ri"); }
    if (!u.active) fail(403, "Bu foydalanuvchi bloklangan. Administratorga murojaat qiling.");
    FAILS.delete(ip);
    const token = crypto.randomBytes(32).toString("hex");
    Q.sesPut.run(token, u.id, Date.now(), Date.now(), ip, str(req.headers["user-agent"], 200));
    setCookie(req, res, token, SESSION_DAYS * 86400);
    audit(u, "login", "users", u.id, ip);
    return send(res, 200, { me: meOf(u), state: stateFor(u) });
  }
  if (m === "POST" && p === "/api/logout") { const t = cookies(req).sid; if (t) Q.sesDel.run(t); setCookie(req, res, "", 0); return send(res, 200, { ok: true }); }

  const A = auth(req);
  if (!A) return send(res, 401, { error: "Tizimga qayta kiring" });
  const u = A.u, admin = u.role === "admin";
  const needAdmin = () => { if (!admin) fail(403, "Bu amal faqat administrator uchun"); };

  if (m === "GET" && p === "/api/me") return send(res, 200, { me: meOf(u), state: stateFor(u) });
  if (m === "GET" && p === "/api/state") return send(res, 200, stateFor(u));
  if (m === "GET" && p === "/api/version") return send(res, 200, { v: VERSION });

  if (m === "POST" && p === "/api/password") {
    const b = await readJson(req);
    if (!checkPass(b.old, u.pass)) fail(400, "Joriy parol noto‘g‘ri");
    if (String(b.new || "").length < 6) fail(400, "Yangi parol kamida 6 belgidan iborat bo‘lsin");
    if (b.new === b.old) fail(400, "Yangi parol eskisidan farq qilsin");
    u.pass = hashPass(b.new); u.mustChange = false; put("users", u); Q.sesDelUser.run(u.id, A.token); audit(u, "password", "users", u.id); bump();
    return send(res, 200, { me: meOf(u) });
  }

  if (m === "POST" && p === "/api/shift/open") {
    const b = await readJson(req);
    const sh = tx(() => { if (openShift()) fail(409, "Smena allaqachon ochiq"); const s = { id: uid(), openedBy: u.id, openedAt: Date.now(), openCash: Math.max(0, Math.round(+b.openCash || 0)) }; put("shifts", s); return s; });
    audit(u, "shift_open", "shifts", sh.id, sh.openCash); bump(); return send(res, 200, { ok: true, v: VERSION });
  }
  if (m === "POST" && p === "/api/shift/close") {
    const b = await readJson(req);
    const out = tx(() => {
      const sh = openShift(); if (!sh) fail(409, "Ochiq smena yo‘q");
      if (all("appts").some(a => a.status === "keldi")) fail(409, "Muolajada turgan mijozni avval yakunlang");
      const now = Date.now(), list = all("appts").filter(a => a.status === "tugadi" && a.leftAt >= sh.openedAt && a.leftAt <= now);
      const t = { count: list.length, naqd: 0, karta: 0, click: 0, total: 0 };
      list.forEach(a => { t[a.pay] = (t[a.pay] || 0) + (+a.price || 0); t.total += +a.price || 0; });
      const counted = Math.max(0, Math.round(+b.counted || 0)), expected = (+sh.openCash || 0) + t.naqd;
      Object.assign(sh, { closedAt: now, closedBy: u.id, counted, expected, note: str(b.note, 500), totals: t });
      put("shifts", sh); Q.metaSet.run("lastClose", String(counted));
      return { shift: sh, totals: t };
    });
    audit(u, "shift_close", "shifts", out.shift.id, `kutilgan ${out.shift.expected}, sanalgan ${out.shift.counted}`); bump();
    return send(res, 200, Object.assign(out, { v: VERSION }));
  }

  if (p.startsWith("/api/photos")) {
    const id = p.split("/")[3];
    if (m === "GET" && id) {
      if (!safeId(id) || !get("photos", id)) return send(res, 404, { error: "Rasm topilmadi" });
      return fs.readFile(path.join(PHOTOS, id + ".jpg"), (e, buf) => e ? send(res, 404, { error: "Rasm topilmadi" }) : send(res, 200, buf, { "Content-Type": buf[0] === 0x89 ? "image/png" : "image/jpeg", "Cache-Control": "private, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" }));
    }
    if (m === "POST" && !id) {
      const a = get("appts", url.searchParams.get("appt")), kind = url.searchParams.get("kind");
      if (!a) fail(400, "Yozuv topilmadi"); if (!["oldin", "keyin"].includes(kind)) fail(400, "Rasm turi noto‘g‘ri");
      const buf = await readBody(req, 12e6);
      const jpg = buf[0] === 0xff && buf[1] === 0xd8, png = buf[0] === 0x89 && buf[1] === 0x50;
      if (!jpg && !png) fail(400, "Faqat JPG yoki PNG rasm");
      const ph = { id: "ph_" + uid(), clientId: a.clientId, apptId: a.id, kind, date: a.date, ts: Date.now(), by: u.id };
      fs.writeFileSync(path.join(PHOTOS, ph.id + ".jpg"), buf); put("photos", ph); audit(u, "photo_add", "photos", ph.id, kind); bump();
      return send(res, 200, { photo: ph, v: VERSION });
    }
    if (m === "DELETE" && id) { needAdmin(); const ph = get("photos", id); if (ph) { deletePhoto(ph); audit(u, "delete", "photos", id); bump(); } return send(res, 200, { ok: true, v: VERSION }); }
  }

  if (m === "GET" && p === "/api/audit") {
    needAdmin(); const names = Object.fromEntries(all("users").map(x => [x.id, x.name]));
    return send(res, 200, Q.auditList.all(Math.min(500, +url.searchParams.get("limit") || 200)).map(r => Object.assign(r, { user: names[r.user_id] || "—" })));
  }
  if (m === "GET" && p === "/api/backup") {
    needAdmin();
    const colls = ["users", "services", "clients", "appts", "photos", "reminders", "shifts", "settings"];
    const docs = Object.fromEntries(colls.map(c => [c, all(c)]));
    const photos = {}; for (const ph of docs.photos) { try { photos[ph.id] = fs.readFileSync(path.join(PHOTOS, ph.id + ".jpg")).toString("base64"); } catch (e) { } }
    audit(u, "backup"); res.writeHead(200, { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="podo-master-zaxira-${today()}.json"`, "Cache-Control": "no-store" });
    return res.end(JSON.stringify({ app: "podo-crm", format: 2, at: Date.now(), docs, photos }));
  }
  if (m === "POST" && p === "/api/restore") {
    needAdmin(); const b = await readJson(req, 800e6);
    if (b.app !== "podo-crm" || !b.docs || !Array.isArray(b.docs.users) || !b.docs.users.some(x => x.role === "admin" && x.pass)) fail(400, "Bu PODO MASTER server zaxira fayli emas");
    tx(() => { for (const c of ["users", "services", "clients", "appts", "photos", "reminders", "shifts", "settings"]) { Q.delColl.run(c); (b.docs[c] || []).forEach(o => o && o.id && put(c, o)); } });
    for (const [id, data] of Object.entries(b.photos || {})) if (safeId(id)) fs.writeFileSync(path.join(PHOTOS, id + ".jpg"), Buffer.from(data, "base64"));
    audit(u, "restore"); bump(); return send(res, 200, { ok: true, v: VERSION });
  }
  if (m === "POST" && p === "/api/demo/clear") {
    needAdmin();
    tx(() => {
      const demoC = new Set(all("clients").filter(c => c.demo).map(c => c.id));
      all("photos").filter(x => demoC.has(x.clientId)).forEach(deletePhoto);
      all("appts").filter(a => demoC.has(a.clientId) || a.demo).forEach(a => del("appts", a.id));
      all("reminders").filter(r => demoC.has(r.clientId) || r.demo).forEach(r => del("reminders", r.id));
      all("shifts").filter(s => s.demo).forEach(s => del("shifts", s.id));
      demoC.forEach(id => del("clients", id));
    });
    audit(u, "demo_clear"); bump(); return send(res, 200, { ok: true, v: VERSION });
  }
  if (m === "POST" && p === "/api/reset") {
    needAdmin(); const b = await readJson(req);
    if (b.confirm !== "TOZALASH") fail(400, "Tasdiqlash so‘zi noto‘g‘ri");
    tx(() => { all("photos").forEach(deletePhoto); ["clients", "appts", "reminders", "shifts"].forEach(c => Q.delColl.run(c)); });
    audit(u, "reset"); bump(); return send(res, 200, { ok: true, v: VERSION });
  }

  const mm = p.match(/^\/api\/(clients|appts|reminders|services|settings|users)\/([A-Za-z0-9_\-]{1,64})$/);
  if (mm) {
    const [, coll, id] = mm;
    if (m === "PUT") {
      const b = await readJson(req);
      const doc = tx(() => { const old = get(coll, id); const d = PUT_RULES[coll](u, id, b, old, A.token); put(coll, d); if (coll === "appts") syncReminder(d); return d; });
      audit(u, "save", coll, id, coll === "appts" ? doc.status : (doc.name || "")); bump();
      const out = Object.assign({}, doc); delete out.pass;
      return send(res, 200, { doc: out, v: VERSION });
    }
    if (m === "DELETE") {
      if (coll === "reminders") { const r = get("reminders", id); if (r && !admin && r.done) fail(403, "Faqat administrator"); }
      else needAdmin();
      tx(() => {
        if (coll === "clients") {
          all("photos").filter(x => x.clientId === id).forEach(deletePhoto);
          all("appts").filter(a => a.clientId === id).forEach(a => del("appts", a.id));
          all("reminders").filter(r => r.clientId === id).forEach(r => del("reminders", r.id));
        }
        if (coll === "appts") {
          all("photos").filter(x => x.apptId === id).forEach(deletePhoto);
          all("reminders").filter(r => r.apptId === id && r.auto).forEach(r => del("reminders", r.id));
        }
        if (coll === "services" && all("appts").some(a => a.serviceId === id)) fail(409, "Bu xizmat tashriflarda ishlatilgan — o‘chirib bo‘lmaydi, nomini o‘zgartiring");
        if (coll === "users") {
          if (id === u.id) fail(400, "O‘zingizni o‘chira olmaysiz");
          if (!all("users").some(o => o.id !== id && o.role === "admin" && o.active)) fail(400, "Kamida bitta administrator qolishi kerak");
          Q.sesDelUser.run(id, "");
        }
        if (coll === "settings") fail(400, "Sozlamalarni o‘chirib bo‘lmaydi");
        del(coll, id);
      });
      audit(u, "delete", coll, id); bump(); return send(res, 200, { ok: true, v: VERSION });
    }
  }
  send(res, 404, { error: "Topilmadi" });
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(e => {
    if (e instanceof HttpErr) return send(res, e.code, { error: e.message });
    console.error(e); send(res, 500, { error: "Server xatosi" });
  });
});
server.requestTimeout = 300000;
server.listen(PORT, HOST, () => console.log(`PODO MASTER CRM: http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}  (ma’lumotlar: ${DATA})`));
setInterval(() => { Q.sesClean.run(Date.now() - SESSION_DAYS * 864e5); Q.auditClean.run(Date.now() - 365 * 864e5); }, 3600e3).unref();
const stop = () => { server.close(); try { db.close(); } catch (e) { } process.exit(0); };
process.on("SIGTERM", stop); process.on("SIGINT", stop);
