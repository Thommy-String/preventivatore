import { Button } from "../../../components/ui/Button"
import { Copy, Pencil, Trash2 } from "lucide-react"
import { surfaceMq } from "../utils/pricing"
import { registry } from "../registry"
import type { QuoteItem } from "../types"

type Props = {
  item: QuoteItem
  onEdit: (it: QuoteItem) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
}

export function ItemCard({ item: it, onEdit, onDuplicate, onRemove }: Props){
  const entry = registry[it.kind]
  return (
    <div className="card p-3">
      <div className="flex gap-3">
        <div className="relative w-[110px] h-[110px] shrink-0 rounded border bg-white flex items-center justify-center">
          <img src={entry.icon} alt={entry.label} className="max-w-[80%] max-h-[80%] object-contain" />
          <div className="absolute bottom-1 left-0 right-0 text-center text-[11px] text-gray-700">
            {it.width_mm} mm
          </div>
          <div className="absolute top-0 bottom-0 left-1 flex items-center">
            <div className="-rotate-90 origin-left text-[11px] text-gray-700">{it.height_mm} mm</div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="font-medium truncate">{entry.label}</div>
            <div className="flex items-center gap-1 md:gap-3">
              <div className="text-sm text-gray-600">
                {it.width_mm && it.height_mm ? `${it.qty}× · ${surfaceMq(it)} m²` : `${it.qty}×`}
              </div>
              <Button variant="ghost" aria-label="Modifica" title="Modifica" onClick={() => onEdit(it)}>
                <Pencil size={16} />
              </Button>
              <Button variant="ghost" aria-label="Duplica" title="Duplica" onClick={() => onDuplicate(it.id)}>
                <Copy size={16} />
              </Button>
              <Button variant="ghost" aria-label="Rimuovi voce" title="Rimuovi voce" onClick={() => onRemove(it.id)}>
                <Trash2 size={16} />
              </Button>
            </div>
          </div>

          <div className="mt-1 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm text-gray-700">
            <div><span className="text-gray-500">Misure:</span> {it.width_mm}×{it.height_mm} mm</div>

            {(it as any).color && <div><span className="text-gray-500">Colore:</span> {(it as any).color}</div>}
            {(it as any).glass && <div><span className="text-gray-500">Vetro:</span> {(it as any).glass}</div>}
            {(it as any).hinges_color && <div><span className="text-gray-500">Cerniere:</span> {(it as any).hinges_color}</div>}
            {typeof (it as any).uw === 'number' && <div><span className="text-gray-500">Uw:</span> {(it as any).uw} W/m²K</div>}

            {/* Dettagli specifici zanzariera */}
            {it.kind === 'zanzariera' && (
              <>
                {(it as any).modello && (
                  <div><span className="text-gray-500">Modello:</span> {(it as any).modello}</div>
                )}
                {(it as any).tipologia && (
                  <div><span className="text-gray-500">Tipologia:</span> {(it as any).tipologia}</div>
                )}
                {(it as any).profilo_colore && (
                  <div><span className="text-gray-500">Profilo:</span> {(it as any).profilo_colore}</div>
                )}
                {(it as any).accessori_colore && (
                  <div><span className="text-gray-500">Accessori:</span> {(it as any).accessori_colore}</div>
                )}
              </>
            )}

            {(it.kind === 'finestra' || it.kind === 'portafinestra') && (it as any).profile_system && (
              <div><span className="text-gray-500">Sistema profilo:</span> {(it as any).profile_system}</div>
            )}

            {/* Dettagli specifici cassonetto */}
            {it.kind === 'cassonetto' && (
              <>
                {(it as any).material && (
                  <div><span className="text-gray-500">Materiale:</span> {(it as any).material}</div>
                )}
                {(it as any).depth_mm && (
                  <div><span className="text-gray-500">Profondità:</span> {(it as any).depth_mm} mm</div>
                )}
                {(it as any).extension_mm && (
                  <div><span className="text-gray-500">Estensione/Spalletta:</span> {(it as any).extension_mm} mm</div>
                )}
              </>
            )}

            {/* Dettagli specifici persiana */}
            {it.kind === 'persiana' && (
              <>
                {(it as any).material && (
                  <div><span className="text-gray-500">Materiale:</span> {(it as any).material}</div>
                )}
                {(it as any).lamelle && (
                  <div><span className="text-gray-500">Lamelle:</span> {(it as any).lamelle}</div>
                )}
                {(typeof (it as any).telaio !== "undefined") && (
                  <div><span className="text-gray-500">Telaio:</span> {(it as any).telaio ? "Con telaio" : "Senza telaio"}</div>
                )}
                {(it as any).color && (
                  <div><span className="text-gray-500">Colore:</span> {(it as any).color}</div>
                )}
              </>
            )}

            {/* Dettagli specifici tapparella */}
            {it.kind === 'tapparella' && (
              <>
                {(it as any).material && (
                  <div><span className="text-gray-500">Materiale:</span> {(it as any).material}</div>
                )}
                {(it as any).color && (
                  <div><span className="text-gray-500">Colore:</span> {(it as any).color}</div>
                )}
                {(it as any).width_mm && (it as any).height_mm && (
                  <div><span className="text-gray-500">Dimensioni:</span> {(it as any).width_mm}×{(it as any).height_mm} mm</div>
                )}
              </>
            )}

            {it.custom_fields?.map((f, idx) => (
              <div key={idx}><span className="text-gray-500">{f.key}:</span> {f.value}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}