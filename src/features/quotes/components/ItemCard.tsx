//src/features/quotes/components/ItemCard.tsx
import { Button } from "../../../components/ui/Button"
import { Copy, Pencil, Trash2 } from "lucide-react"
import { surfaceMq } from "../utils/pricing"
import { registry } from "../registry"
import type { QuoteItem } from "../types"
import WindowSvg from "../window/WindowSvg"
import CassonettoSvg from "../cassonetto/CassonettoSvg"
import PersianaSvg from "../persiana/PersianaSvg"
import TapparellaSvg from "../tapparella/TapparellaSvg"

type Props = {
    item: QuoteItem
    onEdit: (it: QuoteItem) => void
    onDuplicate: (id: string) => void
    onRemove: (id: string) => void
}

export function ItemCard({ item: it, onEdit, onDuplicate, onRemove }: Props) {
    const entry = registry[it.kind]
    const isCustom = it.kind === 'custom'
    const isWindowLike = /^(finestra|portafinestra|scorrevole|tapparella|persiana|cassonetto)$/i.test(String(it.kind))
    const shouldShowDimensions = isWindowLike || /^(porta_interna|porta_blindata|zanzariera)$/i.test(String(it.kind))
    const localPreview = (it as any).__previewUrl as string | undefined; // data/blob URL temporaneo (solo in questa sessione)
    const publicUrl = (it as any).image_url as string | undefined;       // URL pubblico Supabase
    const thumbSrc = localPreview || publicUrl || entry?.icon;           // priorità: preview -> pubblica -> icona default

    // Preferisci un titolo personalizzato se presente su qualsiasi item
    const customTitle = typeof (it as any).title === 'string' ? (it as any).title.trim() : ''
    const label =
      customTitle
        ? customTitle
        : (isCustom ? '(Senza titolo)' : (entry?.label ?? String(it.kind).toUpperCase()))

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="p-4">
                <div className="flex gap-4">
                    {/* Thumbnail più grande */}
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center shadow-sm overflow-hidden">
                        {(
                            // 1) Disegno live per FINESTRA con griglia
                            (it.kind === 'finestra' && (it as any)?.options?.gridWindow)
                        ) ? (
                            <WindowSvg
                                cfg={(it as any).options.gridWindow}
                                stroke={(it as any).options?.gridWindow?.frame_color ?? (it as any).color ?? '#222'}
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
                                        color: (it as any).options?.previewColor,
                                    }}
                                />
                            ) : (
                                it.kind === 'persiana' ? (
                                    <PersianaSvg
                                        cfg={{
                                            width_mm: (it as any).width_mm ?? 1000,
                                            height_mm: (it as any).height_mm ?? 1400,
                                            ante: (it as any).ante ?? 2,
                                            color: (it as any).options?.previewColor,
                                        }}
                                    />
                                ) : (
                                it.kind === 'tapparella' ? (
                                    <TapparellaSvg
                                        cfg={{
                                            width_mm: (it as any).width_mm ?? 1000,
                                            height_mm: (it as any).height_mm ?? 1400,
                                            color: (it as any).options?.previewColor
                                        }}
                                    />
                                ) : (
                                    // 3) Fallback immagine (preview/data/public) o icona di default
                                    thumbSrc
                                        ? <img src={thumbSrc} alt={label} loading="lazy" className="max-w-[85%] max-h-[85%] object-contain rounded" />
                                        : <div className="text-gray-400 text-xs font-medium">Anteprima</div>
                                )
                            )
                            )
                        )}
                        {!shouldShowDimensions && (
                            <>
                                <div className="absolute bottom-1 left-1 right-1 text-center text-xs text-gray-700 font-semibold bg-white/90 backdrop-blur-sm rounded py-0.5">
                                    {typeof it.width_mm === 'number' ? `${it.width_mm} mm` : '—'}
                                </div>
                                <div className="absolute top-1 left-1 bottom-1 flex items-center">
                                    <div className="-rotate-90 origin-left text-xs text-gray-700 font-semibold bg-white/90 backdrop-blur-sm rounded px-0.5">
                                        {typeof it.height_mm === 'number' ? `${it.height_mm} mm` : '—'}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Contenuto principale */}
                    <div className="flex-1 min-w-0">
                        {/* Header con pulsanti in alto a destra */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-semibold text-gray-900 text-base truncate">{label}</h3>
                                    {(typeof it.width_mm === 'number' || typeof it.height_mm === 'number') && (
                                        <span className="text-sm text-gray-500 font-normal shrink-0">
                                            {typeof it.width_mm === 'number' && typeof it.height_mm === 'number'
                                                ? `${it.width_mm} × ${it.height_mm} mm`
                                                : (typeof it.width_mm === 'number'
                                                    ? `${it.width_mm} mm`
                                                    : `${it.height_mm} mm`
                                                )
                                            }
                                        </span>
                                    )}
                                    <span className="text-sm text-gray-500 font-normal shrink-0">
                                        × {it.qty} {it.qty === 1 ? 'pezzo' : 'pezzi'}
                                    </span>
                                </div>
                                {(it as any).reference && (
                                    <p className="text-sm text-gray-600 font-medium truncate">{(it as any).reference}</p>
                                )}
                            </div>

                            {/* Pulsanti azioni in alto a destra */}
                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    variant="ghost"
                                    aria-label="Modifica"
                                    title="Modifica"
                                    onClick={() => onEdit(it)}
                                    className="h-9 w-9 p-0 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors rounded-lg justify-center"
                                >
                                    <Pencil size={18} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    aria-label="Duplica"
                                    title="Duplica"
                                    onClick={() => onDuplicate(it.id)}
                                    className="h-9 w-9 p-0 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 transition-colors rounded-lg justify-center"
                                >
                                    <Copy size={18} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    aria-label="Rimuovi voce"
                                    title="Rimuovi voce"
                                    onClick={() => {
                                        if (window.confirm(`Sei sicuro di voler eliminare "${label}"? Questa azione non può essere annullata.`)) {
                                            onRemove(it.id)
                                        }
                                    }}
                                    className="h-9 w-9 p-0 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors rounded-lg justify-center"
                                >
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        </div>

                        {/* Badge informazioni chiave */}
                        <div className="flex items-center gap-2 mb-3">
                            {it.width_mm && it.height_mm && (
                                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                    {surfaceMq(it)} m²
                                </div>
                            )}
                        </div>

                        {/* Proprietà in griglia responsive a 2 colonne */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full">
                            <>
                                {(it as any).color && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-500 font-medium">Colore:</span>
                                        <span className="text-gray-900">{(it as any).color}</span>
                                    </div>
                                )}
                                {(it as any).glass && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-500 font-medium">Vetro:</span>
                                        <span className="text-gray-900">{(it as any).glass}</span>
                                    </div>
                                )}
                                {typeof (it as any).uw === 'number' && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-500 font-medium">Uw:</span>
                                        <span className="text-gray-900">{(it as any).uw} W/m²K</span>
                                    </div>
                                )}

                                {/* Dettagli specifici per tipo */}
                                {it.kind === 'zanzariera' && (it as any).modello && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-500 font-medium">Modello:</span>
                                        <span className="text-gray-900">{(it as any).modello}</span>
                                    </div>
                                )}

                                {it.kind === 'finestra' && (it as any).profile_system && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-500 font-medium">Sistema:</span>
                                        <span className="text-gray-900">{(it as any).profile_system}</span>
                                    </div>
                                )}

                                {(it.kind === 'cassonetto' || it.kind === 'persiana' || it.kind === 'tapparella') && (it as any).material && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-500 font-medium">Materiale:</span>
                                        <span className="text-gray-900">{(it as any).material}</span>
                                    </div>
                                )}
                            </>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}