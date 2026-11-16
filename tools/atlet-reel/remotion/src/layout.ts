// Pure layout helpers shared by the renderers and the guide path, so the guide knows where words and cards sit.
import {Caption, UiCard, Word} from './types';
import {textW} from './theme';

export const norm = (s: string) => s.replace(/[.,?!:—]/g, '').trim().toLowerCase();

// ---------------- captions ----------------
export const CAP = {top: 1175, size: 102, hero: 144, lh: 1.14, maxW: 880, gapEm: 0.26, padEm: 0.2};
export type WBox = {w: Word; i: number; line: number; x0: number; x1: number; yc: number; size: number; accent: boolean};
export type CapLayout = {hero: boolean; size: number; boxes: WBox[]; lines: number; bottom: number};

export const isAccent = (cap: Caption, w: Word) => !!cap.accent && norm(w.w) === norm(cap.accent);

export const capLayout = (cap: Caption): CapLayout => {
  const hero = cap.words.length === 1 && !!cap.accent;
  const size = hero ? CAP.hero : CAP.size;
  const ww = cap.words.map((w) => textW(w.w, size) + (isAccent(cap, w) ? 2 * CAP.padEm * size : 0));
  // B-style stacks: at most 2 words per line, wrap by width
  const lines: number[][] = [[]];
  let cur = 0;
  ww.forEach((w, i) => {
    const L = lines[lines.length - 1];
    const add = (L.length ? CAP.gapEm * size : 0) + w;
    if (L.length && (L.length >= 2 || cur + add > CAP.maxW)) { lines.push([i]); cur = w; } else { L.push(i); cur += add; }
  });
  const lh = size * CAP.lh;
  const boxes: WBox[] = [];
  lines.forEach((L, li) => {
    const tot = L.reduce((a, i, k) => a + ww[i] + (k ? CAP.gapEm * size : 0), 0);
    let x = 540 - tot / 2;
    L.forEach((i) => {
      boxes.push({w: cap.words[i], i, line: li, x0: x, x1: x + ww[i], yc: CAP.top + lh * (li + 0.5), size, accent: isAccent(cap, cap.words[i])});
      x += ww[i] + CAP.gapEm * size;
    });
  });
  return {hero, size, boxes, lines: lines.length, bottom: CAP.top + lh * lines.length};
};

/** where the guide sits next to an accent word: right of the pill, else left, else underneath */
export const accentSpot = (b: WBox, all: WBox[] = []) => {
  const after = all.some((o) => o.line === b.line && o.i > b.i), before = all.some((o) => o.line === b.line && o.i < b.i);
  const lastLine = !all.some((o) => o.line > b.line);
  if (after) {
    if (!before && b.x0 - 96 > 50) return {x: b.x0 - 96, y: b.yc - b.size * 0.08};
    return lastLine ? {x: (b.x0 + b.x1) / 2, y: b.yc + b.size * 0.78} : {x: (b.x0 + b.x1) / 2, y: b.yc - b.size * 0.8};
  }
  if (b.x1 + 96 < 1030) return {x: b.x1 + 96, y: b.yc - b.size * 0.08};
  if (b.x0 - 96 > 50) return {x: b.x0 - 96, y: b.yc - b.size * 0.08};
  return {x: (b.x0 + b.x1) / 2, y: b.yc + b.size * 0.66};
};

// ---------------- UI cards ----------------
export type Place = {left: number; top: number; w: number; h: number; ax: number; ay: number; group?: string; idx?: number};
export const pillW = (label: string, size = 40) => textW(label, size, 600) + 34 * 2 + 16 + 16;
export const BADGE_COMPACT_TOP = 112;

/** one placement per card (index in edl.ui_cards). ax/ay = where the guide lands to open it */
export const uiPlaces = (cards: UiCard[]): Place[] => {
  const out: Place[] = [];
  const pills = cards.filter((c) => c.kind === 'glass_pill');
  const grp = (c: UiCard) => (c.t < 10 ? 'a' : c.t < 70 ? 'b' : 'cta');
  const chips = cards.filter((c) => c.kind === 'icon_chip');
  const chipW = chips.map((c) => textW(c.label, 36, 500) + 28 * 2 + 14 + 14);
  const chipTot = chipW.reduce((a, b) => a + b, 0) + 20 * (chips.length - 1);
  cards.forEach((c) => {
    if (c.kind === 'glass_pill') {
      const g = grp(c); const same = pills.filter((p) => grp(p) === g); const i = same.indexOf(c);
      const w = pillW(c.label, g === 'cta' ? 60 : 44) + (g === 'cta' ? 70 : 0), h = g === 'cta' ? 116 : 84;
      if (g === 'cta') { const top = 214 + i * 146, left = 540 - w / 2; out.push({left, top, w, h, ax: left + 70, ay: top + h / 2, group: g, idx: i}); }
      else { const top = 236 + i * 100, left = 1024 - w; out.push({left, top, w, h, ax: left + 42, ay: top + h / 2, group: g, idx: i}); }
    } else if (c.kind === 'section_badge') {
      out.push({left: 0, top: 230, w: 1080, h: 160, ax: 110, ay: 300});
    } else if (c.kind === 'icon_chip') {
      const i = chips.indexOf(c); const left = 540 - chipTot / 2 + chipW.slice(0, i).reduce((a, b) => a + b, 0) + 20 * i;
      out.push({left, top: 300, w: chipW[i], h: 70, ax: left + 34, ay: 335, idx: i});
    } else if (c.kind === 'analytics_card') {
      const second = cards.filter((k) => k.kind === 'analytics_card').indexOf(c) === 1;
      out.push({left: 190, top: 220, w: 700, h: 260, ax: second ? 228 : 872, ay: second ? 410 : 236});
    } else if (c.kind === 'glass_card') {
      const w = textW(c.label, 48, 600) + 84; out.push({left: 540 - w / 2, top: 236, w, h: 106, ax: 540 - w / 2 - 6, ay: 289});
    } else if (c.kind === 'donut_card') {
      const i = cards.filter((k) => k.kind === 'donut_card').indexOf(c);
      const a = -Math.PI / 2 + [0.2, 0.62, 0.92][i] * Math.PI * 2;
      out.push({left: 300, top: 250, w: 480, h: 204, ax: 300 + 36 + 80 + Math.cos(a) * 96, ay: 250 + 22 + 80 + Math.sin(a) * 96, idx: i});
    } else if (c.kind === 'graph_card') {
      out.push({left: 56, top: 236, w: 440, h: 230, ax: 96, ay: 418});
    } else if (c.kind === 'bar_card') {
      const i = cards.filter((k) => k.kind === 'bar_card').indexOf(c);
      out.push({left: 240, top: 260, w: 600, h: 200, ax: 276 + 528 * (i ? 0.78 : 0.88), ay: 260 + 24 + 50 + 8 + i * 78, idx: i});
    } else if (c.kind === 'equation_card') {
      const eq = cards.filter((k) => k.kind === 'equation_card'); const i = eq.indexOf(c);
      const w0 = textW(eq[0].label, 58, 700), w1 = textW(eq[1]?.label ?? '', 58, 700); const tot = w0 + 22 + w1 + 80; const left = 540 - tot / 2;
      out.push({left, top: 226, w: tot, h: 122, ax: i ? left + 40 + w0 + 11 : left - 8, ay: 287, idx: i});
    } else out.push({left: 0, top: 0, w: 0, h: 0, ax: 900, ay: 1100});
  });
  return out;
};

// ---------------- 3D cluster projection (MG panels) ----------------
export type Tilt = {cx: number; cy: number; rx: number; ry: number; persp: number; scale: number};
/** screen position of a point (x,y) given in the cluster's local px (origin = cluster centre); matches
 *  CSS `perspective(P) rotateX(rx) rotateY(ry) scale(s)` with transform-origin at the centre */
export const project = (T: Tilt, x: number, y: number) => {
  const a = (T.rx * Math.PI) / 180, b = (T.ry * Math.PI) / 180;
  x *= T.scale; y *= T.scale;
  // rotateY then rotateX (CSS applies the right-most transform first)
  const x1 = x * Math.cos(b), z1 = -x * Math.sin(b);
  const y2 = y * Math.cos(a) - z1 * Math.sin(a), z2 = y * Math.sin(a) + z1 * Math.cos(a);
  const k = T.persp / (T.persp - z2);
  return {x: T.cx + x1 * k, y: T.cy + y2 * k};
};
