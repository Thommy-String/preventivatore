import type { ManualTotalSurfaceEntry, SurfaceGroupId } from '../types'

export type SurfaceGroupMeta = {
  id: SurfaceGroupId
  label: string
  match: (kind: string) => boolean
}

type SurfaceItem = Record<string, any>

const LOWER = (value: unknown) => String(value ?? '').toLowerCase()

export const SURFACE_GROUPS: SurfaceGroupMeta[] = [
  {
    id: 'windows',
    label: 'Finestre e portefinestre',
    match: (kind: string) => /finestr|serrament|scorrevol|portafin/i.test(kind),
  },
  {
    id: 'persiane',
    label: 'Persiane',
    match: (kind: string) => /persian/i.test(kind),
  },
  {
    id: 'tapparelle',
    label: 'Tapparelle',
    match: (kind: string) => /tapparell|avvolgibil/i.test(kind),
  },
  {
    id: 'zanzariere',
    label: 'Zanzariere',
    match: (kind: string) => /zanzar/i.test(kind),
  },
  {
    id: 'cassonetti',
    label: 'Cassonetti',
    match: (kind: string) => /casson/i.test(kind),
  },
  {
    id: 'custom',
    label: 'Voci custom',
    match: (kind: string) => /custom|personalizzat/i.test(kind),
  },
]

const SURFACE_GROUP_IDS = new Set<SurfaceGroupId>(SURFACE_GROUPS.map((g) => g.id))

export const formatMq = (n: number) => `${n.toFixed(2)} m²`

const pickNumber = (input: unknown) => {
  const n = Number(input)
  return Number.isFinite(n) ? n : null
}

const pickDimension = (it: SurfaceItem, keys: string[]) => {
  for (const key of keys) {
    const val = pickNumber((it as any)[key])
    if (val && val > 0) return val
  }
  return null
}

export const computeItemSurfaceMq = (it: SurfaceItem): number => {
  const w = pickDimension(it, ['width_mm', 'larghezza_mm', 'larghezza', 'width'])
  const h = pickDimension(it, ['height_mm', 'altezza_mm', 'altezza', 'height'])
  const qty = pickNumber((it as any).qty) ?? 1
  if (!w || !h || w <= 0 || h <= 0 || !qty || qty <= 0) return 0
  const mq = (w * h) / 1_000_000
  return round2(mq * qty)
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export const describeDimensions = (it: SurfaceItem) => {
  const w = pickDimension(it, ['width_mm', 'larghezza_mm', 'larghezza', 'width'])
  const h = pickDimension(it, ['height_mm', 'altezza_mm', 'altezza', 'height'])
  if (w && h) return `L ${Math.round(w)} × H ${Math.round(h)} mm`
  if (w) return `L ${Math.round(w)} mm`
  if (h) return `H ${Math.round(h)} mm`
  return null
}

export const getGroupForItem = (it: SurfaceItem): SurfaceGroupId | null => {
  const kind = LOWER((it as any)?.kind)
  const group = SURFACE_GROUPS.find((g) => g.match(kind))
  return group ? group.id : null
}

export const normalizeSurfaceEntries = (entries?: ManualTotalSurfaceEntry[] | null): ManualTotalSurfaceEntry[] => {
  if (!Array.isArray(entries)) return []
  const seen = new Set<SurfaceGroupId>()
  return entries
    .map((entry) => {
      const group = entry?.group
      if (!group || !SURFACE_GROUP_IDS.has(group) || seen.has(group)) return null
      const mode: ManualTotalSurfaceEntry['mode'] = entry?.mode === 'subset' ? 'subset' : 'all'
      const ids = Array.isArray(entry?.itemIds)
        ? Array.from(new Set(entry.itemIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)))
        : undefined
      seen.add(group)
      if (mode === 'subset' && (!ids || ids.length === 0)) {
        // sottoinsieme vuoto inutile
        return null
      }
      return { group, mode, itemIds: mode === 'subset' ? ids : undefined }
    })
    .filter(Boolean) as ManualTotalSurfaceEntry[]
}

const itemsForEntry = (entry: ManualTotalSurfaceEntry, items: SurfaceItem[]) => {
  const groupItems = items.filter((it) => getGroupForItem(it) === entry.group)
  if (entry.mode === 'all') return groupItems
  const pickIds = new Set(entry.itemIds ?? [])
  return groupItems.filter((it) => pickIds.has(String(it.id)))
}

export type SurfaceSummaryRow = {
  id: SurfaceGroupId
  label: string
  mq: number
  selectedCount: number
  missingDimensions: number
}

export const buildSurfaceSummary = (
  entries: ManualTotalSurfaceEntry[] | undefined,
  items: SurfaceItem[]
): SurfaceSummaryRow[] => {
  const normalized = normalizeSurfaceEntries(entries)
  if (normalized.length === 0) return []
  return normalized.map((entry) => {
    const meta = SURFACE_GROUPS.find((g) => g.id === entry.group)!
    const selectedItems = itemsForEntry(entry, items)
    let mq = 0
    let missing = 0
    selectedItems.forEach((item) => {
      const area = computeItemSurfaceMq(item)
      if (area > 0) {
        mq += area
      } else {
        missing += 1
      }
    })
    return {
      id: entry.group,
      label: meta.label,
      mq: round2(mq),
      selectedCount: selectedItems.length,
      missingDimensions: missing,
    }
  })
}

export const summarizeEntriesAsText = (entries: ManualTotalSurfaceEntry[] | undefined, items: SurfaceItem[]) => {
  return buildSurfaceSummary(entries, items).map((row) => {
    const base = `${row.label} ${formatMq(row.mq)}`
    if (row.missingDimensions > 0) {
      return `${base} (dati mancanti per ${row.missingDimensions} voce${row.missingDimensions === 1 ? '' : 'i'})`
    }
    return base
  })
}
