import { Button } from "../../../components/ui/Button"
import { registry } from "../registry"
import type { QuoteItem } from "../types"

type Props = {
  draft: QuoteItem
  editingId: string | null
  onChange: (next: QuoteItem) => void
  onCancel: () => void
  onSave: () => void
}

export function ItemModal({ draft, editingId, onChange, onCancel, onSave }: Props){
  const setField = (key: keyof QuoteItem, value: any) => {
    onChange({ ...(draft as any), [key]: value } as QuoteItem)
  }
  const setMany = (patch: Partial<QuoteItem>) => {
    onChange({ ...(draft as any), ...(patch as any) } as QuoteItem)
  }
  const entry = registry[draft.kind]
  if (!entry) {
    console.error('Registry entry non trovato per kind:', draft?.kind)
    return null
  }
  const Title = editingId ? `Modifica ${entry.label}` : `Nuova ${entry.label}`
  const Form = entry.Form

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="absolute inset-0 flex items-start md:items-center justify-center p-4">
        <div className="w-full max-w-[640px] card p-4 overflow-auto max-h-[90vh]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{Title}</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onCancel}>Annulla</Button>
              <Button onClick={onSave}>{editingId ? 'Salva' : 'Aggiungi'}</Button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative rounded border bg-white p-3 flex items-center justify-center min-h-[220px]">
              <img src={entry.icon} alt={entry.label} className="max-w-[75%] max-h-[75%] object-contain" />
              <div className="absolute bottom-2 left-0 right-0 text-center text-[12px] text-gray-700">{draft.width_mm} mm</div>
              <div className="absolute top-0 bottom-0 left-2 flex items-center">
                <div className="-rotate-90 origin-left text-[12px] text-gray-700">{draft.height_mm} mm</div>
              </div>
            </div>

            {Form ? (
              <Form draft={draft as any} onChange={onChange as any} set={setField as any} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}