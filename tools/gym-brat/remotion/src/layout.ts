// Pure layout helpers shared by the renderers and the guide path, so the guide knows where words, chips and pills sit.
// v2 (2026-11-21): stricter Instagram safe zone and nothing over the face (see face.ts).
import {Caption, Edl, Info, Side, Word} from './types';
import {textW} from './theme';
import {Face} from './face';

export const norm = (s: string) => s.replace(/[.,?!:—]/g, '').trim().toLowerCase();

// Instagram Reels safe zone (1080x1920): text and UI stay out of the top 260 px (header), the bottom 480 px
// (caption, audio, username) and, in the lower half, right of x 940 (like / comment / share column).
export const SAFE = {top: 260, bottom: 1440, left: 70, right: 1010, rightLow: 940, lowFrom: 900};

// ---------------- captions (reference-B stacks) ----------------
export const CAP = {top: 1120, size: 100, hero: 136, lh: 1.14, maxW: 740, gapEm: 0.26, padEm: 0.2};
export const CAP_MG = {top: 1262, size: 62, hero: 76};
export type WBox = {w: Word; i: number; line: number; x0: number; x1: number; yc: number; size: number; accent: boolean};
export type CapLayout = {hero: boolean; size: number; top: number; boxes: WBox[]; lines: number; bottom: number};
export const isAccent = (cap: Caption, w: Word) => !!cap.accent && norm(w.w) === norm(cap.accent);
const CX = 505; // captions centre a little left of 540 so wide lines keep clear of the right-hand buttons

export const capLayout = (cap: Caption, inMg = false): CapLayout => {
  const hero = cap.words.length === 1 && !!cap.accent;
  const top = inMg ? CAP_MG.top : CAP.top;
  let size = hero ? (inMg ? CAP_MG.hero : CAP.hero) : inMg ? CAP_MG.size : CAP.size;
  const widths = (sz: number) => cap.words.map((w) => textW(w.w, sz) + (isAccent(cap, w) ? 2 * CAP.padEm * sz : 0));
  // one word wider than the column: shrink the whole caption to fit
  const widest = Math.max(...widths(size)); if (widest > CAP.maxW) size = Math.floor(size * CAP.maxW / widest);
  const ww = widths(size);
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
    let x = CX - tot / 2;
    L.forEach((i) => {
      boxes.push({w: cap.words[i], i, line: li, x0: x, x1: x + ww[i], yc: top + lh * (li + 0.5), size, accent: isAccent(cap, cap.words[i])});
      x += ww[i] + CAP.gapEm * size;
    });
  });
  return {hero, size, top, boxes, lines: lines.length, bottom: top + lh * lines.length};
};
export const CAP_CX = CX;

// ---------------- OZIŞ vs SAMIRIŞ tracker: two pills in the top corners, beside / above the head ----------------
export const PILL = {y: 306, h: 88, w: 310};
export const PILL_X: Record<'oz' | 'sam', number> = {oz: 80 + 155, sam: 1010 - 155};
export const CHIP_FROM = {x: CX, y: 1040};
export const chipTargets = (side: Side): ('oz' | 'sam')[] => (side === 'both' ? ['oz', 'sam'] : [side]);

// hook words over the chest (below the chin, above the bottom safe line)
export const HOOK = {oz: {x: CX, y: 1135, size: 176}, vs: {x: CX, y: 1262, size: 80}, sam: {x: CX, y: 1372, size: 140}};

// ---------------- info chips: a row under the chin, or beside the face if there is no room ----------------
export const INFO_H = 80;
export const infoW = (label: string) => textW(label, 42, 700) + 28 * 2 + 46 + 12;
export type IPlace = {left: number; top: number; w: number; h: number; ax: number; ay: number};
export const infoPlaces = (all: Info[], face: Face): Map<Info, IPlace> => {
  const out = new Map<Info, IPlace>();
  const groups = Array.from(new Set(all.map((x) => x.group)));
  for (const g of groups) {
    const items = all.filter((x) => x.group === g);
    const f = face.span(items[0].t, items[0].out_end, 24);
    // pack into rows of width <= 840 centred on CX, starting under the chin
    const rows: Info[][] = [[]]; let cur = 0;
    for (const x of items) { const w = infoW(x.label); if (rows[rows.length - 1].length && cur + 18 + w > 840) { rows.push([x]); cur = w; } else { rows[rows.length - 1].push(x); cur += (cur ? 18 : 0) + w; } }
    const top0 = Math.max(f.y1 + 16, SAFE.top + 110);
    if (top0 + rows.length * (INFO_H + 16) <= CAP.top - 30) {
      rows.forEach((r, ri) => {
        const tot = r.reduce((a, x, k) => a + infoW(x.label) + (k ? 18 : 0), 0); let left = CX - tot / 2;
        r.forEach((x) => { const w = infoW(x.label); const top = top0 + ri * (INFO_H + 16); out.set(x, {left, top, w, h: INFO_H, ax: left + 4, ay: top + INFO_H / 2}); left += w + 18; });
      });
    } else {
      // beside the face: left column right-aligned to the face, right column left-aligned
      const n = {L: 0, R: 0};
      items.forEach((x) => {
        const w = infoW(x.label); const k = n[x.side]++; const top = Math.max(SAFE.top + 110, (f.y0 + f.y1) / 2 - 60) + k * (INFO_H + 16);
        const left = x.side === 'L' ? Math.max(SAFE.left - 30, f.x0 - 12 - w) : Math.min(f.x1 + 12, SAFE.right - w);
        out.set(x, {left, top, w, h: INFO_H, ax: x.side === 'L' ? left + w - 4 : left + 4, ay: top + INFO_H / 2});
      });
    }
  }
  return out;
};

// ---------------- summary MG: face window at the top, table below ----------------
export const WIN = {cx: 540, cy: 420, r: 150};
export const SUM = {titleY: 640, colTop: 700, rowH: 92, rowCard: 80, colW: 400, gap: 24};
export type SumRow = {side: 'oz' | 'sam' | 'both'; name: string; sub?: string};
export const SUM_ROWS: SumRow[] = [
  {side: 'sam', name: 'Geyner'},
  {side: 'oz', name: 'L-karnitin'},
  {side: 'both', name: 'BCAA'},
  {side: 'oz', name: 'Kreatin', sub: 'gidroxlorid'},
  {side: 'sam', name: 'Kreatin', sub: 'monogidrat'},
  {side: 'oz', name: 'Yoximbe'},
  {side: 'oz', name: 'Protein', sub: 'izolyat'},
  {side: 'sam', name: 'Protein', sub: 'konsentrat'},
];
export const sumPlace = () => {
  const colX = {oz: CX - SUM.gap / 2 - SUM.colW, sam: CX + SUM.gap / 2};
  const n = {oz: 0, sam: 0};
  const head = SUM.colTop + 80;
  const rows = SUM_ROWS.map((r) => {
    if (r.side === 'both') return {...r, left: colX.oz, top: 0, w: SUM.colW * 2 + SUM.gap};
    const top = head + n[r.side] * SUM.rowH; n[r.side]++;
    return {...r, left: colX[r.side], top, w: SUM.colW};
  });
  const maxN = Math.max(n.oz, n.sam);
  rows.forEach((r) => { if (r.side === 'both') r.top = head + maxN * SUM.rowH; });
  return {rows, colX};
};
export const counts = (edl: Edl, t: number) => {
  const c = {oz: 0, sam: 0};
  edl.verdicts.forEach((v) => chipTargets(v.side).forEach((s, k) => { if (t >= v.t + 0.42 + k * 0.36) c[s]++; }));
  return c;
};
