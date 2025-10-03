import type { CassonettoItem } from '../types'
import type { ItemFormProps } from './types'

const MATERIALS = ['PVC', 'Alluminio coibentato', 'Legno coibentato'] as const

export function CassonettoForm({ draft, onChange, set }: ItemFormProps<CassonettoItem>) {
  if (!draft) return null
  const d = draft
  return (
    <div className="space-y-4">
      {/* Materiale */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Materiale</div>
        <div>
          <select
            className="input"
            value={(d.material ?? 'PVC') as string}
            onChange={(e) => set('material', e.target.value as CassonettoItem['material'])}
          >
            {MATERIALS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Misure principali */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Misure</div>
        <div className="grid grid-cols-3 gap-2 items-start">
          <div>
            <div className="text-xs text-gray-500">Larghezza (mm)</div>
            <input
              className="input"
              type="number"
              value={d.width_mm}
              onChange={(e) => set('width_mm', Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500">Altezza (mm)</div>
            <input
              className="input"
              type="number"
              value={d.height_mm}
              onChange={(e) => set('height_mm', Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500">Profondità (mm)</div>
            <input
              className="input"
              type="number"
              value={d.depth_mm ?? ''}
              placeholder="es. 220"
              onChange={(e) => set('depth_mm', e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      {/* Celino */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Celino</div>
        <div className="grid grid-cols-3 gap-2 items-start">
          <div>
            <div className="text-xs text-gray-500">Estensione celino (mm)</div>
            <input
              className="input"
              type="number"
              value={d.extension_mm ?? ''}
              placeholder="es. 40"
              onChange={(e) => set('extension_mm', e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
          <div className="col-span-2 self-end text-xs text-gray-500">
            Valore opzionale: aggiunge profondità al cassonetto per coprire lo spessore muro.
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
          value={d.reference ?? ''}
          onChange={(e) => set('reference', e.target.value)}
        />
      </section>

      {/* Quantità */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Quantità</div>
        <div className="grid grid-cols-3 gap-2 items-start">
          <div>
            <input
              className="input"
              type="number"
              min={1}
              value={d.qty}
              onChange={(e) => set('qty', Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
