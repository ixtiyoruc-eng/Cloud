// Face track from plate.py (face.json: per output frame [x0, y0, x1, y1] incl. hair, or null). Graphics use it so that
// nothing animates over the speaker's face (user rule, 2026-11-21).
export type Box = {x0: number; y0: number; x1: number; y1: number};
export type FaceTrack = (number[] | null)[];

export const makeFace = (track: FaceTrack, fps = 30) => {
  // fill gaps with the last detection (leading gaps with the first one)
  const n = track.length; const filled: Box[] = new Array(n);
  let last: number[] | null = track.find((b) => b) ?? [390, 330, 690, 800];
  for (let i = 0; i < n; i++) { if (track[i]) last = track[i]; filled[i] = {x0: last![0], y0: last![1], x1: last![2], y1: last![3]}; }
  const at = (t: number, pad = 0): Box => {
    const b = filled[Math.max(0, Math.min(n - 1, Math.round(t * fps)))] ?? {x0: 390, y0: 330, x1: 690, y1: 800};
    return {x0: b.x0 - pad, y0: b.y0 - pad, x1: b.x1 + pad, y1: b.y1 + pad};
  };
  /** union of the face boxes over [a, b] (for placing things that stay up for a while) */
  const span = (a: number, b: number, pad = 0): Box => {
    const r = {x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9};
    for (let t = a; t <= b; t += 1 / fps) { const q = at(t); r.x0 = Math.min(r.x0, q.x0); r.y0 = Math.min(r.y0, q.y0); r.x1 = Math.max(r.x1, q.x1); r.y1 = Math.max(r.y1, q.y1); }
    return {x0: r.x0 - pad, y0: r.y0 - pad, x1: r.x1 + pad, y1: r.y1 + pad};
  };
  return {at, span};
};
export type Face = ReturnType<typeof makeFace>;

export const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

/** push a point out of the face ellipse (box + pad) along the ray from its centre */
export const avoidPoint = (x: number, y: number, f: Box, pad = 70) => {
  const cx = (f.x0 + f.x1) / 2, cy = (f.y0 + f.y1) / 2, rx = (f.x1 - f.x0) / 2 + pad, ry = (f.y1 - f.y0) / 2 + pad;
  const dx = (x - cx) / rx, dy = (y - cy) / ry, d = Math.hypot(dx, dy);
  if (d >= 1) return {x, y};
  if (d < 1e-3) return {x: cx + rx, y: cy};
  return {x: cx + (dx / d) * rx, y: cy + (dy / d) * ry};
};

/** shift a box sideways (toward `side`) until it clears the face */
export const avoidBox = (b: Box, f: Box, side: -1 | 1): Box => {
  if (!overlaps(b, f)) return b;
  const dx = side < 0 ? f.x0 - b.x1 : f.x1 - b.x0;
  return {x0: b.x0 + dx, x1: b.x1 + dx, y0: b.y0, y1: b.y1};
};
