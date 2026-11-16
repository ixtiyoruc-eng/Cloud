// Scene plan for the two full-screen MG slots (reference-A style scenes): timing, geometry and the guide's stops.
import {Caption, MgSlot} from './types';
import {Tilt, project} from './layout';
import {textW} from './theme';

export const SUB = {size: 58, pad: 36};
export const subLeft = (txt: string) => 540 - (textW(txt, SUB.size, 800) + 2 * SUB.pad) / 2;
export const SUB0_Y = 446, SUB1_Y = 1040, SUB2_Y = 1092;

export type Trans = 'portalIn' | 'portalOut' | 'whipL' | 'whipR' | 'whipUp' | 'blob' | 'none';
export type Scene = {slot: string; i: number; a: number; b: number; light: boolean; inT: Trans; inDur: number};
export type GKey = {t: number; x: number; y: number; s?: number; pri: number; travel?: number; spin?: number; tag?: string};
export type Panel = {id: string; x: number; y: number; w: number; h: number; at: number};
export type MgInfo = {
  slot: MgSlot; scenes: Scene[]; keys: GKey[]; tilt: Tilt;
  panels: Record<number, Panel[]>; // per scene index
  times: Record<string, number>; // named key times (word hits)
  exit: {a: number; b: number; kind: Trans}; entry: {a: number; b: number; kind: Trans};
};

export const wordTime = (caps: Caption[], re: RegExp, t0: number, t1: number) => {
  for (const c of caps) for (const w of c.words) if (w.t >= t0 && w.t < t1 && re.test(w.w)) return w.t;
  return null;
};

export const TILT: Tilt = {cx: 540, cy: 800, rx: 14, ry: -16, persp: 1700, scale: 1};
export const RING = {cx: 540, cy: 770, r: 286};
export const TITLE_Y = 300; // inside the Reels safe zone (top 220)

export const planMg = (slot: MgSlot, caps: Caption[], snap: (t: number, w?: number) => number, beatsAfter: (t: number, n: number) => number[]): MgInfo => {
  const c = slot.cards; const keys: GKey[] = []; const times: Record<string, number> = {};
  const panels: Record<number, Panel[]> = {};
  const land = slot.land; const end = slot.out_end;
  const isMg1 = slot.id === 'MG1';
  const tilt: Tilt = {...TILT, scale: isMg1 ? 1 : 1.12};
  const scenes: Scene[] = c.map((k, i) => ({
    slot: slot.id, i, a: i === 0 ? slot.out_start : k.t, b: k.out_end, light: i === 1,
    inT: i === 0 ? (isMg1 ? 'portalIn' : 'whipL') : isMg1 ? (i === 1 ? 'blob' : 'whipL') : i === 1 ? 'whipL' : 'blob',
    inDur: i === 0 ? land - slot.out_start : i === 1 && isMg1 ? 0.2 : 0.26,
  }));
  const entry = {a: slot.out_start, b: land, kind: scenes[0].inT};
  const exit = isMg1 ? {a: end - 0.27, b: end, kind: 'portalOut' as Trans} : {a: end - 0.28, b: end, kind: 'whipUp' as Trans};

  // ---- entry: MG1 = zoom-through the guide's plate (portal), MG2 = whip led by the guide
  if (isMg1) {
    keys.push({t: slot.out_start, x: 540, y: 1480, pri: 10, travel: 0.3, tag: 'portal-in'});
    keys.push({t: land, x: 540, y: 1480, s: 0.03, pri: 10, travel: 0.02, tag: 'portal-done'});
  } else keys.push({t: slot.out_start, x: 1010, y: 760, pri: 10, travel: 0.3, tag: 'whip-in'});
  // title sweep right after landing (letters assemble behind the guide)
  const tA = isMg1 ? land + 0.3 : land, tB = snap(tA + 0.42, 0.1);
  keys.push({t: tA, x: 110, y: TITLE_Y, s: 0.9, pri: 9, travel: isMg1 ? 0.3 : land - slot.out_start, spin: 1, tag: 'mg-title-start'});
  keys.push({t: tB, x: 990, y: TITLE_Y, s: 0.9, pri: 9, travel: 0.4, spin: 1, tag: 'mg-title-end'});
  times.titleA = tA; times.titleB = tB;
  // ---- scene 0: tilted 3D panel cluster, panels pop on beats as the guide touches them
  const bts = beatsAfter(tB - 0.05, 6);
  const P0: Panel[] = isMg1
    ? [
        {id: 'main', x: -430, y: -270, w: 520, h: 300, at: bts[0]},
        {id: 'dots', x: -90, y: 50, w: 260, h: 110, at: bts[1]},
        {id: 'bars', x: -430, y: 50, w: 320, h: 240, at: bts[2]},
        {id: 'plate', x: 110, y: -270, w: 320, h: 300, at: bts[3]},
        {id: 'pie', x: 190, y: 50, w: 240, h: 240, at: bts[4]},
        {id: 'spark', x: -90, y: 180, w: 260, h: 110, at: bts[5]},
      ]
    : [
        {id: 'battery', x: -430, y: -270, w: 380, h: 420, at: bts[0]},
        {id: 'atf', x: -30, y: -270, w: 460, h: 200, at: bts[1]},
        {id: 'line', x: -30, y: -50, w: 460, h: 200, at: bts[2]},
        {id: 'dots', x: -430, y: 170, w: 380, h: 120, at: bts[3]},
        {id: 'pie', x: -30, y: 170, w: 460, h: 120, at: bts[4]},
      ];
  panels[0] = P0;
  P0.forEach((p) => {
    const q = project(tilt, p.x + p.w - 18, p.y + 18); // top-right corner of the panel: guide lands, panel pops
    keys.push({t: p.at, x: q.x, y: q.y, pri: 8, travel: 0.3, tag: 'panel-' + p.id});
  });
  // subtitle pill / accent word inside scene 0
  const subRe = isMg1 ? /^köp$/i : /^ATF$/i;
  const ws = wordTime(caps, subRe, c[0].t + 1.5, c[0].out_end);
  const wsT = ws != null ? snap(ws, 0.1) : null;
  if (wsT != null) { times.sub0 = wsT; const q = project(tilt, -30 + 230, -270 + 40); keys.push({t: wsT, x: isMg1 ? subLeft(c[0].subtitle) - 74 : q.x, y: isMg1 ? SUB0_Y : q.y, pri: 9, travel: 0.28, tag: 'sub0'}); }
  // idle hops on remaining beats of scene 0 around the main panel
  const lastAt = Math.max(...P0.map((p) => p.at), wsT ?? 0);
  beatsAfter(lastAt + 0.4, 12).filter((t) => t < c[0].out_end - 0.35).forEach((t, k) => {
    const corner = k % 2 ? project(tilt, -430 + 20, -270 + 16) : project(tilt, P0[0].x + P0[0].w - 20, P0[0].y + P0[0].h - 16);
    keys.push({t, x: corner.x, y: corner.y, pri: 2, travel: 0.32, tag: 'mg-idle'});
  });
  // lead into transition to scene 1
  const s1 = scenes[1];
  keys.push({t: s1.a - (isMg1 ? 0.2 : 0.12), x: isMg1 ? 760 : 1010, y: isMg1 ? 920 : 800, pri: 9, travel: 0.3, tag: 'to-s1'});

  // ---- scene 1 (light flip)
  if (isMg1) {
    // blob grows from the guide (held), then the guide drops under "qiyin"
    keys.push({t: s1.a, x: 760, y: 920, pri: 9, travel: 0.05, spin: 0.5});
    keys.push({t: s1.a + 0.2, x: 540, y: 1000, pri: 9, travel: 0.18, tag: 'under-qiyin'});
  } else {
    // whip to the light scene led by the guide (right -> left), then it rides the ribbon front
    keys.push({t: s1.a + 0.14, x: 70, y: 800, pri: 9, travel: 0.26, spin: 1, tag: 'whip-lead'});
    const rb = [[180, 640], [420, 560], [700, 640], [940, 560]];
    rb.forEach(([x, y], k) => keys.push({t: s1.a + 0.4 + k * 0.17, x, y, pri: 8, travel: 0.16, tag: 'ribbon'}));
    const wm = wordTime(caps, /manba/i, s1.a, s1.b);
    if (wm != null) { times.sub1 = snap(wm, 0.1); keys.push({t: times.sub1, x: subLeft(c[1].subtitle) - 74, y: SUB1_Y, pri: 9, travel: 0.3, tag: 'sub1'}); }
  }
  const s2 = scenes[2];
  keys.push({t: s2.a - (isMg1 ? 0.12 : 0.22), x: isMg1 ? 1010 : 820, y: isMg1 ? 760 : 980, pri: 9, travel: isMg1 ? 0.2 : 0.3, tag: 'to-s2'});

  // ---- scene 2: big ring sweeping round a framed card; the guide rides the arc's leading end
  const sweepA = s2.a + 0.08, sweepB = s2.a + 1.15; times.ringA = sweepA; times.ringB = sweepB;
  const ringAng = (u: number) => -200 + 300 * u; // degrees
  for (let k = 0; k <= 5; k++) {
    const u = k / 5, ang = (ringAng(u) * Math.PI) / 180;
    keys.push({t: sweepA + (sweepB - sweepA) * u, x: RING.cx + Math.cos(ang) * RING.r, y: RING.cy + Math.sin(ang) * RING.r, pri: 9, travel: k ? (sweepB - sweepA) / 5 : 0.12, spin: 0.25, tag: 'ring'});
  }
  if (isMg1) {
    const wsu = wordTime(caps, /^suyuq/i, s2.a, s2.b); if (wsu != null) { times.sub2 = snap(wsu, 0.1); keys.push({t: times.sub2, x: subLeft(c[2].subtitle) - 74, y: SUB2_Y, pri: 9, travel: 0.3, tag: 'sub2'}); }
    const wg = wordTime(caps, /geyner/i, s2.a + 1, s2.b); if (wg != null) {
      times.hero2 = snap(wg, 0.1);
      keys.push({t: times.hero2 - 0.02, x: 150, y: 330, pri: 9, travel: 0.3, tag: 'hero-a'});
      keys.push({t: times.hero2 + 0.42, x: 960, y: 330, pri: 9, travel: 0.42, spin: 1, tag: 'hero-b'});
    }
  } else {
    times.hero2 = s2.a + 0.05;
  }
  // orbit the ring on the remaining beats
  const orbitFrom = Math.max(sweepB, (times.hero2 ?? 0) + 0.5, (times.sub2 ?? 0) + 0.4);
  beatsAfter(orbitFrom + 0.3, 14).filter((t) => t < exit.a - 0.3).forEach((t, k) => {
    const ang = ((100 + k * 70) * Math.PI) / 180;
    keys.push({t, x: RING.cx + Math.cos(ang) * RING.r, y: RING.cy + Math.sin(ang) * RING.r, pri: 2, travel: 0.36, spin: 0.25, tag: 'orbit'});
  });
  // exit
  if (isMg1) keys.push({t: exit.a, x: 540, y: 1480, pri: 10, travel: 0.25, tag: 'portal-out'});
  else { keys.push({t: exit.a, x: 540, y: 1060, pri: 10, travel: 0.25, tag: 'up-a'}); keys.push({t: exit.b, x: 540, y: 90, pri: 10, travel: 0.27, spin: 1, tag: 'up-b'}); }
  return {slot, scenes, keys, tilt, panels, times, exit, entry};
};
