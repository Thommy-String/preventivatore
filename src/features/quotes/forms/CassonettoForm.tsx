import  { useEffect, useState } from 'react';
import type { CassonettoItem } from '../types';
import type { ItemFormProps } from '../types';
import { RalColorPicker } from '../components/RalColorPicker';

const MATERIALS = ['PVC', 'Alluminio coibentato', 'Legno coibentato'] as const;

export function CassonettoForm({ draft, onChange }: ItemFormProps<CassonettoItem>) {
  if (!draft) return null;
  const d = draft;

  // --- Local string state for smooth numeric editing (mobile-friendly) ---
  const [widthStr, setWidthStr] = useState(d.width_mm == null ? '' : String(d.width_mm));
  const [heightStr, setHeightStr] = useState(d.height_mm == null ? '' : String(d.height_mm));
  const [depthStr, setDepthStr] = useState(d.depth_mm == null ? '' : String(d.depth_mm));
  const [celinoStr, setCelinoStr] = useState(d.celino_mm == null ? '' : String(d.celino_mm));
  const [qtyStr, setQtyStr] = useState(d.qty == null ? '1' : String(d.qty));

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

  // Keep local strings in sync when draft changes externally
  useEffect(() => {
    setWidthStr(d.width_mm == null ? '' : String(d.width_mm));
    setHeightStr(d.height_mm == null ? '' : String(d.height_mm));
    setDepthStr(d.depth_mm == null ? '' : String(d.depth_mm));
    setCelinoStr(d.celino_mm == null ? '' : String(d.celino_mm));
    setQtyStr(d.qty == null ? '1' : String(d.qty));
  }, [d.width_mm, d.height_mm, d.depth_mm, d.celino_mm, d.qty]);

  const updateField = (key: keyof CassonettoItem, value: any) => {
    onChange({ ...d, [key]: value });
  };

  // Patch profonda per options (come Tapparella/Persiana)
  const updateOption = (key: string, val: any) => {
    const prevOptions = (d as any).options || {};
    onChange({ ...d, options: { ...prevOptions, [key]: val } } as any);
  };

  return (
    <div className="space-y-4">
      {/* Misure principali */}
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
                const v = e.target.value;
                if (v === '' || /^\d+$/.test(v)) setWidthStr(v);
              }}
              onBlur={() => {
                // commit: empty -> null, otherwise number
                if (widthStr === '') {
                  updateField('width_mm', null);
                } else {
                  const n = Number(widthStr);
                  updateField('width_mm', Number.isNaN(n) ? null : n);
                  setWidthStr(Number.isNaN(n) ? '' : String(n));
                }
              }}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
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
                const v = e.target.value;
                if (v === '' || /^\d+$/.test(v)) setHeightStr(v);
              }}
              onBlur={() => {
                if (heightStr === '') {
                  updateField('height_mm', null);
                } else {
                  const n = Number(heightStr);
                  updateField('height_mm', Number.isNaN(n) ? null : n);
                  setHeightStr(Number.isNaN(n) ? '' : String(n));
                }
              }}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500">Profondità (mm)</div>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={depthStr}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '' || /^\d+$/.test(v)) setDepthStr(v);
              }}
              onBlur={() => {
                if (depthStr === '') {
                  updateField('depth_mm', null);
                } else {
                  const n = Number(depthStr);
                  updateField('depth_mm', Number.isNaN(n) ? null : n);
                  setDepthStr(Number.isNaN(n) ? '' : String(n));
                }
              }}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
            />
          </div>
        </div>
      </section>

      {/* Celino */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Celino (Opzionale)</div>
        <div className="grid grid-cols-2 gap-3 items-center">
          <div>
            <div className="text-xs text-gray-500">Celino (mm)</div>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={celinoStr}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '' || /^\d+$/.test(v)) setCelinoStr(v);
              }}
              onBlur={() => {
                if (celinoStr === '') {
                  updateField('celino_mm', null);
                } else {
                  const n = Number(celinoStr);
                  updateField('celino_mm', Number.isNaN(n) ? null : n);
                  setCelinoStr(Number.isNaN(n) ? '' : String(n));
                }
              }}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
            />
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
            <RalColorPicker
              previewColor={(d as any).options?.previewColor ?? "#e8e8e8"}
              labelValue={d.color ?? ""}
              onPreviewColorChange={(hex) => updateOption("previewColor", hex)}
              onLabelChange={(text) => updateField('color', text || null)}
              onRalSelect={(ral) => {
                const prevOptions = (d as any).options || {};
                onChange({
                  ...d,
                  color: `${ral.code} ${ral.name}`,
                  options: { ...prevOptions, previewColor: ral.hex },
                } as any);
              }}
            />
          </div>
        </div>
      </section>

      {/* Quantità e Riferimento */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Quantità e Riferimento</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Pezzi</label>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={qtyStr}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '' || /^\d+$/.test(v)) setQtyStr(v);
              }}
              onBlur={() => {
                const n = qtyStr === '' ? 1 : Math.max(1, Number(qtyStr) || 1);
                updateField('qty', n);
                setQtyStr(String(n));
              }}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
            />
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
