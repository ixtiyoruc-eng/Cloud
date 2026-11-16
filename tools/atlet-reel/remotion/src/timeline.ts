// v3 timeline: beat grid, cut transitions, flashes, caption hits and the guide (dumbbell) flight path.
// Everything is a pure function of edl.json so any frame renders the same in any order.
import {Easing} from 'remotion';
import {Edl} from './types';
import {accentSpot, capLayout, uiPlaces} from './layout';
import {GKey, MgInfo, planMg} from './mgPlan';
import {clamp01, lerp} from './theme';

export type CutFx = {t: number; kind: 'whipL' | 'whipR' | 'punch' | 'streak' | 'blob'; x?: number; y?: number};
export type Flash = {t: number; k: number; col: string; dur?: number};
export type Portal = {a: number; b: number; dir: 'in' | 'out'; cx: number; cy: number};
export type G = {x: number; y: number; s: number; rot: number; phi: number; vx: number; vy: number; speed: number; endOn: number};
export type TL = {
  beats: number[]; downbeats: number[]; drops: number[];
  snap: (t: number, win?: number) => number; beatsAfter: (t: number, n: number) => number[];
  cuts: CutFx[]; flashes: Flash[]; hits: {t: number; k: number}[];
  portals: Portal[]; mg: MgInfo[]; keys: GKey[]; cardAt: number[];
  guide: (t: number) => G; inMg: (t: number) => boolean;
};

const HOME = [{x: 160, y: 1075}, {x: 918, y: 1090}, {x: 190, y: 1520}, {x: 900, y: 1100}, {x: 150, y: 1090}, {x: 890, y: 1530}];
const FACE = {x: 540, y: 740};

// whip/punch/streak rotation for talking-head cuts (drops and section starts get the blob wipe)
const CUT_PLAN: Record<string, CutFx['kind']> = {
  '4.92': 'whipL', '7.605': 'blob', '12.086': 'punch', '13.45': 'streak', '17.67': 'whipR', '18.45': 'punch',
  '20.268': 'streak', '28.958': 'whipL', '33.45': 'blob', '38.1': 'punch', '54.994': 'whipR', '56.632': 'blob',
  '61.732': 'streak', '74.359': 'blob',
};

export const buildTimeline = (edl: Edl): TL => {
  const mu = edl.music as {beats_out: number[]; downbeats_out: number[]; drops_out: number[]};
  const beats = mu.beats_out, downbeats = mu.downbeats_out, drops = mu.drops_out;
  const snap = (t: number, win = 0.12) => {
    let best = t, bd = win;
    for (const b of beats) { const d = Math.abs(b - t); if (d < bd) { bd = d; best = b; } }
    return best;
  };
  const beatsAfter = (t: number, n: number) => beats.filter((b) => b >= t).slice(0, n);
  const inMgRaw = (t: number) => edl.mg_slots.some((m) => t >= m.out_start && t < m.out_end);

  // ---------------- cut transitions ----------------
  const cuts: CutFx[] = [];
  for (const c of edl.cuts) {
    const k = CUT_PLAN[String(c.at)];
    if (!k || inMgRaw(c.at)) continue;
    const sec = edl.ui_cards.some((u) => u.kind === 'section_badge' && u.t >= c.at - 0.2 && u.t < c.at + 0.5);
    cuts.push({t: c.at, kind: k, x: k === 'blob' ? (sec ? 110 : 860) : k === 'streak' ? 952 : undefined, y: k === 'blob' ? (sec ? 300 : 1330) : undefined});
  }
  cuts.unshift({t: 0.15, kind: 'streak', x: 128});
  const flashes: Flash[] = [];
  const hits: {t: number; k: number}[] = [];
  for (const c of cuts) {
    if (c.kind === 'whipL' || c.kind === 'whipR') flashes.push({t: c.t, k: 0.35, col: '#BFD8FF', dur: 0.12});
    if (c.kind === 'streak') flashes.push({t: c.t, k: 0.45, col: '#E6F0FF', dur: 0.1});
    if (c.kind === 'punch') flashes.push({t: c.t, k: 0.22, col: '#9CC2FF', dur: 0.1});
    hits.push({t: c.t, k: c.kind === 'blob' ? 1 : 0.7});
  }
  for (const d of drops) hits.push({t: d, k: 1});
  // the hook drop: white flash on "Kreatin"
  flashes.push({t: drops[0], k: 0.55, col: '#FFFFFF', dur: 0.14});

  // ---------------- MG plans ----------------
  const mg = edl.mg_slots.map((s) => planMg(s, edl.captions, snap, beatsAfter));
  const portals: Portal[] = [];
  for (const m of mg) {
    if (m.entry.kind === 'portalIn') portals.push({a: m.entry.a, b: m.entry.b, dir: 'in', cx: 540, cy: 1480});
    if (m.exit.kind === 'portalOut') portals.push({a: m.exit.a, b: m.exit.b, dir: 'out', cx: 540, cy: 1480});
    flashes.push({t: m.entry.b, k: 0.6, col: '#DDEBFF', dur: 0.13});
    flashes.push({t: m.exit.b, k: 0.5, col: '#DDEBFF', dur: 0.12});
    m.scenes.slice(1).forEach((sc) => flashes.push({t: sc.a + (sc.inT === 'blob' ? 0.2 : 0.1), k: sc.light ? 0.5 : 0.35, col: '#FFFFFF', dur: 0.1}));
    hits.push({t: m.entry.b, k: 0.8}, {t: m.exit.b, k: 0.8});
  }

  // ---------------- guide keys ----------------
  const keys: GKey[] = [];
  keys.push({t: 0, x: 128, y: 1760, s: 0.6, pri: 10, travel: 0.01});
  // UI cards: guide lands where the card opens from
  const places = uiPlaces(edl.ui_cards);
  const cardAt = edl.ui_cards.map((c) => (Math.abs(c.snap_beat - c.t) < 0.13 ? c.snap_beat : c.t));
  edl.ui_cards.forEach((c, i) => {
    const p = places[i];
    if (c.kind === 'section_badge') {
      const t0 = cardAt[i];
      keys.push({t: Math.max(t0, (cuts.find((k) => k.kind === 'blob' && Math.abs(k.t - t0) < 0.5)?.t ?? 0) + 0.05), x: 110, y: 300, pri: 9, travel: 0.3, tag: 'hero-a'});
      keys.push({t: snap(t0 + 0.45, 0.1), x: 975, y: 300, pri: 9, travel: 0.42, spin: 1, tag: 'hero-b'});
    } else keys.push({t: cardAt[i], x: p.ax, y: p.ay, s: p.s, pri: 7, travel: 0.3, tag: 'card-' + c.kind});
  });
  // cut transitions led by the guide
  for (const c of cuts) {
    if (c.kind === 'whipL') { keys.push({t: c.t - 0.16, x: 1000, y: 1600, pri: 8, travel: 0.3, tag: 'whip'}); keys.push({t: c.t + 0.14, x: 90, y: 1600, pri: 8, travel: 0.3, spin: 1.5, tag: 'whip'}); }
    if (c.kind === 'whipR') { keys.push({t: c.t - 0.16, x: 80, y: 1600, pri: 8, travel: 0.3, tag: 'whip'}); keys.push({t: c.t + 0.14, x: 990, y: 1600, pri: 8, travel: 0.3, spin: 1.5, tag: 'whip'}); }
    if (c.kind === 'streak') { if (c.t > 0.5) keys.push({t: c.t - 0.14, x: c.x!, y: 1690, pri: 8, travel: 0.3, tag: 'streak'}); keys.push({t: c.t + 0.16, x: c.x!, y: c.t > 0.5 ? 380 : 1080, pri: 10, travel: 0.3, spin: 1, tag: 'streak'}); }
    if (c.kind === 'punch') { const h = HOME[1]; keys.push({t: c.t, x: h.x - 20, y: h.y - 30, s: 1.25, pri: 8, travel: 0.3, spin: 1.5, tag: 'punch'}); }
    if (c.kind === 'blob') { keys.push({t: c.t - 0.24, x: c.x!, y: c.y!, pri: 9, travel: 0.32, tag: 'blob-a'}); if (c.y! > 1000) keys.push({t: c.t + 0.2, x: c.x!, y: c.y!, s: 1.3, pri: 9, travel: 0.4, spin: 1, tag: 'blob-b'}); }
  }
  // accent caption words: guide lands beside the pill
  edl.captions.forEach((cap) => {
    if (!cap.accent || inMgRaw(cap.out_start)) return;
    const L = capLayout(cap); const b = L.boxes.find((x) => x.accent); if (!b) return;
    const sp = accentSpot(b, L.boxes); keys.push({t: snap(b.w.t + 0.03, 0.08), x: sp.x, y: sp.y, pri: 5, travel: 0.28, tag: 'accent'});
  });
  mg.forEach((m) => keys.push(...m.keys));

  // resolve conflicts: keep the higher priority when two keys are closer than 0.2 s
  keys.sort((a, b) => a.t - b.t);
  let K: GKey[] = [];
  for (const k of keys) {
    const last = K[K.length - 1];
    if (last && k.t - last.t < 0.2 && !(k.pri >= 8 && last.pri >= 8)) { if (k.pri > last.pri) K[K.length - 1] = k; continue; }
    K.push(k);
  }
  // fill long gaps with drift hops (on downbeats) so the guide never stands still
  const filled: GKey[] = [];
  let hi = 0;
  for (let i = 0; i < K.length; i++) {
    filled.push(K[i]);
    const nx = K[i + 1]; if (!nx) break;
    let t = K[i].t + 1.5;
    while (nx.t - t > 0.9) {
      const st = snap(t, 0.23);
      if (inMgRaw(st)) { const p = filled[filled.length - 1]; filled.push({t: st, x: Math.min(1000, Math.max(80, p.x + (hi % 2 ? -90 : 90))), y: Math.min(1100, Math.max(140, p.y + (hi % 2 ? 50 : -50))), pri: 1, tag: 'drift'}); }
      else { const prev = filled[filled.length - 1]; let h = HOME[hi % HOME.length]; if (Math.hypot(h.x - prev.x, h.y - prev.y) < 60) h = HOME[(hi + 1) % HOME.length]; filled.push({t: st, x: h.x, y: h.y, pri: 1, tag: 'drift'}); }
      hi++; t = st + 1.6;
    }
  }
  K = filled;
  // cumulative spin
  const rot0: number[] = [-18]; for (let i = 1; i < K.length; i++) {
    const d = Math.hypot(K[i].x - K[i - 1].x, K[i].y - K[i - 1].y);
    rot0.push(rot0[i - 1] + 360 * (K[i].spin ?? (d > 320 ? 1 : d > 80 ? 0.5 : 0)));
  }
  const easeTravel = Easing.bezier(0.6, 0, 0.25, 1.12);
  const ts = K.map((k) => k.t);
  const idx = (t: number) => { let lo = 0, hi2 = ts.length - 1; if (t < ts[0]) return -1; while (lo < hi2) { const m = (lo + hi2 + 1) >> 1; if (ts[m] <= t) lo = m; else hi2 = m - 1; } return lo; };

  const base = (t: number) => {
    const i = idx(t);
    if (i < 0) return {x: K[0].x, y: K[0].y, s: 1, rot: rot0[0], trav: 0};
    const k0 = K[i], k1 = K[i + 1];
    if (!k1) return {x: k0.x, y: k0.y, s: k0.s ?? 1, rot: rot0[i], trav: 0};
    const T = Math.min(k1.travel ?? 0.42, (k1.t - k0.t) * 0.85);
    const d0 = k1.t - T;
    if (t < d0) return {x: k0.x, y: k0.y, s: k0.s ?? 1, rot: rot0[i], trav: 0};
    const u = easeTravel(clamp01((t - d0) / T)); const uc = clamp01(u);
    const mx = (k0.x + k1.x) / 2, my = (k0.y + k1.y) / 2, dx = k1.x - k0.x, dy = k1.y - k0.y, dist = Math.hypot(dx, dy) || 1;
    const amp = Math.min(200, dist * 0.26); let px = -dy / dist, py = dx / dist;
    const ref = inMgRaw(t) ? {x: 540, y: 800} : FACE;
    if (Math.hypot(mx + px * amp - ref.x, my + py * amp - ref.y) < Math.hypot(mx - px * amp - ref.x, my - py * amp - ref.y)) { px = -px; py = -py; }
    if (inMgRaw(t) && i % 2) { px = -px; py = -py; }
    const cx = mx + px * amp, cy = my + py * amp;
    const x = (1 - u) * (1 - u) * k0.x + 2 * (1 - u) * u * cx + u * u * k1.x;
    const y = (1 - u) * (1 - u) * k0.y + 2 * (1 - u) * u * cy + u * u * k1.y;
    return {x, y, s: lerp(k0.s ?? 1, k1.s ?? 1, uc), rot: lerp(rot0[i], rot0[i + 1], u), trav: Math.sin(Math.PI * clamp01((t - d0) / T))};
  };
  const portalAt = (t: number) => portals.find((p) => t >= p.a && t < p.b);
  const pos = (t: number) => {
    const p = portalAt(t);
    const b = base(t);
    let x = b.x + Math.sin(t * 2 * Math.PI / 1.7) * 12 * (1 - b.trav), y = b.y + Math.sin(t * 2 * Math.PI / 1.13 + 1) * 9 * (1 - b.trav);
    let s = b.s, endOn = 0;
    if (p) {
      const u = (t - p.a) / (p.b - p.a);
      const g = Easing.bezier(0.7, 0, 0.9, 0.4)(u); // accelerate toward the camera
      x = lerp(b.x, p.cx, clamp01(u * 3)); y = lerp(b.y, p.cy, clamp01(u * 3));
      s = 1.2 * Math.pow(160, g); endOn = clamp01(u * 3.2);
    }
    return {x, y, s, rot: b.rot, trav: b.trav, endOn};
  };
  const guide = (t: number): G => {
    const a = pos(t), e = 1 / 120, p0 = pos(t - e), p1 = pos(t + e);
    const vx = (p1.x - p0.x) / (2 * e), vy = (p1.y - p0.y) / (2 * e);
    const phi = a.endOn > 0 ? lerp(30, 90, a.endOn) : lerp(32 + 22 * Math.sin(t * 1.3), 8, a.trav);
    return {x: a.x, y: a.y, s: a.s, rot: a.rot + 8 * Math.sin(t * 0.9), phi, vx, vy, speed: Math.hypot(vx, vy), endOn: a.endOn};
  };
  return {beats, downbeats, drops, snap, beatsAfter, cuts, flashes, hits, portals, mg, keys: K, cardAt, guide, inMg: inMgRaw};
};
