// src/features/quotes/types.ts
export type QuoteStatus = 'bozza'|'inviato'|'accettato'|'rifiutato'|'scaduto'
export type VatRate = '22'|'10'|'4'
export type PriceMode = 'per_mq' | 'per_pezzo' | 'total'

export type QuoteKind =
  | 'finestra'
  | 'cassonetto'
  | 'zanzariera'
  | 'persiana'
  | 'tapparella'
  | 'custom'

export type CustomField = {
  key: string
  /** Etichetta visibile (opzionale) */
  label?: string
  /** Nome tecnico/chiave (opzionale) */
  name?: string
  /** Valore del campo (opzionale durante l'editing) */
  value?: string
}

/** Stato di apertura per ogni anta nel disegno */
export type LeafState =
  | 'fissa'
  | 'apre_sx'
  | 'apre_dx'
  | 'vasistas'
  | 'apre_sx+vasistas'
  | 'apre_dx+vasistas'
  | 'scorrevole_sx'
  | 'scorrevole_dx'

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
      /** override del tipo di vetro per la singola anta; se assente eredita da GridWindowConfig.glazing */
      glazing?: GridWindowConfig['glazing']
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

/** Finestre */
export type WindowItem = BaseItem & {
  kind: 'finestra'
  color?: string | null
  glass?: string | null
  glass_spec?: string | null
  hinges_color?: string | null
  uw?: number | null
  profile_system?: string | null
  /** Opzioni avanzate per disegno finestra */
  options?: { gridWindow?: GridWindowConfig }
}

/** Cassonetto */
export type CassonettoItem = BaseItem & {
  kind: 'cassonetto'
  material?: 'PVC' | 'Alluminio' | 'Altro' | null
  depth_mm?: number | null
  celino_mm?: number | null   // “celino” (ex spalletta/extension)
  color?: string | null
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
  | CassonettoItem
  | ZanzarieraItem
  | PersianaItem
  | TapparellaItem
  | CustomItem

export type ItemFormProps<T extends QuoteItem> = {
  draft: T
  onChange: (next: T) => void
  readOnly?: boolean
}

// --- Editor / Profile Overview ---

/** Singola caratteristica da mostrare sotto l'immagine (stile "Apple"): eyebrow, titolo grande e descrizione breve. */
export type ProfileOverviewFeature = {
  eyebrow?: string | null
  title: string
  description?: string | null
}

/** Contenuto completo della sezione "Panoramica profilo": immagine sopra + lista di caratteristiche.
 *  Le caratteristiche verranno impaginate a due colonne (2 per riga) dove possibile.
 */
export type ProfileOverviewContent = {
  /** URL pubblico dell'immagine (Supabase o data URL) */
  image_url?: string | null
  /** Elenco di caratteristiche (l'ordine è importante). */
  features: ProfileOverviewFeature[]
}

// --- Modello sconto persistente (riutilizzabile nello store/DB e nel PDF) ---

export type DiscountModel = {
  mode: 'pct' | 'final'
  /** percentuale sconto (0-100) se mode === 'pct' */
  pct?: number | null
  /** totale finale (IVA esclusa) desiderato se mode === 'final' */
  final?: number | null
  /** totale originale (IVA esclusa) prima dello sconto */
  originalTotal: number
  /** totale scontato (IVA esclusa) calcolato */
  discountedTotal: number
}