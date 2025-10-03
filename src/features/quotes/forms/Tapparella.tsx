

import type { ItemFormProps } from "./types"
import type { TapparellaItem } from "../types"

const MATERIALI = ["PVC", "Alluminio"] as const

export function TapparellaForm(
  props: ItemFormProps<TapparellaItem> & { draft?: TapparellaItem }
) {
  const draft = props.value ?? props.draft
  const onChange = props.onChange
  // preserva sempre `kind` e i campi esistenti del draft
  const set = <K extends keyof TapparellaItem>(k: K, v: TapparellaItem[K]) => {
    const base =
      draft ??
      ({
        kind: "tapparella",
        qty: 1,
        width_mm: 1000,
        height_mm: 1400,
        material: "PVC",
        color: "",
      } as TapparellaItem)
    onChange({ ...base, [k]: v })
  }

  // Fallback sicuri per campi controllati
  const width = draft?.width_mm ?? 1000
  const height = draft?.height_mm ?? 1400
  const qty = draft?.qty ?? 1
  const material = draft?.material ?? "PVC"
  const color = draft?.color ?? ""

  return (
    <div className="space-y-4">
      {/* Misure */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Misure</div>
        <div className="grid grid-cols-3 gap-2 items-start">
          <div>
            <div className="text-xs text-gray-500">Larghezza (mm)</div>
            <input
              className="input"
              type="number"
              value={width}
              onChange={(e) => set("width_mm", Number(e.target.value || 0))}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500">Altezza (mm)</div>
            <input
              className="input"
              type="number"
              value={height}
              onChange={(e) => set("height_mm", Number(e.target.value || 0))}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500">Quantità</div>
            <input
              className="input"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => set("qty", Math.max(1, Number(e.target.value || 1)))}
            />
          </div>
        </div>
      </section>

      {/* Specifiche */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Specifiche</div>
        <div className="grid grid-cols-2 gap-2 items-start">
          <div>
            <div className="text-xs text-gray-500">Materiale</div>
            <select
              className="input"
              value={material}
              onChange={(e) => set("material", e.target.value as any)}
            >
              {MATERIALI.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-500">Colore</div>
            <input
              className="input"
              placeholder="es. RAL 9016 Bianco"
              value={color}
              onChange={(e) => set("color", e.target.value || "")}
            />
          </div>
        </div>
      </section>

      {/* Riferimento */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Riferimento</div>
        <input
          className="input"
          type="text"
          placeholder="es. Bagno piccolo, Salotto..."
          value={draft.reference ?? ''}
          onChange={(e) => set('reference', e.target.value)}
        />
      </section>
    </div>
  )
}