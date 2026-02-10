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

export function imageFor(kind?: string | null, item?: any) {
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
    case 'porta_blindata':
      return finestraImg
    case 'porta_interna': {
      // Fallback: produzione SVG semplice senza React (browser-safe)
      const simplePortaInternaSvg = (it: any) => {
        const w = Number(it?.width_mm || 800)
        const h = Number(it?.height_mm || 2100)
        const color = it?.color || '#ffffff'
        const handleRight = (it?.handle_position || 'left') !== 'left'
        const handleX = handleRight ? w - Math.round(w * 0.1) : Math.round(w * 0.1)
        const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' width='${w}' height='${h}'>\n  <rect x='0' y='0' width='${w}' height='${h}' fill='${color}' stroke='#222' stroke-width='2'/>\n  <rect x='${Math.round(w*0.05)}' y='${Math.round(h*0.03)}' width='${Math.round(w*0.9)}' height='${Math.round(h*0.94)}' fill='${color}' stroke='#222' stroke-width='1'/>\n  <circle cx='${handleX}' cy='${Math.round(h/2)}' r='${Math.round(Math.min(w,h)*0.02)}' fill='#bbb' stroke='#444'/>\n</svg>`
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
      }

      // Prefer server-side render when available (better detail)
      if (typeof window === 'undefined') {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { renderToStaticMarkup } = require('react-dom/server');
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const React = require('react');
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { PortaInternaSvg } = require('../features/quotes/porta-interna/PortaInternaSvg');
          const svgString = renderToStaticMarkup(React.createElement(PortaInternaSvg, { item }));
          return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
        } catch (e) {
          return simplePortaInternaSvg(item);
        }
      }

      // Browser: return simple SVG data URL
      return simplePortaInternaSvg(item);
    }
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

  let wNum = Number(it.width_mm ?? it.larghezza_mm ?? it.larghezza);
  let hNum = Number(it.height_mm ?? it.altezza_mm ?? it.altezza);
  // Per porta_interna, width_mm/height_mm sono solo anta (telaio fuori misura SVG)
  let areaM2: number | undefined = undefined;
  if (String(it.kind).toLowerCase() === 'porta_interna') {
    // width_mm e height_mm sono già solo anta
    areaM2 = Number.isFinite(wNum) && Number.isFinite(hNum) ? (wNum * hNum) / 1_000_000 : undefined;
  } else {
    areaM2 = Number.isFinite(wNum) && Number.isFinite(hNum) ? (wNum * hNum) / 1_000_000 : undefined;
  }
  if (areaM2 && areaM2 > 0) {
    pairs.push(['Superficie', `${areaM2.toFixed(2)} m²`]);
  }

  const priceTotal = pickFirst(it, ['price_total', 'prezzo_totale', 'price', 'prezzo'])
  const kindLower = String(it.kind).toLowerCase()
  const val = Number(priceTotal)
  if (priceTotal !== undefined && kindLower !== 'tapparella' && kindLower !== 'persiana' && kindLower !== 'cassonetto' && !Number.isNaN(val) && val > 0) {
      pairs.push(['Totale', String(priceTotal)])
  }

  const color = pickFirst(it, ['color', 'colore', 'profile_color', 'profilo_colore'])
  if (color) pairs.push(['Colore', String(color)])

  // Specifiche per porta interna
  if (kindLower === 'porta_interna') {
    const apertura = pickFirst(it, ['apertura'])
    if (apertura) {
      const aperturaLabel = apertura === 'battente' ? 'Apertura a battente' : 'Apertura scorrevole'
      pairs.push(['Tipo apertura', aperturaLabel])
    }
    
    const slidingDirection = pickFirst(it, ['sliding_direction'])
    if (slidingDirection && apertura === 'scorrevole') {
      const directionLabel = slidingDirection === 'sx' ? 'Scorrimento a sinistra' : 'Scorrimento a destra'
      pairs.push(['Direzione scorrimento', directionLabel])
    }
  }

  const wood = pickFirst(it, ['wood', 'legno'])
  if (wood) pairs.push(['Legno', String(wood)])

  const glass = pickFirst(it, ['glass', 'vetro'])
  if (glass) pairs.push(['Vetro', String(glass)])

  const handle = pickFirst(it, ['handle', 'maniglia'])
  if (handle) pairs.push(['Maniglia', String(handle)])

  const foil = pickFirst(it, ['foil', 'pellicola'])
  if (foil) pairs.push(['Pellicola', String(foil)])

  const uwRaw = pickFirst(it, ['uw'])
  const uwLabel = uwRaw !== undefined && uwRaw !== null && String(uwRaw).trim() !== ''
    ? `<= ${String(uwRaw)} W/m2K`
    : undefined

  const featurePairs = [
    ['Trasmittanza', uwLabel],
    ['Trasmittanza', pickFirst(it, ['trasmittanza'])],
    ['Telaio', asBoolLabel(pickFirst(it, ['con_telaio']))],
    ['Deceleratore', asBoolLabel(pickFirst(it, ['deceleratore', 'has_deceleratore', 'con_deceleratore']))],
    // Mostra solo se true (Sì)
    ['Serratura', pickFirst(it, ['serratura']) ? 'Sì' : undefined],
    ['Spioncino', pickFirst(it, ['spioncino']) ? 'Sì' : undefined],
    ['Posizione maniglia', (() => {
        const v = pickFirst(it, ['handle_position']);
        if (v === 'left') return 'Sinistra';
        if (v === 'right') return 'Destra';
        return v;
    })()],
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
    'serratura', // explicitly handled above
    'spioncino', // explicitly handled above
    'handle_position',
  ])
  const kindLow = String(it.kind).toLowerCase()
  if (kindLow === 'persiana' || kindLow === 'cassonetto') {
    skip.add('ante')
    skip.add('ante_count')
  }
  if (kindLow === 'porta_interna') {
    skip.add('apertura')
    skip.add('sliding_direction')
  }
  for (const [k, v] of Object.entries(it)) {
    if (v === undefined || v === null || String(v).trim() === '') continue
    if (typeof v === 'object' || typeof v === 'function') continue
    if (skip.has(k)) continue
    if (k === 'serratura' || k === 'spioncino' || k === 'handle_position') continue

    const pretty: Record<string, string> = {
      profile_system: 'Sistema profilo',
      system_profile: 'Sistema profilo',
      color: 'Colore',
      colore: 'Colore',
      profilo_colore: 'Colore profilo',
      glass: 'Vetro',
      vetro: 'Vetro',
      glazing: 'Vetro',
      uw: 'Trasmittanza',
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
      glass_spec: 'Vetrocamera',
      vetro_stratigrafia: 'Vetrocamera',
      stratigrafia_vetro: 'Vetrocamera',
      handle_position: 'Posizione maniglia',
      panel_type: 'Tipo pannello',
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
      if (label === 'Posizione maniglia') {
         if (displayVal === 'left') displayVal = 'Sinistra'
         if (displayVal === 'right') displayVal = 'Destra'
      }
      pairs.push([label, displayVal])
      shownKeys.add(label.toLowerCase())
    }
  }

  return pairs
}
