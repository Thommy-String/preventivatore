import { useEffect, useMemo, useState } from 'react'
import { Button } from '../ui/Button'
import type { ManualTotalRow, ManualTotalSurfaceEntry, QuoteItem, SurfaceGroupId } from '../../features/quotes/types'
import {
  SURFACE_GROUPS,
  buildSurfaceSummary,
  computeItemSurfaceMq,
  describeDimensions,
  formatMq,
  getGroupForItem,
  normalizeSurfaceEntries,
} from '../../features/quotes/utils/surfaceSelections'

export type SurfaceModalProps = {
  open: boolean
  row: ManualTotalRow | null
  items: QuoteItem[]
  onClose: () => void
  onSave: (entries: ManualTotalSurfaceEntry[]) => void
}

type DraftEntry = { mode: 'all' | 'subset'; itemIds: string[] }
type DraftState = Partial<Record<SurfaceGroupId, DraftEntry>>

const titleForSurfaceItem = (item: QuoteItem) => {
  const raw = (item as any)?.title ?? (item as any)?.label ?? (item as any)?.kind
  const title = String(raw ?? '').trim()
  return title ? title : 'Voce'
}

export function SurfaceModal({ open, row, items, onClose, onSave }: SurfaceModalProps) {
  const [draft, setDraft] = useState<DraftState>({})

  const groupedItems = useMemo(() => {
    const base: Record<SurfaceGroupId, QuoteItem[]> = {
      windows: [],
      persiane: [],
      tapparelle: [],
      zanzariere: [],
      cassonetti: [],
      custom: [],
    }
    items.forEach((item) => {
      const group = getGroupForItem(item as QuoteItem)
      if (!group) return
      base[group] = [...base[group], item]
    })
    return base
  }, [items])

  useEffect(() => {
    if (!open || !row) return
    const normalized = normalizeSurfaceEntries(row?.surfaces)
    const next: DraftState = {}
    normalized.forEach((entry) => {
      const allowed = new Set((groupedItems[entry.group] ?? []).map((it) => String(it.id)))
      const filtered = entry.itemIds?.filter((id) => allowed.has(String(id))) ?? []
      next[entry.group] = { mode: entry.mode, itemIds: entry.mode === 'subset' ? filtered : [] }
    })
    setDraft(next)
  }, [open, row, groupedItems])

  useEffect(() => {
    setDraft((prev) => {
      const next: DraftState = {}
      Object.entries(prev).forEach(([group, entry]) => {
        const metaId = group as SurfaceGroupId
        const available = groupedItems[metaId] ?? []
        if (available.length === 0) return
        if (entry.mode === 'subset') {
          const allowed = new Set(available.map((it) => String(it.id)))
          const filtered = entry.itemIds.filter((id) => allowed.has(id))
          next[metaId] = { mode: 'subset', itemIds: filtered }
        } else {
          next[metaId] = entry
        }
      })
      return next
    })
  }, [groupedItems])

  const availableGroups = useMemo(
    () => SURFACE_GROUPS.filter((meta) => (groupedItems[meta.id]?.length ?? 0) > 0),
    [groupedItems]
  )

  const rawEntries = useMemo<ManualTotalSurfaceEntry[]>(() => {
    return Object.entries(draft).map(([group, entry]) => ({
      group: group as SurfaceGroupId,
      mode: entry.mode,
      itemIds: entry.itemIds,
    }))
  }, [draft])

  const normalizedEntries = useMemo(
    () => normalizeSurfaceEntries(rawEntries),
    [rawEntries]
  )

  const summaryRows = useMemo(
    () => buildSurfaceSummary(normalizedEntries, items),
    [normalizedEntries, items]
  )

  const summaryByGroup = useMemo(() => {
    const map = new Map<SurfaceGroupId, (typeof summaryRows)[number]>()
    summaryRows.forEach((row) => map.set(row.id, row))
    return map
  }, [summaryRows])

  const invalidSubsetGroups = rawEntries
    .filter((entry) => entry.mode === 'subset' && (!entry.itemIds || entry.itemIds.length === 0))
    .map((entry) => entry.group)
  const hasInvalidSubset = invalidSubsetGroups.length > 0

  const currentMode = (groupId: SurfaceGroupId): 'none' | 'all' | 'subset' => {
    const entry = draft[groupId]
    return entry ? entry.mode : 'none'
  }

  const currentSelection = (groupId: SurfaceGroupId) => draft[groupId]?.itemIds ?? []

  const setMode = (groupId: SurfaceGroupId, mode: 'none' | 'all' | 'subset') => {
    setDraft((prev) => {
      const next = { ...prev }
      if (mode === 'none') {
        delete next[groupId]
        return next
      }
      const existing = next[groupId]
      next[groupId] = {
        mode: mode === 'all' ? 'all' : 'subset',
        itemIds: mode === 'subset' ? (existing?.itemIds ?? []) : [],
      }
      return next
    })
  }

  const toggleItem = (groupId: SurfaceGroupId, itemId: string) => {
    setDraft((prev) => {
      const entry = prev[groupId] ?? { mode: 'subset', itemIds: [] }
      if (entry.mode !== 'subset') return prev
      const exists = entry.itemIds.includes(itemId)
      const ids = exists ? entry.itemIds.filter((id) => id !== itemId) : [...entry.itemIds, itemId]
      return { ...prev, [groupId]: { mode: 'subset', itemIds: ids } }
    })
  }

  const handleSave = () => {
    onSave(normalizedEntries)
    onClose()
  }

  if (!open || !row) return null

  const rowTitle = row.label?.trim() ? row.label : 'Voce senza titolo'

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 top-10 mx-auto flex w-full max-w-4xl flex-col rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">Metratura collegata</div>
            <div className="text-xl font-semibold text-gray-900">{rowTitle}</div>
          </div>
          <button className="text-sm text-gray-500 hover:text-gray-800" onClick={onClose}>
            Chiudi
          </button>
        </div>

        {summaryRows.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {summaryRows.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 font-medium text-emerald-800"
              >
                <span className="text-emerald-900">{formatMq(s.mq)}</span>
                {s.missingDimensions > 0 && (
                  <span className="text-[10px] text-amber-700">
                    · {s.missingDimensions} senza dimensioni
                  </span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            Seleziona quali voci del preventivo contribuire devono contribuire alla metratura mostrata accanto a questa categoria.
          </div>
        )}

        <div className="mt-4 space-y-4 overflow-y-auto pr-1" style={{ maxHeight: '60vh' }}>
          {availableGroups.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white/80 px-4 py-6 text-center text-sm text-gray-500">
              Nessuna voce del preventivo dispone di dimensioni per calcolare la metratura.
            </div>
          ) : (
            availableGroups.map((meta) => {
              const mode = currentMode(meta.id)
              const selections = currentSelection(meta.id)
              const groupItems = groupedItems[meta.id] ?? []
              const summary = summaryByGroup.get(meta.id)
              const showSubset = mode === 'subset'
              const subsetInvalid = showSubset && selections.length === 0

              return (
                <div key={meta.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-gray-900">{meta.label}</div>
                      <div className="text-xs text-gray-500">
                        {groupItems.length} voce{groupItems.length === 1 ? '' : 'i'} disponibili
                      </div>
                    </div>
                    {summary && (
                      <div className="text-xs font-semibold text-emerald-700">
                        {formatMq(summary.mq)}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                    {(['none', 'all', 'subset'] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`rounded-full border px-3 py-1 transition ${
                          mode === option
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                        onClick={() => setMode(meta.id, option)}
                      >
                        {option === 'none' && 'Nessuna'}
                        {option === 'all' && 'Tutte'}
                        {option === 'subset' && 'Seleziona voci'}
                      </button>
                    ))}
                  </div>

                  {showSubset && (
                    <div className="mt-3 space-y-2">
                      {groupItems.map((item) => {
                        const itemId = String(item.id)
                        const checked = selections.includes(itemId)
                        const dims = describeDimensions(item)
                        const mq = computeItemSurfaceMq(item)
                        const qty = Number(item?.qty ?? 1)
                        return (
                          <label
                            key={itemId}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                              checked ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              checked={checked}
                              onChange={() => toggleItem(meta.id, itemId)}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{titleForSurfaceItem(item)}</div>
                              <div className="text-[11px] text-gray-500">
                                {dims ?? 'Dimensioni mancanti'}
                                {mq > 0 && ` · ${formatMq(mq)}`}
                              </div>
                            </div>
                            {qty > 1 && (
                              <span className="text-[11px] text-gray-500">x{qty}</span>
                            )}
                          </label>
                        )
                      })}
                      {subsetInvalid && (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          Seleziona almeno una voce da includere.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="mt-5 flex items-center justify-between border-t pt-3">
          <div className="text-xs text-gray-500">
            {summaryRows.length === 0 ? 'Nessuna metratura verrà stampata per questa categoria.' : 'I valori includono quantità e dimensioni (in m²).'}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Annulla</Button>
            <Button onClick={handleSave} disabled={hasInvalidSubset}>Salva</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
