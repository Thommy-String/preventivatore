import { useEffect, useMemo, useRef, useState } from "react"
import { registry } from "../registry"

export type ProductPickerModalProps = {
  open: boolean
  onClose: () => void
  onPick: (kind: keyof typeof registry) => void
}

export function ProductPickerModal({ open, onClose, onPick }: ProductPickerModalProps){
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open])

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    const entries = Object.entries(registry) as [keyof typeof registry, (typeof registry)[keyof typeof registry]][]
    if (!q) return entries
    return entries.filter(([_, v]) => v.label.toLowerCase().includes(q))
  }, [query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 top-16 mx-auto w-full max-w-3xl card p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-medium">Aggiungi prodotto</div>
          <button className="text-sm text-gray-600 hover:text-gray-900" onClick={onClose}>Chiudi</button>
        </div>

        <div className="mt-3">
          <input
            ref={inputRef}
            className="input w-full"
            placeholder="Cerca categoria (es. finestra, cassonetto…)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map(([k, entry]) => (
            <button
              key={String(k)}
              className="group relative flex items-center gap-3 rounded-lg border bg-white p-3 text-left hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              onClick={() => onPick(k)}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded border bg-white">
                <img src={entry.icon} alt={entry.label} className="max-h-8 max-w-8 object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium leading-tight">{entry.label}</div>
                <div className="text-xs text-gray-500">Clicca per configurare</div>
              </div>
              <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-transparent group-hover:ring-gray-200" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}