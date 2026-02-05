import { type DragEvent } from 'react'
import { ArrowDown, ArrowUp, BadgePercent, GripVertical, Plus, Trash2, X } from 'lucide-react'
import { Button } from '../ui/Button'
import type { ManualTotalRow, ManualTotalSurfaceEntry, QuoteItem } from '../../features/quotes/types'
import { euro } from '../../features/quotes/utils/pricing'
import { buildSurfaceSummary, formatMq } from '../../features/quotes/utils/surfaceSelections'

type CostSummarySectionProps = {
  manualTotals: ManualTotalRow[]
  itemsArray: QuoteItem[]
  dragTotalId: string | null
  piecesStr: Record<string, string>
  amountStr: Record<string, string>
  totalExcluded: number
  hasDiscount: boolean
  discountedTotal: number
  discountMode: 'pct' | 'final' | null
  discountPct: number | null
  discountFinal: number | null
  showDiscountEditor: boolean
  onAddRow: () => void
  onUpdateRow: (id: string, patch: Partial<ManualTotalRow> & { surfaces?: ManualTotalSurfaceEntry[] | null }) => void
  onRemoveRow: (id: string) => void
  onMoveRow: (id: string, dir: -1 | 1) => void
  onTotalDragStart: (event: DragEvent<HTMLDivElement>, id: string) => void
  onTotalDragOver: (event: DragEvent<HTMLDivElement>) => void
  onTotalDrop: (event: DragEvent<HTMLDivElement>, id: string) => void
  onPiecesChange: (id: string, value: string) => void
  onPiecesBlur: (id: string) => void
  onAmountChange: (id: string, value: string) => void
  onAmountBlur: (id: string) => void
  onOpenSurfaceModal: (id: string) => void
  onToggleDiscountEditor: () => void
  onSetDiscountMode: (mode: 'pct' | 'final' | null) => void
  onSetDiscountPct: (value: number | null) => void
  onSetDiscountFinal: (value: number | null) => void
  onClearDiscount: () => void
}

export function CostSummarySection({
  manualTotals,
  itemsArray,
  dragTotalId,
  piecesStr,
  amountStr,
  totalExcluded,
  hasDiscount,
  discountedTotal,
  discountMode,
  discountPct,
  discountFinal,
  showDiscountEditor,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
  onMoveRow,
  onTotalDragStart,
  onTotalDragOver,
  onTotalDrop,
  onPiecesChange,
  onPiecesBlur,
  onAmountChange,
  onAmountBlur,
  onOpenSurfaceModal,
  onToggleDiscountEditor,
  onSetDiscountMode,
  onSetDiscountPct,
  onSetDiscountFinal,
  onClearDiscount,
}: CostSummarySectionProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h2>Riepilogo costi</h2>
        <Button variant="ghost" onClick={onAddRow}><Plus size={16} /> Aggiungi costo</Button>
      </div>

      {manualTotals.length === 0 ? (
        <div className="mt-4 rounded border border-dashed p-6 text-center text-sm text-gray-600">
          Aggiungi le voci di costo per categoria (es. “Finestre”, “Zanzariere”, “Montaggio”…).
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {manualTotals.map((row) => {
            const summary = buildSurfaceSummary(row.surfaces, itemsArray as any[])
            return (
              <div
                key={row.id}
                className={`rounded-lg border p-3 bg-white/60 ${dragTotalId===row.id ? 'ring-2 ring-gray-300' : ''}`}
                draggable
                onDragStart={(e) => onTotalDragStart(e, row.id)}
                onDragOver={onTotalDragOver}
                onDrop={(e) => onTotalDrop(e, row.id)}
              >
                <div className="space-y-2">
                  {/* Top row: Title + Delete (inline on mobile) */}
                  <div className="flex items-center gap-2">
                    <span className="cursor-grab text-gray-400 hover:text-gray-700" title="Trascina per riordinare">
                      <GripVertical size={16} />
                    </span>
                    <input
                      className="input flex-1 min-w-0"
                      placeholder="Es. Finestre / Portoncino cantina / Montaggio…"
                      value={row.label}
                      onChange={(e) => onUpdateRow(row.id, { label: e.target.value })}
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-md border bg-white hover:bg-gray-50"
                        aria-label="Sposta su"
                        title="Sposta su"
                        onClick={() => onMoveRow(row.id, -1)}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-md border bg-white hover:bg-gray-50"
                        aria-label="Sposta giù"
                        title="Sposta giù"
                        onClick={() => onMoveRow(row.id, +1)}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-md border bg-white hover:bg-gray-50"
                        aria-label="Rimuovi riga"
                        onClick={() => onRemoveRow(row.id)}
                        title="Rimuovi"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Amount (second row) */}
                  <div className="flex items-center gap-2">
                    {/* Pezzi opzionale */}
                    <div className="w-20">
                      <input
                        className="input w-full text-right"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="pz."
                        value={piecesStr[row.id] ?? (typeof row.pieces === 'number' ? String(row.pieces) : '')}
                        onChange={(e) => onPiecesChange(row.id, e.target.value)}
                        onBlur={() => onPiecesBlur(row.id)}
                        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                        onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                      />
                    </div>

                    {/* Importo */}
                    <div className="flex-1 sm:flex-none sm:w-40">
                      <input
                        className="input w-full text-right"
                        type="text"
                        inputMode="decimal"
                        value={amountStr[row.id] ?? (row.amount === 0 ? '' : String(row.amount))}
                        onChange={(e) => onAmountChange(row.id, e.target.value)}
                        onBlur={() => onAmountBlur(row.id)}
                        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                        onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                        placeholder="0,00"
                      />
                    </div>
                    <span className="hidden sm:inline text-sm text-gray-500">€</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-gray-200 bg-white/70 px-3 py-2 text-xs">
                    <div className="flex flex-1 flex-wrap items-center gap-1.5">
                      {summary.length === 0 ? (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                          Nessuna metratura collegata
                        </span>
                      ) : (
                        summary.map((s) => (
                          <span
                            key={`${row.id}-${s.id}`}
                            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 font-medium text-gray-700"
                          >
                            <span className="text-gray-900">{formatMq(s.mq)}</span>
                            {s.missingDimensions > 0 && (
                              <span className="text-[10px] text-amber-700">
                                · {s.missingDimensions} senza dimensioni
                              </span>
                            )}
                          </span>
                        ))
                      )}
                    </div>
                    <button
                      type="button"
                      className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
                      onClick={() => onOpenSurfaceModal(row.id)}
                    >
                      Configura metratura
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-4 border-t pt-3 space-y-2 relative">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Totale (IVA esclusa)</div>

          <div className="flex items-center gap-2">
            {!hasDiscount ? (
              <div className="text-xl font-semibold">{euro(totalExcluded)}</div>
            ) : (
              <div className="text-right">
                <div className="text-sm text-gray-500 line-through">{euro(totalExcluded)}</div>
                <div className="text-[11px] text-gray-500">
                  {discountMode === 'pct' ? `Sconto ${discountPct}%` : 'Totale impostato manualmente'}
                </div>
              </div>
            )}

            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm hover:bg-gray-50"
              onClick={onToggleDiscountEditor}
              title="Applica sconto"
            >
              <BadgePercent size={14} /> Sconto
            </button>
          </div>
        </div>

        {showDiscountEditor && (
          <div className="absolute right-0 mt-2 w-80 rounded-lg border bg-white p-3 shadow-lg z-10">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Imposta sconto</div>
              <button className="text-gray-500 hover:text-gray-800" onClick={onToggleDiscountEditor}>
                <X size={16} />
              </button>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <button
                className={`rounded-md border px-2 py-1.5 ${discountMode === 'pct' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}
                onClick={() => onSetDiscountMode('pct')}
              >
                In percentuale
              </button>
              <button
                className={`rounded-md border px-2 py-1.5 ${discountMode === 'final' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}
                onClick={() => onSetDiscountMode('final')}
              >
                Sul totale
              </button>
            </div>

            {discountMode === 'pct' ? (
              <div className="mt-3">
                <label className="text-xs text-gray-500">Sconto (%)</label>
                <input
                  className="input w-full"
                  type="number"
                  min={0}
                  max={100}
                  step="0.5"
                  value={discountPct ?? ''}
                  onChange={(e) => onSetDiscountPct(e.target.value === '' ? null : Number(e.target.value))}
                />
                <div className="mt-1 text-xs text-gray-600">
                  Nuovo totale: <b>{euro(Math.max(0, totalExcluded * (1 - (discountPct ?? 0) / 100)))}</b>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <label className="text-xs text-gray-500">Nuovo totale (IVA esclusa)</label>
                <input
                  className="input w-full"
                  type="number"
                  min={0}
                  step="0.01"
                  value={discountFinal ?? ''}
                  onChange={(e) => onSetDiscountFinal(e.target.value === '' ? null : Number(e.target.value))}
                />
              </div>
            )}

            <div className="mt-3 flex items-center justify-between">
              <button
                className="text-sm text-red-600 hover:underline"
                onClick={onClearDiscount}
              >
                Rimuovi sconto
              </button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onToggleDiscountEditor}>Annulla</Button>
                <Button onClick={onToggleDiscountEditor}>Applica</Button>
              </div>
            </div>
          </div>
        )}

        {hasDiscount && (
          <div className="flex items-center justify-between rounded-md px-3 py-2" style={{ background: '#e8f7ec' }}>
            <div className="text-sm font-medium text-gray-800">Totale scontato (IVA esclusa)</div>
            <div className="text-xl font-bold">{euro(discountedTotal)}</div>
          </div>
        )}
      </div>
    </>
  )
}
