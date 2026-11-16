export type Word = {w: string; t: number};
export type Caption = {out_start: number; out_end: number; text: string; words: Word[]; accent: string | null; over_mg: boolean};
export type MgCard = {t: number; out_end: number; title: string; subtitle: string; visual: string};
export type MgSlot = {id: string; out_start: number; land: number; out_end: number; cards: MgCard[]};
export type UiCard = {t: number; out_end: number; kind: string; label: string};
export type DumbbellCue = {t: number; out_end: number; action: string};
export type Edl = {
  output: {width: number; height: number; fps: number; duration: number};
  captions: Caption[]; mg_slots: MgSlot[]; ui_cards: UiCard[]; dumbbell: DumbbellCue[];
};
