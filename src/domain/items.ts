// src/domain/items.ts
export type BaseItem = {
  id: string
  kind: 'finestra' | 'portafinestra' | 'cassonetto' | 'zanzariera' | 'persiana' | 'tapparella' | 'custom'
  width_mm?: number
  height_mm?: number
  qty?: number
  price_mode?: 'per_mq' | 'total'
  price_per_mq?: number | null
  price_total?: number | null
  notes?: string | null
  custom_fields?: { key: string; value: string }[]
  reference?: string | null
}

export type FinestraItem = BaseItem & {
  kind: 'finestra' | 'portafinestra'
  color?: string | null
  glass?: string | null
  hinges_color?: string | null
  uw?: number | null
}

export type CassonettoItem = BaseItem & {
  kind: 'cassonetto'
  profondita_mm?: number | null
  ispezione?: 'frontale' | 'inferiore' | 'superiore' | null
  coibentazione?: 'nessuna' | 'standard' | 'alta' | null
  motore?: 'manuale' | 'elettrico' | null
  colore?: string | null
}

export type ZanzarieraItem = BaseItem & {
  kind: 'zanzariera'
  scorrimento?: 'verticale' | 'orizzontale'
  rete?: 'fibra' | 'alluminio' | 'acciaio'
  colore?: string | null
}

export type CustomItem = BaseItem & { kind: 'custom'; title?: string }

export type QuoteItem =
  | FinestraItem
  | CassonettoItem
  | ZanzarieraItem
  | CustomItem
  | (BaseItem & { kind: 'persiana' | 'tapparella' })

export const createDefaultItem = (kind: QuoteItem['kind']): QuoteItem => {
  switch (kind) {
    case 'finestra':
      return {
        id: crypto.randomUUID(),
        kind, width_mm: 1200, height_mm: 1500, qty: 1,
        price_mode: 'per_mq', price_per_mq: 300, price_total: null,
        color: null, glass: null, hinges_color: null, uw: null, custom_fields: [], reference: null
      }
    case 'portafinestra':
      return {
        id: crypto.randomUUID(),
        kind, width_mm: 1200, height_mm: 2300, qty: 1,
        price_mode: 'per_mq', price_per_mq: 350, price_total: null,
        color: null, glass: null, hinges_color: null, uw: null, custom_fields: [], reference: null
      }
    case 'cassonetto':
      return {
        id: crypto.randomUUID(),
        kind,
        width_mm: 800, height_mm: 300, qty: 1,
        price_mode: 'total', price_total: 0,
        profondita_mm: 170, ispezione: 'frontale', coibentazione: 'standard',
        motore: 'manuale', colore: null, custom_fields: [], reference: null
      }
    case 'zanzariera':
      return {
        id: crypto.randomUUID(),
        kind, width_mm: 1000, height_mm: 1500, qty: 1,
        price_mode: 'per_mq', price_per_mq: 120,
        scorrimento: 'verticale', rete: 'fibra', colore: null, custom_fields: [], reference: null
      }
    case 'custom':
      return { id: crypto.randomUUID(), kind, title: 'Voce personalizzata', price_mode: 'total', price_total: 0, custom_fields: [], reference: null }
    case 'persiana':
    case 'tapparella':
      return { id: crypto.randomUUID(), kind, width_mm: 1000, height_mm: 1500, qty: 1, price_mode: 'per_mq', price_per_mq: 180, custom_fields: [], reference: null }
  }
}