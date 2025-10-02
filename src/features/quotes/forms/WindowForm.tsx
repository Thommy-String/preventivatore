import type { ItemFormProps } from "./types"
import type { WindowItem } from "../types"

const PROFILE_SYSTEMS = [
  'WDS 76 MD',
  'WDS 76 AD',
  'WDS 76 PORTE',
  'WDS 76 SCORREVOLE',
  'ULTRA 70',
  'ULTRA 60',
] as const

export function WindowForm({ draft, onChange, set }: ItemFormProps<WindowItem>) {
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
              onChange={(e) => set('width_mm', Number(e.target.value || 0))}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500">Altezza (mm)</div>
            <input
              className="input"
              type="number"
              value={d.height_mm}
              onChange={(e) => set('height_mm', Number(e.target.value || 0))}
            />
          </div>
        </div>
      </section>

      {/* Quantità (solo informativa, nessun prezzo) */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Quantità</div>
        <div className="grid grid-cols-2 gap-2 items-start">
          <div>
            <div className="text-xs text-gray-500">Pezzi</div>
            <input
              className="input"
              type="number"
              min={1}
              value={d.qty}
              onChange={(e) => set('qty', Math.max(1, Number(e.target.value || 1)))}
            />
          </div>
        </div>
      </section>

      {/* Dettagli tecnici */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Dettagli tecnici</div>
        <div className="grid grid-cols-2 gap-2 items-start">
          <div>
            <div className="text-xs text-gray-500">Sistema profilo (voce)</div>
            <select
              className="input"
              value={(d as any).profile_system ?? ''}
              onChange={(e) => set('profile_system' as any, e.target.value)}
            >
              <option value="">— Seleziona —</option>
              {PROFILE_SYSTEMS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 items-start">
          <div>
            <div className="text-xs text-gray-500">Colore</div>
            <input
              className="input"
              placeholder="es. RAL 7016"
              value={d.color ?? ''}
              onChange={(e) => set('color', e.target.value || null)}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500">Vetro</div>
            <input
              className="input"
              placeholder="es. 4-22-33.1 LowE"
              value={d.glass ?? ''}
              onChange={(e) => set('glass', e.target.value || null)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 items-start">
          <div>
            <div className="text-xs text-gray-500">Colore cerniere</div>
            <input
              className="input"
              placeholder="es. Nero opaco"
              value={d.hinges_color ?? ''}
              onChange={(e) => set('hinges_color', e.target.value || null)}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500">Uw (W/m²K)</div>
            <input
              className="input"
              type="number"
              step="0.01"
              value={d.uw ?? ''}
              onChange={(e) => set('uw', e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
        </div>
      </section>
    </div>
  )
}