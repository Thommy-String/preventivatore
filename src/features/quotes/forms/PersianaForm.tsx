import type { ItemFormProps } from "../types"
import type { PersianaItem } from "../types"

const MATERIALI = ["Alluminio", "PVC", "Altro"] as const
const LAMELLE = ["fisse", "regolabili"] as const

export function PersianaForm({ draft, onChange }: ItemFormProps<PersianaItem>) {
  if (!draft) return null
  const d = draft

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
              type="number"
              value={d.width_mm}
              onChange={(e) => onChange({ ...d, width_mm: Number(e.target.value || 0) })}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500">Altezza (mm)</div>
            <input
              className="input"
              type="number"
              value={d.height_mm}
              onChange={(e) => onChange({ ...d, height_mm: Number(e.target.value || 0) })}
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
              type="number"
              min={1}
              value={d.qty}
              onChange={(e) => onChange({ ...d, qty: Math.max(1, Number(e.target.value || 1)) })}
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