import { useMemo } from "react";
import { Button } from "../../../components/ui/Button";
import { registry } from "../registry";
import type { QuoteItem } from "../types";
import CustomForm from "../forms/CustomForm";
import type { CustomField } from "../types";
import { gridWindowToPngBlob } from "../svg/windowToPng";
import { cassonettoToPngBlob } from "../cassonetto/cassonettoToPng";
import { persianaToPngBlob } from "../persiana/persianaToPng";
import { tapparellaToPngBlob } from "../tapparella/tapparellaToPng";
import WindowSvg from "../window/WindowSvg";
import CassonettoSvg from "../cassonetto/CassonettoSvg";
import PersianaSvg from "../persiana/PersianaSvg";
import TapparellaSvg from "../tapparella/TapparellaSvg";
import { PortaBlindataSvg } from "../porta-blindata/PortaBlindataSvg";
import { portaBlindataToPngBlob } from "../porta-blindata/portaBlindataToPng";
import { PortaInternaSvg } from "../porta-interna/PortaInternaSvg";
import { portaInternaToPngBlob } from "../porta-interna/portaInternaToPng";

// Helper per convertire Blob in data URL, utile per le immagini nel PDF
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = () => reject(fr.error || new Error("FileReader error"));
    fr.readAsDataURL(blob);
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
    color: d?.options?.previewColor || opt.color || d?.color || null,
    showDims: true,
  };
}

type Props = {
  draft: QuoteItem;
  editingId: string | null;
  onChange: (next: QuoteItem) => void;
  onCancel: () => void;
  onSave: (nextDraft?: QuoteItem) => void;
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
  const isPersiana = useMemo(() => draft.kind === "persiana", [draft.kind]);
  const isTapparella = useMemo(() => draft.kind === "tapparella", [draft.kind]);
  const isPortaBlindata = useMemo(() => draft.kind === "porta_blindata", [draft.kind]);
  const isPortaInterna = useMemo(() => draft.kind === "porta_interna", [draft.kind]);

  // Sorgente legacy per gli altri prodotti
  const legacyPreviewSrc =
    (draft as any)?.__previewUrl || (draft as any)?.image_url || entry?.icon || "";
  // referenced to avoid unused-local TS errors
  void legacyPreviewSrc;

  const Title = editingId ? `Modifica ${entry.label}` : `Nuova ${entry.label}`;
  const Form = (draft.kind === "custom" ? CustomForm : entry.Form) as any;

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
      } else if (isPersiana) {
        const cfg = {
          width_mm: Number((finalDraft as any)?.width_mm) || 1000,
          height_mm: Number((finalDraft as any)?.height_mm) || 1400,
          ante: Number((finalDraft as any)?.ante) || 2,
          color: (finalDraft as any)?.options?.previewColor || null,
        };
        const blobPers = await persianaToPngBlob(cfg, 900, 900);
        const dataUrlPers = await blobToDataUrl(blobPers);
        finalDraft = {
          ...(finalDraft as any),
          __previewUrl: dataUrlPers,
          image_url: dataUrlPers,
        } as QuoteItem;
      } else if (isTapparella) {
        const cfg = {
          width_mm: Number((finalDraft as any)?.width_mm) || 1000,
          height_mm: Number((finalDraft as any)?.height_mm) || 1400,
          color: (finalDraft as any)?.options?.previewColor || (finalDraft as any)?.color || null,
        };
        const blobTap = await tapparellaToPngBlob(cfg, 900, 900);
        const dataUrlTap = await blobToDataUrl(blobTap);
        finalDraft = {
          ...(finalDraft as any),
          __previewUrl: dataUrlTap,
          image_url: dataUrlTap,
        } as QuoteItem;
      } else if (isPortaBlindata) {
         const blobDoor = await portaBlindataToPngBlob(finalDraft as any, 900, 900);
         const dataUrlDoor = await blobToDataUrl(blobDoor);
         finalDraft = {
           ...(finalDraft as any),
           __previewUrl: dataUrlDoor,
           image_url: dataUrlDoor,
           __needsUpload: true,
         } as QuoteItem;
      } else if (isPortaInterna) {
         try {
           console.debug('Generazione PNG porta interna: start', finalDraft?.width_mm, finalDraft?.height_mm)
           blob = await portaInternaToPngBlob(finalDraft as any);
           console.debug('Generazione PNG porta interna: blob ottenuto', !!blob)
         } catch (e) {
           console.warn('Generazione PNG porta interna fallita', e);
         }
      }

      if (blob) {
        const dataUrl = await blobToDataUrl(blob);
        finalDraft = {
          ...(finalDraft as any),
          __previewUrl: dataUrl,
          image_url: dataUrl, // PDF-friendly (niente blob:)
          __needsUpload: true,
        } as QuoteItem;
      }

    } catch (e) {
      console.warn("Generazione PNG al salvataggio fallita", e);
    }

    // Passiamo il finalDraft direttamente a save per evitare race condition setState -> save
    onSave(finalDraft);
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
    if (isPersiana) {
      return `${(draft as any).width_mm || 2} / ${(draft as any).height_mm || 1}`;
    }
    if (isTapparella) {
      return `${(draft as any).width_mm || 2} / ${(draft as any).height_mm || 1}`;
    }
    if (isPortaBlindata) {
      return `${(draft as any).width_mm || 900} / ${(draft as any).height_mm || 2100}`;
    }
    return "1 / 1";
  }, [isWindow, isCassonetto, isPersiana, isTapparella, isPortaBlindata, draft]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="absolute inset-0 flex items-start md:items-center justify-center p-4">
        <div className="w-full max-w-5xl card p-4 overflow-auto max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{Title}</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onCancel}>Annulla</Button>
              <Button onClick={handleSave}>{editingId ? "Salva" : "Aggiungi"}</Button>
            </div>
          </div>

          {/* Body */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 transition-all">
            {/* Anteprima sempre a sinistra */}
            <div className="order-1 md:order-1 w-full flex items-center justify-center p-2 bg-gray-50 rounded border">
              <div
                className="relative w-full flex items-center justify-center overflow-hidden max-h-[70vh] min-h-[400px]"
                style={{ aspectRatio }}
              >
                {isWindow ? (
                  <WindowSvg cfg={(draft as any).options.gridWindow} stroke={(draft as any).options?.gridWindow?.frame_color ?? (draft as any).color ?? '#222'} />
                ) : isCassonetto ? (
                  (typeof (draft as any)?.image_url === 'string' && (draft as any).image_url.startsWith('data:')) ? (
                    <img src={(draft as any).image_url} alt={entry?.label || 'Anteprima'} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <CassonettoSvg cfg={(draft as any)?.options?.cassonetto ?? buildCassonettoCfgFromDraft(draft)} />
                  )
                ) : isPersiana ? (
                  <PersianaSvg
                    cfg={{
                      width_mm: Number((draft as any).width_mm) || 1000,
                      height_mm: Number((draft as any).height_mm) || 1400,
                      ante: Number((draft as any).ante) || 2,
                      color: (draft as any).options?.previewColor || null,
                    }}
                  />
                ) : isPortaBlindata ? (
                  <PortaBlindataSvg
                    width_mm={Number((draft as any).width_mm) || 900}
                    height_mm={Number((draft as any).height_mm) || 2100}
                    color={(draft as any).options?.previewColor || (draft as any).color}
                    serratura={(draft as any).serratura}
                    spioncino={(draft as any).spioncino}
                    handle_position={(draft as any).handle_position}
                    handle_color={(draft as any).options?.handleColor}
                  />
                ) : isPortaInterna ? (
                  <PortaInternaSvg item={draft as any} handle_color={(draft as any).options?.handleColor} />
                ) : isTapparella ? (
                  <TapparellaSvg
                    cfg={{
                      width_mm: Number((draft as any).width_mm) || 1000,
                      height_mm: Number((draft as any).height_mm) || 1400,
                      color: (draft as any).options?.previewColor || (draft as any).color || null,
                    }}
                  />
                ) : null}
              </div>
            </div>

            {/* Form and Custom Fields */}
            <div className="order-2 md:order-2 space-y-4">
              {Form ? <Form draft={draft as any} onChange={onChange as any} /> : null}
              {/* Shared custom fields for every kind tranne le voci custom, porta blindata e porta interna */}
              {draft.kind !== "custom" && draft.kind !== "porta_blindata" && draft.kind !== "porta_interna" ? (
                <CustomFieldsSection draft={draft as any} onChange={onChange as any} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
