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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Avoid iOS zoom on focus: >=16px on mobile
  const mobileInputCls = "input text-base sm:text-sm";

  const ensurePO = () => po ?? { imageUrl: null, features: [] as Feature[] };

  // Apply a preset replacing everything (image + features)
  function applyPresetReplace(preset: { imageUrl: string | null; features: Feature[] }) {
    const cloned: { imageUrl: string | null; features: Feature[] } = {
      imageUrl: preset.imageUrl ?? null,
      features: (preset.features || []).map((f) => ({ ...f, id: rid() })),
    };
    setPO?.(cloned);
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

      {open && (
        <>
      {/* Preset library — minimal carousel */}
      <div className="mt-4">
        <h3 className="font-medium mb-2">Modelli rapidi</h3>

        <div className="relative">
          {/* Horizontal scroll, snap, minimal cards */}
          <div
            className="
              flex gap-3 overflow-x-auto pb-2
              snap-x snap-mandatory
              -mx-1 px-1
            "
          >
            {/* "Nessuna" card (clears overview) */}
            <button
              type="button"
              onClick={() => { setPO?.(null); setOpen(false); }}
              className="
                snap-start shrink-0 w-40 rounded-lg border bg-white
                hover:shadow-sm transition text-left
                focus:outline-none focus:ring-2 focus:ring-emerald-500/40
              "
              title="Nessuna"
            >
              <div className="h-24 w-full bg-white flex items-center justify-center p-2 border-b">
                <div className="h-full w-full bg-[repeating-linear-gradient(45deg,#f3f4f6,#f3f4f6_6px,#ffffff_6px,#ffffff_12px)] rounded-md" />
              </div>
              <div className="px-2 py-2">
                <div className="text-xs font-semibold truncate">Nessuna</div>
              </div>
            </button>

            {/* Preset cards */}
            {PROFILE_OVERVIEW_PRESETS.map((p) => {
              const img = (p.imageUrl as string) || "";
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPresetReplace(p as any)}
                  className="
                    snap-start shrink-0 w-40 rounded-lg border bg-white
                    hover:shadow-sm transition text-left
                    focus:outline-none focus:ring-2 focus:ring-emerald-500/40
                  "
                  title={p.label}
                >
                  <div className="h-24 w-full bg-white flex items-center justify-center p-2 border-b">
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
                  <div className="px-2 py-2">
                    <div className="text-xs font-semibold truncate">{p.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
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
      <div className="mt-6">
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

        <div className="mt-2 space-y-4">
          {features.map((f, idx) => (
            <div key={f.id} className="rounded-lg border p-3 bg-gray-50/50">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500">Voce #{idx + 1}</div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => moveFeatureLocal(f.id, -1)}
                    title="Sposta su"
                  >
                    ↑
                  </button>
                  <button
                    className="text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => moveFeatureLocal(f.id, 1)}
                    title="Sposta giù"
                  >
                    ↓
                  </button>
                  <button
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => removeFeatureLocal(f.id)}
                    title="Rimuovi voce"
                  >
                    Rimuovi
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Eyebrow</div>
                  <input
                    className={mobileInputCls}
                    placeholder="Profondità telaio"
                    value={f.eyebrow}
                    onChange={(e) => updateFeature(f.id, "eyebrow", e.target.value)}
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Titolo</div>
                  <input
                    className="input font-bold text-lg"
                    placeholder="77 mm"
                    value={f.title}
                    onChange={(e) => updateFeature(f.id, "title", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-3">
                  <div className="text-xs text-gray-500 mb-1">Descrizione</div>
                  <textarea
                    className={mobileInputCls + " min-h-[84px] resize-y"}
                    placeholder="Breve descrizione della caratteristica..."
                    value={f.description}
                    onChange={(e) => updateFeature(f.id, "description", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anteprima impaginata stile “Apple” */}
      {features.length > 0 && (
        <div className="mt-8">
          <h3 className="font-medium mb-2">Anteprima</h3>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Anteprima sezione"
              className="rounded-md border bg-white w-full max-h-64 object-contain mb-4"
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
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
