// src/features/quotes/window/types.ts
export type Glazing = 'singolo'|'doppio'|'triplo'|'satinato';
export type LeafState = 'fissa'|'apre_sx'|'apre_dx'|'vasistas'|'tilt_sx'|'tilt_dx';

export type GridWindow = {
  width_mm: number;
  height_mm: number;
  frame_mm?: number;   // es. 60
  mullion_mm?: number; // es. 40
  glazing: Glazing;
  showDims?: boolean;
  rows: Array<{
    height_ratio: number; // somma = 1
    cols: Array<{
      width_ratio: number; // somma = 1 nella riga
      leaf: { state: LeafState };
    }>;
  }>;
};