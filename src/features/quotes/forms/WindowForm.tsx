//src/features/quotes/forms/WindowForm.tsx
import { useState, useEffect } from "react";
import type { ItemFormProps } from "../types";
import type { WindowItem } from "../types";
import type { GridWindowConfig, LeafState } from "../types";
import { Trash2, Lock, Unlock } from "lucide-react";
import { RalColorPicker } from "../components/RalColorPicker";

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
    cols: [{ width_ratio: 1, leaf: { state: 'fissa' }, handle: false }],
});

const createNewSash = (): GridWindowConfig['rows'][0]['cols'][0] => ({
    width_ratio: 1,
    leaf: { state: 'fissa' },
    handle: false,
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

// === Helper numeric con precisione a 0.1 mm ===
const MM_DECIMALS = 1;
const MM_SCALE = Math.pow(10, MM_DECIMALS);
const MIN_MM = 1;
const MIN_SCALED = Math.round(MIN_MM * MM_SCALE);

function sumNum(arr: number[]) { return arr.reduce((s, v) => s + v, 0); }
const clampMm = (value: number) => Math.max(MIN_MM, value);
const roundMm = (value: number) => Math.max(MIN_MM, Math.round(value * MM_SCALE) / MM_SCALE);
const formatMm = (value: number) => {
    if (!Number.isFinite(value)) return '0';
    const rounded = roundMm(value);
    const fixed = rounded.toFixed(MM_DECIMALS);
    return fixed.replace(/\.?0+$/, '');
};
const allowMmInput = (value: string) => value === '' || /^\d+([.,]\d{0,1})?$/.test(value);
const parseMmInput = (value: string) => {
    if (value == null) return null;
    const normalized = value.replace(',', '.').trim();
    if (normalized === '') return null;
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return null;
    return roundMm(parsed);
};
const toScaled = (value: number) => Math.max(MIN_SCALED, Math.round(clampMm(value) * MM_SCALE));
const fromScaled = (value: number) => value / MM_SCALE;
const normalizeDimensionValues = (values: number[], total: number) => {
    const fallback = total > 0 ? total / Math.max(1, values.length) : 1;
    const sanitized = values.map(v => (Number.isFinite(v) && v > 0 ? v : fallback));
    const sumValues = sumNum(sanitized);
    if (sumValues > 0 && total > 0 && sumValues <= 1.0001) {
        return sanitized.map(v => v * total);
    }
    return sanitized.map(clampMm);
};
const allocateScaled = (totalScaled: number, weightsScaled: number[], minScaled: number) => {
    const len = weightsScaled.length;
    if (len === 0) return [];
    const base = Array(len).fill(minScaled);
    let remaining = totalScaled - minScaled * len;
    if (remaining <= 0) {
        const fallback = Array(len).fill(Math.floor(totalScaled / len));
        let residue = totalScaled - sumNum(fallback);
        for (let i = len - 1; i >= 0 && residue > 0; i -= 1) {
            fallback[i] += 1;
            residue -= 1;
        }
        return fallback;
    }
    const safeWeights = weightsScaled.map(w => Math.max(0, w));
    const weightSum = sumNum(safeWeights);
    const shares = weightSum > 0
        ? safeWeights.map(w => Math.floor((w / weightSum) * remaining))
        : Array(len).fill(Math.floor(remaining / len));
    let residue = remaining - sumNum(shares);
    const result = base.map((v, i) => v + shares[i]);
    if (residue > 0) {
        for (let i = len - 1; i >= 0 && residue > 0; i -= 1) {
            result[i] += 1;
            residue -= 1;
        }
    } else if (residue < 0) {
        for (let i = len - 1; i >= 0 && residue < 0; i -= 1) {
            const possible = result[i] - minScaled;
            if (possible <= 0) continue;
            const delta = Math.min(possible, -residue);
            result[i] -= delta;
            residue += delta;
        }
    }
    return result;
};
const splitEvenly = (total: number, count: number) => {
    if (count <= 0) return [];
    const totalScaled = Math.round(clampMm(total) * MM_SCALE);
    const distributed = allocateScaled(totalScaled, Array(count).fill(1), MIN_SCALED);
    return distributed.map(fromScaled);
};

/** Ribilancia le altezze delle righe con precisione a 0.1 mm. */
function rebalanceRowsToTotal(
    rows: GridWindowConfig['rows'],
    totalH: number,
    fixedIndex?: number,
    fixedNewVal?: number
): GridWindowConfig['rows'] {
    if (!rows.length) return rows;
    const totalScaled = Math.round(clampMm(totalH) * MM_SCALE);
    const baseValues = normalizeDimensionValues(rows.map(r => r.height_ratio ?? 0), totalH);
    const rawScaled = baseValues.map(toScaled);
    let targetScaled: number[];

    if (
        typeof fixedIndex === 'number' &&
        fixedIndex >= 0 &&
        fixedIndex < rows.length &&
        typeof fixedNewVal === 'number'
    ) {
        const safeFixed = Math.min(
            Math.max(MIN_SCALED, Math.round(clampMm(fixedNewVal) * MM_SCALE)),
            totalScaled - MIN_SCALED * Math.max(0, rows.length - 1)
        );
        const otherIdx = rawScaled.map((_, i) => i).filter(i => i !== fixedIndex);
        const otherWeights = otherIdx.map(i => rawScaled[i]);
        const remainingScaled = Math.max(0, totalScaled - safeFixed);
        const distributed = allocateScaled(remainingScaled, otherWeights, MIN_SCALED);
        targetScaled = Array(rows.length).fill(MIN_SCALED);
        targetScaled[fixedIndex] = safeFixed;
        otherIdx.forEach((idx, pos) => {
            targetScaled[idx] = distributed[pos] ?? MIN_SCALED;
        });
    } else {
        targetScaled = allocateScaled(totalScaled, rawScaled, MIN_SCALED);
    }

    const diff = totalScaled - sumNum(targetScaled);
    if (diff !== 0 && targetScaled.length > 0) {
        const last = targetScaled.length - 1;
        targetScaled[last] = Math.max(MIN_SCALED, targetScaled[last] + diff);
    }

    return rows.map((r, i) => ({ ...r, height_ratio: fromScaled(targetScaled[i]) }));
}

/** Ribilancia le larghezze delle ante con precisione a 0.1 mm. */
function rebalanceColsToTotal(
    cols: GridWindowConfig['rows'][0]['cols'],
    totalW: number,
    fixedIndex?: number,
    fixedNewVal?: number,
    lockedMask?: boolean[]
): GridWindowConfig['rows'][0]['cols'] {
    if (!cols.length) return cols;
    const totalScaled = Math.round(clampMm(totalW) * MM_SCALE);
    const baseValues = normalizeDimensionValues(cols.map(c => c.width_ratio ?? 0), totalW);
    const rawScaled = baseValues.map(toScaled);
    let targetScaled: number[] = Array(cols.length).fill(0);

    const lockedIdxs = new Set<number>();
    if (Array.isArray(lockedMask)) {
        lockedMask.forEach((v, i) => { if (v) lockedIdxs.add(i); });
    }

    // If user edited a specific col, consider it fixed as well (uses fixedNewVal)
    let fixedScaledForIndex: number | null = null;
    if (
        typeof fixedIndex === 'number' &&
        fixedIndex >= 0 &&
        fixedIndex < cols.length &&
        typeof fixedNewVal === 'number'
    ) {
        const safeFixed = Math.min(
            Math.max(MIN_SCALED, Math.round(clampMm(fixedNewVal) * MM_SCALE)),
            totalScaled - MIN_SCALED * Math.max(0, cols.length - 1)
        );
        fixedScaledForIndex = safeFixed;
        lockedIdxs.add(fixedIndex);
    }

    // Assign locked values (either the explicit fixed value, or current rawScaled)
    lockedIdxs.forEach(i => {
        targetScaled[i] = i === fixedIndex && fixedScaledForIndex !== null ? fixedScaledForIndex : rawScaled[i];
    });

    const sumLocked = sumNum(Array.from(lockedIdxs).map(i => targetScaled[i] || 0));
    const remainingScaled = Math.max(0, totalScaled - sumLocked);

    const unlockedIdxs = rawScaled.map((_, i) => i).filter(i => !lockedIdxs.has(i));
    if (unlockedIdxs.length === 0) {
        // nothing to distribute, fill last with remainder if needed
        if (targetScaled.length > 0) {
            const last = targetScaled.length - 1;
            targetScaled[last] = Math.max(MIN_SCALED, targetScaled[last] + (totalScaled - sumNum(targetScaled)));
        }
    } else {
        const weights = unlockedIdxs.map(i => rawScaled[i]);
        const distributed = allocateScaled(remainingScaled, weights, MIN_SCALED);
        unlockedIdxs.forEach((idx, pos) => {
            targetScaled[idx] = distributed[pos] ?? MIN_SCALED;
        });
    }

    const diff = totalScaled - sumNum(targetScaled);
    if (diff !== 0 && targetScaled.length > 0) {
        const last = targetScaled.length - 1;
        targetScaled[last] = Math.max(MIN_SCALED, targetScaled[last] + diff);
    }

    return cols.map((c, i) => ({ ...c, width_ratio: fromScaled(targetScaled[i]) }));
}



export function WindowForm({ draft, onChange }: ItemFormProps<WindowItem>) {
    if (!draft) return null;
    const d = draft;

    const [autoSplit, setAutoSplit] = useState(true);

    const getGrid = (): GridWindowConfig | undefined => (d as any)?.options?.gridWindow;
    const grid = getGrid();

    const interpretRowHeight = (r: GridWindowConfig['rows'][0]) => {
        const raw = r.height_ratio ?? 0;
        if (!raw || raw <= 0) return grid ? grid.height_mm / Math.max(1, grid.rows.length) : 0;
        return raw <= 1.0001 && grid ? raw * grid.height_mm : raw;
    };

    const [widthStr, setWidthStr] = useState(typeof d.width_mm === 'number' ? formatMm(d.width_mm) : '');
    const [heightStr, setHeightStr] = useState(typeof d.height_mm === 'number' ? formatMm(d.height_mm) : '');
    const [qtyStr, setQtyStr] = useState(String(d.qty ?? 1));

    // --- Per-row and per-anta string states for safe editing ---
    const [rowHeightStr, setRowHeightStr] = useState<Record<number, string>>({});
    const [sashCountStr, setSashCountStr] = useState<Record<number, string>>({});
    const [colWidthStr, setColWidthStr] = useState<Record<string, string>>({});
    const [barOffsetStr, setBarOffsetStr] = useState<Record<string, string>>({});
    const [colLocked, setColLocked] = useState<Record<string, boolean>>({});

    const getRowLockedMask = (rowIndex: number) => {
        const row = grid?.rows?.[rowIndex];
        if (!row) return [] as boolean[];
        return row.cols.map((_, ci) => Boolean(colLocked[`${rowIndex}.${ci}`]));
    };

    const toggleColLock = (rowIndex: number, colIndex: number) => {
        const key = `${rowIndex}.${colIndex}`;
        setColLocked(prev => ({ ...prev, [key]: !prev[key] }));
    };

    useEffect(() => {
        setQtyStr(String(d.qty ?? 1));
    }, [d.qty]);

    useEffect(() => {
        setWidthStr(typeof d.width_mm === 'number' ? formatMm(d.width_mm) : '');
        setHeightStr(typeof d.height_mm === 'number' ? formatMm(d.height_mm) : '');
    }, [d.width_mm, d.height_mm]);

    // Sync string states from grid structure/values
    useEffect(() => {
        if (!grid) return;
        const nextRowHeights: Record<number, string> = {};
        const nextSashCounts: Record<number, string> = {};
        const nextColWidths: Record<string, string> = {};
        const nextBarOffsets: Record<string, string> = {};
        const nextColLocked: Record<string, boolean> = {};

        grid.rows.forEach((r, ri) => {
            nextRowHeights[ri] = formatMm(interpretRowHeight(r));
            nextSashCounts[ri] = String(r.cols.length);
            r.cols.forEach((c, ci) => {
                nextColWidths[`${ri}.${ci}`] = formatMm(c.width_ratio ?? 0);
                nextColLocked[`${ri}.${ci}`] = colLocked[`${ri}.${ci}`] ?? false;
                const bar = c.leaf?.horizontalBars?.[0];
                if (bar && Number.isFinite(bar.offset_mm)) {
                    const rowHeight = interpretRowHeight(r);
                    const raw = Math.max(MIN_MM, Math.min(rowHeight, bar.offset_mm));
                    const bottomValue = bar.origin === 'bottom'
                        ? raw
                        : Math.max(MIN_MM, Math.min(rowHeight, rowHeight - raw));
                    nextBarOffsets[`${ri}.${ci}`] = formatMm(bottomValue);
                }
            });
        });
        setRowHeightStr(nextRowHeights);
        setSashCountStr(nextSashCounts);
        setColWidthStr(nextColWidths);
        setBarOffsetStr(nextBarOffsets);
        setColLocked(nextColLocked);
    }, [grid?.rows]);

    // Inizializzazione
    useEffect(() => {
        if (!grid) {
            const initialGrid: GridWindowConfig = {
                width_mm: d.width_mm || 1200, height_mm: d.height_mm || 1500,
                frame_mm: FRAME_MM, mullion_mm: MULLION_MM,
                rows: [{
                    height_ratio: (d.height_mm || 1500),
                    cols: [{ width_ratio: (d.width_mm || 1200), leaf: { state: 'fissa' }, handle: false }]
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
        if (value === '') return;
        const parsed = parseMmInput(value);
        if (parsed === null) return;
        const commitTotal = roundMm(Math.max(100, parsed));

        if (key === 'width_mm') {
            const nextRows = grid.rows.map((r, rIdx) => {
                if (autoSplit) {
                    const count = Math.max(1, r.cols.length);
                    const distributed = splitEvenly(commitTotal, count);
                    return {
                        ...r,
                        cols: r.cols.map((c, idx) => ({
                            ...c,
                            width_ratio: distributed[idx] ?? distributed[distributed.length - 1] ?? commitTotal / count,
                        })),
                    };
                }
                return { ...r, cols: rebalanceColsToTotal(r.cols, commitTotal, undefined, undefined, getRowLockedMask(rIdx)) };
            });

            applyPatch(
                { width_mm: commitTotal },
                { width_mm: commitTotal, rows: nextRows }
            );
            setWidthStr(formatMm(commitTotal));
        } else {
            const nextRows = rebalanceRowsToTotal(grid.rows, commitTotal);
            applyPatch(
                { height_mm: commitTotal },
                { height_mm: commitTotal, rows: nextRows }
            );
            setHeightStr(formatMm(commitTotal));
        }
    };

    const addRow = () => {
        const totalH = grid.height_mm;
        const nextRows = [...grid.rows, createNewRow()];
        let resized = nextRows;
        if (autoSplit) {
            const distributed = splitEvenly(totalH, nextRows.length);
            resized = nextRows.map((r, idx) => ({
                ...r,
                height_ratio: distributed[idx] ?? distributed[distributed.length - 1] ?? totalH / nextRows.length,
            }));
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
                const distributed = splitEvenly(totalW, count);
                const cols = newCols.map((c, idx) => ({
                    ...c,
                    width_ratio: distributed[idx] ?? distributed[distributed.length - 1] ?? totalW / count,
                }));
                return { ...row, cols };
            }
            // no autoSplit: ribilancia proporzionalmente
            return { ...row, cols: rebalanceColsToTotal(newCols, totalW, undefined, undefined, getRowLockedMask(rowIndex)) };
        });

        handleRowsChange(nextRows);
    };

    const updateSashOpening = (rowIndex: number, colIndex: number, newState: LeafState) => {
        const newRows = grid.rows.map((row, rIdx) => {
            if (rIdx === rowIndex) {
                const newCols = row.cols.map((col, cIdx) => {
                    if (cIdx !== colIndex) return col;
                    const nextCol = {
                        ...col,
                        leaf: { ...(col.leaf ?? {}), state: newState },
                    } as typeof col;
                    if (newState === 'fissa') {
                        nextCol.handle = false;
                    }
                    return nextCol;
                });
                return { ...row, cols: newCols };
            }
            return row;
        });
        handleRowsChange(newRows);
    };

    const updateSashHandle = (rowIndex: number, colIndex: number, enabled: boolean) => {
        const newRows = grid.rows.map((row, rIdx) => {
            if (rIdx === rowIndex) {
                const newCols = row.cols.map((col, cIdx) => {
                    if (cIdx !== colIndex) return col;
                    const state = col.leaf?.state ?? 'fissa';
                    if (state === 'fissa') return { ...col, handle: false };
                    return { ...col, handle: enabled };
                });
                return { ...row, cols: newCols };
            }
            return row;
        });
        handleRowsChange(newRows);
    };

    const updateSashHorizontalBar = (rowIndex: number, colIndex: number, newOffsetMm: number | null) => {
        const frameVal = grid.frame_mm ?? FRAME_MM;
        const newRows = grid.rows.map((row, rIdx) => {
            if (rIdx !== rowIndex) return row;
            const safeRowHeight = interpretRowHeight(row);
            const baseMin = MULLION_MM / 2;
            const safeMin = Math.min(safeRowHeight / 2, Math.max(baseMin, frameVal * 0.12));
            const maxOffset = Math.max(safeMin, safeRowHeight - safeMin);
            const clampedBottom = typeof newOffsetMm === 'number'
                ? Math.min(maxOffset, Math.max(safeMin, roundMm(newOffsetMm)))
                : null;

            const newCols = row.cols.map((col, cIdx) => {
                if (cIdx !== colIndex) return col;
                const baseLeaf = col.leaf ?? { state: 'fissa' as LeafState };
                const nextLeaf = { ...baseLeaf };

                if (clampedBottom === null) {
                    if (nextLeaf.horizontalBars) delete nextLeaf.horizontalBars;
                } else {
                    nextLeaf.horizontalBars = [{ offset_mm: clampedBottom, origin: 'bottom' }];
                }

                return { ...col, leaf: nextLeaf };
            });
            return { ...row, cols: newCols };
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
            return { ...r, cols: rebalanceColsToTotal(r.cols, totalW, colIndex, newWidthMm, getRowLockedMask(rowIndex)) };
        });
        handleRowsChange(nextRows);
    };

    // --- Handlers for safe editing of numeric fields (row/cols) ---
    const onRowHeightChange = (i: number, v: string) => {
        if (allowMmInput(v)) setRowHeightStr(prev => ({ ...prev, [i]: v }));
    };
    const onRowHeightBlur = (i: number) => {
        const raw = rowHeightStr[i] ?? '';
        if (raw === '') return;
        const parsed = parseMmInput(raw);
        if (parsed === null) return;
        updateRowHeightMm(i, parsed);
        setRowHeightStr(prev => ({ ...prev, [i]: formatMm(parsed) }));
    };

    const onSashCountChange = (i: number, v: string) => {
        if (v === '' || /^\d+$/.test(v)) setSashCountStr(prev => ({ ...prev, [i]: v }));
    };
    const onSashCountBlur = (i: number) => {
        const raw = sashCountStr[i] ?? '';
        const n = raw === '' ? 1 : Math.max(1, Number(raw) || 1);
        handleSashCountChange(i, n);
        setSashCountStr(prev => ({ ...prev, [i]: String(n) }));
    };

    const onColWidthChange = (ri: number, ci: number, v: string) => {
        if (allowMmInput(v)) setColWidthStr(prev => ({ ...prev, [`${ri}.${ci}`]: v }));
    };
    const onColWidthBlur = (ri: number, ci: number) => {
        const key = `${ri}.${ci}`;
        const raw = colWidthStr[key] ?? '';
        if (raw === '') return;
        const parsed = parseMmInput(raw);
        if (parsed === null) return;
        updateColWidthMm(ri, ci, parsed);
        setColWidthStr(prev => ({ ...prev, [key]: formatMm(parsed) }));
    };

    return (
        <div className="space-y-6">
            {/* Titolo personalizzato voce */}
            <section className="space-y-2">
                <div className="text-sm font-medium text-gray-600">Titolo voce</div>
                <input
                    className="input"
                    type="text"
                    placeholder="es. Portafinestra soggiorno"
                    value={(d as any).title ?? ""}
                    onChange={(e) => applyPatch({ title: e.target.value })}
                />
                <div className="text-xs text-gray-500">
                    Usato come titolo in editor e PDF. Se vuoto, verrà mostrato il tipo (es. “Finestra”).
                </div>
            </section>
            <section className="space-y-2">
                <div className="text-sm font-medium text-gray-600">Misure Totali e Quantità</div>
                <div className="grid grid-cols-3 gap-3">
                    {/* Input per Misure Totali e Pezzi */}
                    <div>
                        <label className="text-xs text-gray-500">Largh (mm)</label>
                        <input
                            className="input"
                            type="text"
                            inputMode="decimal"
                            pattern="\\d+([.,]\\d{0,1})?"
                            value={widthStr}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (allowMmInput(v)) setWidthStr(v);
                            }}
                            onBlur={() => {
                                if (widthStr === '') return;
                                handleMeasureUpdate('width_mm', widthStr);
                            }}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500">Altezza (mm)</label>
                        <input
                            className="input"
                            type="text"
                            inputMode="decimal"
                            pattern="\\d+([.,]\\d{0,1})?"
                            value={heightStr}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (allowMmInput(v)) setHeightStr(v);
                            }}
                            onBlur={() => {
                                if (heightStr === '') return;
                                handleMeasureUpdate('height_mm', heightStr);
                            }}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500">Quantità</label>
                        <input
                            className="input"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={qtyStr}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (v === '' || /^\d+$/.test(v)) setQtyStr(v);
                            }}
                            onBlur={() => {
                                // se vuoto, default a 1; altrimenti clamp minimo 1
                                const n = qtyStr === '' ? 1 : Math.max(1, Number(qtyStr) || 1);
                                applyPatch({ qty: n as any });
                                setQtyStr(String(n));
                            }}
                        />
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
                                        className="input"
                                        type="text"
                                        inputMode="decimal"
                                        pattern="\\d+([.,]\\d{0,1})?"
                                        value={rowHeightStr[rowIndex] ?? formatMm(interpretRowHeight(row))}
                                        onChange={(e) => onRowHeightChange(rowIndex, e.target.value)}
                                        onBlur={() => onRowHeightBlur(rowIndex)}
                                        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                        onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500">Numero Ante</label>
                                    <input
                                        className="input"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={sashCountStr[rowIndex] ?? String(row.cols.length)}
                                        onChange={(e) => onSashCountChange(rowIndex, e.target.value)}
                                        onBlur={() => onSashCountBlur(rowIndex)}
                                        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                        onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                                    />
                                    <div className="mt-1 text-xs text-gray-500">
                                        {`≈ ${formatMm(grid.width_mm / Math.max(1, row.cols.length))} mm ad anta`}
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
                                        const state = col.leaf?.state ?? 'fissa';
                                        const canHaveHandle = state !== 'fissa';
                                        const handleChecked = Boolean(col.handle);
                                        const inputId = `handle-${rowIndex}-${colIndex}`;
                                        const currentHandleH = (grid as any).handle_height_mm;
                                        return (
                                            <div className="mt-3 space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <input
                                                        id={inputId}
                                                        type="checkbox"
                                                        className="h-4 w-4"
                                                        checked={handleChecked}
                                                        disabled={!canHaveHandle}
                                                        onChange={(e) => updateSashHandle(rowIndex, colIndex, e.target.checked)}
                                                    />
                                                    <label htmlFor={inputId} className={!canHaveHandle ? 'text-gray-400 line-through' : ''}>
                                                        Maniglia
                                                    </label>
                                                </div>
                                                {handleChecked && (state === 'apre_sx' || state === 'apre_dx') && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <span>Altezza da terra (mm)</span>
                                                        <input
                                                            className="input w-20"
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            placeholder={String(Math.round((grid.height_mm || 1500) / 2))}
                                                            value={currentHandleH != null ? String(currentHandleH) : ''}
                                                            onChange={(e) => {
                                                                const v = e.target.value;
                                                                if (v === '' || /^\d+$/.test(v)) {
                                                                    const num = v === '' ? undefined : Number(v);
                                                                    handleGridChange({ handle_height_mm: num } as any);
                                                                }
                                                            }}
                                                            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                                            onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                    {(() => {
                                        const barKey = `${rowIndex}.${colIndex}`;
                                        const bar = col.leaf?.horizontalBars?.[0];
                                        const hasBar = Boolean(bar);
                                        const checkboxId = `bar-${rowIndex}-${colIndex}`;
                                        const rowHeight = interpretRowHeight(row);
                                        let storedValue = '';
                                        if (bar && Number.isFinite(bar.offset_mm)) {
                                            const raw = Math.max(MIN_MM, Math.min(rowHeight, bar.offset_mm));
                                            const bottomValue = bar.origin === 'bottom'
                                                ? raw
                                                : Math.max(MIN_MM, Math.min(rowHeight, rowHeight - raw));
                                            storedValue = formatMm(bottomValue);
                                        }
                                        return (
                                            <div className="mt-3 space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <input
                                                        id={checkboxId}
                                                        type="checkbox"
                                                        className="h-4 w-4"
                                                        checked={hasBar}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                const frameVal = grid.frame_mm ?? FRAME_MM;
                                                                const baseMin = MULLION_MM / 2;
                                                                const safeMin = Math.min(rowHeight / 2, Math.max(baseMin, frameVal * 0.12));
                                                                const safeMax = Math.max(safeMin, rowHeight - safeMin);
                                                                const rawDefault = rowHeight / 2 || safeMin;
                                                                const defaultOffset = roundMm(Math.min(safeMax, Math.max(safeMin, rawDefault)));
                                                                updateSashHorizontalBar(rowIndex, colIndex, defaultOffset);
                                                                setBarOffsetStr(prev => ({ ...prev, [barKey]: formatMm(defaultOffset) }));
                                                            } else {
                                                                updateSashHorizontalBar(rowIndex, colIndex, null);
                                                                setBarOffsetStr(prev => {
                                                                    const next = { ...prev };
                                                                    delete next[barKey];
                                                                    return next;
                                                                });
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor={checkboxId}>Traverso orizzontale</label>
                                                </div>
                                                {hasBar && (
                                                    <div>
                                                        <label className="text-xs text-gray-500">Altezza dal bordo inferiore (mm)</label>
                                                        <input
                                                            className="input"
                                                            type="text"
                                                            inputMode="decimal"
                                                            pattern="\\d+([.,]\\d{0,1})?"
                                                            value={barOffsetStr[barKey] ?? storedValue}
                                                            onChange={(e) => {
                                                                const v = e.target.value;
                                                                if (allowMmInput(v)) {
                                                                    setBarOffsetStr(prev => ({ ...prev, [barKey]: v }));
                                                                }
                                                            }}
                                                            onBlur={() => {
                                                                const raw = barOffsetStr[barKey] ?? '';
                                                                if (raw === '') return;
                                                                const parsed = parseMmInput(raw);
                                                                if (parsed === null) return;
                                                                updateSashHorizontalBar(rowIndex, colIndex, parsed);
                                                                setBarOffsetStr(prev => ({ ...prev, [barKey]: formatMm(parsed) }));
                                                            }}
                                                            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                                            onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                    {(() => {
                                        // Compute the TOTAL width per-anta (including telai/montanti) from ratios
                                        const colTotalMm = formatMm(col.width_ratio ?? 0);

                                        return (
                                            <div className="mt-2">
                                                <div className="text-[11px] text-gray-400 mb-1">
                                                    {autoSplit
                                                        ? "Auto-ripartizione attiva: larghezze uguali sul totale"
                                                        : "Imposta larghezza TOTALE anta (mm)"}
                                                </div>
                                                {autoSplit ? (
                                                    <div className="text-xs text-gray-600">Larghezza totale stimata: <b>{formatMm(grid.width_mm / Math.max(1, row.cols.length))} mm</b></div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-xs text-gray-500">Larghezza Anta {rowIndex + 1}.{colIndex + 1} (totale mm)</label>
                                                            {(() => {
                                                                const lockKey = `${rowIndex}.${colIndex}`;
                                                                const isLocked = Boolean(colLocked[lockKey]);
                                                                return (
                                                                    <button type="button" title={isLocked ? 'Sblocco misura' : 'Blocca misura'} onClick={() => toggleColLock(rowIndex, colIndex)} className="p-1 rounded">
                                                                        {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                                                                    </button>
                                                                );
                                                            })()}
                                                        </div>
                                                        <input
                                                            className={`input ${Boolean(colLocked[`${rowIndex}.${colIndex}`]) ? 'bg-gray-100' : ''}`}
                                                            type="text"
                                                            inputMode="decimal"
                                                            pattern="\\d+([.,]\\d{0,1})?"
                                                            value={colWidthStr[`${rowIndex}.${colIndex}`] ?? colTotalMm}
                                                            onChange={(e) => onColWidthChange(rowIndex, colIndex, e.target.value)}
                                                            onBlur={() => onColWidthBlur(rowIndex, colIndex)}
                                                            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                                            onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
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
            <section className="space-y-3">
                <div className="text-sm font-medium text-gray-600">Finiture &amp; Dati tecnici</div>
                
                {/* Colore profilo su riga dedicata */}
                <div>
                    <div className="text-xs text-gray-500 mb-1">Colore profilo</div>
                    <RalColorPicker
                        previewColor={(grid as any)?.frame_color ?? '#ffffff'}
                        labelValue={(d as any).color ?? ''}
                        onPreviewColorChange={(hex) => applyPatch({}, ({ frame_color: hex } as any))}
                        onLabelChange={(text) => applyPatch({ color: text })}
                        onRalSelect={(ral) => {
                             applyPatch(
                                { color: `${ral.code} ${ral.name}` }, 
                                { frame_color: ral.hex } as any
                             );
                        }}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* Colore cerniere / ferramenta */}
                    <div>
                        <label className="text-xs text-gray-500">Colore cerniere</label>
                        <input
                            className="input w-full"
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
                            className="input w-full"
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
                            className="input w-full"
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
