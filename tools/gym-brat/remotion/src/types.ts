export type Word = {w: string; t: number};
export type Caption = {seg: string; out_start: number; out_end: number; text: string; words: Word[]; accent: string | null; role: string | null};
export type Side = 'oz' | 'sam' | 'both';
export type Item = {name: string; t: number};
export type Verdict = {item: string; side: Side; label: string; t: number};
export type Info = {t: number; out_end: number; label: string; icon: 'up' | 'down' | 'bolt' | 'check'; side: 'L' | 'R'; group: string; seg: string};
export type Cut = {at: number; prev: string; next: string; kind: 'blob' | 'whipL' | 'whipR' | 'punch' | 'streak' | 'none'};
export type Segment = {id: string; out_start: number; out_end: number; zoom: string};
export type Edl = {
  output: {width: number; height: number; fps: number; duration: number};
  segments: Segment[]; captions: Caption[]; items: Item[]; verdicts: Verdict[]; info: Info[]; cuts: Cut[];
  mg: {a: number; b: number};
  music: {beats_out: number[]; downbeats_out: number[]; drops_out: number[]};
};
