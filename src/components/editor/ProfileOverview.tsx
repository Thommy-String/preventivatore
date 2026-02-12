// src/components/editor/ProfileOverview.tsx
import { useRef, useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { useQuoteStore } from "../../stores/useQuoteStore";
import { uploadQuoteItemImage } from "../../lib/uploadImages";
import { PROFILE_OVERVIEW_PRESETS } from "./presets/profileOverviewPresets";

type Feature = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
};

// Robust ID generator (no SSR issues)
const rid = () =>
  (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
    ? (crypto as any).randomUUID()
    : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)

function classNames(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

export function ProfileOverview() {
  const [open, setOpen] = useState(false); // collapsed by default
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null);
  const [selectedGlazing, setSelectedGlazing] = useState<'doppio' | 'triplo' | null>(null);
  // ---- Store bindings ----
  const po = useQuoteStore((s) => s.profileOverview);
  const setPO = useQuoteStore((s) => s.setProfileOverview);
  const addPOFeature = useQuoteStore((s) => s.addPOFeature);
  const updatePOFeature = useQuoteStore((s) => s.updatePOFeature);
  const removePOFeature = useQuoteStore((s) => s.removePOFeature);
  const movePOFeature = useQuoteStore((s) => s.movePOFeature);

  const quoteId = useQuoteStore((s) => (s as any)?.quote?.id) || "profile-overview";

  const imageUrl = po?.imageUrl ?? null;
  const features: Feature[] = (po?.features as Feature[] | undefined) ?? [];
  const selectedPreset = selectedPresetKey
    ? PROFILE_OVERVIEW_PRESETS.find((p) => p.key === selectedPresetKey)
    : null;
  const glazingLabel = selectedGlazing === 'doppio'
    ? 'Doppio vetro'
    : selectedGlazing === 'triplo'
      ? 'Triplo vetro'
      : null;
  const storedLabel = po?.label ?? null;
  const storedGlazing = po?.glazing ?? null;
  const summaryLabel = storedLabel || selectedPreset?.label || 'Profilo personalizzato';
  const summaryGlazing = storedGlazing || glazingLabel || null;
  const hasSummary = Boolean(imageUrl || storedLabel || storedGlazing || selectedPreset || glazingLabel);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const ensurePO = () => po ?? { imageUrl: null, features: [] as Feature[], label: null, glazing: null };

  function resolvePresetImage(
    preset: { imageUrl: string | null; imageUrlDouble?: string | null; imageUrlTriple?: string | null },
    glazing: 'doppio' | 'triplo'
  ) {
    if (glazing === 'doppio') return preset.imageUrlDouble ?? preset.imageUrl ?? null;
    return preset.imageUrlTriple ?? preset.imageUrl ?? null;
  }

  function applyPresetWithGlazing(
    preset: { imageUrl: string | null; imageUrlDouble?: string | null; imageUrlTriple?: string | null; features: Feature[] },
    glazing: 'doppio' | 'triplo'
  ) {
    const baseFeatures = (preset.features || []).map((f) => ({ ...f, id: rid() }));
    const filtered = baseFeatures.filter((f) => {
      const e = String(f.eyebrow || '').toLowerCase();
      const t = String(f.title || '').toLowerCase();
      return !(e.includes('vetro') || t.includes('vetro'));
    });

    const img = resolvePresetImage(preset, glazing);
    const glazingName = glazing === 'doppio' ? 'Doppio vetro' : 'Triplo vetro';
    setPO?.({ imageUrl: img, features: filtered, label: preset.label, glazing: glazingName });
    setSelectedPresetKey((preset as any)?.key ?? null);
    setSelectedGlazing(glazing);
  }

  const addFeature = () => {
    const f: Feature = {
      id: rid(),
      eyebrow: "",
      title: "",
      description: "",
    };
    if (addPOFeature) {
      addPOFeature(f);
    } else {
      const next = ensurePO();
      setPO?.({ ...next, features: [...features, f] });
    }
  };

  const updateFeature = (id: string, field: keyof Feature, value: string) => {
    if (updatePOFeature) {
      updatePOFeature(id, { [field]: value } as Partial<Feature>);
    } else {
      const next = ensurePO();
      setPO?.({
        ...next,
        features: features.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
      });
    }
  };

  const removeFeatureLocal = (id: string) => {
    if (removePOFeature) {
      removePOFeature(id);
    } else {
      const next = ensurePO();
      setPO?.({ ...next, features: features.filter((f) => f.id !== id) });
    }
  };

  const moveFeatureLocal = (id: string, dir: -1 | 1) => {
    if (movePOFeature) {
      movePOFeature(id, dir);
      return;
    }
    const i = features.findIndex((f) => f.id === id);
    if (i === -1) return;
    const j = i + dir;
    if (j < 0 || j >= features.length) return;
    const nextArr = [...features];
    const [item] = nextArr.splice(i, 1);
    nextArr.splice(j, 0, item);
    const next = ensurePO();
    setPO?.({ ...next, features: nextArr });
  };

  const setImageUrlSafe = (url: string | null) => {
    const next = ensurePO();
    setPO?.({ ...next, imageUrl: url });
  };

  const onPickImage = async (file: File) => {
    try {
      // Upload nel bucket corretto; path: <quoteId>/<uuid>.ext
      const url = await uploadQuoteItemImage(file, String(quoteId));
      if (url) {
        setImageUrlSafe(url);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      // Fallback: anteprima locale (non persistente) se l'upload non restituisce URL
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageUrlSafe(String(ev.target?.result || ""));
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    } catch {
      // Fallback in caso di errore upload
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageUrlSafe(String(ev.target?.result || ""));
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="w-full md:col-span-2">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 group"
        aria-expanded={open}
      >
        <div className="text-left">
          <h2 className="text-lg font-semibold">Panoramica profilo</h2>
          <p className="text-sm text-gray-600">
            Aggiungi un’immagine e le caratteristiche del sistema. Le voci saranno
            impaginate automaticamente a due colonne.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 hidden sm:inline">
            {features.length > 0 ? `${features.length} caratteristiche` : 'Nessuna caratteristica'}
          </span>
          <span
            className={`inline-block transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            aria-hidden
          >
            ▾
          </span>
        </div>
      </button>

      {!open && hasSummary && (
        <div className="mt-3 rounded-lg border bg-white/60 p-3 flex items-center gap-3">
          <div className="h-12 w-16 shrink-0 rounded-md border bg-white flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt="Profilo selezionato" className="h-full w-full object-contain" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-gray-50 to-gray-100" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">
              {summaryLabel}
            </div>
            {summaryGlazing && (
              <div className="text-xs text-gray-500">{summaryGlazing}</div>
            )}
          </div>
        </div>
      )}

      {open && (
        <>
      {/* Preset library — compact grid */}
        <div className="mt-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-semibold text-base">Modelli rapidi</h3>
            <p className="text-xs text-gray-500">Scegli un profilo e il vetro: l’immagine si aggiorna subito.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const base = { imageUrl: null, features: [{ id: rid(), eyebrow: '', title: '', description: '' }], label: 'Profilo personalizzato', glazing: null };
              setPO?.(base as any);
            }}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:border-emerald-300 hover:bg-emerald-50 transition"
          >
            <span className="text-sm">＋</span> Nuovo modello
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* "Nessuna" card (clears overview) */}
          <button
            type="button"
            onClick={() => { setPO?.(null); setOpen(false); setSelectedPresetKey(null); setSelectedGlazing(null); }}
            className="group rounded-xl border bg-white hover:shadow-md transition text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            title="Nessuna"
          >
            <div className="h-24 w-full bg-white flex items-center justify-center p-3 border-b rounded-t-xl">
              <div className="h-full w-full bg-[repeating-linear-gradient(45deg,#f3f4f6,#f3f4f6_6px,#ffffff_6px,#ffffff_12px)] rounded-lg" />
            </div>
            <div className="px-3 py-3">
              <div className="text-xs font-semibold truncate">Nessuna</div>
              <div className="mt-1 text-[11px] text-gray-500">Svuota sezione</div>
            </div>
          </button>

          {/* Preset cards */}
          {PROFILE_OVERVIEW_PRESETS.map((p) => {
            const img = (p.imageUrl as string) || "";
            return (
              <div
                key={p.key}
                className={
                  "group rounded-xl border bg-white hover:shadow-md transition text-left focus-within:ring-2 focus-within:ring-emerald-500/40 " +
                  (selectedPresetKey === p.key ? "border-emerald-500 ring-1 ring-emerald-300/70" : "")
                }
              >
                <div className="h-24 w-full bg-white flex items-center justify-center p-3 border-b rounded-t-xl">
                  {img ? (
                    <img
                      src={img}
                      alt={p.label}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-gray-50 to-gray-100" />
                  )}
                </div>
                <div className="px-3 py-3">
                  <div className="text-xs font-semibold truncate">{p.label}</div>
                  <div className="mt-1 text-[11px] text-gray-500">Seleziona vetro</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => applyPresetWithGlazing(p as any, 'doppio')}
                      className={
                        "text-[11px] font-semibold rounded-lg border px-2 py-1.5 transition " +
                        (selectedPresetKey === p.key && selectedGlazing === 'doppio'
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "hover:bg-emerald-50 hover:border-emerald-300")
                      }
                      title="Doppio vetro"
                    >
                      2x vetro
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetWithGlazing(p as any, 'triplo')}
                      className={
                        "text-[11px] font-semibold rounded-lg border px-2 py-1.5 transition " +
                        (selectedPresetKey === p.key && selectedGlazing === 'triplo'
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "hover:bg-emerald-50 hover:border-emerald-300")
                      }
                      title="Triplo vetro"
                    >
                      3x vetro
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Immagine (hero) */}
      <div className="mt-4">
        <div className="text-xs text-gray-500 mb-1">Immagine superiore</div>

        {!imageUrl ? (
          <div
            className={classNames(
              "border border-dashed rounded-lg p-6 text-center",
              "text-gray-500 bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
            )}
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) onPickImage(file);
            }}
          >
            <div className="text-[15px] sm:text-sm">Trascina un’immagine qui o clicca per caricarla</div>
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onPickImage(file);
              }}
            />
          </div>
        ) : (
          <div className="relative">
            <img
              src={imageUrl}
              alt="Anteprima"
              className="rounded-lg border shadow-sm max-h-60 w-full object-contain bg-white"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
                Sostituisci
              </Button>
              <Button variant="ghost" onClick={() => setImageUrlSafe(null)}>
                Rimuovi
              </Button>
              <span className="hidden sm:inline h-4 w-px bg-gray-300" />
              <span className="text-xs text-gray-500">PNG / JPG consigliati · max 4–6MB</span>
              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onPickImage(file);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Editor caratteristiche */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Caratteristiche</h3>
          <div className="sm:hidden">
            <Button variant="ghost" onClick={addFeature}>
              + Aggiungi
            </Button>
          </div>
        </div>

        {features.length === 0 && (
          <div className="text-sm text-gray-500 mt-2">
            Nessuna caratteristica aggiunta. Clicca “Aggiungi” per iniziare.
          </div>
        )}

        <div className="mt-2 space-y-1.5">
          {features.map((f, idx) => (
            <div key={f.id} className="rounded-md border p-1.5 bg-gray-50/50">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-500">Voce #{idx + 1}</div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-[11px] text-gray-500 hover:text-gray-700"
                    onClick={() => moveFeatureLocal(f.id, -1)}
                    title="Sposta su"
                  >
                    ↑
                  </button>
                  <button
                    className="text-[11px] text-gray-500 hover:text-gray-700"
                    onClick={() => moveFeatureLocal(f.id, 1)}
                    title="Sposta giù"
                  >
                    ↓
                  </button>
                  <button
                    className="text-[11px] text-red-600 hover:underline"
                    onClick={() => removeFeatureLocal(f.id)}
                    title="Rimuovi voce"
                  >
                    Rimuovi
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_2fr] gap-2 items-center">
                <label className="sr-only" htmlFor={`po-eyebrow-${f.id}`}>Eyebrow</label>
                <input
                  id={`po-eyebrow-${f.id}`}
                  className="input text-sm"
                  placeholder="Eyebrow"
                  value={f.eyebrow}
                  onChange={(e) => updateFeature(f.id, "eyebrow", e.target.value)}
                />
                <label className="sr-only" htmlFor={`po-title-${f.id}`}>Titolo</label>
                <input
                  id={`po-title-${f.id}`}
                  className="input text-sm font-semibold"
                  placeholder="Titolo"
                  value={f.title}
                  onChange={(e) => updateFeature(f.id, "title", e.target.value)}
                />
                <label className="sr-only" htmlFor={`po-desc-${f.id}`}>Descrizione</label>
                <textarea
                  id={`po-desc-${f.id}`}
                  className="input text-sm h-9 resize-none"
                  placeholder="Descrizione breve"
                  value={f.description}
                  onChange={(e) => updateFeature(f.id, "description", e.target.value)}
                  rows={1}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anteprima impaginata stile “Apple” */}
      {features.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">Anteprima</h3>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Anteprima sezione"
              className="rounded-md border bg-white w-full max-h-40 object-contain mb-3"
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {features.map((f) => (
              <div key={`preview-${f.id}`} className="pb-4">
                {f.eyebrow && (
                  <div className="text-[12px] text-gray-500 mb-1">
                    {f.eyebrow}
                  </div>
                )}
                {f.title && (
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                    {f.title}
                  </div>
                )}
                {f.description && (
                  <div className="text-gray-600 leading-snug text-[14px]">
                    {f.description}
                  </div>
                )}
                <div className="h-[2px] bg-emerald-500 mt-4" />
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </Card>
  );
}
