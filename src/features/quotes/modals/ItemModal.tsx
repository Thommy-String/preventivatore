import { useMemo } from "react";
import { Button } from "../../../components/ui/Button";
import { registry } from "../registry";
import type { QuoteItem } from "../types";
import CustomForm from "../forms/CustomForm";
import type { CustomField } from "../types";
import { gridWindowToPngBlob } from "../svg/windowToPng";
import { cassonettoToPngBlob } from "../cassonetto/cassonettoToPng";
import WindowSvg from "../window/WindowSvg";
import CassonettoSvg from "../cassonetto/CassonettoSvg";

// Helper per convertire Blob in data URL, utile per le immagini nel PDF
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = () => reject(fr.error || new Error("FileReader error"));
    fr.readAsDataURL(blob);
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = () => reject(fr.error || new Error("FileReader error"));
    fr.readAsDataURL(file);
  });
}

// — Reusable inline section: custom fields for ALL item kinds —
function CustomFieldsSection({ draft, onChange }: { draft: any; onChange: (next: any) => void }) {
  const details: CustomField[] = Array.isArray(draft?.custom_fields) ? (draft.custom_fields as any) : [];

  const update = (nextArr: CustomField[]) => {
    onChange({ ...(draft as any), custom_fields: nextArr } as any);
  };

  const updateRow = (idx: number, patch: Partial<CustomField>) => {
    const next = details.slice();
    next[idx] = { ...next[idx], ...patch } as CustomField;
    update(next);
  };

  const addRow = () => {
    update([
      ...details,
      { key: (crypto as any).randomUUID?.() || String(Date.now() + Math.random()), name: "", value: "" } as any,
    ]);
  };

  const removeRow = (idx: number) => {
    const next = details.slice();
    next.splice(idx, 1);
    update(next);
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-600">Dettagli aggiuntivi</div>
        <button type="button" className="btn btn-sm" onClick={addRow}>+ Aggiungi campo</button>
      </div>

      {details.length === 0 ? (
        <div className="rounded border border-dashed p-4 text-sm text-gray-500">
          Nessun campo. Premi “+ Aggiungi campo”.
        </div>
      ) : (
        <div className="space-y-2">
          {details.map((f, idx) => (
            <div key={(f as any).key ?? idx} className="grid grid-cols-[1fr_1fr_40px] gap-2 items-center">
              <input
                className="input"
                placeholder="Titolo (es. Colore maniglia)"
                value={typeof (f as any).name === "string" && (f as any).name ? (f as any).name : (typeof (f as any).label === "string" ? (f as any).label : "")}
                onChange={(e) => updateRow(idx, { name: e.target.value } as any)}
              />
              <input
                className="input"
                placeholder="Valore (es. Nero opaco)"
                value={typeof (f as any).value === "string" ? (f as any).value : ""}
                onChange={(e) => updateRow(idx, { value: e.target.value } as any)}
              />
              <button
                type="button"
                className="h-9 w-9 inline-flex items-center justify-center rounded-md border bg-white hover:bg-gray-50"
                onClick={() => removeRow(idx)}
                aria-label="Rimuovi"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Crea una cfg cassonetto di fallback dai campi della voce
function buildCassonettoCfgFromDraft(d: any) {
  const opt = (d?.options?.cassonetto ?? {}) as any;
  // supporta alias: celino_mm / extension_mm / spalletta_mm
  const celino =
    typeof opt.celino_mm === "number" ? opt.celino_mm :
    typeof d?.celino_mm === "number" ? d.celino_mm :
    typeof d?.extension_mm === "number" ? d.extension_mm :
    typeof d?.spalletta_mm === "number" ? d.spalletta_mm :
    null;

  return {
    width_mm: Number(opt.width_mm ?? d?.width_mm) || 1000,
    height_mm: Number(opt.height_mm ?? d?.height_mm) || 600,
    depth_mm: Number(opt.depth_mm ?? d?.depth_mm) || 200,
    celino_mm: celino,
    color: opt.color ?? d?.color ?? null,
    showDims: true,
  };
}

type Props = {
  draft: QuoteItem;
  editingId: string | null;
  onChange: (next: QuoteItem) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function ItemModal({ draft, editingId, onChange, onCancel, onSave }: Props) {
  const entry = registry[draft.kind];
  if (!entry) return null;

  // --- Riconoscimento del tipo di prodotto ---
  const isWindow = useMemo(
    () => draft.kind === "finestra" && Boolean((draft as any)?.options?.gridWindow),
    [draft.kind, (draft as any)?.options?.gridWindow]
  );
  const isCassonetto = useMemo(() => draft.kind === "cassonetto", [draft.kind]);

  // Sorgente legacy per gli altri prodotti
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
        onChange({ ...(draft as any), __previewUrl: localUrl, image_url: dataUrl });
      })
      .catch(() => {
        onChange({ ...(draft as any), __previewUrl: localUrl });
      });
  }

  // --- SALVATAGGIO CON GENERAZIONE PNG SOLO AL CLICK ---
  async function handleSave() {
    let finalDraft = { ...draft };

    try {
      let blob: Blob | null = null;

      if (isWindow) {
        const grid = (finalDraft as any).options.gridWindow;
        blob = await gridWindowToPngBlob(grid, 900, 900);
      } else if (isCassonetto) {
        const cfg = (finalDraft as any)?.options?.cassonetto ?? buildCassonettoCfgFromDraft(finalDraft);
        const blobCass = await cassonettoToPngBlob(cfg, 900, 900);
        const dataUrlCass = await blobToDataUrl(blobCass);
        finalDraft = {
          ...(finalDraft as any),
          options: { ...(finalDraft as any).options, cassonetto: cfg },
          __previewUrl: dataUrlCass,
          image_url: dataUrlCass,
        } as QuoteItem;
      }

      if (blob) {
        const dataUrl = await blobToDataUrl(blob);
        finalDraft = {
          ...(finalDraft as any),
          __previewUrl: dataUrl,
          image_url: dataUrl, // PDF-friendly (niente blob:)
        } as QuoteItem;
        onChange(finalDraft);
      }
    } catch (e) {
      console.warn("Generazione PNG al salvataggio fallita", e);
    }

    onSave();
  }

  // Calcolo dell'Aspect Ratio per il contenitore dell'anteprima
  const aspectRatio = useMemo(() => {
    if (isWindow) {
      return `${(draft as any).width_mm || 1} / ${(draft as any).height_mm || 1}`;
    }
    if (isCassonetto) {
      const cfg =
        (draft as any)?.options?.cassonetto ?? buildCassonettoCfgFromDraft(draft);
      return `${cfg.width_mm || 2} / ${cfg.height_mm || 1}`;
    }
    return "1 / 1";
  }, [isWindow, isCassonetto, draft]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="absolute inset-0 flex items-start md:items-center justify-center p-4">
        <div className="w-full max-w-[640px] card p-4 overflow-auto max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{Title}</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onCancel}>Annulla</Button>
              <Button onClick={handleSave}>{editingId ? "Salva" : "Aggiungi"}</Button>
            </div>
          </div>

          {/* Body */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Anteprima */}
            <div className="w-full h-full flex items-center justify-center p-2">
              <div
                className="relative w-full rounded border bg-white flex items-center justify-center overflow-hidden"
                style={{ aspectRatio }}
              >
                {isWindow ? (
                  <WindowSvg cfg={(draft as any).options.gridWindow} />
                ) : isCassonetto ? (
                  (typeof (draft as any)?.image_url === 'string' && (draft as any).image_url.startsWith('data:')) ? (
                    <img src={(draft as any).image_url} alt={entry?.label || 'Anteprima'} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <CassonettoSvg cfg={(draft as any)?.options?.cassonetto ?? buildCassonettoCfgFromDraft(draft)} />
                  )
                ) : legacyPreviewSrc ? (
                  <img key={legacyPreviewSrc} src={legacyPreviewSrc} alt={entry?.label || 'Anteprima'} className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className="text-sm text-gray-400">Nessuna immagine</div>
                )}

                {!isWindow && !isCassonetto && (
                  <div className="absolute bottom-2 right-2">
                    <label className="inline-flex items-center justify-center h-8 px-2 rounded border bg-white text-xs cursor-pointer hover:bg-gray-50">
                      Carica
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handlePickImage} />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Form and Custom Fields */}
            <div className="space-y-4">
              {Form ? <Form draft={draft as any} onChange={onChange as any} /> : null}
              {/* Shared custom fields for every kind */}
              <CustomFieldsSection draft={draft as any} onChange={onChange as any} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
