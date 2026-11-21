// Timeline for the Gym brat reel: beat grid, cut transitions, flashes, caption hits and the guide (dumbbell) flight path.
// Pure function of edl.json, so any frame renders the same in any order.
import {Easing} from 'remotion';
import {Edl} from './types';
import {CHIP_FROM, HOOK, PILL, PILL_X, capLayout, chipTargets, infoPlace, sumPlace} from './layout';
import {clamp01, lerp, textW} from './theme';

export type CutFx = {t: number; kind: 'whipL' | 'whipR' | 'punch' | 'streak' | 'blob'; x?: number; y?: number};
export type Flash = {t: number; k: number; col: string; dur?: number};
export type GKey = {t: number; x: number; y: number; s?: number; pri: number; travel?: number; spin?: number; tag?: string};
export type G = {x: number; y: number; s: number; rot: number; phi: number; vx: number; vy: number; speed: number; endOn: number};
export type TL = {
  beats: number[]; downbeats: number[]; drops: number[];
  snap: (t: number, win?: number) => number; beatsAfter: (t: number, n: number) => number[];
  cuts: CutFx[]; flashes: Flash[]; hits: {t: number; k: number}[]; keys: GKey[];
  rowAt: number[]; mgIn: {a: number; b: number}; mgOut: {a: number; b: number};
  guide: (t: number) => G; inMg: (t: number) => boolean; hookEnd: number; cta: {obuna: number; layk: number};
};

const HOME = [{x: 150, y: 1080}, {x: 930, y: 1090}, {x: 170, y: 1500}, {x: 910, y: 1110}, {x: 140, y: 1100}, {x: 920, y: 1480}];
const FACE = {x: 540, y: 640};

export const buildTimeline = (edl: Edl): TL => {
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

  // ---------------- cut transitions ----------------
  const cuts: CutFx[] = [{t: 0.12, kind: 'streak', x: 128}];
  for (const c of edl.cuts) {
    if (c.kind === 'none') continue;
    cuts.push({t: c.at, kind: c.kind, x: c.kind === 'blob' ? (c.at < 2 ? 540 : 880) : c.kind === 'streak' ? 952 : undefined, y: c.kind === 'blob' ? (c.at < 2 ? 300 : 1330) : undefined});
  }
  const flashes: Flash[] = [];
  const hits: {t: number; k: number}[] = [];
  for (const c of cuts) {
    if (c.kind === 'whipL' || c.kind === 'whipR') flashes.push({t: c.t, k: 0.35, col: '#BFD8FF', dur: 0.12});
    if (c.kind === 'streak') flashes.push({t: c.t, k: 0.4, col: '#E6F0FF', dur: 0.1});
    if (c.kind === 'punch') flashes.push({t: c.t, k: 0.2, col: '#9CC2FF', dur: 0.1});
    hits.push({t: c.t, k: c.kind === 'blob' ? 1 : 0.7});
  }
  for (const d of drops) { hits.push({t: d, k: 1}); flashes.push({t: d, k: 0.5, col: '#FFFFFF', dur: 0.14}); }
  const hw = edl.captions.slice(0, 2).map((c) => c.words[c.words.length - 1].t);
  flashes.push({t: edl.captions[0].words[0].t, k: 0.45, col: '#FFFFFF', dur: 0.12}, {t: hw[1], k: 0.35, col: '#DDEBFF', dur: 0.12});
  hits.push({t: edl.captions[0].words[0].t, k: 0.8}, {t: hw[1], k: 0.8});
  flashes.push({t: mgIn.b, k: 0.55, col: '#DDEBFF', dur: 0.13}, {t: mgOut.b, k: 0.45, col: '#DDEBFF', dur: 0.12});
  for (const v of edl.verdicts) hits.push({t: v.t + 0.42, k: 0.35});

  // summary rows pop on half beats after the MG lands
  const half: number[] = []; for (const b of beats) half.push(b, b + (beats[1] - beats[0]) / 2);
  const rowAt: number[] = []; let tr = mgIn.b + 0.3;
  sumPlace().rows.forEach(() => { const n = half.find((h) => h >= tr) ?? tr; rowAt.push(n); tr = n + 0.12; });

  const cw = (re: RegExp) => { for (const c of edl.captions) if (c.role === 'cta') for (const w of c.words) if (re.test(w.w)) return w.t; return edl.output.duration - 1; };
  const cta = {obuna: cw(/^obuna/i), layk: cw(/^layk/i)};

  // ---------------- guide keys ----------------
  const keys: GKey[] = [];
  keys.push({t: 0, x: 128, y: 1760, s: 0.6, pri: 10, travel: 0.01});
  // hook: the guide hits OZIŞ, then the VS, then flies up and becomes the centre of the tracker
  const w0 = edl.captions[0].words[0].t;
  keys.push({t: w0, x: HOOK.oz.x + textW('OZIŞ', HOOK.oz.size, 900) / 2 + 70, y: HOOK.oz.y - 40, pri: 10, travel: 0.12, spin: 1, tag: 'hook-oz'});
  keys.push({t: hw[1], x: HOOK.vs.x + 110, y: HOOK.vs.y, pri: 10, travel: 0.25, spin: 1, tag: 'hook-vs'});
  keys.push({t: hookEnd + 0.02, x: 540, y: PILL.y, s: 0.8, pri: 10, travel: 0.3, spin: 1, tag: 'hook-up'});
  // items: the guide lands beside the hero word
  for (const it of edl.items) {
    const cap = edl.captions.find((c) => c.words[0].t === it.t); if (!cap) continue;
    const L = capLayout(cap); const b = L.boxes[0];
    const x = b.x1 + 90 < 1000 ? b.x1 + 90 : b.x0 - 90;
    keys.push({t: it.t, x, y: b.yc - 10, pri: 8, travel: 0.28, spin: 1, tag: 'item'});
  }
  // verdicts: the guide carries the chip from the caption zone to the pill
  for (const v of edl.verdicts) {
    keys.push({t: v.t, x: CHIP_FROM.x, y: CHIP_FROM.y, pri: 9, travel: 0.22, tag: 'chip-a'});
    chipTargets(v.side).forEach((s, k) => keys.push({t: v.t + 0.42 + k * 0.36, x: PILL_X[s] + (s === 'oz' ? -PILL.w / 2 + 40 : PILL.w / 2 - 40), y: PILL.y, s: 0.75, pri: 9, travel: 0.36, spin: 1, tag: 'chip-b'}));
  }
  // info chips open where the guide lands
  for (const x of edl.info) { const p = infoPlace(edl.info, x); keys.push({t: x.t, x: p.ax, y: p.ay, s: 0.7, pri: 7, travel: 0.28, tag: 'info'}); }
  // cut transitions led by the guide
  for (const c of cuts) {
    if (c.t < 0.5 || c.t < hookEnd + 0.1) continue;
    if (c.kind === 'whipL') { keys.push({t: c.t - 0.16, x: 1000, y: 1600, pri: 6, travel: 0.3, tag: 'whip'}); keys.push({t: c.t + 0.14, x: 90, y: 1600, pri: 6, travel: 0.3, spin: 1.5, tag: 'whip'}); }
    if (c.kind === 'whipR') { keys.push({t: c.t - 0.16, x: 80, y: 1600, pri: 6, travel: 0.3, tag: 'whip'}); keys.push({t: c.t + 0.14, x: 990, y: 1600, pri: 6, travel: 0.3, spin: 1.5, tag: 'whip'}); }
    if (c.kind === 'streak') { keys.push({t: c.t - 0.14, x: c.x!, y: 1690, pri: 6, travel: 0.3, tag: 'streak'}); keys.push({t: c.t + 0.16, x: c.x!, y: 420, pri: 6, travel: 0.3, spin: 1, tag: 'streak'}); }
    if (c.kind === 'blob') keys.push({t: c.t - 0.24, x: c.x!, y: c.y!, pri: 6, travel: 0.32, tag: 'blob'});
  }
  // summary MG: guide dives into the centre, then touches every row as it pops
  keys.push({t: mgIn.a, x: 540, y: 960, s: 1.3, pri: 10, travel: 0.3, spin: 1, tag: 'mg-in'});
  const sp = sumPlace();
  sp.rows.forEach((r, i) => keys.push({t: rowAt[i], x: r.side === 'sam' ? r.left + r.w - 30 : r.left + 30, y: r.top + 50, s: 0.8, pri: 9, travel: 0.22, tag: 'row'}));
  keys.push({t: mgOut.a, x: 540, y: 1700, pri: 10, travel: 0.25, tag: 'mg-out'});
  // CTA pills
  keys.push({t: cta.obuna, x: 150, y: 300, s: 0.75, pri: 9, travel: 0.3, spin: 1, tag: 'cta-obuna'});
  keys.push({t: cta.layk, x: 330, y: 410, s: 0.75, pri: 9, travel: 0.3, tag: 'cta-layk'});
  keys.push({t: edl.output.duration - 0.2, x: 930, y: 1090, pri: 5, travel: 0.5, spin: 1, tag: 'end'});

  // resolve conflicts: keep the higher priority when two keys are closer than 0.2 s
  keys.sort((a, b) => a.t - b.t);
  let K: GKey[] = [];
  for (const k of keys) {
    const last = K[K.length - 1];
    if (last && k.t - last.t < 0.2 && !(k.pri >= 8 && last.pri >= 8)) { if (k.pri > last.pri) K[K.length - 1] = k; continue; }
    K.push(k);
  }
  // fill long gaps with drift hops on beats so the guide never stands still
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
    const amp = Math.min(200, dist * 0.26); let px = -dy / dist, py = dx / dist;
    const ref = inMg(t) ? {x: 540, y: 800} : FACE; // arc away from the face
    if (Math.hypot(mx + px * amp - ref.x, my + py * amp - ref.y) < Math.hypot(mx - px * amp - ref.x, my - py * amp - ref.y)) { px = -px; py = -py; }
    const cx = mx + px * amp, cy = my + py * amp;
    return {
      x: (1 - u) * (1 - u) * k0.x + 2 * (1 - u) * u * cx + u * u * k1.x, y: (1 - u) * (1 - u) * k0.y + 2 * (1 - u) * u * cy + u * u * k1.y,
      s: lerp(k0.s ?? 1, k1.s ?? 1, uc), rot: lerp(rot0[i], rot0[i + 1], u), trav: Math.sin(Math.PI * clamp01((t - d0) / T)),
    };
  };
  const pos = (t: number) => { const b = base(t); return {x: b.x + Math.sin(t * 2 * Math.PI / 1.7) * 12 * (1 - b.trav), y: b.y + Math.sin(t * 2 * Math.PI / 1.13 + 1) * 9 * (1 - b.trav), s: b.s, rot: b.rot, trav: b.trav}; };
  const guide = (t: number): G => {
    const a = pos(t), e = 1 / 120, p0 = pos(t - e), p1 = pos(t + e);
    const vx = (p1.x - p0.x) / (2 * e), vy = (p1.y - p0.y) / (2 * e);
    return {x: a.x, y: a.y, s: a.s, rot: a.rot + 8 * Math.sin(t * 0.9), phi: lerp(32 + 22 * Math.sin(t * 1.3), 8, a.trav), vx, vy, speed: Math.hypot(vx, vy), endOn: 0};
  };
  return {beats, downbeats, drops, snap, beatsAfter, cuts, flashes, hits, keys: K, rowAt, mgIn, mgOut, guide, inMg, hookEnd, cta};
};
