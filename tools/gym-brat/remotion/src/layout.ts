// Pure layout helpers shared by the renderers and the guide path, so the guide knows where words, chips and pills sit.
import {Caption, Edl, Info, Side, Word} from './types';
import {textW} from './theme';

export const norm = (s: string) => s.replace(/[.,?!:—]/g, '').trim().toLowerCase();

// Instagram Reels safe zone (1080x1920): clear of the top 220 px, the bottom 450 px and the right 120 px of the lower half
export const SAFE = {top: 224, bottom: 1470, left: 60, right: 960};

// ---------------- captions (reference-B stacks, same metrics as the Atlet reel) ----------------
export const CAP = {top: 1120, size: 102, hero: 144, lh: 1.14, maxW: 880, gapEm: 0.26, padEm: 0.2};
export const CAP_MG = {top: 1300, size: 78, hero: 96};
export type WBox = {w: Word; i: number; line: number; x0: number; x1: number; yc: number; size: number; accent: boolean};
export type CapLayout = {hero: boolean; size: number; top: number; boxes: WBox[]; lines: number; bottom: number};
export const isAccent = (cap: Caption, w: Word) => !!cap.accent && norm(w.w) === norm(cap.accent);

export const capLayout = (cap: Caption, inMg = false): CapLayout => {
  const hero = cap.words.length === 1 && !!cap.accent;
  const top = inMg ? CAP_MG.top : CAP.top;
  const size = hero ? (inMg ? CAP_MG.hero : CAP.hero) : inMg ? CAP_MG.size : CAP.size;
  const ww = cap.words.map((w) => textW(w.w, size) + (isAccent(cap, w) ? 2 * CAP.padEm * size : 0));
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
      boxes.push({w: cap.words[i], i, line: li, x0: x, x1: x + ww[i], yc: top + lh * (li + 0.5), size, accent: isAccent(cap, cap.words[i])});
      x += ww[i] + CAP.gapEm * size;
    });
  });
  return {hero, size, top, boxes, lines: lines.length, bottom: top + lh * lines.length};
};

// ---------------- OZIŞ vs SAMIRIŞ tracker ----------------
export const PILL = {y: 284, h: 96, w: 360};
export const PILL_X: Record<'oz' | 'sam', number> = {oz: 300, sam: 780};
export const SIDE_NAME: Record<'oz' | 'sam', string> = {oz: 'OZIŞ', sam: 'SAMIRIŞ'};
/** chips are born under the hero word (caption zone) and fly to the pill */
export const CHIP_FROM = {x: 540, y: 1040};
export const chipTargets = (side: Side): ('oz' | 'sam')[] => (side === 'both' ? ['oz', 'sam'] : [side]);

// hook words (big type over the chest, before the tracker exists)
export const HOOK = {oz: {x: 540, y: 1150, size: 200}, vs: {x: 540, y: 1300, size: 96}, sam: {x: 540, y: 1440, size: 168}};

// ---------------- info chips beside the head ----------------
export const INFO_H = 84;
export const infoPlace = (all: Info[], x: Info) => {
  const same = all.filter((k) => k.group === x.group && k.side === x.side);
  const n = same.indexOf(x);
  const w = textW(x.label, 44, 700) + 28 * 2 + 50 + 12;
  const top = 610 + n * (INFO_H + 18);
  const left = x.side === 'L' ? 48 : 1032 - w;
  return {left, top, w, h: INFO_H, ax: x.side === 'L' ? left + 4 : left + w - 4, ay: top + INFO_H / 2};
};

// ---------------- summary MG ----------------
export const SUM = {titleY: 300, colTop: 430, rowH: 118, colW: 452, gap: 32};
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
/** screen box of each summary row: two columns, BCAA spans both at the bottom */
export const sumPlace = () => {
  const colX = {oz: 540 - SUM.gap / 2 - SUM.colW, sam: 540 + SUM.gap / 2};
  const n = {oz: 0, sam: 0};
  const rows = SUM_ROWS.map((r) => {
    if (r.side === 'both') return {...r, left: colX.oz, top: 0, w: SUM.colW * 2 + SUM.gap};
    const top = SUM.colTop + 104 + n[r.side] * SUM.rowH; n[r.side]++;
    return {...r, left: colX[r.side], top, w: SUM.colW};
  });
  const maxN = Math.max(n.oz, n.sam);
  rows.forEach((r) => { if (r.side === 'both') r.top = SUM.colTop + 104 + maxN * SUM.rowH + 10; });
  return {rows, colX};
};
export const counts = (edl: Edl, t: number) => {
  const c = {oz: 0, sam: 0};
  for (const v of edl.verdicts) if (t >= v.t + 0.42) for (const s of chipTargets(v.side)) c[s]++;
  return c;
};
