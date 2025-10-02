export type QuoteStatus = 'bozza'|'inviato'|'accettato'|'rifiutato'|'scaduto'
export type VatRate = '22'|'10'|'4'
export type PriceMode = 'per_mq' | 'per_pezzo' | 'total'
export type QuoteKind = 'finestra' | 'portafinestra' | 'scorrevole' | 'cassonetto' | 'zanzariera' | 'persiana' | 'tapparella' | 'custom'

export type CustomField = { key: string; value: string }

export type BaseItem = {
  id: string
  kind: QuoteKind
  width_mm: number
  height_mm: number
  qty: number
  price_mode?: PriceMode
  price_per_mq?: number | null
  price_total?: number | null
  notes?: string | null
  custom_fields?: CustomField[]
}

// Finestre
export type WindowItem = BaseItem & {
  kind: 'finestra' | 'portafinestra'
  color?: string | null
  glass?: string | null
  hinges_color?: string | null
  uw?: number | null
  profile_system?: string | null
}

// Scorrevole (stesse proprietà di una finestra)
export type ScorrevoleItem = BaseItem & {
  kind: 'scorrevole'
  color?: string | null
  glass?: string | null
  hinges_color?: string | null
  uw?: number | null
  profile_system?: string | null
}

// Cassonetto
export type CassonettoItem = BaseItem & {
  kind: 'cassonetto'
  material?: 'PVC' | 'Alluminio' | 'Altro' | null   // default: 'PVC'
  depth_mm?: number | null                          // profondità cassonetto
  extension_mm?: number | null                       // prolunga/spalletta che estende la profondità
}

// Zanzariera
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
  mesh?: string | null

  deceleratore?: boolean | null

  price_mode?: PriceMode
  price_per_piece?: number | null
}

// Persiana
export type PersianaItem = BaseItem & {
  kind: 'persiana'
  material?: 'Alluminio' | 'PVC' | 'Altro' | null // default concettuale: 'Alluminio'
  lamelle?: 'fisse' | 'regolabili' | null
  con_telaio?: boolean | null
  misura_tipo?: 'luce' | null // per chiarezza: misure luce
  color?: string | null       // testo libero (RAL/descrizione)
}

// Tapparella
export type TapparellaItem = BaseItem & {
  kind: 'tapparella'
  material?: 'PVC' | 'Alluminio' | null // scelta tra PVC o Alluminio
  color?: string | null                 // testo libero (RAL/descrizione)
}

// Custom
export type CustomItem = BaseItem & {
  kind: 'custom'
  title?: string | null
}

export type QuoteItem = WindowItem | ScorrevoleItem | CassonettoItem | ZanzarieraItem | PersianaItem | TapparellaItem | CustomItem