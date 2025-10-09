//src/features/quotes/forms/Tapparella.tsx
import { useEffect, useState } from "react"
import type { ItemFormProps } from "../types"
import type { TapparellaItem } from "../types"

const MATERIALI = ["PVC", "Alluminio"] as const

export function TapparellaForm({ draft, onChange }: ItemFormProps<TapparellaItem>) {
  // helper per aggiornare mantenendo il resto dell'oggetto
  const set = <K extends keyof TapparellaItem>(k: K, v: TapparellaItem[K]) =>
    onChange({ ...draft, [k]: v })

  // Mobile-friendly numeric editing (allow empty while typing, commit on blur)
  const [widthStr, setWidthStr] = useState(draft.width_mm == null ? "" : String(draft.width_mm))
  const [heightStr, setHeightStr] = useState(draft.height_mm == null ? "" : String(draft.height_mm))
  const [qtyStr, setQtyStr] = useState(draft.qty == null ? "1" : String(draft.qty))
  
  // Keep local strings in sync when draft changes externally
  useEffect(() => {
    setWidthStr(draft.width_mm == null ? "" : String(draft.width_mm))
    setHeightStr(draft.height_mm == null ? "" : String(draft.height_mm))
    setQtyStr(draft.qty == null ? "1" : String(draft.qty))
  }, [draft.width_mm, draft.height_mm, draft.qty])

  const material = draft.material ?? "PVC"
  const color = draft.color ?? ""

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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={widthStr}
              onChange={(e) => {
                const v = e.target.value
                if (v === "" || /^\d+$/.test(v)) setWidthStr(v)
              }}
              onBlur={() => {
                if (widthStr === "") {
                  set("width_mm", null as any)
                } else {
                  const n = Number(widthStr)
                  set("width_mm", Number.isNaN(n) ? null as any : (n as any))
                  setWidthStr(Number.isNaN(n) ? "" : String(n))
                }
              }}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              onKeyDown={(e) => { if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault() }}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500">Altezza (mm)</div>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={heightStr}
              onChange={(e) => {
                const v = e.target.value
                if (v === "" || /^\d+$/.test(v)) setHeightStr(v)
              }}
              onBlur={() => {
                if (heightStr === "") {
                  set("height_mm", null as any)
                } else {
                  const n = Number(heightStr)
                  set("height_mm", Number.isNaN(n) ? null as any : (n as any))
                  setHeightStr(Number.isNaN(n) ? "" : String(n))
                }
              }}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              onKeyDown={(e) => { if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault() }}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500">Quantità</div>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={qtyStr}
              onChange={(e) => {
                const v = e.target.value
                if (v === "" || /^\d+$/.test(v)) setQtyStr(v)
              }}
              onBlur={() => {
                const n = qtyStr === "" ? 1 : Math.max(1, Number(qtyStr) || 1)
                set("qty", n as any)
                setQtyStr(String(n))
              }}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              onKeyDown={(e) => { if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault() }}
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