//src/features/quotes/forms/WindowForm.tsx
import React, { useState, useEffect } from "react";
import type { ItemFormProps } from "../types";
import type { WindowItem } from "../types";
import type { GridWindowConfig, LeafState } from "../window/WindowSvg";
import { Trash2 } from "lucide-react";

// --- Costanti e Tipi ---
const openingOptions: { value: LeafState; label: string }[] = [
    { value: 'fissa', label: 'Fissa' },
    { value: 'apre_sx', label: 'Apertura Sinistra' },
    { value: 'apre_dx', label: 'Apertura Destra' },
    { value: 'vasistas', label: 'Vasistas' },
    { value: 'apre_sx+vasistas', label: 'Anta-ribalta Sinistra' },
    { value: 'apre_dx+vasistas', label: 'Anta-ribalta Destra' },
    { value: 'scorrevole_sx', label: 'Scorrevole Sinistra' },
    { value: 'scorrevole_dx', label: 'Scorrevole Destra' },
];

// Funzioni Helper
const createNewRow = (): GridWindowConfig['rows'][0] => ({
    height_ratio: 1,
    cols: [{ width_ratio: 1, leaf: { state: 'fissa' } }],
});

const createNewSash = (): GridWindowConfig['rows'][0]['cols'][0] => ({
    width_ratio: 1,
    leaf: { state: 'fissa' },
});

// Valori fissi per telaio e montante
const FRAME_MM = 70;
const MULLION_MM = 60;

// Profili disponibili (lista rapida)
const PROFILE_SYSTEMS = [
    'WDS 76 MD',
    'WDS 76 AD',
    'WDS 76 PORTE',
    'WDS 76 SCORREVOLE',
    'ULTRA 70',
    'ULTRA 60',
] as const;

// === Nuovi helper: trattiamo width_ratio/height_ratio come mm assoluti che sommano al totale ===
function sumNum(arr: number[]) { return arr.reduce((s, v) => s + v, 0); }

/** Ribilancia le altezze di riga (mm assoluti) in modo che sommino a totalH.
 *  Se fixedIndex/fixedNewVal sono forniti, quella riga viene fissata a quel valore e le altre scalate proporzionalmente.
 */
function rebalanceRowsToTotal(
    rows: GridWindowConfig['rows'],
    totalH: number,
    fixedIndex?: number,
    fixedNewVal?: number
): GridWindowConfig['rows'] {
    const current = rows.map(r => Math.max(1, Math.round(r.height_ratio || 1)));
    const sumH = Math.max(1, sumNum(current));
    let target = [...current];

    if (typeof fixedIndex === 'number' && typeof fixedNewVal === 'number') {
        // Fissa una riga e scala le altre
        const clamped = Math.max(1, Math.round(fixedNewVal));
        const otherIdx = target.map((_, i) => i).filter(i => i !== fixedIndex);
        const otherSum = sumNum(otherIdx.map(i => target[i])) || 1;
        const remain = Math.max(1, totalH - clamped);
        target[fixedIndex] = clamped;
        for (const i of otherIdx) {
            target[i] = Math.max(1, Math.round((target[i] / otherSum) * remain));
        }
    } else {
        // Scala tutte le righe proporzionalmente
        const k = totalH / sumH;
        target = target.map(v => Math.max(1, Math.round(v * k)));
    }

    // Aggiusta eventuali differenze di arrotondamento
    const diff = totalH - sumNum(target);
    if (diff !== 0 && target.length > 0) {
        target[target.length - 1] = Math.max(1, target[target.length - 1] + diff);
    }

    return rows.map((r, i) => ({ ...r, height_ratio: target[i] }));
}

/** Ribilancia le larghezze delle ante (mm assoluti) in una riga, somma = totalW.
 *  Se fixedIndex/fixedNewVal sono forniti, quell'anta viene fissata e le altre scalate proporzionalmente.
 */
function rebalanceColsToTotal(
    cols: GridWindowConfig['rows'][0]['cols'],
    totalW: number,
    fixedIndex?: number,
    fixedNewVal?: number
): GridWindowConfig['rows'][0]['cols'] {
    const current = cols.map(c => Math.max(1, Math.round(c.width_ratio || 1)));
    const sumW = Math.max(1, sumNum(current));
    let target = [...current];

    if (typeof fixedIndex === 'number' && typeof fixedNewVal === 'number') {
        const clamped = Math.max(1, Math.round(fixedNewVal));
        const otherIdx = target.map((_, i) => i).filter(i => i !== fixedIndex);
        const otherSum = sumNum(otherIdx.map(i => target[i])) || 1;
        const remain = Math.max(1, totalW - clamped);
        target[fixedIndex] = clamped;
        for (const i of otherIdx) {
            target[i] = Math.max(1, Math.round((target[i] / otherSum) * remain));
        }
    } else {
        const k = totalW / sumW;
        target = target.map(v => Math.max(1, Math.round(v * k)));
    }

    const diff = totalW - sumNum(target);
    if (diff !== 0 && target.length > 0) {
        target[target.length - 1] = Math.max(1, target[target.length - 1] + diff);
    }

    return cols.map((c, i) => ({ ...c, width_ratio: target[i] }));
}

// --- Helper dimensioni assolute (mm) ---
function innerWidthMm(grid: GridWindowConfig) {
    return Math.max(0, grid.width_mm - grid.frame_mm * 2);
}
function innerHeightMm(grid: GridWindowConfig) {
    return Math.max(0, grid.height_mm - grid.frame_mm * 2);
}
function usableWidthMm(grid: GridWindowConfig, colsCount: number) {
    return Math.max(0, innerWidthMm(grid) - Math.max(0, colsCount - 1) * grid.mullion_mm);
}
function usableHeightMm(grid: GridWindowConfig, rowsCount: number) {
    return Math.max(0, innerHeightMm(grid) - Math.max(0, rowsCount - 1) * grid.mullion_mm);
}

export function WindowForm({ draft, onChange }: ItemFormProps<WindowItem>) {
    if (!draft) return null;
    const d = draft;

    const [autoSplit, setAutoSplit] = useState(true);
    const equalizeRowCols = (rows: GridWindowConfig['rows']) =>
        rows.map(r => ({
            ...r,
            cols: r.cols.map(c => ({ ...c, width_ratio: 1 }))
        }));

    const [widthStr, setWidthStr] = useState(String(d.width_mm || ''));
    const [heightStr, setHeightStr] = useState(String(d.height_mm || ''));

    useEffect(() => {
        setWidthStr(String(d.width_mm || ''));
        setHeightStr(String(d.height_mm || ''));
    }, [d.width_mm, d.height_mm]);

    const getGrid = (): GridWindowConfig | undefined => (d as any)?.options?.gridWindow;
    const grid = getGrid();

    // Inizializzazione
    useEffect(() => {
        if (!grid) {
            const initialGrid: GridWindowConfig = {
                width_mm: d.width_mm || 1200, height_mm: d.height_mm || 1500,
                frame_mm: FRAME_MM, mullion_mm: MULLION_MM,
                rows: [{
                    height_ratio: (d.height_mm || 1500),
                    cols: [{ width_ratio: (d.width_mm || 1200), leaf: { state: 'fissa' } }]
                }],
                glazing: 'doppio',
                showDims: true,
            };
            onChange({ ...(d as any), options: { ...(d as any).options, gridWindow: initialGrid } });
        }
    }, [grid, d.width_mm, d.height_mm, onChange, d]);

    if (!grid) { return <div>Caricamento...</div>; }

    // --- Patch atomica: aggiorna contemporaneamente draft e gridWindow ---
    const applyPatch = (
      draftPatch: Partial<WindowItem> = {},
      gridPatch: Partial<GridWindowConfig> = {}
    ) => {
      const curGrid: GridWindowConfig = (d as any)?.options?.gridWindow ?? {
        width_mm: d.width_mm || 1200,
        height_mm: d.height_mm || 1500,
        frame_mm: FRAME_MM,
        mullion_mm: MULLION_MM,
        rows: [{
          height_ratio: (d.height_mm || 1500),
          cols: [{ width_ratio: (d.width_mm || 1200), leaf: { state: 'fissa' } }]
        }],
        glazing: 'doppio',
        showDims: true,
      };
    
      const next = {
        ...(d as any),
        ...draftPatch,
        options: {
          ...(d as any).options,
          gridWindow: { ...curGrid, ...gridPatch },
        },
      };
    
      onChange(next as any);
    };

    // --- Gestori Eventi ---
    const handleGridChange = (newGridData: Partial<GridWindowConfig>) => {
      applyPatch({}, newGridData);
    };

    const handleRowsChange = (newRows: GridWindowConfig['rows']) => {
        handleGridChange({ rows: newRows });
    };

    const handleMeasureUpdate = (key: 'width_mm' | 'height_mm', value: string) => {
      const nextTotal = Math.max(100, Math.round(Number(value)) || 100);
    
      if (key === 'width_mm') {
        // Per ogni riga, porta la somma delle ante al nuovo TOTALE finestra.
        // Se autoSplit è attivo, distribuzione perfettamente uguale tra le ante.
        const nextRows = grid.rows.map((r) => {
          if (autoSplit) {
            const count = Math.max(1, r.cols.length);
            const equal = Math.max(1, Math.round(nextTotal / count));
            const cols = r.cols.map((c) => ({ ...c, width_ratio: equal }));
            // Aggiusta eventuale differenza di arrotondamento sull'ultima anta
            const diff = nextTotal - sumNum(cols.map(c => c.width_ratio as number));
            if (diff !== 0) cols[cols.length - 1].width_ratio = Math.max(1, (cols[cols.length - 1].width_ratio as number) + diff);
            return { ...r, cols };
          }
          return { ...r, cols: rebalanceColsToTotal(r.cols, nextTotal) };
        });
    
        applyPatch(
          { width_mm: nextTotal },
          { width_mm: nextTotal, rows: nextRows }
        );
      } else {
        // Altezza totale finestra: ribilancia le righe per farle sommare al nuovo TOTALE.
        const nextRows = rebalanceRowsToTotal(grid.rows, nextTotal);
        applyPatch(
          { height_mm: nextTotal },
          { height_mm: nextTotal, rows: nextRows }
        );
      }
    };

    const addRow = () => {
        const totalH = grid.height_mm;
        const nextRows = [...grid.rows, createNewRow()];
        let resized = nextRows;
        if (autoSplit) {
            // distribuzione uniforme in mm
            const each = Math.max(1, Math.round(totalH / nextRows.length));
            resized = nextRows.map(r => ({ ...r, height_ratio: each }));
            const diff = totalH - sumNum(resized.map(r => r.height_ratio as number));
            if (diff !== 0) {
                resized[resized.length - 1].height_ratio = Math.max(1, (resized[resized.length - 1].height_ratio as number) + diff);
            }
        } else {
            resized = rebalanceRowsToTotal(nextRows, totalH);
        }
        handleRowsChange(resized);
    };
    const removeRow = (rowIndex: number) => {
        if (grid.rows.length <= 1) return;
        handleRowsChange(grid.rows.filter((_, i) => i !== rowIndex));
    };

    const handleSashCountChange = (rowIndex: number, newCount: number) => {
        const count = Math.max(1, newCount || 1);
        const totalW = grid.width_mm;

        let nextRows = grid.rows.map((row, rIdx) => {
            if (rIdx !== rowIndex) return row;
            let newCols = [...row.cols];
            const cur = newCols.length;
            if (count > cur) {
                for (let i = 0; i < count - cur; i++) newCols.push(createNewSash());
            } else if (count < cur) {
                newCols = newCols.slice(0, count);
            }

            // Assicura che ogni anta abbia un glazing valorizzato (eredita dal default di griglia)
            newCols = newCols.map((c) => ({ ...c, glazing: (c as any).glazing ?? grid.glazing }));

            if (autoSplit) {
                const equal = Math.max(1, Math.round(totalW / count));
                const cols = newCols.map(c => ({ ...c, width_ratio: equal }));
                const diff = totalW - sumNum(cols.map(c => c.width_ratio as number));
                if (diff !== 0) cols[cols.length - 1].width_ratio = Math.max(1, (cols[cols.length - 1].width_ratio as number) + diff);
                return { ...row, cols };
            }
            // no autoSplit: ribilancia proporzionalmente
            return { ...row, cols: rebalanceColsToTotal(newCols, totalW) };
        });

        handleRowsChange(nextRows);
    };

    const updateSashOpening = (rowIndex: number, colIndex: number, newState: LeafState) => {
        const newRows = grid.rows.map((row, rIdx) => {
            if (rIdx === rowIndex) {
                const newCols = row.cols.map((col, cIdx) =>
                    cIdx === colIndex ? { ...col, leaf: { state: newState } } : col
                );
                return { ...row, cols: newCols };
            }
            return row;
        });
        handleRowsChange(newRows);
    };

    // Nuova funzione: aggiorna il glazing di una singola anta
    const updateSashGlazing = (rowIndex: number, colIndex: number, newGlazing: GridWindowConfig['glazing']) => {
        const newRows = grid.rows.map((row, rIdx) => {
            if (rIdx === rowIndex) {
                const newCols = row.cols.map((col, cIdx) =>
                    cIdx === colIndex ? { ...col, glazing: newGlazing } : col
                );
                return { ...row, cols: newCols };
            }
            return row;
        });
        handleRowsChange(newRows);
    };

    const updateRowHeightMm = (rowIndex: number, newHeightMm: number) => {
        const totalH = grid.height_mm;
        const nextRows = rebalanceRowsToTotal(grid.rows, totalH, rowIndex, newHeightMm);
        handleRowsChange(nextRows);
    };

    const updateColWidthMm = (rowIndex: number, colIndex: number, newWidthMm: number) => {
        const totalW = grid.width_mm;
        const nextRows = grid.rows.map((r, i) => {
            if (i !== rowIndex) return r;
            return { ...r, cols: rebalanceColsToTotal(r.cols, totalW, colIndex, newWidthMm) };
        });
        handleRowsChange(nextRows);
    };

    return (
        <div className="space-y-6">
            <section className="space-y-2">
                <div className="text-sm font-medium text-gray-600">Misure Totali e Quantità</div>
                <div className="grid grid-cols-3 gap-3">
                    {/* Input per Misure Totali e Pezzi */}
                    <div>
                        <label className="text-xs text-gray-500">Largh (mm)</label>
                        <input
                            className="input"
                            type="number"
                            min="100"
                            step="10"
                            value={widthStr}
                            onChange={(e) => { const v = e.target.value; setWidthStr(v); handleMeasureUpdate('width_mm', v); }}
                        />                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Altezza (mm)</label>
                        <input
                            className="input"
                            type="number"
                            min="100"
                            step="10"
                            value={heightStr}
                            onChange={(e) => { const v = e.target.value; setHeightStr(v); handleMeasureUpdate('height_mm', v); }}
                        />                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Quantità</label>
                        <input className="input" type="number" min={1} value={d.qty} onChange={e => onChange({ ...(d as any), qty: Math.max(1, Number(e.target.value || 1)) })} />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <input id="autosplit" type="checkbox" className="h-4 w-4" checked={autoSplit} onChange={(e) => setAutoSplit(e.target.checked)} />
                    <label htmlFor="autosplit">Ripartisci automaticamente la larghezza tra le ante</label>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-600">Struttura Finestra</div>
                    <button type="button" onClick={addRow} className="btn btn-sm">+ Nuova riga</button>
                </div>
                <div className="space-y-4">
                    {grid.rows.map((row, rowIndex) => (
                        <div key={rowIndex} className="p-3 border rounded-lg bg-gray-50/50 space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500">Altezza {rowIndex + 1} (mm)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        min="1"
                                        step="1"
                                        value={Math.round(row.height_ratio || 1)}
                                        onChange={(e) => updateRowHeightMm(rowIndex, Number(e.target.value))}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500">Numero Ante</label>
                                    <input type="number" className="input" min="1" value={row.cols.length} onChange={e => handleSashCountChange(rowIndex, Number(e.target.value))} />
                                    <div className="mt-1 text-xs text-gray-500">
                                        {`≈ ${Math.round(grid.width_mm / Math.max(1, row.cols.length))} mm ad anta`}
                                    </div>
                                </div>
                                {grid.rows.length > 1 && (
                                    <button type="button" onClick={() => removeRow(rowIndex)} className="btn-icon text-gray-400 hover:text-red-500 mt-4" title="Rimuovi riga"><Trash2 size={16} /></button>
                                )}
                            </div>

                            {row.cols.map((col, colIndex) => (
                                <div key={colIndex}>
                                    <label className="text-xs text-gray-500">Apertura Anta {rowIndex + 1}.{colIndex + 1}</label>
                                    <select
                                        className="input"
                                        value={col.leaf?.state ?? 'fissa'}
                                        onChange={e => updateSashOpening(rowIndex, colIndex, e.target.value as LeafState)}
                                    >
                                        {openingOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    {/* Per-anta glazing selector */}
                                    <div className="mt-2">
                                        <label className="text-xs text-gray-500">Vetro Anta {rowIndex + 1}.{colIndex + 1}</label>
                                        <select
                                            className="input"
                                            value={(col as any).glazing ?? grid.glazing}
                                            onChange={(e) => updateSashGlazing(rowIndex, colIndex, e.target.value as GridWindowConfig['glazing'])}
                                        >
                                            <option value="singolo">Singolo</option>
                                            <option value="doppio">Doppio</option>
                                            <option value="triplo">Triplo</option>
                                            <option value="satinato">Satinato</option>
                                        </select>
                                    </div>
                                    {(() => {
                                        // Compute the TOTAL width per-anta (including telai/montanti) from ratios
                                        const colTotalMm = Math.round(col.width_ratio || 1);

                                        return (
                                            <div className="mt-2">
                                                <div className="text-[11px] text-gray-400 mb-1">
                                                    {autoSplit
                                                        ? "Auto-ripartizione attiva: larghezze uguali sul totale"
                                                        : "Imposta larghezza TOTALE anta (mm)"}
                                                </div>
                                                {autoSplit ? (
                                                    <div className="text-xs text-gray-600">Larghezza totale stimata: <b>{Math.round(grid.width_mm / Math.max(1, row.cols.length))} mm</b></div>
                                                ) : (
                                                    <>
                                                        <label className="text-xs text-gray-500">Larghezza Anta {rowIndex + 1}.{colIndex + 1} (totale mm)</label>
                                                        <input
                                                            className="input"
                                                            type="number"
                                                            min={1}
                                                            step={1}
                                                            value={colTotalMm}
                                                            onChange={(e) => updateColWidthMm(rowIndex, colIndex, Number(e.target.value))}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-2">
                <div className="text-sm font-medium text-gray-600">Vetro</div>
                <div className="grid grid-cols-2 gap-3">
                    {/* Input per Riferimento */}
                    
                    <div>
                        <label className="text-xs text-gray-500">Stratigrafia vetro</label>
                        <input
                          className="input"
                          type="text"
                          placeholder="es. 4-14-4-12-33.1 LowE"
                          value={(d as any).glass_spec ?? ''}
                          onChange={(e) => applyPatch({ glass_spec: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Riferimento</label>
                        <input className="input" type="text" placeholder="es. Salotto" value={d.reference ?? ''} onChange={(e) => applyPatch({ reference: e.target.value })} />
                    </div>
                </div>
            </section>

            {/* Finiture & Dati tecnici */}
            <section className="space-y-2">
                <div className="text-sm font-medium text-gray-600">Finiture &amp; Dati tecnici</div>
                <div className="grid grid-cols-2 gap-3">
                    {/* Colore profilo */}
                    <div>
                        <label className="text-xs text-gray-500">Colore profilo</label>
                        <input
                            className="input"
                            type="text"
                            placeholder="Es. RAL 9016 Bianco"
                            value={(d as any).color ?? ''}
                            onChange={(e) => applyPatch({ color: e.target.value })}
                        />
                    </div>
                    {/* Colore cerniere / ferramenta */}
                    <div>
                        <label className="text-xs text-gray-500">Colore cerniere</label>
                        <input
                            className="input"
                            type="text"
                            placeholder="Es. Bianco / Inox / Nero"
                            value={(d as any).hinges_color ?? ''}
                            onChange={(e) => applyPatch({ hinges_color: e.target.value })}
                        />
                    </div>
                    {/* Sistema profilo */}
                    <div>
                        <label className="text-xs text-gray-500">Sistema profilo</label>
                        <select
                            className="input"
                            value={(d as any).profile_system ?? ''}
                            onChange={(e) => applyPatch({ profile_system: e.target.value || null })}
                        >
                            <option value="">— Seleziona —</option>
                            {PROFILE_SYSTEMS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                    {/* Uw (trasmittanza) */}
                    <div>
                        <label className="text-xs text-gray-500">Uw (W/m²K)</label>
                        <input
                            className="input"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Es. 1.3"
                            value={typeof (d as any).uw === 'number' ? String((d as any).uw) : ''}
                            onChange={(e) => {
                                const raw = e.target.value;
                                const num = raw === '' ? null : Number(raw);
                                applyPatch({ uw: (raw === '' || Number.isNaN(num)) ? null : num as any });
                            }}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}
