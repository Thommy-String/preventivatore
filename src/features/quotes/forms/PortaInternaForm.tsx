import React from "react";
import type { ItemFormProps, PortaInternaItem } from "../types";
import CustomFieldsSection from "./CustomFieldsSection";
import { RalColorPicker } from "../components/RalColorPicker";


export const PortaInternaForm: React.FC<ItemFormProps<PortaInternaItem>> = ({
  draft,
  onChange,
  readOnly,
}) => {

  // set: aggiorna anche sliding_direction se serve
  const set = <K extends keyof PortaInternaItem>(k: K, v: PortaInternaItem[K]) => {
    let next = { ...draft, [k]: v };
    if (k === 'apertura' && v === 'scorrevole') {
      const handlePos = next.handle_position || 'left';
      next.sliding_direction = handlePos === 'left' ? 'dx' : 'sx';
    }
    if (k === 'handle_position' && draft.apertura === 'scorrevole') {
      next.sliding_direction = v === 'left' ? 'dx' : 'sx';
    }
    onChange(next);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column: Form */}
      <div className="space-y-8">
        {/* Title */}
        <section className="space-y-2">
          <label className="text-xs text-gray-500 mb-1 block">Titolo</label>
          <input
            className="input w-full"
            type="text"
            placeholder="Porta interna"
            value={draft.title || ""}
            onChange={(e) => set("title", e.target.value)}
            disabled={readOnly}
          />
        </section>
        {/* Dimensions & Qty */}
        <section className="space-y-4">
          <div className="flex justify-between items-center text-sm font-medium text-gray-700">
            <span>Dimensioni & Quantità</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Larghezza (mm)</label>
              <input
                className="input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={draft.width_mm === 0 ? '' : String(draft.width_mm)}
                onChange={e => set("width_mm", Number(e.target.value.replace(/\D/g, "")))}
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Altezza (mm)</label>
              <input
                className="input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={draft.height_mm === 0 ? '' : String(draft.height_mm)}
                onChange={e => set("height_mm", Number(e.target.value.replace(/\D/g, "")))}
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Quantità</label>
              <input
                className="input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={draft.qty === 0 ? '' : String(draft.qty)}
                onChange={e => set("qty", Number(e.target.value.replace(/\D/g, "")))}
                disabled={readOnly}
              />
            </div>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Options */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Caratteristiche</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Colore Pannello</label>
              <RalColorPicker
                previewColor={draft.options?.previewColor ?? "#ffffff"}
                labelValue={draft.color || ''}
                onPreviewColorChange={(hex) => {
                  const prevOptions = draft.options || {};
                  onChange({ ...draft, options: { ...prevOptions, previewColor: hex } });
                }}
                onLabelChange={(text) => set("color", text)}
                onRalSelect={(ral) => {
                  const prevOptions = draft.options || {};
                  onChange({
                    ...draft,
                    color: `${ral.code} ${ral.name}`,
                    options: { ...prevOptions, previewColor: ral.hex }
                  });
                }}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Colore Maniglia</label>
              <RalColorPicker
                previewColor={draft.options?.handleColor ?? "#a6a6a6"}
                labelValue={draft.options?.handleColorLabel || ''}
                onPreviewColorChange={(hex) => {
                  const prevOptions = draft.options || {};
                  onChange({ ...draft, options: { ...prevOptions, handleColor: hex } });
                }}
                onLabelChange={(text) => {
                  const prevOptions = draft.options || {};
                  onChange({ ...draft, options: { ...prevOptions, handleColorLabel: text } });
                }}
                onRalSelect={(ral) => {
                  const prevOptions = draft.options || {};
                  onChange({ 
                    ...draft, 
                    options: { 
                      ...prevOptions, 
                      handleColor: ral.hex, 
                      handleColorLabel: `${ral.code} ${ral.name}` 
                    } 
                  });
                }}
              />
            </div>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Apertura (battente/scorrevole) */}
        <section className="space-y-2">
          <label className="text-xs text-gray-500 mb-1 block">Tipo apertura</label>
          <select
            className="input"
            value={draft.apertura}
            onChange={e => set("apertura", e.target.value as PortaInternaItem["apertura"])}
            disabled={readOnly}
          >
            <option value="battente">Battente</option>
            <option value="scorrevole">Scorrevole</option>
          </select>
        </section>
        {/* Maniglia (sx/dx) */}
        <section className="space-y-2">
          <label className="text-xs text-gray-500 mb-1 block">Lato maniglia</label>
          <select
            className="input"
            value={draft.handle_position}
            onChange={e => set("handle_position", e.target.value as PortaInternaItem["handle_position"])}
            disabled={readOnly}
          >
            <option value="left">Sinistra</option>
            <option value="right">Destra</option>
          </select>
        </section>
        {/* Verso scorrimento (solo se scorrevole) */}
        {draft.apertura === "scorrevole" && (
          <section className="space-y-2">
            <label className="text-xs text-gray-500 mb-1 block">Verso scorrimento</label>
            <input
              className="input bg-gray-100 cursor-not-allowed"
              value={((draft.handle_position || 'left') === 'left' ? 'Destra' : 'Sinistra')}
              disabled
            />
          </section>
        )}
        {/* Custom fields */}
        <CustomFieldsSection draft={draft} onChange={onChange} />
      </div>
    </div>
  );
};
