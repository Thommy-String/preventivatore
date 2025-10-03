// src/features/quotes/types.ts

export type QuoteStatus = 'bozza'|'inviato'|'accettato'|'rifiutato'|'scaduto'
export type VatRate = '22'|'10'|'4'
export type PriceMode = 'per_mq' | 'per_pezzo' | 'total'

export type QuoteKind =
  | 'finestra'
  | 'portafinestra'
  | 'scorrevole'
  | 'cassonetto'
  | 'zanzariera'
  | 'persiana'
  | 'tapparella'
  | 'custom'

export type CustomField = {
  key: string
  name: string
  value: string
}

/** Stato di apertura per ogni anta nel disegno */
export type LeafState =
  | 'fissa'
  | 'apre_sx'
  | 'apre_dx'
  | 'vasistas'
  | 'apre_sx+vasistas'
  | 'apre_dx+vasistas'

/** Configurazione disegno finestra per l'SVG (opzionale) */
export type GridWindowConfig = {
  /** larghezza totale in mm (sincronizzata con width_mm dell'item) */
  width_mm: number
  /** altezza totale in mm (sincronizzata con height_mm dell'item) */
  height_mm: number
  /** spessore telaio in mm */
  frame_mm: number
  /** spessore montante/traverso in mm */
  mullion_mm: number
  /** tipo vetro solo per resa grafica */
  glazing: 'singolo' | 'doppio' | 'triplo' | 'satinato'
  /** mostrare quote L/H sopra il disegno */
  showDims?: boolean
  /** righe della griglia: ciascuna ha un'altezza relativa e una lista di colonne con larghezze relative */
  rows: Array<{
    height_ratio: number
    cols: Array<{
      width_ratio: number
      /** stato della singola anta (facoltativo se pannello fisso) */
      leaf?: { state: LeafState }
    }>
  }>
}

export type BaseItem = {
  id: string
  kind: QuoteKind
  width_mm: number
  height_mm: number
  qty: number

  // prezzi interni (non stampati nel PDF)
  price_mode?: PriceMode
  price_per_mq?: number | null
  price_total?: number | null

  // meta
  notes?: string | null
  reference?: string | null
  custom_fields?: CustomField[]

  // immagine voce (URL pubblico supabase o dataURL temporaneo)
  image_url?: string
}

/** Finestre/Portefinestre */
export type WindowItem = BaseItem & {
  kind: 'finestra' | 'portafinestra'
  color?: string | null
  glass?: string | null
  hinges_color?: string | null
  uw?: number | null
  profile_system?: string | null
  /** Opzioni avanzate per disegno finestra */
  options?: { gridWindow?: GridWindowConfig }
}

/** Scorrevole (stesse proprietà delle finestre) */
export type ScorrevoleItem = BaseItem & {
  kind: 'scorrevole'
  color?: string | null
  glass?: string | null
  hinges_color?: string | null
  uw?: number | null
  profile_system?: string | null
  /** Opzioni avanzate per disegno scorrevole */
  options?: { gridWindow?: GridWindowConfig }
}

/** Cassonetto */
export type CassonettoItem = BaseItem & {
  kind: 'cassonetto'
  material?: 'PVC' | 'Alluminio' | 'Altro' | null
  depth_mm?: number | null
  celino_mm?: number | null   // “celino” (ex spalletta/extension)
}

/** Zanzariera */
export type ZanzarieraItem = BaseItem & {
  kind: 'zanzariera'
  modello?: 'Tondo 38' | 'Tondo 46' | 'Tondo 65' | 'Tondo 105' | null
  tipologia?:
    | 'Tondo verticale molla'
    | 'Tondo plus verticale molla'
    | 'Tondo verticale catenella'
    | 'Tondo verticale motore'
    | 'Tondo laterale molla'
    | 'Tondo doppia zanz laterale molla'
    | null

  misura_tipo?: 'vano' | null

  profilo_colore?: string | null
  accessori_colore?: string | null
  mesh?: string | null          // “colore rete” in UI/PDF

  deceleratore?: boolean | null

  // prezzi (se mai servissero per calcoli interni)
  price_mode?: PriceMode
  price_per_piece?: number | null
}

/** Persiana */
export type PersianaItem = BaseItem & {
  kind: 'persiana'
  material?: 'Alluminio' | 'PVC' | 'Altro' | null
  lamelle?: 'fisse' | 'regolabili' | null
  con_telaio?: boolean | null
  misura_tipo?: 'luce' | null
  color?: string | null
}

/** Tapparella */
export type TapparellaItem = BaseItem & {
  kind: 'tapparella'
  material?: 'PVC' | 'Alluminio' | null
  color?: string | null
}

/** Voce personalizzata */
export type CustomItem = BaseItem & {
  kind: 'custom'
  title: string
}

export type QuoteItem =
  | WindowItem
  | ScorrevoleItem
  | CassonettoItem
  | ZanzarieraItem
  | PersianaItem
  | TapparellaItem
  | CustomItem