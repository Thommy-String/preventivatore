import { Button } from "../../../components/ui/Button"
import { Copy, Pencil, Trash2 } from "lucide-react"
import { surfaceMq } from "../utils/pricing"
import { registry } from "../registry"
import type { QuoteItem } from "../types"
import WindowSvg from "../window/WindowSvg"
import CassonettoSvg from "../cassonetto/CassonettoSvg"

type Props = {
    item: QuoteItem
    onEdit: (it: QuoteItem) => void
    onDuplicate: (id: string) => void
    onRemove: (id: string) => void
}

export function ItemCard({ item: it, onEdit, onDuplicate, onRemove }: Props) {
    const entry = registry[it.kind]
    const isCustom = it.kind === 'custom'
    const localPreview = (it as any).__previewUrl as string | undefined; // data/blob URL temporaneo (solo in questa sessione)
    const publicUrl = (it as any).image_url as string | undefined;       // URL pubblico Supabase
    const thumbSrc = localPreview || publicUrl || entry?.icon;           // priorità: preview -> pubblica -> icona default
    const label =
        isCustom
            ? ((it as any).title?.trim() || '(Senza titolo)')
            : (entry?.label ?? it.kind.toUpperCase())

    return (
        <div className="card p-3">
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Thumbnail con quote L/H */}
                <div className="relative w-[88px] h-[88px] sm:w-[110px] sm:h-[110px] shrink-0 rounded border bg-white flex items-center justify-center">
                    {(
                      // 1) Disegno live per FINESTRA con griglia
                      (it.kind === 'finestra' && (it as any)?.options?.gridWindow)
                    ) ? (
                      <WindowSvg
                        cfg={(it as any).options.gridWindow}
                      />
                    ) : (
                      // 2) Disegno live per CASSONETTO (usa misure direttamente sull'item)
                      it.kind === 'cassonetto' ? (
                        <CassonettoSvg
                          cfg={{
                            width_mm: (it as any).width_mm ?? 1000,
                            height_mm: (it as any).height_mm ?? 250,
                            depth_mm: (it as any).depth_mm ?? null,
                            celino_mm: (it as any).celino_mm ?? (it as any).extension_mm ?? null,
                          }}
                        />
                      ) : (
                        // 3) Fallback immagine (preview/data/public) o icona di default
                        thumbSrc
                          ? <img src={thumbSrc} alt={label} loading="lazy" className="max-w-[80%] max-h-[80%] object-contain" />
                          : null
                      )
                    )}
                    <div className="absolute bottom-1 left-0 right-0 text-center text-[11px] text-gray-700">
                        {typeof it.width_mm === 'number' ? `${it.width_mm} mm` : '—'}
                    </div>
                    <div className="absolute top-0 bottom-0 left-1 flex items-center">
                        <div className="-rotate-90 origin-left text-[11px] text-gray-700">
                            {typeof it.height_mm === 'number' ? `${it.height_mm} mm` : '—'}
                        </div>
                    </div>
                </div>

                {/* Dati voce */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">                        <div className="min-w-0">
                        <div className="font-medium truncate">{label}</div>
                        {(it as any).reference && (
                            <div className="text-xs text-gray-500 mt-0.5 truncate">{(it as any).reference}</div>
                        )}
                    </div>
                        <div className="flex items-center gap-1 md:gap-3">
                            <div className="text-sm text-gray-600 whitespace-nowrap">
                                {it.width_mm && it.height_mm ? `${it.qty}× · ${surfaceMq(it)} m²` : `${it.qty}×`}
                            </div>
                            <Button variant="ghost" aria-label="Modifica" title="Modifica" onClick={() => onEdit(it)}>
                                <Pencil size={16} />
                            </Button>
                            <Button variant="ghost" aria-label="Duplica" title="Duplica" onClick={() => onDuplicate(it.id)}>
                                <Copy size={16} />
                            </Button>
                            <Button variant="ghost" aria-label="Rimuovi voce" title="Rimuovi voce" onClick={() => onRemove(it.id)}>
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </div>

                    <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm text-gray-700">
                        {(typeof it.width_mm === 'number' || typeof it.height_mm === 'number') && (
                            <div>
                                <span className="text-gray-500">Misure:</span>{' '}
                                {typeof it.width_mm === 'number' && typeof it.height_mm === 'number'
                                    ? <>L {it.width_mm} × H {it.height_mm} mm</>
                                    : (typeof it.width_mm === 'number'
                                        ? <>L {it.width_mm} mm</>
                                        : <>H {it.height_mm} mm</>
                                    )
                                }
                            </div>
                        )}
                        {(it as any).color && <div><span className="text-gray-500">Colore:</span> {(it as any).color}</div>}
                        {(it as any).glass && <div><span className="text-gray-500">Vetro:</span> {(it as any).glass}</div>}
                        {(it as any).hinges_color && <div><span className="text-gray-500">Cerniere:</span> {(it as any).hinges_color}</div>}
                        {typeof (it as any).uw === 'number' && (
                            <div><span className="text-gray-500">Uw (trasmittanza termica):</span> {(it as any).uw} W/m²K</div>
                        )}

                        {/* Zanzariera */}
                        {it.kind === 'zanzariera' && (
                            <>
                                {(it as any).modello && (
                                    <div><span className="text-gray-500">Modello:</span> {(it as any).modello}</div>
                                )}
                                {(it as any).tipologia && (
                                    <div><span className="text-gray-500">Tipologia:</span> {(it as any).tipologia}</div>
                                )}
                                {(((it as any).rete_colore) || ((it as any).mesh)) && (
                                    <div><span className="text-gray-500">Colore rete:</span> {(it as any).rete_colore ?? (it as any).mesh}</div>
                                )}
                            </>
                        )}

                        {/* Finestre/Portefinestre/Scorrevoli */}
                        {(it.kind === 'finestra' || it.kind === 'portafinestra' || it.kind === 'scorrevole') && (it as any).profile_system && (
                            <div><span className="text-gray-500">Sistema profilo:</span> {(it as any).profile_system}</div>
                        )}

                        {/* Cassonetto */}
                        {it.kind === 'cassonetto' && (
                            <>
                                {(it as any).material && (
                                    <div><span className="text-gray-500">Materiale:</span> {(it as any).material}</div>
                                )}
                                {(it as any).depth_mm && (
                                    <div><span className="text-gray-500">Profondità:</span> {(it as any).depth_mm} mm</div>
                                )}
                                {(it as any).celino_mm && (
                                    <div><span className="text-gray-500">Celino:</span> {(it as any).celino_mm} mm</div>
                                )}
                            </>
                        )}

                        {/* Persiana */}
                        {it.kind === 'persiana' && (
                            <>
                                {(it as any).material && (
                                    <div><span className="text-gray-500">Materiale:</span> {(it as any).material}</div>
                                )}
                                {(it as any).lamelle && (
                                    <div><span className="text-gray-500">Lamelle:</span> {(it as any).lamelle}</div>
                                )}
                                {(typeof (it as any).con_telaio !== "undefined") && (
                                    <div><span className="text-gray-500">Telaio:</span> {(it as any).con_telaio ? "Con telaio" : "Senza telaio"}</div>
                                )}
                                {(it as any).color && (
                                    <div><span className="text-gray-500">Colore:</span> {(it as any).color}</div>
                                )}
                            </>
                        )}

                        {/* Tapparella */}
                        {it.kind === 'tapparella' && (
                            <>
                                {(it as any).material && (
                                    <div><span className="text-gray-500">Materiale:</span> {(it as any).material}</div>
                                )}
                                {(it as any).color && (
                                    <div><span className="text-gray-500">Colore:</span> {(it as any).color}</div>
                                )}
                                {(it as any).width_mm && (it as any).height_mm && (
                                    <div><span className="text-gray-500">Dimensioni:</span> {(it as any).width_mm}×{(it as any).height_mm} mm</div>
                                )}
                            </>
                        )}

                        {/* Campi personalizzati (voce custom) */}
                        {Array.isArray((it as any).custom_fields) &&
                            (it as any).custom_fields.map((f: any, idx: number) => {
                                const lbl = (f?.label ?? f?.name ?? f?.key ?? '').toString().trim();
                                const val = (f?.value ?? '').toString().trim();
                                if (!lbl || !val) return null;
                                return (
                                    <div key={f?.key ?? `${lbl}-${val}-${idx}`}>
                                        <span className="text-gray-500">{lbl}:</span> {val}
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}