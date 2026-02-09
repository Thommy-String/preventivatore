import { ArrowUp, ArrowDown, GripVertical, Plus, Layers } from 'lucide-react'
import type { DragEvent } from 'react'
import { Button } from '../ui/Button'
import { ItemCard } from '../../features/quotes/components/ItemCard'
import type { QuoteItem } from '../../features/quotes/types'
import { surfaceMq } from '../../features/quotes/utils/pricing'
import { registry } from '../../features/quotes/registry'

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
  // Calcola statistiche per il summary
  const totalItems = itemsArray.length

  // Conta per tipo di voce con mq
  const itemsByType = itemsArray.reduce((acc, item) => {
    const type = item.kind
    if (!acc[type]) {
      acc[type] = { count: 0, quantity: 0, surface: 0, label: '' }
    }
    acc[type].count += 1
    acc[type].quantity += (item.qty || 1)
    
    // Calcola superficie per questo item
    if (item.width_mm && item.height_mm) {
      acc[type].surface += surfaceMq(item) * (item.qty || 1)
    }
    
    // Usa il registry per ottenere l'etichetta
    acc[type].label = registry[type]?.label || type.toUpperCase()
    return acc
  }, {} as Record<string, { count: number; quantity: number; surface: number; label: string }>)

  const sortedTypes = Object.entries(itemsByType)
    .sort(([,a], [,b]) => b.count - a.count)

  // Colori ottimizzati (più tenui e moderni)
  const getCategoryColor = (kind: string) => {
    const colors: Record<string, string> = {
      porta_blindata: 'bg-blue-50 text-blue-700 border-blue-100 ring-blue-500/10',
      porta_interna: 'bg-indigo-50 text-indigo-700 border-indigo-100 ring-indigo-500/10',
      window: 'bg-emerald-50 text-emerald-700 border-emerald-100 ring-emerald-500/10',
      cassonetto: 'bg-orange-50 text-orange-700 border-orange-100 ring-orange-500/10',
      zanzariera: 'bg-pink-50 text-pink-700 border-pink-100 ring-pink-500/10',
      persiana: 'bg-purple-50 text-purple-700 border-purple-100 ring-purple-500/10',
      tapparella: 'bg-cyan-50 text-cyan-700 border-cyan-100 ring-cyan-500/10',
      custom: 'bg-gray-50 text-gray-700 border-gray-100 ring-gray-500/10'
    }
    return colors[kind] || 'bg-gray-50 text-gray-700 border-gray-100'
  }

  return (
    <div className="space-y-6">
      {/* --- HEADER SUMMARY --- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <Layers size={18} className="text-gray-600" />
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        Voci Preventivo
                        {totalItems > 0 && (
                            <span className="bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded-full">
                                {totalItems}
                            </span>
                        )}
                    </h2>
                    <p className="text-xs text-gray-500">Gestisci le voci e l'ordine di inserimento</p>
                </div>
            </div>
        </div>

        {/* Chips Area */}
        {totalItems > 0 && Object.keys(itemsByType).length > 0 && (
          <div className="p-3 bg-white flex flex-wrap gap-2">
            {sortedTypes.map(([type, data]) => (
              <div 
                key={type} 
                className={`
                    inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all hover:scale-[1.02] cursor-default
                    ${getCategoryColor(type)}
                `}
              >
                <span className="font-semibold">{data.label}</span>
                <span className="w-px h-3 bg-current opacity-20 mx-0.5"></span>
                <span>{data.quantity} pz</span>
                {data.surface > 0 && (
                  <>
                     <span className="w-1 h-1 rounded-full bg-current opacity-40"></span>
                     <span className="opacity-90">{data.surface.toFixed(1)} m²</span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- LISTA VOCI O EMPTY STATE --- */}
      {itemsArray.length === 0 ? (
        <div 
            onClick={onOpenPicker}
            className="group relative flex flex-col items-center justify-center p-12 text-center bg-white border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50/50 transition-all cursor-pointer"
        >
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-gray-100">
            <Plus size={32} className="text-gray-400 group-hover:text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Preventivo Vuoto</h3>
          <p className="text-gray-500 text-sm max-w-md mb-6">
            Non hai ancora inserito nessuna voce. Clicca qui per aprire il catalogo e iniziare.
          </p>
          <Button variant="outline" className="pointer-events-none">
            Inizia configurazione
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {itemsArray.map((it, index) => {
             const isFirst = index === 0;
             const isLast = index === itemsArray.length - 1;

             return (
                <div
                  key={it.id}
                  draggable
                  onDragStart={(e) => onItemDragStart(e, it.id)}
                  onDragOver={onItemDragOver}
                  onDrop={(e) => onItemDrop(e, it.id)}
                  className="group relative flex items-stretch gap-0 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
                >
                  {/* --- SIDEBAR CONTROLLI (Left) --- */}
                  <div className="flex flex-col items-center justify-between py-3 px-1.5 w-10 bg-gray-50 border-r border-gray-100 rounded-l-lg text-gray-400">
                    
                    {/* Drag Handle */}
                    <div className="cursor-grab active:cursor-grabbing hover:text-gray-700 p-1" title="Trascina per spostare">
                        <GripVertical size={16} />
                    </div>

                    {/* Index Number */}
                    <div className="text-xs font-mono font-medium text-gray-500 select-none">
                        {index + 1}
                    </div>

                    {/* Ordina Su/Giù */}
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                        <button 
                            type="button"
                            disabled={isFirst}
                            onClick={() => onMoveItemRow(it.id, -1)}
                            className={`p-0.5 rounded hover:bg-white hover:shadow-sm ${isFirst ? 'opacity-20 cursor-not-allowed' : 'hover:text-gray-800'}`}
                            title="Sposta su"
                        >
                            <ArrowUp size={14} />
                        </button>
                        <button 
                            type="button"
                            disabled={isLast}
                            onClick={() => onMoveItemRow(it.id, +1)}
                            className={`p-0.5 rounded hover:bg-white hover:shadow-sm ${isLast ? 'opacity-20 cursor-not-allowed' : 'hover:text-gray-800'}`}
                            title="Sposta giù"
                        >
                            <ArrowDown size={14} />
                        </button>
                    </div>
                  </div>

                  {/* --- CONTENUTO CARD --- */}
                  <div className="flex-1 min-w-0">
                    <ItemCard
                      item={it}
                      onEdit={onEditItem}
                      onDuplicate={onDuplicateItem}
                      onRemove={onRemoveItem}
                      // Passiamo una prop per togliere eventuali bordi/ombre interne se ItemCard ne ha di default troppo pesanti
                      // className="border-none shadow-none" 
                    />
                  </div>
                </div>
             );
          })}

          {/* Pulsante aggiungi rapido bottom */}
          <div 
            onClick={onOpenPicker}
            className="flex items-center justify-center p-3 mt-4 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 cursor-pointer transition-all gap-2"
          >
             <Plus size={16} />
             <span className="text-sm font-medium">Aggiungi un'altra voce</span>
          </div>
        </div>
      )}
    </div>
  )
}