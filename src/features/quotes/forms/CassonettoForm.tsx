import  { useEffect } from 'react';
import type { CassonettoItem } from '../types';
import type { ItemFormProps } from '../types';

const MATERIALS = ['PVC', 'Alluminio coibentato', 'Legno coibentato'] as const;

export function CassonettoForm({ draft, onChange }: ItemFormProps<CassonettoItem>) {
  if (!draft) return null;
  const d = draft;

  // Imposta valori di default se l'elemento è nuovo
  useEffect(() => {
    if (!d.width_mm && !d.height_mm && !d.depth_mm) {
      onChange({
        ...d,
        width_mm: 1000,
        height_mm: 250,
        depth_mm: 250,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Eseguito solo al primo render

  const updateField = (key: keyof CassonettoItem, value: any) => {
    onChange({ ...d, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Misure principali */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Misure</div>
        <div className="grid grid-cols-3 gap-2 items-start">
          <div>
            <div className="text-xs text-gray-500">Larghezza (mm)</div>
            <input className="input" type="number" value={d.width_mm || ''} onChange={(e) => updateField('width_mm', Number(e.target.value) || null)} />
          </div>
          <div>
            <div className="text-xs text-gray-500">Altezza (mm)</div>
            <input className="input" type="number" value={d.height_mm || ''} onChange={(e) => updateField('height_mm', Number(e.target.value) || null)} />
          </div>
          <div>
            <div className="text-xs text-gray-500">Profondità (mm)</div>
            <input className="input" type="number" value={d.depth_mm ?? ''} onChange={(e) => updateField('depth_mm', e.target.value === '' ? null : Number(e.target.value))} />
          </div>
        </div>
      </section>

      {/* Celino */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Celino (Opzionale)</div>
        <div className="grid grid-cols-2 gap-3 items-center">
          <div>
            <div className="text-xs text-gray-500">Celino (mm)</div>
            <input className="input" type="number" value={d.celino_mm ?? ''} onChange={(e) => updateField('celino_mm', e.target.value === '' ? null : Number(e.target.value))} />
          </div>
          <div className="text-xs text-gray-500">Estensione frontale per coprire il muro.</div>
        </div>
      </section>

      {/* Dettagli */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Dettagli</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Materiale</label>
            <select className="input" value={d.material ?? 'PVC'} onChange={(e) => updateField('material', e.target.value as CassonettoItem['material'])} >
              {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Colore</label>
            <input className="input" type="text" placeholder="Es. RAL 9016" value={d.color ?? ''} onChange={(e) => updateField('color', e.target.value)} />
          </div>
        </div>
      </section>

      {/* Quantità e Riferimento */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Quantità e Riferimento</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Pezzi</label>
            <input className="input" type="number" min={1} value={d.qty} onChange={(e) => updateField('qty', Math.max(1, Number(e.target.value) || 1))} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Riferimento</label>
            <input className="input" type="text" placeholder="es. Cucina" value={d.reference ?? ''} onChange={(e) => updateField('reference', e.target.value)} />
          </div>
        </div>
      </section>
    </div>
  );
}
