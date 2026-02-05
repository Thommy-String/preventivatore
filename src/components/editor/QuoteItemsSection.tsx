import { ArrowUp, ArrowDown, GripVertical, Plus } from 'lucide-react'
import type { DragEvent } from 'react'
import { Button } from '../ui/Button'
import { ItemCard } from '../../features/quotes/components/ItemCard'
import type { QuoteItem } from '../../features/quotes/types'

export type QuoteItemsSectionProps = {
  itemsArray: QuoteItem[]
  onOpenPicker: () => void
  onItemDragStart: (e: DragEvent<HTMLDivElement>, id: string) => void
  onItemDragOver: (e: DragEvent<HTMLDivElement>) => void
  onItemDrop: (e: DragEvent<HTMLDivElement>, targetId: string) => void
  onMoveItemRow: (id: string, dir: -1 | 1) => void
  onEditItem: (item: QuoteItem) => void
  onDuplicateItem: (id: string) => void
  onRemoveItem: (id: string) => void
}

export function QuoteItemsSection({
  itemsArray,
  onOpenPicker,
  onItemDragStart,
  onItemDragOver,
  onItemDrop,
  onMoveItemRow,
  onEditItem,
  onDuplicateItem,
  onRemoveItem,
}: QuoteItemsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2>Voci del preventivo</h2>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onOpenPicker}>
            <Plus size={16} /> Aggiungi voce
          </Button>
        </div>
      </div>

      {itemsArray.length === 0 ? (
        <div className="mt-4 rounded border border-dashed p-6 text-center text-sm text-gray-600">
          Nessuna voce. Premi <span className="font-medium">Aggiungi</span> e scegli la categoria.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {itemsArray.map((it) => (
            <div
              key={it.id}
              className="relative group rounded-lg"
              draggable
              onDragStart={(e) => onItemDragStart(e, it.id)}
              onDragOver={onItemDragOver}
              onDrop={(e) => onItemDrop(e, it.id)}
            >
              <div className="absolute -left-6 top-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-gray-400 hover:text-gray-700" title="Trascina per riordinare">
                <GripVertical size={16} />
              </div>

              <div className="absolute -right-6 top-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md border bg-white hover:bg-gray-50"
                  title="Sposta su"
                  onClick={() => onMoveItemRow(it.id, -1)}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md border bg-white hover:bg-gray-50"
                  title="Sposta giù"
                  onClick={() => onMoveItemRow(it.id, +1)}
                >
                  <ArrowDown size={16} />
                </button>
              </div>

              <ItemCard
                item={it}
                onEdit={onEditItem}
                onDuplicate={onDuplicateItem}
                onRemove={onRemoveItem}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
