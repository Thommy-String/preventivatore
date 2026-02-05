import finestraImg from '../assets/images/finestra.png'
import zanzarieraImg from '../assets/images/zanzariera.png'
import cassonettoImg from '../assets/images/cassonetto.png'
import persianaImg from '../assets/images/persiana.png'
import tapparellaImg from '../assets/images/tapparella.png'
import type { ManualTotalSurfaceEntry } from '../features/quotes/types'
import { normalizeSurfaceEntries } from '../features/quotes/utils/surfaceSelections'

export type CategoryTotalInput = {
  category?: string | null
  label?: string | null
  amount?: number | null
  pieces?: number | null
  surfaces?: ManualTotalSurfaceEntry[] | null
}

export type Customer = {
  name?: string | null
  address?: string | null
  email?: string | null
  phone?: string | null
  vat?: string | null
}

export function euro(n?: number | null) {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 0
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(v)
}

export function safeText(v?: string | null, fallback = '—') {
  if (typeof v === 'string' && v.trim().length > 0) return v
  return fallback
}

export function formatISODate(iso?: string | null) {
  if (!iso) return '—'
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) {
    const [, y, mo, d] = m
    return `${d}-${mo}-${y}`
  }
  return String(iso)
}

export function normalizeTotals(input?: CategoryTotalInput[] | null) {
  const arr = Array.isArray(input) ? input : []
  return arr.map((r) => ({
    category: safeText(r?.label ?? r?.category ?? '', '-'),
    amount: typeof r?.amount === 'number' && Number.isFinite(r.amount) ? r.amount : 0,
    pieces:
      typeof (r as any)?.pieces === 'number' && Number.isFinite((r as any).pieces) && (r as any).pieces > 0
        ? (r as any).pieces
        : null,
    surfaces: normalizeSurfaceEntries((r as any)?.surfaces),
  }))
}

export function normalizeItems(input?: any[] | Record<string, any> | null) {
  if (Array.isArray(input)) return input.filter(Boolean)
  if (input && typeof input === 'object') return Object.values(input).filter(Boolean)
  return []
}

export function describeItem(it: any): string {
  if (!it || typeof it !== 'object') return ''
  const w = it.width_mm || it.larghezza_mm || it.larghezza
  const h = it.height_mm || it.altezza_mm || it.altezza

  if (w && h) {
    return `L ${w} × H ${h} mm`
  }
  if (w) return `L ${w} mm`
  if (h) return `H ${h} mm`

  return ''
}

export function imageFor(kind?: string | null) {
  switch (kind) {
    case 'finestra':
      return finestraImg
    case 'zanzariera':
      return zanzarieraImg
    case 'cassonetto':
      return cassonettoImg
    case 'persiana':
      return persianaImg
    case 'tapparella':
      return tapparellaImg
    default:
      return finestraImg
  }
}

export function pickFirst(obj: any, keys: string[]): any {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).toString().trim() !== '') return obj[k]
  }
  return undefined
}

export function asBoolLabel(v: any, yes = 'Sì', no = 'No'): string | undefined {
  if (typeof v === 'boolean') return v ? yes : no
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (['si', 'sì', 'yes', 'true', '1', 'on'].includes(s)) return yes
    if (['no', 'false', '0', 'off'].includes(s)) return no
  }
  return undefined
}

export function detailPairs(it: any): Array<[string, string]> {
  if (!it || typeof it !== 'object') return []
  const pairs: Array<[string, string]> = []

  const wNum = Number(it.width_mm ?? it.larghezza_mm ?? it.larghezza)
  const hNum = Number(it.height_mm ?? it.altezza_mm ?? it.altezza)
  const areaM2 = Number.isFinite(wNum) && Number.isFinite(hNum) ? (wNum * hNum) / 1_000_000 : undefined

  const qty = pickFirst(it, ['qty', 'quantita', 'qta'])
  const qtyLabel = qty ? String(qty) : undefined
  if (qtyLabel) pairs.push(['Quantità', qtyLabel])

  if (areaM2 && areaM2 > 0) {
    pairs.push(['Superficie', `${areaM2.toFixed(2)} m²`])
  }

  const pricePerMq = pickFirst(it, ['price_per_mq', 'prezzo_mq', 'prezzo_m2'])
  if (pricePerMq !== undefined) pairs.push(['Prezzo al m²', String(pricePerMq)])

  const priceTotal = pickFirst(it, ['price_total', 'prezzo_totale', 'price', 'prezzo'])
  if (priceTotal !== undefined) pairs.push(['Totale', String(priceTotal)])

  const color = pickFirst(it, ['color', 'colore', 'profile_color', 'profilo_colore'])
  if (color) pairs.push(['Colore', String(color)])

  const wood = pickFirst(it, ['wood', 'legno'])
  if (wood) pairs.push(['Legno', String(wood)])

  const glass = pickFirst(it, ['glass', 'vetro'])
  if (glass) pairs.push(['Vetro', String(glass)])

  const handle = pickFirst(it, ['handle', 'maniglia'])
  if (handle) pairs.push(['Maniglia', String(handle)])

  const foil = pickFirst(it, ['foil', 'pellicola'])
  if (foil) pairs.push(['Pellicola', String(foil)])

  const featurePairs = [
    ['Uw', pickFirst(it, ['uw'])],
    ['Trasmittanza', pickFirst(it, ['trasmittanza'])],
    ['Telaio', asBoolLabel(pickFirst(it, ['con_telaio']))],
    ['Deceleratore', asBoolLabel(pickFirst(it, ['deceleratore', 'has_deceleratore', 'con_deceleratore']))],
  ] as const

  for (const [label, value] of featurePairs) {
    if (value) pairs.push([label, String(value)])
  }

  const shownKeys = new Set(pairs.map(([k]) => k.toLowerCase()))
  const skip = new Set([
    'id',
    'kind',
    'qty',
    'title',
    'label',
    'width_mm',
    'height_mm',
    'larghezza_mm',
    'altezza_mm',
    'larghezza',
    'altezza',
    'price_mode',
    'price_total',
    'price_per_mq',
    'unit_price',
    'unitPrice',
    'price',
    'prezzo',
    'misura_tipo',
    'accessori_colore',
    'reference',
    'riferimento',
    'image_url',
    'imageUrl',
  ])
  for (const [k, v] of Object.entries(it)) {
    if (v === undefined || v === null || String(v).trim() === '') continue
    if (typeof v === 'object' || typeof v === 'function') continue
    if (skip.has(k)) continue

    const pretty: Record<string, string> = {
      profile_system: 'Sistema profilo',
      system_profile: 'Sistema profilo',
      color: 'Colore',
      colore: 'Colore',
      profilo_colore: 'Colore profilo',
      glass: 'Vetro',
      vetro: 'Vetro',
      glazing: 'Vetro',
      uw: 'Uw',
      modello: 'Modello',
      tipologia: 'Tipologia',
      rete_colore: 'Colore rete',
      rete_tipo: 'Colore rete',
      tipo_rete: 'Colore rete',
      mesh: 'Colore rete',
      deceleratore: 'Deceleratore',
      has_deceleratore: 'Deceleratore',
      con_deceleratore: 'Deceleratore',
      material: 'Materiale',
      materiale: 'Materiale',
      depth_mm: 'Profondità',
      profondita_mm: 'Profondità',
      celino_mm: 'Celino',
      spalletta_mm: 'Celino',
      extension_mm: 'Celino',
      lamelle_type: 'Lamelle',
      lamelle: 'Lamelle',
      con_telaio: 'Telaio',
      ante: 'Ante',
      ante_count: 'Ante',
      hinge_color: 'Colore cerniere',
      hinges_color: 'Colore cerniere',
      glass_spec: 'Stratigrafia vetro',
      vetro_stratigrafia: 'Stratigrafia vetro',
      stratigrafia_vetro: 'Stratigrafia vetro',
    }
    const label = pretty[k] || k
    if (!shownKeys.has(label.toLowerCase())) {
      let displayVal = String(v)
      if (label === 'Profondità' || label === 'Spalletta' || label === 'Celino') {
        if (!/mm\b/i.test(displayVal)) displayVal = `${displayVal} mm`
      }
      if (label === 'Colore rete') {
        displayVal = displayVal.replace(/^mesh\s*/i, '').trim()
      }
      pairs.push([label, displayVal])
      shownKeys.add(label.toLowerCase())
    }
  }

  return pairs
}
