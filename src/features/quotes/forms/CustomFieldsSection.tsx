import type { CustomField } from "../types"

type WithCustomFields = { custom_fields?: CustomField[] } & Record<string, any>

type Props<T extends WithCustomFields> = {
  draft: T
  onChange: (next: T) => void
  title?: string
  addLabel?: string
}

export default function CustomFieldsSection<T extends WithCustomFields>({
  draft,
  onChange,
  title = "Campi personalizzati",
  addLabel = "+ Aggiungi campo",
}: Props<T>) {

  const details: CustomField[] = Array.isArray(draft.custom_fields) ? draft.custom_fields : []

  const update = (next: CustomField[]) => {
    onChange({ ...(draft as any), custom_fields: next } as T)
  }

  const updateRow = (idx: number, patch: Partial<CustomField>) => {
    const next = details.slice()
    next[idx] = { ...next[idx], ...patch }
    update(next)
  }

  const addRow = () => {
    update([
      ...details,
      { key: crypto.randomUUID(), name: "", value: "" }
    ])
  }

  const removeRow = (idx: number) => {
    const next = details.slice()
    next.splice(idx, 1)
    update(next)
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-600">{title}</div>
        <button type="button" className="btn btn-sm" onClick={addRow}>
          {addLabel}
        </button>
      </div>

      {details.length === 0 ? (
        <div className="rounded border border-dashed p-4 text-sm text-gray-500">
          Nessun campo. Premi “{addLabel}”.
        </div>
      ) : (
        <div className="space-y-2">
          {details.map((f, idx) => (
            <div key={f.key ?? idx} className="grid grid-cols-[1fr_1fr_40px] gap-2 items-center">
              <input
                className="input"
                placeholder="Titolo (es. Colore maniglia)"
                value={typeof (f.name ?? (f as any).label) === "string" ? (f.name ?? (f as any).label)! : ""}
                onChange={(e) => updateRow(idx, { name: e.target.value, /* compat */ ...(f as any).label !== undefined ? { label: e.target.value as any } : {} })}
              />
              <input
                className="input"
                placeholder="Valore (es. Nero opaco)"
                value={typeof f.value === "string" ? f.value : ""}
                onChange={(e) => updateRow(idx, { value: e.target.value })}
              />
              <button
                type="button"
                className="h-9 w-9 inline-flex items-center justify-center rounded-md border bg-white hover:bg-gray-50"
                onClick={() => removeRow(idx)}
                aria-label="Rimuovi"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}