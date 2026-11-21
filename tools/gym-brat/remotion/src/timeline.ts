// Timeline for the Gym brat reel: beat grid, cut transitions, flashes, caption hits and the guide (dumbbell) flight path.
// Pure function of edl.json + the face track, so any frame renders the same in any order.
// v2 (2026-11-21): the guide is pushed out of the face every frame; blob wipes became ring bursts (masked off the face).
import {Easing} from 'remotion';
import {Edl} from './types';
import {CAP_CX, CHIP_FROM, HOOK, PILL, PILL_X, WIN, capLayout, chipTargets, infoPlaces, sumPlace} from './layout';
import {clamp01, lerp, textW} from './theme';
import {Box, Face, avoidPoint} from './face';

export type CutFx = {t: number; kind: 'whipL' | 'whipR' | 'punch' | 'streak' | 'ring'; x?: number; y?: number};
export type Flash = {t: number; k: number; col: string; dur?: number};
export type GKey = {t: number; x: number; y: number; s?: number; pri: number; travel?: number; spin?: number; tag?: string};
export type G = {x: number; y: number; s: number; rot: number; phi: number; vx: number; vy: number; speed: number; endOn: number};
export type TL = {
  beats: number[]; downbeats: number[]; drops: number[];
  snap: (t: number, win?: number) => number; beatsAfter: (t: number, n: number) => number[];
  cuts: CutFx[]; flashes: Flash[]; hits: {t: number; k: number}[]; keys: GKey[];
  rowAt: number[]; mgIn: {a: number; b: number}; mgOut: {a: number; b: number};
  guide: (t: number) => G; inMg: (t: number) => boolean; hookEnd: number; cta: {obuna: number; layk: number};
  face: Face; faceAt: (t: number) => Box; info: ReturnType<typeof infoPlaces>;
};

// drift spots: sides of the frame, out of the bottom safe band and the right-hand button column
const HOME = [{x: 130, y: 1000}, {x: 950, y: 700}, {x: 140, y: 1380}, {x: 880, y: 1040}, {x: 120, y: 700}, {x: 860, y: 1380}];

export const buildTimeline = (edl: Edl, face: Face): TL => {
  const {beats_out: beats, downbeats_out: downbeats, drops_out: drops} = edl.music;
  const snap = (t: number, win = 0.12) => {
    let best = t, bd = win;
    for (const b of beats) { const d = Math.abs(b - t); if (d < bd) { bd = d; best = b; } }
    return best;
  };
  const beatsAfter = (t: number, n: number) => beats.filter((b) => b >= t).slice(0, n);
  const inMg = (t: number) => t >= edl.mg.a && t < edl.mg.b;
  const mgIn = {a: edl.mg.a - 0.12, b: edl.mg.a + 0.2};
  const mgOut = {a: edl.mg.b - 0.22, b: edl.mg.b};
  const hookEnd = edl.segments[1].out_start;
  // during the summary MG the face is the round window at the top
  const winBox: Box = {x0: WIN.cx - WIN.r, y0: WIN.cy - WIN.r, x1: WIN.cx + WIN.r, y1: WIN.cy + WIN.r};
  const faceAt = (t: number): Box => (t >= mgIn.b && t < mgOut.a ? winBox : face.at(t));

  // ---------------- cut transitions ----------------
  const cuts: CutFx[] = [{t: 0.12, kind: 'streak', x: 128}];
  for (const c of edl.cuts) {
    if (c.kind === 'none') continue;
    const kind = c.kind === 'blob' ? 'ring' : c.kind;
    cuts.push({t: c.at, kind, x: kind === 'ring' ? CAP_CX : kind === 'streak' ? 120 : undefined, y: kind === 'ring' ? 1250 : undefined});
  }
  const flashes: Flash[] = [];
  const hits: {t: number; k: number}[] = [];
  for (const c of cuts) {
    if (c.kind === 'whipL' || c.kind === 'whipR') flashes.push({t: c.t, k: 0.35, col: '#BFD8FF', dur: 0.12});
    if (c.kind === 'streak') flashes.push({t: c.t, k: 0.35, col: '#E6F0FF', dur: 0.1});
    if (c.kind === 'punch') flashes.push({t: c.t, k: 0.2, col: '#9CC2FF', dur: 0.1});
    if (c.kind === 'ring') flashes.push({t: c.t, k: 0.45, col: '#DDEBFF', dur: 0.14});
    hits.push({t: c.t, k: c.kind === 'ring' ? 1 : 0.7});
  }
  for (const d of drops) { hits.push({t: d, k: 1}); flashes.push({t: d, k: 0.5, col: '#FFFFFF', dur: 0.14}); }
  const hw = edl.captions.slice(0, 2).map((c) => c.words[c.words.length - 1].t);
  flashes.push({t: edl.captions[0].words[0].t, k: 0.45, col: '#FFFFFF', dur: 0.12}, {t: hw[1], k: 0.35, col: '#DDEBFF', dur: 0.12});
  hits.push({t: edl.captions[0].words[0].t, k: 0.8}, {t: hw[1], k: 0.8});
  flashes.push({t: mgIn.b, k: 0.5, col: '#DDEBFF', dur: 0.13}, {t: mgOut.b, k: 0.45, col: '#DDEBFF', dur: 0.12});
  for (const v of edl.verdicts) hits.push({t: v.t + 0.42, k: 0.35});

  // summary rows pop on half beats after the MG lands
  const half: number[] = []; for (const b of beats) half.push(b, b + (beats[1] - beats[0]) / 2);
  const rowAt: number[] = []; let tr = mgIn.b + 0.3;
  sumPlace().rows.forEach(() => { const n = half.find((h) => h >= tr) ?? tr; rowAt.push(n); tr = n + 0.12; });

  const cw = (re: RegExp) => { for (const c of edl.captions) if (c.role === 'cta') for (const w of c.words) if (re.test(w.w)) return w.t; return edl.output.duration - 1; };
  const cta = {obuna: cw(/^obuna/i), layk: cw(/^layk/i)};
  const info = infoPlaces(edl.info, face);

  // ---------------- guide keys ----------------
  const keys: GKey[] = [];
  keys.push({t: 0, x: 128, y: 1380, s: 0.6, pri: 10, travel: 0.01});
  const w0 = edl.captions[0].words[0].t;
  keys.push({t: w0, x: HOOK.oz.x + textW('OZIŞ', HOOK.oz.size, 900) / 2 + 60, y: HOOK.oz.y - 30, pri: 10, travel: 0.12, spin: 1, tag: 'hook-oz'});
  keys.push({t: hw[1], x: HOOK.vs.x + 100, y: HOOK.vs.y, pri: 10, travel: 0.25, spin: 1, tag: 'hook-vs'});
  keys.push({t: hookEnd + 0.3, x: PILL_X.oz + PILL.w / 2 + 40, y: PILL.y, s: 0.75, pri: 10, travel: 0.4, spin: 1, tag: 'hook-up'});
  for (const it of edl.items) {
    const cap = edl.captions.find((c) => c.words[0].t === it.t); if (!cap) continue;
    const b = capLayout(cap).boxes[0];
    const right = b.x1 + 80 < 880;
    keys.push({t: it.t, x: right ? b.x1 + 80 : Math.max(110, b.x0 - 80), y: b.yc - 10, pri: 8, travel: 0.28, spin: 1, tag: 'item'});
  }
  for (const v of edl.verdicts) {
    keys.push({t: v.t, x: CHIP_FROM.x, y: CHIP_FROM.y, pri: 9, travel: 0.22, tag: 'chip-a'});
    chipTargets(v.side).forEach((s, k) => keys.push({t: v.t + 0.42 + k * 0.36, x: s === 'oz' ? PILL_X.oz + PILL.w / 2 + 34 : PILL_X.sam - PILL.w / 2 - 34, y: PILL.y, s: 0.7, pri: 9, travel: 0.36, spin: 1, tag: 'chip-b'}));
  }
  for (const x of edl.info) { const p = info.get(x)!; keys.push({t: x.t, x: p.ax, y: p.ay, s: 0.65, pri: 7, travel: 0.28, tag: 'info'}); }
  for (const c of cuts) {
    if (c.t < hookEnd + 0.1) continue;
    if (c.kind === 'whipL') { keys.push({t: c.t - 0.16, x: 880, y: 1380, pri: 6, travel: 0.3, tag: 'whip'}); keys.push({t: c.t + 0.14, x: 110, y: 1380, pri: 6, travel: 0.3, spin: 1.5, tag: 'whip'}); }
    if (c.kind === 'whipR') { keys.push({t: c.t - 0.16, x: 110, y: 1380, pri: 6, travel: 0.3, tag: 'whip'}); keys.push({t: c.t + 0.14, x: 880, y: 1380, pri: 6, travel: 0.3, spin: 1.5, tag: 'whip'}); }
    if (c.kind === 'streak') { keys.push({t: c.t - 0.14, x: c.x!, y: 1400, pri: 6, travel: 0.3, tag: 'streak'}); keys.push({t: c.t + 0.16, x: c.x!, y: 560, pri: 6, travel: 0.3, spin: 1, tag: 'streak'}); }
    if (c.kind === 'ring') keys.push({t: c.t - 0.05, x: c.x!, y: c.y!, s: 1.3, pri: 6, travel: 0.32, spin: 1, tag: 'ring'});
  }
  keys.push({t: mgIn.a, x: 540, y: 1100, s: 1.2, pri: 10, travel: 0.3, spin: 1, tag: 'mg-in'});
  const sp = sumPlace();
  sp.rows.forEach((r, i) => keys.push({t: rowAt[i], x: r.side === 'sam' ? r.left + r.w - 28 : r.left + 28, y: r.top + 40, s: 0.7, pri: 9, travel: 0.22, tag: 'row'}));
  keys.push({t: mgOut.a, x: 540, y: 1400, pri: 10, travel: 0.25, tag: 'mg-out'});
  keys.push({t: cta.obuna, x: 110, y: 302, s: 0.7, pri: 9, travel: 0.3, spin: 1, tag: 'cta-obuna'});
  keys.push({t: cta.layk, x: 940, y: 302, s: 0.7, pri: 9, travel: 0.3, tag: 'cta-layk'});
  keys.push({t: edl.output.duration - 0.2, x: 880, y: 1040, pri: 5, travel: 0.5, spin: 1, tag: 'end'});

  keys.sort((a, b) => a.t - b.t);
  let K: GKey[] = [];
  for (const k of keys) {
    const last = K[K.length - 1];
    if (last && k.t - last.t < 0.2 && !(k.pri >= 8 && last.pri >= 8)) { if (k.pri > last.pri) K[K.length - 1] = k; continue; }
    K.push(k);
  }
  const filled: GKey[] = []; let hi = 0;
  for (let i = 0; i < K.length; i++) {
    filled.push(K[i]);
    const nx = K[i + 1]; if (!nx) break;
    let t = K[i].t + 1.4;
    while (nx.t - t > 0.9) {
      const st = snap(t, 0.23); const prev = filled[filled.length - 1];
      let h = HOME[hi % HOME.length]; if (Math.hypot(h.x - prev.x, h.y - prev.y) < 60) h = HOME[(hi + 1) % HOME.length];
      filled.push({t: st, x: h.x, y: h.y, pri: 1, tag: 'drift'}); hi++; t = st + 1.6;
    }
  }
  K = filled;
  const rot0: number[] = [-18];
  for (let i = 1; i < K.length; i++) { const d = Math.hypot(K[i].x - K[i - 1].x, K[i].y - K[i - 1].y); rot0.push(rot0[i - 1] + 360 * (K[i].spin ?? (d > 320 ? 1 : d > 80 ? 0.5 : 0))); }
  const easeTravel = Easing.bezier(0.6, 0, 0.25, 1.12);
  const ts = K.map((k) => k.t);
  const idx = (t: number) => { let lo = 0, h2 = ts.length - 1; if (t < ts[0]) return -1; while (lo < h2) { const m = (lo + h2 + 1) >> 1; if (ts[m] <= t) lo = m; else h2 = m - 1; } return lo; };
  const base = (t: number) => {
    const i = idx(t);
    if (i < 0) return {x: K[0].x, y: K[0].y, s: 1, rot: rot0[0], trav: 0};
    const k0 = K[i], k1 = K[i + 1];
    if (!k1) return {x: k0.x, y: k0.y, s: k0.s ?? 1, rot: rot0[i], trav: 0};
    const T = Math.min(k1.travel ?? 0.42, (k1.t - k0.t) * 0.85); const d0 = k1.t - T;
    if (t < d0) return {x: k0.x, y: k0.y, s: k0.s ?? 1, rot: rot0[i], trav: 0};
    const u = easeTravel(clamp01((t - d0) / T)); const uc = clamp01(u);
    const mx = (k0.x + k1.x) / 2, my = (k0.y + k1.y) / 2, dx = k1.x - k0.x, dy = k1.y - k0.y, dist = Math.hypot(dx, dy) || 1;
    const amp = Math.min(220, dist * 0.3); let px = -dy / dist, py = dx / dist;
    const f = faceAt(t); const ref = {x: (f.x0 + f.x1) / 2, y: (f.y0 + f.y1) / 2}; // arc away from the face
    if (Math.hypot(mx + px * amp - ref.x, my + py * amp - ref.y) < Math.hypot(mx - px * amp - ref.x, my - py * amp - ref.y)) { px = -px; py = -py; }
    const cx = mx + px * amp, cy = my + py * amp;
    return {
      x: (1 - u) * (1 - u) * k0.x + 2 * (1 - u) * u * cx + u * u * k1.x, y: (1 - u) * (1 - u) * k0.y + 2 * (1 - u) * u * cy + u * u * k1.y,
      s: lerp(k0.s ?? 1, k1.s ?? 1, uc), rot: lerp(rot0[i], rot0[i + 1], u), trav: Math.sin(Math.PI * clamp01((t - d0) / T)),
    };
  };
  const pos = (t: number) => {
    const b = base(t);
    const x = b.x + Math.sin(t * 2 * Math.PI / 1.7) * 12 * (1 - b.trav), y = b.y + Math.sin(t * 2 * Math.PI / 1.13 + 1) * 9 * (1 - b.trav);
    const p = avoidPoint(x, y, faceAt(t), 85 * b.s + 20);
    return {x: p.x, y: p.y, s: b.s, rot: b.rot, trav: b.trav};
  };
  const guide = (t: number): G => {
    const a = pos(t), e = 1 / 120, p0 = pos(t - e), p1 = pos(t + e);
    const vx = (p1.x - p0.x) / (2 * e), vy = (p1.y - p0.y) / (2 * e);
    return {x: a.x, y: a.y, s: a.s, rot: a.rot + 8 * Math.sin(t * 0.9), phi: lerp(32 + 22 * Math.sin(t * 1.3), 8, a.trav), vx, vy, speed: Math.hypot(vx, vy), endOn: 0};
  };
  return {beats, downbeats, drops, snap, beatsAfter, cuts, flashes, hits, keys: K, rowAt, mgIn, mgOut, guide, inMg, hookEnd, cta, face, faceAt, info};
};
