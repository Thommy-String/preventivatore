import { useEffect, useState } from "react"
import type { ItemFormProps } from "../types"
import type { PersianaItem } from "../types"

const MATERIALI = ["Alluminio", "PVC", "Altro"] as const
const LAMELLE = ["fisse", "regolabili"] as const

export function PersianaForm({ draft, onChange }: ItemFormProps<PersianaItem>) {
  if (!draft) return null
  const d = draft

  // Local string state for smooth numeric editing (mobile-friendly)
  const [widthStr, setWidthStr] = useState(d.width_mm == null ? "" : String(d.width_mm))
  const [heightStr, setHeightStr] = useState(d.height_mm == null ? "" : String(d.height_mm))
  const [qtyStr, setQtyStr] = useState(d.qty == null ? "1" : String(d.qty))

  // Keep local strings in sync when draft changes externally
  useEffect(() => {
    setWidthStr(d.width_mm == null ? "" : String(d.width_mm))
    setHeightStr(d.height_mm == null ? "" : String(d.height_mm))
    setQtyStr(d.qty == null ? "1" : String(d.qty))
  }, [d.width_mm, d.height_mm, d.qty])

  return (
    <div className="space-y-4">
      {/* Misure */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Misure</div>
        <div className="grid grid-cols-2 gap-2 items-start">
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
                  onChange({ ...d, width_mm: null as any })
                } else {
                  const n = Number(widthStr)
                  onChange({ ...d, width_mm: Number.isNaN(n) ? null as any : n })
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
                  onChange({ ...d, height_mm: null as any })
                } else {
                  const n = Number(heightStr)
                  onChange({ ...d, height_mm: Number.isNaN(n) ? null as any : n })
                  setHeightStr(Number.isNaN(n) ? "" : String(n))
                }
              }}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              onKeyDown={(e) => { if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault() }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 items-start">
          <div>
            <div className="text-xs text-gray-500">Tipo di misura</div>
            <select
              className="input"
              value={d.misura_tipo ?? "luce"}
              onChange={(e) => onChange({ ...d, misura_tipo: e.target.value as any })}
            >
              <option value="luce">Luce</option>
            </select>
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
                onChange({ ...d, qty: n })
                setQtyStr(String(n))
              }}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              onKeyDown={(e) => { if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault() }}
            />
          </div>
        </div>
      </section>

      {/* Specifiche persiana */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Specifiche</div>
        <div className="grid grid-cols-2 gap-2 items-start">
          <div>
            <div className="text-xs text-gray-500">Materiale</div>
            <select
              className="input"
              value={d.material ?? "Alluminio"}
              onChange={(e) => onChange({ ...d, material: e.target.value as any })}
            >
              {MATERIALI.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-500">Lamelle</div>
            <select
              className="input"
              value={d.lamelle ?? "fisse"}
              onChange={(e) => onChange({ ...d, lamelle: e.target.value as any })}
            >
              {LAMELLE.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(d.con_telaio)}
            onChange={(e) => onChange({ ...d, con_telaio: e.target.checked })}
          />
          Con telaio
        </label>
      </section>

      {/* Colore */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Colore</div>
        <input
          className="input"
          placeholder="es. RAL 6005 Verde"
          value={d.color ?? ""}
          onChange={(e) => onChange({ ...d, color: e.target.value || null })}
        />
      </section>

      {/* Riferimento */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Riferimento</div>
        <input
          className="input"
          type="text"
          placeholder="es. Bagno piccolo, Salotto..."
          value={d.reference ?? ''}
          onChange={(e) => onChange({ ...d, reference: e.target.value })}
        />
      </section>
    </div>
  )
}