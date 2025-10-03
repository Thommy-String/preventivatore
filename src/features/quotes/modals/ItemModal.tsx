// src/features/quotes/modals/ItemModal.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { Button } from "../../../components/ui/Button";
import { registry } from "../registry";
import type { QuoteItem } from "../types";
import CustomForm from "../forms/CustomForm";
import { gridWindowToPngBlob } from "../svg/windowToPng";
import { blobToFile } from "../../../lib/blobToFile";
import WindowSvg from "../window/WindowSvg";

// Helpers: read File/Blob as data URL for PDF compatibility
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = () => reject(fr.error || new Error("FileReader error"));
    fr.readAsDataURL(file);
  });
}
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = () => reject(fr.error || new Error("FileReader error"));
    fr.readAsDataURL(blob);
  });
}
const isBlobUrl = (s?: string) => !!s && typeof s === "string" && s.startsWith("blob:");
const isDataUrl = (s?: string) => !!s && typeof s === "string" && s.startsWith("data:");

type Props = {
  draft: QuoteItem;
  editingId: string | null;
  onChange: (next: QuoteItem) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function ItemModal({ draft, editingId, onChange, onCancel, onSave }: Props) {
  const entry = registry[draft.kind];
  if (!entry) {
    console.error("Registry entry non trovato per kind:", draft?.kind);
    return null;
  }

  const isWindowWithGrid =
    (draft.kind === "finestra" || draft.kind === "portafinestra" || draft.kind === "scorrevole") &&
    (draft as any)?.options?.gridWindow;

  // Sorgente fallback per preview non-finestra
  const legacyPreviewSrc =
    (draft as any)?.__previewUrl || (draft as any)?.image_url || entry?.icon || "";

  const Title = editingId ? `Modifica ${entry.label}` : `Nuova ${entry.label}`;
  const Form = (draft.kind === "custom" ? CustomForm : entry.Form) as any;

  function handlePickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const localUrl = URL.createObjectURL(f);
    fileToDataUrl(f)
      .then((dataUrl) => {
        onChange({ ...(draft as any), __pickedFile: f, __previewUrl: localUrl, image_url: dataUrl });
      })
      .catch(() => {
        // fallback: almeno l'anteprima locale
        onChange({ ...(draft as any), __pickedFile: f, __previewUrl: localUrl });
      });
  }

  // ---------------------------
  // AUTO-RIGENERAZIONE PNG (dataURL) quando cambia la griglia
  // ---------------------------
  const grid = (draft as any)?.options?.gridWindow;
  const gridKey = useMemo(() => {
    try {
      return JSON.stringify(grid);
    } catch {
      return "";
    }
  }, [grid]);
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    if (!isWindowWithGrid || !grid) return;

    // Evita rigenerazioni inutili
    if (gridKey && gridKey === lastKeyRef.current) return;
    lastKeyRef.current = gridKey;

    // Se non abbiamo ancora un'immagine valida (o è blob:), rigenera
    const currentUrl = (draft as any).image_url as string | undefined;
    const needs = !currentUrl || isBlobUrl(currentUrl) || !isDataUrl(currentUrl);

    // Anche se esiste un dataURL, rigenero quando la griglia cambia (così è sempre coerente)
    (async () => {
      try {
        const blob = await gridWindowToPngBlob(grid, 640, 640);
        const file = blobToFile(blob, `window-${draft.id || crypto.randomUUID()}.png`, "image/png");
        const dataUrl = await blobToDataUrl(blob);

        onChange({
          ...(draft as any),
          // Salvo sia dataURL (per PDF) che File (eventuale upload futuro)
          __pickedFile: needs ? file : (draft as any).__pickedFile,
          __previewUrl: dataUrl,
          image_url: dataUrl, // <<— PDF leggerà questo
        });
      } catch (e) {
        console.warn("Rigenerazione PNG da griglia fallita", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWindowWithGrid, gridKey]); // dipende solo dal “key” della griglia

  async function handleSave() {
    // Se è finestra ma non c'è ancora image_url (edge case), crea ora
    if (isWindowWithGrid && !isDataUrl((draft as any).image_url)) {
      try {
        const blob = await gridWindowToPngBlob(grid, 640, 640);
        const file = blobToFile(blob, `window-${draft.id || crypto.randomUUID()}.png`, "image/png");
        const dataUrl = await blobToDataUrl(blob);
        onChange({ ...(draft as any), __pickedFile: file, __previewUrl: dataUrl, image_url: dataUrl });
      } catch (e) {
        console.warn("Auto-generazione PNG al salvataggio fallita", e);
      }
    }
    onSave();
  }

  // Aspect ratio dinamico per il contenitore anteprima
  const aspectRatio = isWindowWithGrid
    ? `${(draft as any).width_mm || 1} / ${(draft as any).height_mm || 1}`
    : "1 / 1";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="absolute inset-0 flex items-start md:items-center justify-center p-4">
        <div className="w-full max-w-[640px] card p-4 overflow-auto max-h-[90vh]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{Title}</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onCancel}>
                Annulla
              </Button>
              <Button onClick={handleSave}>{editingId ? "Salva" : "Aggiungi"}</Button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* PANNELLO SINISTRO: anteprima live */}
            <div className="w-full h-full flex items-center justify-center p-2">
              <div
                className="relative w-full rounded border bg-white flex items-center justify-center overflow-hidden"
                style={{ aspectRatio }}
              >
                {isWindowWithGrid ? (
                  <WindowSvg cfg={(draft as any).options.gridWindow} />
                ) : legacyPreviewSrc ? (
                  <img
                    key={legacyPreviewSrc}
                    src={legacyPreviewSrc}
                    alt={entry?.label || "Anteprima"}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-sm text-gray-400">Nessuna immagine</div>
                )}

                {/* Quote (per non-finestra; le finestre le disegna WindowSvg) */}
                {!isWindowWithGrid && typeof (draft as any).width_mm === "number" && (
                  <div className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-gray-700 bg-white/70 px-1 rounded">
                    L {(draft as any).width_mm} mm
                  </div>
                )}
                {!isWindowWithGrid && typeof (draft as any).height_mm === "number" && (
                  <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 -rotate-90 origin-center text-[10px] text-gray-700 bg-white/70 px-1 rounded">
                    H {(draft as any).height_mm} mm
                  </div>
                )}

                {!isWindowWithGrid && (
                  <div className="absolute bottom-2 right-2">
                    <label className="inline-flex items-center justify-center h-8 px-2 rounded border bg-white text-xs cursor-pointer hover:bg-gray-50">
                      Carica
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handlePickImage}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Form a destra */}
            {Form ? <Form draft={draft as any} onChange={onChange as any} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}