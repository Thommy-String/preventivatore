import React from "react";
import type { ItemFormProps, PortaBlindataItem } from "../types";
import { RalColorPicker } from "../components/RalColorPicker";
import CustomFieldsSection from "./CustomFieldsSection";

export const PortaBlindataForm: React.FC<ItemFormProps<PortaBlindataItem>> = ({
  draft,
  onChange,
}) => {
  const set = <K extends keyof PortaBlindataItem>(k: K, v: PortaBlindataItem[K]) =>
    onChange({ ...draft, [k]: v });

  return (
    <div className="space-y-8">
       {/* Form Controls */}
      <div className="space-y-8">

        {/* Title */}
        <section className="space-y-2">
          <label className="text-xs text-gray-500 mb-1 block">Titolo</label>
          <input
            className="input w-full"
            type="text"
            placeholder="Porta blindata"
            value={draft.title || ""}
            onChange={(e) => set("title", e.target.value)}
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
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '')
                  set("width_mm", val ? Number(val) : 0)
                }}
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
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '')
                  set("height_mm", val ? Number(val) : 0)
                }}
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
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '')
                  set("qty", val ? Number(val) : 1)
                }}
              />
            </div>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Options */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Caratteristiche</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 h-[42px]">
              <input
                type="checkbox"
                id="serratura_chk"
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={draft.serratura || false}
                onChange={(e) => set("serratura", e.target.checked)}
              />
              <label htmlFor="serratura_chk" className="text-sm text-gray-700 font-medium cursor-pointer">
                Con Serratura di Sicurezza
              </label>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 h-[42px]">
              <input
                type="checkbox"
                id="spioncino_chk"
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={draft.spioncino || false}
                onChange={(e) => set("spioncino", e.target.checked)}
              />
              <label htmlFor="spioncino_chk" className="text-sm text-gray-700 font-medium cursor-pointer">
                Spioncino
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 mb-1 block">Posizione Maniglia (vista interna)</label>
              <div className="flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => set("handle_position", 'left')}
                  className={`px-4 py-2 text-sm font-medium border rounded-l-lg flex-1 ${
                    draft.handle_position === 'left'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Sinistra
                </button>
                <button
                  type="button"
                  onClick={() => set("handle_position", 'right')}
                  className={`px-4 py-2 text-sm font-medium border rounded-r-lg flex-1 -ml-px ${
                    (draft.handle_position || 'right') === 'right'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Destra
                </button>
              </div>
            </div>
          </div>

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
                  previewColor={draft.options?.handleColor ?? "#d1d5db"}
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
        
        {/* Custom Fields */}
        <CustomFieldsSection
          draft={draft}
          onChange={onChange}
        />
      </div>

       {/* Right Column: Preview removed as requested */}
       {/* 
      <div className="lg:sticky lg:top-6 bg-gray-50 rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center space-y-6 min-h-[400px]">
         <div className="bg-white p-6 shadow-sm rounded-lg w-full flex items-center justify-center relative overflow-hidden">
             
             {isSyncing && (
                 <div className="absolute top-2 right-2 z-10">
                     <Badge variant="outline" className="bg-white/80 backdrop-blur">
                        Aggiornamento...
                     </Badge>
                 </div>
             )}

             <div className="w-[300px] h-[300px]">
                <PortaBlindataSvg 
                    width_mm={draft.width_mm}
                    height_mm={draft.height_mm}
                    color={draft.options?.previewColor || draft.color}
                    serratura={draft.serratura}
                />
             </div>
         </div>
      </div>
      */}
    </div>
  );
};
