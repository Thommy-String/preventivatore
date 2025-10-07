// src/features/quotes/forms/CustomForm.tsx
import React, { useRef } from "react"
import type { CustomItem, CustomField } from "../../quotes/types"

type Props = {
    draft: CustomItem
    onChange: (next: CustomItem) => void
}

type FlexField = CustomField & { name?: string; label?: string } // tollera name/label

export default function CustomForm({ draft, onChange }: Props) {
    const fileRef = useRef<HTMLInputElement | null>(null)

    const set = <K extends keyof CustomItem>(k: K, v: CustomItem[K]) =>
        onChange({ ...draft, [k]: v })

    const details: FlexField[] = Array.isArray(draft.custom_fields)
        ? (draft.custom_fields as any)
        : []

    const previewSrc: string | null = (draft as any).__previewUrl || draft.image_url || null

    const updateDetail = (idx: number, patch: Partial<FlexField>) => {
        const next = details.slice()
        next[idx] = { ...next[idx], ...patch }
        set("custom_fields", next as any)
    }

    const addDetail = () => {
        const next = details.concat({
            key: crypto.randomUUID(),
            label: "",
            value: "",
        } as FlexField)
        set("custom_fields", next as any)
    }

    const removeDetail = (idx: number) => {
        const next = details.slice()
        next.splice(idx, 1)
        set("custom_fields", next as any)
    }

    // --- Mini uploader immagine (solo preview locale; upload avviene al salvataggio in ItemModal) ---
    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) { e.target.value = ""; return; }

      // crea anteprima locale e memorizza anche il File (sarà caricato in ItemModal onSave)
      const previewUrl = URL.createObjectURL(file);
      onChange({ ...(draft as any), __pickedFile: file, __previewUrl: previewUrl } as any);
      e.target.value = "";
    };

    const removeImage = () => {
      const prev = (draft as any).__previewUrl as string | undefined;
      if (prev) URL.revokeObjectURL(prev);
      const next: any = { ...draft };
      delete next.__pickedFile;
      delete next.__previewUrl;
      next.image_url = undefined;
      onChange(next);
    };

    return (
        <div className="space-y-4">
            {/* Titolo voce */}
            <div className="space-y-1">
                <div className="text-xs text-gray-500">Titolo voce</div>
                <input
                    className="input"
                    placeholder="Es. Voce personalizzata"
                    value={draft.title ?? ""}
                    onChange={(e) => set("title", e.target.value)}
                />
            </div>

            {/* Riferimento (opzionale) */}
            <div className="space-y-1">
                <div className="text-xs text-gray-500">Riferimento (opzionale)</div>
                <input
                    className="input"
                    placeholder="Es. bagno piccolo / salotto"
                    value={draft.reference ?? ""}
                    onChange={(e) => set("reference", e.target.value)}
                />
            </div>

            {/* Misure e quantità */}
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <div className="text-xs text-gray-500">Larghezza (mm)</div>
                    <input
                        type="number"
                        min={0}
                        className="input"
                        value={draft.width_mm ?? ""}
                        onChange={(e) =>
                            set("width_mm", Number(e.target.value || 0) as any)
                        }
                        placeholder="es. 1200"
                    />
                </div>
                <div>
                    <div className="text-xs text-gray-500">Altezza (mm)</div>
                    <input
                        type="number"
                        min={0}
                        className="input"
                        value={draft.height_mm ?? ""}
                        onChange={(e) =>
                            set("height_mm", Number(e.target.value || 0) as any)
                        }
                        placeholder="es. 1500"
                    />
                </div>
                <div>
                    <div className="text-xs text-gray-500">Quantità</div>
                    <input
                        type="number"
                        min={1}
                        step={1}
                        className="input"
                        value={draft.qty ?? 1}
                        onChange={(e) =>
                            set("qty", Math.max(1, Number(e.target.value || 1)) as any)
                        }
                        placeholder="1"
                    />
                </div>
            </div>

            {/* Immagine voce (mini uploader) */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600">Immagine voce</div>

              {previewSrc ? (
                <div className="flex items-center gap-3">
                  <img
                    src={previewSrc}
                    alt="Anteprima"
                    className="h-24 w-24 object-contain rounded border bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => fileRef.current?.click()}
                    >
                      Cambia immagine
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={removeImage}
                    >
                      Rimuovi
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded border border-dashed p-4 text-sm text-gray-600 flex items-center justify-between">
                  <span>Nessuna immagine. Caricane una dal dispositivo.</span>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => fileRef.current?.click()}
                  >
                    Carica immagine
                  </button>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickFile}
              />
            </div>

            {/* Dettagli dinamici */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-gray-600">Voci</div>
                    <button type="button" className="btn btn-sm" onClick={addDetail}>
                        + Aggiungi voce
                    </button>
                </div>

                {details.length === 0 ? (
                    <div className="rounded border border-dashed p-4 text-sm text-gray-500">
                        Nessuna voce. Premi “Aggiungi voce.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {details.map((f, idx) => (
                            <div key={f.key} className="grid grid-cols-[1fr_1fr_40px] gap-2 items-center">
                                <input
                                    className="input"
                                    placeholder="Nome (es. Colore)"
                                    value={typeof (f.label ?? f.name) === 'string' ? (f.label ?? f.name)! : ''}
                                    onChange={(e) => updateDetail(idx, { label: e.target.value })}
                                />
                                <input
                                    className="input"
                                    placeholder="Valore (es. Oro)"
                                    value={typeof f.value === 'string' ? f.value : ''}
                                    onChange={(e) => updateDetail(idx, { value: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="h-9 w-9 inline-flex items-center justify-center rounded-md border bg-white hover:bg-gray-50"
                                    onClick={() => removeDetail(idx)}
                                    aria-label="Rimuovi"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}