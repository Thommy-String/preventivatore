import * as React from "react";
import type { GridWindowConfig, LeafState } from "../types";

type RowBarInfo = {
    positions: Array<{ absMm: number; absPx: number }>;
    startMm: number;
    endMm: number;
    startPx: number;
    endPx: number;
};

export interface WindowSvgProps {
    cfg?: GridWindowConfig;
    radius?: number;
    stroke?: string;
}

const sum = (a: number[]) => (a && a.length ? a.reduce((s, v) => s + v, 0) : 0);
const distributeWidths = (total: number, ratios: number[], decimalPlaces = 0) => {
    if (!ratios.length) return [];
    const scale = Math.pow(10, Math.max(0, decimalPlaces));
    const scaledTotal = Math.round(total * scale);
    const ratioSum = sum(ratios);

    if (ratioSum <= 0) {
        const base = Math.floor(scaledTotal / ratios.length);
        const remainder = scaledTotal - base * ratios.length;
        return ratios.map((_, idx) => (base + (idx === ratios.length - 1 ? remainder : 0)) / scale);
    }

    const raw = ratios.map(r => (scaledTotal * r) / ratioSum);
    const floors = raw.map(v => Math.floor(v));
    let remainder = scaledTotal - sum(floors);
    const result = floors.slice();

    if (remainder < 0) {
        for (let i = result.length - 1; i >= 0 && remainder < 0; i -= 1) {
            const decrease = Math.min(result[i], Math.abs(remainder));
            result[i] -= decrease;
            remainder += decrease;
        }
    }

    if (result.length) {
        const targetIdx = result.length - 1;
        result[targetIdx] += remainder;
    }

    return result.map(v => v / scale);
};
const formatMeasure = (value: number, decimals: number) => {
    if (!Number.isFinite(value)) return "0";
    if (decimals <= 0) return `${Math.round(value)}`;
    const rounded = Number(value.toFixed(decimals));
    const fixed = rounded.toFixed(decimals);
    return fixed.replace(/\.?0+$/, "");
};

function glassFill(glazing: GridWindowConfig["glazing"]) {
    switch (glazing) {
        case "singolo": return "#e6f9ff";
        case "doppio": return "#cfefff";
        case "triplo": return "#b7e0ff";
        case "satinato": return "#f2f2f2";
        default: return "#e6f9ff";
    }
}

function isSatin(glazing: GridWindowConfig["glazing"]) {
    return glazing === "satinato";
}

function makeFallbackCfg(): GridWindowConfig {
    return {
        width_mm: 1200,
        height_mm: 1500,
        frame_mm: 60,
        mullion_mm: 20,
        glazing: 'doppio',
        showDims: true,
        rows: [
            { height_ratio: 1, cols: [{ width_ratio: 1, leaf: { state: 'fissa' } }] }
        ]
    };
}

// --- Componenti di Disegno ---

function OpeningGlyph({ x, y, w, h, state, stroke, strokeWidth }: { x: number; y: number; w: number; h: number; state: LeafState; stroke: string; strokeWidth: number }) {
    const dash = `${strokeWidth * 5} ${strokeWidth * 5}`;
    const drawVasistas = () => <polyline points={`${x},${y + h} ${x + w / 2},${y} ${x + w},${y + h}`} stroke={stroke} strokeDasharray={dash} strokeWidth={strokeWidth} fill="none" />;
    const drawApreSx = () => <polyline points={`${x + w},${y} ${x},${y + h / 2} ${x + w},${y + h}`} stroke={stroke} strokeDasharray={dash} strokeWidth={strokeWidth} fill="none" />;
    const drawApreDx = () => <polyline points={`${x},${y} ${x + w},${y + h / 2} ${x},${y + h}`} stroke={stroke} strokeDasharray={dash} strokeWidth={strokeWidth} fill="none" />;
    
    // ... (codice per le frecce, non rilevante per la maniglia)
    const drawArrow = (direction: 'left' | 'right') => {
        const arrowHeight = Math.min(h * 0.5, 100);
        const arrowWidth = arrowHeight * 3;
        const midY = y + h / 2;
        const midX = x + w / 2;
        const startX = direction === 'left' ? midX + arrowWidth / 2 : midX - arrowWidth / 2;
        const endX = direction === 'left' ? midX - arrowWidth / 2 : midX + arrowWidth / 2;
        const arrowHead = direction === 'left'
            ? `${endX + arrowHeight / 2},${midY - arrowHeight / 2} ${endX},${midY} ${endX + arrowHeight / 2},${midY + arrowHeight / 2}`
            : `${endX - arrowHeight / 2},${midY - arrowHeight / 2} ${endX},${midY} ${endX - arrowHeight / 2},${midY + arrowHeight / 2}`;
        return (
            <g stroke={stroke} strokeWidth={strokeWidth * 1.5} fill="none" strokeLinecap="round" strokeLinejoin="round">
                <line x1={startX} y1={midY} x2={endX} y2={midY} />
                <polyline points={arrowHead} />
            </g>
        );
    };

    switch (state) {
        case "fissa": return null;
        case "vasistas": return drawVasistas();
        case "apre_sx": return drawApreSx();
        case "apre_dx": return drawApreDx();
        case "apre_sx+vasistas": return <g>{drawApreSx()}{drawVasistas()}</g>;
        case "apre_dx+vasistas": return <g>{drawApreDx()}{drawVasistas()}</g>;
        case "scorrevole_sx": return drawArrow('left');
        case "scorrevole_dx": return drawArrow('right');
        default: return null;
    }
}

type HandlePlacement = 'left' | 'right' | 'top' | null;

// ## Logica di Posizionamento Corretta
// Questa funzione determina su quale lato dell'anta va la maniglia.
function handlePlacementForState(state?: LeafState): HandlePlacement {
    switch (state) {
        // Cerniere a SX (apre_sx), quindi la maniglia va sul montante DESTRO dell'anta.
        case 'apre_sx':
        case 'scorrevole_sx':
        case 'apre_sx+vasistas':
            return 'right'; 
        // Cerniere a DX (apre_dx), quindi la maniglia va sul montante SINISTRO dell'anta.
        case 'apre_dx':
        case 'scorrevole_dx':
        case 'apre_dx+vasistas':
            return 'left'; 
        // Apertura a vasistas, la maniglia va sul traverso SUPERIORE dell'anta.
        case 'vasistas':
            return 'top'; 
        default:
            return null;
    }
}

// --- Renderer SVG Principale ---
function WindowSvg({ cfg, radius = 6, stroke = "#222" }: WindowSvgProps) {
    const safe = cfg ?? makeFallbackCfg();

    const { width_mm, height_mm, rows, frame_mm, mullion_mm, glazing } = safe;
    const showDims = safe.showDims !== false;

    const innerW = width_mm - frame_mm * 2;
    const innerH = height_mm - frame_mm * 2;
    const totalRowsGapY = (rows.length - 1) * mullion_mm;
    const usableH = innerH - totalRowsGapY;
    const totalRowRatios = sum(rows.map(r => r.height_ratio));

    const baseDim = Math.max(60, Math.min(width_mm, height_mm));
    const strokeWidth = Math.max(1.0, Math.min(5.0, baseDim / 400));
    const baseFont = Math.max(9, Math.min(24, baseDim / 28));
    const MIN_MEASURE_FONT = 60;
    const MAX_MEASURE_FONT = 120;
    const desiredMeasureFont = Math.max(baseFont * 10.2, baseFont + 80, width_mm / 60, height_mm / 60);
    const sashFontSize = Math.min(Math.max(desiredMeasureFont, MIN_MEASURE_FONT), MAX_MEASURE_FONT);
    const totalFontSize = sashFontSize;
    const sashMeasureDecimals = 1;

    const labelGap = Math.max(26, Math.min(48, baseDim / 9));
    let padRight = Math.max(6, baseFont * 0.5);
    const padLeft = labelGap + totalFontSize * 1.3;

    const topRowIndices = rows.length > 0 ? [0] : [];
    const bottomRowIndices = rows.length > 1 ? rows.map((_, idx) => idx).filter((idx) => idx !== 0) : [];
    const topRowOrder = new Map<number, number>();
    topRowIndices.forEach((idx, order) => topRowOrder.set(idx, order));
    const bottomRowOrder = new Map<number, number>();
    bottomRowIndices.forEach((idx, order) => bottomRowOrder.set(idx, order));

    const sashLabelBaseOffset = Math.max(70, sashFontSize * 1.15);
    const sashLabelStep = Math.max(48, sashFontSize);

    const topLabelsArea = topRowIndices.length > 0 ? sashLabelBaseOffset + (topRowIndices.length - 1) * sashLabelStep + sashFontSize : 0;
    const bottomLabelsArea = bottomRowIndices.length > 0 ? sashLabelBaseOffset + (bottomRowIndices.length - 1) * sashLabelStep + sashFontSize : 0;
    const bottomStackHeight = bottomLabelsArea;

    const basePadTop = Math.max(6, baseFont * 0.5);
    const basePadBottom = labelGap + baseFont * 1.1;
    let padTop = basePadTop + topLabelsArea;
    let padBottom = basePadBottom + bottomLabelsArea + totalFontSize * 1.4 + labelGap;
    // ensure frame stroke is visible in exported PDF (avoid being clipped)
    padTop += strokeWidth;
    padBottom += strokeWidth;

    const satinPatternId = React.useMemo(() => `satin-dots-pfeli3`, []);
    const dimensionLineDash = `${strokeWidth * 3.5} ${strokeWidth * 2.2}`;
    const handleColor = '#333';
    const frameColor = (safe as any).frame_color ?? stroke;
    const outlineColor = '#000';

    const drawing = rows.reduce((acc, row, rowIdx) => {
        const rowH = (usableH * row.height_ratio) / totalRowRatios;
        const y0 = frame_mm + acc.offsetY;
        const rowTopMm = acc.offsetMm;
        const rowMm = row.height_ratio > 0 ? row.height_ratio : height_mm / Math.max(1, rows.length);
        acc.rowDimensions.push({ rowIdx, top: y0, bottom: y0 + rowH, heightMm: rowMm });

        const totalColsGapX = (row.cols.length - 1) * mullion_mm;
        const usableW = innerW - totalColsGapX;
        const ratioValues = row.cols.map(c => Number.isFinite(c.width_ratio) && c.width_ratio > 0 ? c.width_ratio : 1);
        const ratioSum = sum(ratioValues);
        const safeRatioSum = ratioSum > 0 ? ratioSum : row.cols.length;
        const labelNumbers = distributeWidths(width_mm, ratioValues, sashMeasureDecimals);

        let xCursor = frame_mm;
        const colLabels: Array<{ x: number; text: string; start: number; end: number }> = [];

        const pxPerMmRow = rowMm > 0 ? rowH / rowMm : 0;
        const mullionPx = pxPerMmRow > 0 ? pxPerMmRow * mullion_mm : mullion_mm;
        let rowHasNewSegment = false;

        let rowBarInfo = acc.rowBars.get(rowIdx);
        if (!rowBarInfo) {
            rowBarInfo = {
                positions: [],
                startMm: rowTopMm,
                endMm: rowTopMm + rowMm,
                startPx: rowTopMm,
                endPx: rowTopMm + rowMm,
            };
            acc.rowBars.set(rowIdx, rowBarInfo);
        }

        row.cols.forEach((col, colIdx) => {
            const startX = xCursor;
            const colW = (usableW * ratioValues[colIdx]) / safeRatioSum;
            
            const sashInset = frame_mm * 0.15;
            const gx = startX + sashInset;
            const gy = y0 + sashInset;
            const gw = colW - sashInset * 2;
            const gh = rowH - sashInset * 2;

            const sashGlazing = col.glazing ?? glazing;

            // draw vertical divider BEFORE the glass of this column when it's not the first column
            if (colIdx > 0) {
                const vx = startX - (mullion_mm / 2); // center of the mullion gap
                const rectX = vx - mullion_mm / 2; // left edge of mullion fill
                const rectW = mullion_mm;

                // filled area of the mullion (solid color)
                acc.nodes.push(
                    <rect
                        key={`vm-fill-${rowIdx}-${colIdx}`}
                        x={rectX}
                        y={y0}
                        width={rectW}
                        height={rowH}
                        fill={frameColor}
                    />
                );

                // (removed small white gap to avoid white contour between mullion and glass)
            }

            acc.nodes.push(<g key={`g-${rowIdx}-${colIdx}`}><rect x={gx} y={gy} width={gw} height={gh} fill={glassFill(sashGlazing)} stroke={outlineColor} strokeWidth={strokeWidth / 1.5} />{isSatin(sashGlazing) && (<rect x={gx} y={gy} width={gw} height={gh} fill={`url(#${satinPatternId})`} opacity={0.6} />)}</g>);

            const bars = col.leaf?.horizontalBars ?? [];
            if (bars.length && pxPerMmRow > 0) {
                const sortedBars = [...bars].sort((a, b) => (a?.offset_mm ?? 0) - (b?.offset_mm ?? 0));

                sortedBars.forEach((bar, barIdx) => {
                    const rawOffset = Number(bar?.offset_mm);
                    if (!Number.isFinite(rawOffset)) return;

                    const offsetBottomMm = bar?.origin === 'bottom'
                        ? rawOffset
                        : rowMm - rawOffset;

                    const baseMin = mullion_mm / 2;
                    const safeMin = Math.min(rowMm / 2, Math.max(baseMin, frame_mm * 0.12));
                    const safeMax = Math.max(safeMin, rowMm - safeMin);
                    const clampedBottomMm = Math.min(safeMax, Math.max(safeMin, offsetBottomMm));
                    const offsetTopMm = rowMm - clampedBottomMm;

                    const centerY = y0 + offsetTopMm * pxPerMmRow;
                    const availableTop = y0 + (mullionPx / 2);
                    const availableBottom = y0 + rowH - (mullionPx / 2);
                    const clampedY = Math.max(availableTop, Math.min(availableBottom, centerY));

                    const barHeight = Math.max(mullionPx * 0.7, strokeWidth * 4);
                    const barTop = Math.max(y0, clampedY - barHeight / 2);
                    const maxTop = y0 + rowH - barHeight;
                    const finalTop = Math.min(barTop, maxTop);
                    const finalBottom = finalTop + barHeight;

                    const bodyX = startX;
                    const bodyWidth = colW;
                    const frameStroke = Math.max(strokeWidth / 1.5, 0.9);
                    const innerInset = Math.max(frameStroke * 0.9, strokeWidth * 1.4);

                    const innerWidth = bodyWidth - innerInset * 2;
                    const innerHeight = barHeight - innerInset * 2;
                    const innerX = bodyX + innerInset;
                    const innerY = finalTop + innerInset;

                    if (pxPerMmRow > 0) {
                        const barMmAbs = rowTopMm + offsetTopMm;
                        rowBarInfo.positions.push({ absMm: barMmAbs, absPx: clampedY });
                    }

                    acc.nodes.push(
                        <g key={`hb-${rowIdx}-${colIdx}-${barIdx}`}>
                            <rect
                                x={bodyX}
                                y={finalTop}
                                width={bodyWidth}
                                height={barHeight}
                                fill="#dfe3ea"
                            />
                            <line
                                x1={bodyX}
                                y1={finalTop}
                                x2={bodyX + bodyWidth}
                                y2={finalTop}
                                stroke={outlineColor}
                                strokeWidth={frameStroke}
                            />
                            <line
                                x1={bodyX}
                                y1={finalBottom}
                                x2={bodyX + bodyWidth}
                                y2={finalBottom}
                                stroke={outlineColor}
                                strokeWidth={frameStroke}
                            />
                            {innerWidth > 0 && innerHeight > 0 && (
                                <rect
                                    x={innerX}
                                    y={innerY}
                                    width={innerWidth}
                                    height={innerHeight}
                                    fill="#f8fafc"
                                />
                            )}
                            <line
                                x1={bodyX + frameStroke}
                                y1={finalTop + frameStroke * 0.8}
                                x2={bodyX + bodyWidth - frameStroke}
                                y2={finalTop + frameStroke * 0.8}
                                stroke="#ffffff"
                                strokeWidth={frameStroke / 2}
                                strokeLinecap="round"
                                opacity={0.6}
                            />
                            <line
                                x1={bodyX + frameStroke * 0.6}
                                y1={finalBottom - frameStroke * 0.8}
                                x2={bodyX + bodyWidth - frameStroke * 0.6}
                                y2={finalBottom - frameStroke * 0.8}
                                stroke="rgba(30, 41, 59, 0.25)"
                                strokeWidth={frameStroke / 1.5}
                                strokeLinecap="round"
                            />
                        </g>
                    );
                });
            }
            acc.nodes.push(<OpeningGlyph key={`o-${rowIdx}-${colIdx}`} x={gx} y={gy} w={gw} h={gh} state={col.leaf?.state ?? "fissa"} stroke={outlineColor} strokeWidth={strokeWidth} />);

            const outerStartRaw = colIdx === 0 ? 0 : startX - (mullion_mm / 2);
            const outerEndRaw = colIdx === row.cols.length - 1 ? width_mm : startX + colW + (mullion_mm / 2);
            const outerStart = Math.max(0, Math.min(width_mm, outerStartRaw));
            const outerEnd = Math.max(0, Math.min(width_mm, outerEndRaw));
            const outerWidth = Math.max(0, outerEnd - outerStart);
            const labelValue = colIdx < labelNumbers.length ? labelNumbers[colIdx] : outerWidth;
            const labelText = formatMeasure(labelValue, sashMeasureDecimals);
            const segmentKey = `${Math.round(outerStart)}-${Math.round(outerEnd)}`;
            if (!acc.seenSegments.has(segmentKey)) {
                rowHasNewSegment = true;
                acc.seenSegments.add(segmentKey);
            }

            colLabels.push({ x: (outerStart + outerEnd) / 2, text: labelText, start: outerStart, end: outerEnd });

            // ## BLOCCO MANIGLIA: Stile e Posizionamento Definitivi
            if (col.handle) {
                const placement = handlePlacementForState(col.leaf?.state);
                let handleSvg = null;

                // Dimensioni relative al telaio, per uno stile consistente
                const vRectWidth = frame_mm * 0.22;
                const vRectHeight = frame_mm * 1.0;
                const hRectWidth = frame_mm * 0.75;
                const hRectHeight = frame_mm * 0.22;

                if (placement === 'left' || placement === 'right') {
                    // Centro verticale
                    const y = y0 + rowH / 2;
                    // Centro orizzontale, calcolato per essere SUL TELAIO
                    const x = placement === 'left'
                        ? startX + frame_mm / 2
                        : startX + colW - frame_mm / 2;

                    handleSvg = (
                        <g transform={`translate(${x}, ${y})`} fill={handleColor}>
                            <rect x={-vRectWidth / 2} y={-vRectHeight / 2} width={vRectWidth} height={vRectHeight} />
                            <rect x={-hRectWidth / 2} y={-vRectHeight / 2 - hRectHeight} width={hRectWidth} height={hRectHeight} />
                        </g>
                    );
                } else if (placement === 'top') {
                    // Centro orizzontale
                    const x = startX + colW / 2;
                    // Centro verticale, calcolato per essere SUL TELAIO
                    const y = y0 + frame_mm / 2;

                    handleSvg = (
                        <g transform={`translate(${x}, ${y})`} fill={handleColor}>
                            <rect x={-vRectHeight / 2} y={-vRectWidth / 2} width={vRectHeight} height={vRectWidth} />
                            <rect x={vRectHeight / 2} y={-hRectWidth / 2} width={hRectHeight} height={hRectWidth} />
                        </g>
                    );
                }

                if (handleSvg) {
                    acc.nodes.push(<g key={`handle-${rowIdx}-${colIdx}`}>{handleSvg}</g>);
                }
            }

            xCursor += colW + mullion_mm;
        });

        // horizontal divider lines removed to match requested style

        if (colLabels.length > 0 && rowHasNewSegment) {
            let labelY: number | null = null, position: "top" | "bottom" | null = null;
            let skipForTopDuplicate = false;

            if (topRowOrder.has(rowIdx)) {
                const singleFullWidth = colLabels.length === 1
                    && Math.abs(colLabels[0].start) < 0.5
                    && Math.abs(colLabels[0].end - width_mm) < 0.5;
                if (singleFullWidth) {
                    skipForTopDuplicate = true;
                } else {
                    labelY = -(sashLabelBaseOffset + topRowOrder.get(rowIdx)! * sashLabelStep);
                    position = "top";
                }
            } else if (bottomRowOrder.has(rowIdx)) {
                labelY = height_mm + sashLabelBaseOffset + bottomRowOrder.get(rowIdx)! * sashLabelStep;
                position = "bottom";
            }
            if (!skipForTopDuplicate && labelY !== null && position) {
                acc.rowLabels.push({ rowIdx, y: labelY, position, rowTop: y0, rowBottom: y0 + rowH, labels: colLabels });
            }
        }

        acc.offsetY += rowH + mullion_mm;
        acc.offsetMm += row.height_ratio + (rowIdx < rows.length - 1 ? mullion_mm : 0);
        return acc;
    }, {
        nodes: [] as React.ReactNode[],
        offsetY: 0,
        offsetMm: 0,
        rowLabels: [] as Array<{ rowIdx: number; y: number; position: "top" | "bottom"; rowTop: number; rowBottom: number; labels: Array<{ x: number; text: string; start: number; end: number }>; }>,
        rowDimensions: [] as Array<{ rowIdx: number; top: number; bottom: number; heightMm: number }>,
        seenSegments: new Set<string>(),
        rowBars: new Map<number, RowBarInfo>(),
        mullionLines: [] as Array<{ x: number; y1: number; y2: number; width: number }>,
        horzLines: [] as Array<{ x1: number; x2: number; y: number; width: number }>
    });

    const rowHeightSegments = rows.length > 1
        ? drawing.rowDimensions
            .map(({ top, bottom, heightMm }) => {
                const safeHeight = Math.max(0, heightMm);
                if (safeHeight <= 0.05) return null;
                return {
                    startPx: top,
                    endPx: bottom,
                    midPx: (top + bottom) / 2,
                    label: formatMeasure(safeHeight, sashMeasureDecimals)
                };
            })
            .filter((seg): seg is { startPx: number; endPx: number; midPx: number; label: string } => Boolean(seg))
        : [];

    const barDimensionRows = Array.from(drawing.rowBars.entries())
        .map(([rowIdx, info]) => {
            if (!info.positions.length) return null;
            const sorted = info.positions
                .filter(p => Number.isFinite(p?.absMm) && Number.isFinite(p?.absPx))
                .sort((a, b) => a.absMm - b.absMm);
            if (!sorted.length) return null;
            const dedup: Array<{ absMm: number; absPx: number }> = [];
            sorted.forEach(pos => {
                if (!dedup.length || Math.abs(dedup[dedup.length - 1].absMm - pos.absMm) > 0.05) {
                    dedup.push(pos);
                }
            });
            if (!dedup.length) return null;

            const boundaries: Array<{ absMm: number; absPx: number; type: 'frame' | 'bar' }> = [
                { absMm: info.startMm, absPx: info.startPx, type: 'frame' },
                ...dedup.map(p => ({ absMm: p.absMm, absPx: p.absPx, type: 'bar' as const })),
                { absMm: info.endMm, absPx: info.endPx, type: 'frame' }
            ];

            const segments: Array<{ startPx: number; endPx: number; midPx: number; label: string }> = [];
            const boundarySet = new Set<number>();

            for (let i = 0; i < boundaries.length - 1; i += 1) {
                const start = boundaries[i];
                const end = boundaries[i + 1];
                const lengthMm = end.absMm - start.absMm;
                if (lengthMm <= 0.05) continue;
                if (start.type !== 'bar' && end.type !== 'bar') continue;
                const label = formatMeasure(lengthMm, sashMeasureDecimals);
                const midPx = (start.absPx + end.absPx) / 2;
                boundarySet.add(start.absPx);
                boundarySet.add(end.absPx);
                segments.push({ startPx: start.absPx, endPx: end.absPx, midPx, label });
            }

            if (!segments.length) return null;

            return { rowIdx, segments, boundaries: Array.from(boundarySet).sort((a, b) => a - b) };
        })
        .filter((entry): entry is { rowIdx: number; segments: Array<{ startPx: number; endPx: number; midPx: number; label: string }>; boundaries: number[] } => Boolean(entry));

    const rightDimensionBaseOffset = labelGap + totalFontSize * 1.4;
    const rightDimensionSpacing = totalFontSize * 1.8;

    const totalRightGroups = (rowHeightSegments.length ? 1 : 0) + barDimensionRows.length;

    if (totalRightGroups > 0) {
        const requiredPad = rightDimensionBaseOffset + (totalRightGroups - 1) * rightDimensionSpacing + totalFontSize * 1.6;
        padRight = Math.max(padRight, requiredPad);
    }

    type DimensionSegment = { startPx: number; endPx: number; midPx: number; label: string };
    type DimensionGroup = {
        lineX: number;
        extX: number;
        textX: number;
        segments: DimensionSegment[];
        boundaries: number[];
    };

    const rightDimensionGroups: DimensionGroup[] = [];
    let dimensionGroupIndex = 0;
    const pushDimensionGroup = (segments: DimensionSegment[], boundaries: number[]) => {
        if (!segments.length) return;
        const sortedBoundaries = boundaries.slice().sort((a, b) => a - b);
        const lineX = width_mm + rightDimensionBaseOffset + dimensionGroupIndex * rightDimensionSpacing;
        const extX = lineX - totalFontSize * 0.6;
        const textX = lineX + totalFontSize * 0.45;
        rightDimensionGroups.push({ lineX, extX, textX, segments, boundaries: sortedBoundaries });
        dimensionGroupIndex += 1;
    };

    if (rowHeightSegments.length) {
        const boundarySet = new Set<number>();
        rowHeightSegments.forEach(seg => {
            boundarySet.add(seg.startPx);
            boundarySet.add(seg.endPx);
        });
        pushDimensionGroup(rowHeightSegments, Array.from(boundarySet));
    }

    barDimensionRows.forEach(entry => {
        pushDimensionGroup(entry.segments, entry.boundaries);
    });

    const totalLabelY = height_mm + bottomStackHeight + labelGap + totalFontSize * 0.9;
    const leftLabelX = -(labelGap + totalFontSize * 0.75);
    const labelLineGap = totalFontSize * 0.6;
    
    return (
        <svg
            viewBox={`${-padLeft} ${-padTop} ${width_mm + padLeft + padRight} ${height_mm + padTop + padBottom}`}
            width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Anteprima finestra">
            <defs>
                <pattern id={satinPatternId} patternUnits="userSpaceOnUse" width={30} height={30}>
                    <rect x="0" y="0" width={30} height={30} fill="transparent" />
                    <circle cx={7.5} cy={7.5} r={3} fill="#d1d5db" />
                </pattern>
            </defs>
            <rect x={0} y={0} width={width_mm} height={height_mm} rx={radius} ry={radius} fill={frameColor} />
            <rect x={strokeWidth / 2} y={strokeWidth / 2} width={width_mm - strokeWidth} height={height_mm - strokeWidth} rx={radius} ry={radius} fill="none" stroke={outlineColor} strokeWidth={strokeWidth} />
            <rect x={frame_mm} y={frame_mm} width={innerW} height={innerH} fill={frameColor} stroke="none" />
            {drawing.nodes}
            {/* overlay strokes for mullions and traverses to ensure visible contours (stroke-only to avoid covering glass glyphs) */}
            {/* mullion and horizontal dividers drawn as lines inside nodes; overlays removed to preserve exact line structure */}
            {showDims && drawing.rowLabels.length > 0 && (
                <>
                    <g stroke={outlineColor} strokeWidth={strokeWidth / 1.5} strokeDasharray={dimensionLineDash} fill="none">
                        {drawing.rowLabels.map(row => {
                            const fromY = row.position === "top" ? 0 : height_mm;
                            const targetY = row.position === "top" ? row.y + labelLineGap : row.y - labelLineGap;
                            return row.labels.flatMap((label, idx) => ([
                                <line key={`row-ext-start-${row.rowIdx}-${idx}`} x1={label.start} y1={fromY} x2={label.start} y2={targetY} />,
                                <line key={`row-ext-end-${row.rowIdx}-${idx}`} x1={label.end} y1={fromY} x2={label.end} y2={targetY} />,
                            ]));
                        })}
                    </g>
                    <g style={{ fontFamily: 'sans-serif', textAnchor: 'middle', fill: '#1f2937', fontSize: sashFontSize }}>
                        {drawing.rowLabels.map(({ rowIdx, y, labels }) =>
                            labels.map((label, idx) => (
                                <text key={`row-label-${rowIdx}-${idx}`} x={label.x} y={y} dominantBaseline="middle">{label.text}</text>
                            ))
                        )}
                    </g>
                </>
            )}
            {showDims && (
                <>
                    <g stroke={outlineColor} strokeWidth={strokeWidth / 1.5} strokeDasharray={dimensionLineDash} fill="none">
                        <line x1={0} y1={height_mm} x2={0} y2={totalLabelY - labelLineGap} />
                        <line x1={width_mm} y1={height_mm} x2={width_mm} y2={totalLabelY - labelLineGap} />
                        <line x1={0} y1={0} x2={leftLabelX + labelLineGap} y2={0} />
                        <line x1={0} y1={height_mm} x2={leftLabelX + labelLineGap} y2={height_mm} />
                    </g>
                    <g style={{ fontFamily: 'sans-serif', textAnchor: 'middle', fill: '#1f2937', fontSize: totalFontSize }}>
                        {/* total width label removed per request */}
                        <text x={leftLabelX} y={height_mm / 2} transform={`rotate(-90, ${leftLabelX}, ${height_mm / 2})`} dominantBaseline="middle">{Math.round(height_mm)}</text>
                    </g>
                </>
            )}
            {showDims && rightDimensionGroups.length > 0 && (
                <>
                    <g stroke={outlineColor} strokeWidth={strokeWidth / 1.5} strokeDasharray={dimensionLineDash} fill="none">
                        {rightDimensionGroups.flatMap((group, groupIdx) =>
                            group.boundaries.map((y, boundaryIdx) => (
                                <line key={`bar-ext-${groupIdx}-${boundaryIdx}`} x1={width_mm} y1={y} x2={group.extX} y2={y} />
                            ))
                        )}
                        {rightDimensionGroups.flatMap((group, groupIdx) =>
                            group.segments.map((seg, segIdx) => (
                                <line key={`bar-line-${groupIdx}-${segIdx}`} x1={group.lineX} y1={seg.startPx} x2={group.lineX} y2={seg.endPx} />
                            ))
                        )}
                    </g>
                    <g style={{ fontFamily: 'sans-serif', textAnchor: 'middle', fill: '#1f2937', fontSize: sashFontSize }}>
                        {rightDimensionGroups.flatMap((group, groupIdx) =>
                            group.segments.map((seg, segIdx) => (
                                <text
                                    key={`bar-label-${groupIdx}-${segIdx}`}
                                    x={group.textX}
                                    y={seg.midPx}
                                    transform={`rotate(-90, ${group.textX}, ${seg.midPx})`}
                                    dominantBaseline="middle"
                                >
                                    {seg.label}
                                </text>
                            ))
                        )}
                    </g>
                </>
            )}
        </svg>
    );
}

export default WindowSvg;
export { WindowSvg };
