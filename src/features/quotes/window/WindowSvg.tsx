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

// Colori tecnici (fedeli al riferimento)
const OPENING_COLOR_SIDE = '#888888';  // grigio standard
const OPENING_COLOR_TILT = '#E6B000';  // giallo dorato

// Definizione stile tecnico
const TECH_STYLE = {
    FRAME_FILL: '#FFFFFF',
    FRAME_STROKE: '#222222',
    GLASS_FILL: '#D6EFFF',
    GLASS_STROKE: '#222222',
    BEAD_STROKE: '#222222',
    STROKE_WIDTH_FRAME: 1.5,
    STROKE_WIDTH_SASH: 2.5, // Linea anta più spessa
    STROKE_WIDTH_BEAD: 1.5,
    STROKE_WIDTH_GLASS: 0.9,
};

function OpeningGlyph({ x, y, w, h, state }: { x: number; y: number; w: number; h: number; state: LeafState; stroke: string; strokeWidth: number }) {
    const sideStroke = 2; // Linee apertura più spesse
    const tiltStroke = 2.2;
    // Tratteggio per linee apertura (più grande)
    const dash = "12, 8";
    
    // Vasistas: triangolo dal basso verso l'alto (linee dorate)
    const drawVasistas = () => (
        <polygon 
            points={`${x},${y + h} ${x + w / 2},${y} ${x + w},${y + h}`} 
            stroke={OPENING_COLOR_TILT} 
            strokeWidth={tiltStroke} 
            fill="none" 
            strokeLinejoin="round"
        />
    );
    
    // Apre a sinistra: linee dal centro-sinistra agli angoli destri (grigio tratteggiato)
    const drawApreSx = () => (
        <polyline 
            points={`${x + w},${y} ${x},${y + h / 2} ${x + w},${y + h}`} 
            stroke={OPENING_COLOR_SIDE} 
            strokeWidth={sideStroke} 
            strokeDasharray={dash}
            fill="none"
            strokeLinejoin="round"
        />
    );
    
    // Apre a destra: linee dal centro-destra agli angoli sinistri (grigio tratteggiato)
    const drawApreDx = () => (
        <polyline 
            points={`${x},${y} ${x + w},${y + h / 2} ${x},${y + h}`} 
            stroke={OPENING_COLOR_SIDE} 
            strokeWidth={sideStroke} 
            strokeDasharray={dash}
            fill="none"
            strokeLinejoin="round"
        />
    );
    
    // Frecce per scorrevoli
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
            <g stroke={OPENING_COLOR_SIDE} strokeWidth={sideStroke * 1.5} fill="none" strokeLinecap="round" strokeLinejoin="round">
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
function WindowSvg({ cfg }: WindowSvgProps) {
    const safe = cfg ?? makeFallbackCfg();

    // Estrai frame_mm originale, ma per il disegno tecnico usiamo un valore forzato "Sottile"
    // per il telaio esterno (L frame), pur mantenendo l'anta (Z sash) molto spessa.
    const { width_mm, height_mm, rows, mullion_mm, glazing } = safe;
    const showDims = safe.showDims !== false;

    // OVERRIDE VISIVO: Telaio esterno sottile (34mm) vs Anta spessa (55mm+)
    // Aumentato leggermente da 28 a 34 su richiesta
    const frame_mm = 34;

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
    const frameColor = (safe as any).frame_color ?? '#ffffff';
    // Ensure a visible contour: prefer explicit `outline_color`, otherwise default to black
    const outlineColor = (safe as any).outline_color ?? '#000';

    const drawing = rows.reduce((acc, row, rowIdx) => {
        const rowH = (usableH * row.height_ratio) / totalRowRatios; // actual row height in mm
        const y0 = frame_mm + acc.offsetY;
        const logicalRatio = Number.isFinite(row.height_ratio) && row.height_ratio > 0
            ? row.height_ratio
            : (1 / Math.max(1, rows.length));
        const rowStartLogicalMm = acc.offsetLogicalMm;
        const rowHeightLogicalMm = logicalRatio * height_mm;
        const rowEndLogicalMm = rowStartLogicalMm + rowHeightLogicalMm;
        const rowHeightMm = rowH;
        acc.rowDimensions.push({ rowIdx, top: y0, bottom: y0 + rowH, heightMm: rowHeightMm });

        // Ante si toccano direttamente (nessun gap montante, come nel riferimento)
        const usableW = innerW;
        const ratioValues = row.cols.map(c => Number.isFinite(c.width_ratio) && c.width_ratio > 0 ? c.width_ratio : 1);
        const ratioSum = sum(ratioValues);
        const safeRatioSum = ratioSum > 0 ? ratioSum : row.cols.length;
        const labelNumbers = distributeWidths(width_mm, ratioValues, sashMeasureDecimals);

        let xCursor = frame_mm;
        const colLabels: Array<{ x: number; text: string; start: number; end: number }> = [];

        const pxPerMmRow = rowHeightMm > 0 ? rowH / rowHeightMm : 0;
        const mullionPx = pxPerMmRow > 0 ? pxPerMmRow * mullion_mm : mullion_mm;
        let rowHasNewSegment = false;

        let rowBarInfo = acc.rowBars.get(rowIdx);
        if (!rowBarInfo) {
            const rowStartAbs = rowIdx === 0 ? 0 : (y0 - (mullion_mm / 2));
            const rowEndAbs = rowIdx === rows.length - 1 ? height_mm : (y0 + rowH + (mullion_mm / 2));
            rowBarInfo = {
                positions: [],
                startMm: rowStartLogicalMm,
                endMm: rowEndLogicalMm,
                startPx: rowStartAbs,
                endPx: rowEndAbs,
            };
            acc.rowBars.set(rowIdx, rowBarInfo);
        }

        row.cols.forEach((col, colIdx) => {
            const startX = xCursor;
            const colW = (usableW * ratioValues[colIdx]) / safeRatioSum;
            
            // Calcolo dimensioni profili (style tecnico)
            // Sash Frame: ~55mm visuali (Molto più spessa)
            // Nota: frame_mm aumentato a 34, aggiustato moltiplicatore per mantenere anta sui 55-60
            const sashProfileW = Math.max(55, frame_mm * 1.7); 
            // Fermavetro:ampiezza o spessore
            const beadProfileW = 14;

            // 1. Sash Frame Extents
            const sx = startX;
            const sy = y0;
            const sw = colW;
            const sh = rowH;

            // 2. Bead Extents
            const bx = sx + sashProfileW;
            const by = sy + sashProfileW;
            const bw = Math.max(0, sw - (sashProfileW * 2));
            const bh = Math.max(0, sh - (sashProfileW * 2));

            // 3. Glass Extents
            const gx = bx + beadProfileW;
            const gy = by + beadProfileW;
            const gw = Math.max(0, bw - (beadProfileW * 2));
            const gh = Math.max(0, bh - (beadProfileW * 2));

            const sashGlazing = col.glazing ?? glazing;

            // Anta: 3 livelli di rettangoli (Telaio Anta -> Fermavetro -> Vetro)
            acc.nodes.push(
                <g key={`sash-group-${rowIdx}-${colIdx}`}>
                    {/* 1. Telaio Anta (Colorato, bordo più spesso) */}
                    <rect 
                        x={sx} y={sy} width={sw} height={sh} 
                        fill={frameColor} 
                        stroke={TECH_STYLE.FRAME_STROKE} 
                        strokeWidth={TECH_STYLE.STROKE_WIDTH_SASH} 
                    />
                    
                    {/* 2. Fermavetro (Colorato, bordo medio) */}
                    <rect 
                        x={bx} y={by} width={bw} height={bh} 
                        fill={frameColor} 
                        stroke={TECH_STYLE.BEAD_STROKE || TECH_STYLE.FRAME_STROKE} 
                        strokeWidth={TECH_STYLE.STROKE_WIDTH_BEAD} 
                    />

                    {/* 3. Vetro (Azzurro, bordo sottile) */}
                    <rect 
                        x={gx} y={gy} width={gw} height={gh} 
                        fill={isSatin(sashGlazing) ? '#E0E0E0' : TECH_STYLE.GLASS_FILL} 
                        stroke={TECH_STYLE.GLASS_STROKE || TECH_STYLE.FRAME_STROKE} 
                        strokeWidth={TECH_STYLE.STROKE_WIDTH_GLASS} 
                    />

                    {isSatin(sashGlazing) && (
                        <rect x={gx} y={gy} width={gw} height={gh} fill={`url(#${satinPatternId})`} opacity={0.6} />
                    )}
                </g>
            );

            const bars = col.leaf?.horizontalBars ?? [];
            if (bars.length && pxPerMmRow > 0) {
                const sortedBars = [...bars].sort((a, b) => (a?.offset_mm ?? 0) - (b?.offset_mm ?? 0));

                sortedBars.forEach((bar, barIdx) => {
                    const rawOffset = Number(bar?.offset_mm);
                    if (!Number.isFinite(rawOffset)) return;

                    const offsetBottomMm = bar?.origin === 'bottom'
                        ? rawOffset
                        : rowHeightMm - rawOffset;

                    const baseMin = mullion_mm / 2;
                    const safeMin = Math.min(rowHeightMm / 2, Math.max(baseMin, frame_mm * 0.12));
                    const safeMax = Math.max(safeMin, rowHeightMm - safeMin);
                    const clampedBottomMm = Math.min(safeMax, Math.max(safeMin, offsetBottomMm));
                    const offsetTopMm = rowHeightMm - clampedBottomMm;

                    const centerY = y0 + offsetTopMm * pxPerMmRow;
                    const availableTop = y0 + (mullionPx / 2);
                    const availableBottom = y0 + rowH - (mullionPx / 2);
                    const clampedY = Math.max(availableTop, Math.min(availableBottom, centerY));

                    const barHeight = Math.max(mullionPx * 0.7, strokeWidth * 4);
                    const barTop = Math.max(y0, clampedY - barHeight / 2);
                    const maxTop = y0 + rowH - barHeight;
                    // compute top of bar but do not declare unused intermediates
                    Math.min(barTop, maxTop);

                    if (pxPerMmRow > 0) {
                        const rawOffsetLogical = Number(bar?.offset_mm);
                        const offsetBottomLogical = bar?.origin === 'bottom'
                            ? rawOffsetLogical
                            : rowHeightLogicalMm - rawOffsetLogical;
                        const clampedBottomLogical = Math.max(0, Math.min(rowHeightLogicalMm, offsetBottomLogical));
                        const barMmAbs = rowStartLogicalMm + (rowHeightLogicalMm - clampedBottomLogical);
                        rowBarInfo.positions.push({ absMm: barMmAbs, absPx: clampedY });
                    }

                    // Traverso integrato nell'anta: si appoggia all'area fermavetro con un lieve overlap,
                    // evitando l'effetto "barra sospesa" nel vetro.
                    const visualHeight = Math.max(beadProfileW * 1.2, Math.min(mullionPx * 1.25, barHeight));
                    const overlap = Math.max(1.2, TECH_STYLE.STROKE_WIDTH_BEAD * 0.7);
                    const rectX = bx - overlap;
                    const rectW = Math.max(1, bw + overlap * 2);
                    const topY = clampedY - visualHeight / 2;
                    const contourStroke = Math.max(1, strokeWidth * 0.9);
                    acc.nodes.push(
                        <g key={`hb-${rowIdx}-${colIdx}-${barIdx}`}>
                            <rect x={rectX} y={topY} width={rectW} height={visualHeight} fill={frameColor} />
                            <line x1={rectX} y1={topY} x2={rectX + rectW} y2={topY} stroke={outlineColor} strokeWidth={contourStroke} strokeLinecap="square" />
                            <line x1={rectX} y1={topY + visualHeight} x2={rectX + rectW} y2={topY + visualHeight} stroke={outlineColor} strokeWidth={contourStroke} strokeLinecap="square" />
                        </g>
                    );
                });
            }
            acc.nodes.push(<OpeningGlyph key={`o-${rowIdx}-${colIdx}`} x={gx} y={gy} w={gw} h={gh} state={col.leaf?.state ?? "fissa"} stroke={outlineColor} strokeWidth={strokeWidth} />);

            // Punti di estensione: 
            // - Prima anta: parte da 0 (bordo telaio), finisce al confine con la prossima
            // - Ante intermedie: da confine a confine
            // - Ultima anta: finisce a width_mm (bordo telaio)
            const outerStart = colIdx === 0 ? 0 : startX;
            const outerEnd = colIdx === row.cols.length - 1 ? width_mm : startX + colW;
            const labelValue = colIdx < labelNumbers.length ? labelNumbers[colIdx] : colW;
            const labelText = formatMeasure(labelValue, sashMeasureDecimals);
            const segmentKey = `${Math.round(outerStart)}-${Math.round(outerEnd)}`;
            if (!acc.seenSegments.has(segmentKey)) {
                rowHasNewSegment = true;
                acc.seenSegments.add(segmentKey);
            }

            colLabels.push({ x: (outerStart + outerEnd) / 2, text: labelText, start: outerStart, end: outerEnd });

            // ## BLOCCO MANIGLIA: Stile tecnico, colore telaio, dimensione visibile
            if (col.handle) {
                const placement = handlePlacementForState(col.leaf?.state);
                let handleSvg = null;

                // Dimensioni più grandi e proporzionali alla finestra
                const minDim = Math.min(width_mm, height_mm);
                const handleBodyWidth = Math.max(6, minDim * 0.012);
                const handleBodyHeight = Math.max(60, minDim * 0.08);
                const handleLeverWidth = Math.max(12, minDim * 0.018);
                const handleLeverHeight = Math.max(5, minDim * 0.012);
                const handleRx = 0; // Square handle for technical drawing
                // Maniglia bianca con contorno nero (stile tecnico)
                const handleColor = '#ffffff'; 
                const handleStroke = outlineColor;
                const handleStrokeW = Math.max(0.5, strokeWidth * 0.6);

                // Altezza maniglia configurabile (da terra)
                const configHandleH = (safe as any).handle_height_mm;

                if (placement === 'left' || placement === 'right') {
                    // Posizione verticale: configHandleH da terra (dal basso della finestra)
                    // oppure centro dell'anta
                    let cy: number;
                    if (typeof configHandleH === 'number' && configHandleH > 0) {
                        // handle_height_mm è da terra → dal basso della finestra
                        cy = height_mm - configHandleH;
                        // Clamp dentro l'anta corrente
                        cy = Math.max(y0 + sashProfileW + handleBodyHeight / 2, Math.min(y0 + rowH - sashProfileW - handleBodyHeight / 2, cy));
                    } else {
                        cy = y0 + rowH / 2;
                    }
                    const cx = placement === 'left'
                        ? startX + sashProfileW * 0.5
                        : startX + colW - sashProfileW * 0.5;

                    handleSvg = (
                        <g transform={`translate(${cx}, ${cy})`}>
                            {/* Rosetta (base) */}
                            <rect
                                x={-handleLeverWidth / 2}
                                y={-handleBodyHeight * 0.15}
                                width={handleLeverWidth}
                                height={handleBodyHeight * 0.3}
                                rx={handleRx}
                                ry={handleRx}
                                fill={handleColor}
                                stroke={handleStroke}
                                strokeWidth={handleStrokeW}
                            />
                            {/* Corpo principale della maniglia (rettangolo verticale) */}
                            <rect
                                x={-handleBodyWidth / 2}
                                y={-handleBodyHeight / 2}
                                width={handleBodyWidth}
                                height={handleBodyHeight}
                                rx={handleRx}
                                ry={handleRx}
                                fill={handleColor}
                                stroke={handleStroke}
                                strokeWidth={handleStrokeW}
                            />
                            {/* Leva orizzontale verso l'alto */}
                            <rect
                                x={-handleLeverWidth / 2}
                                y={-handleBodyHeight / 2 - handleLeverHeight}
                                width={handleLeverWidth}
                                height={handleLeverHeight + handleRx}
                                rx={handleRx}
                                ry={handleRx}
                                fill={handleColor}
                                stroke={handleStroke}
                                strokeWidth={handleStrokeW}
                            />
                        </g>
                    );
                } else if (placement === 'top') {
                    const cx = startX + colW / 2;
                    const cy = y0 + sashProfileW * 0.5;

                    handleSvg = (
                        <g transform={`translate(${cx}, ${cy})`}>
                            {/* Rosetta */}
                            <rect
                                x={-handleBodyHeight * 0.15}
                                y={-handleLeverWidth / 2}
                                width={handleBodyHeight * 0.3}
                                height={handleLeverWidth}
                                rx={handleRx}
                                ry={handleRx}
                                fill={handleColor}
                                stroke={handleStroke}
                                strokeWidth={handleStrokeW}
                            />
                            {/* Corpo principale (orizzontale) */}
                            <rect
                                x={-handleBodyHeight / 2}
                                y={-handleBodyWidth / 2}
                                width={handleBodyHeight}
                                height={handleBodyWidth}
                                rx={handleRx}
                                ry={handleRx}
                                fill={handleColor}
                                stroke={handleStroke}
                                strokeWidth={handleStrokeW}
                            />
                            {/* Leva verso destra */}
                            <rect
                                x={handleBodyHeight / 2 - handleRx}
                                y={-handleLeverWidth / 2}
                                width={handleLeverHeight + handleRx}
                                height={handleLeverWidth}
                                rx={handleRx}
                                ry={handleRx}
                                fill={handleColor}
                                stroke={handleStroke}
                                strokeWidth={handleStrokeW}
                            />
                        </g>
                    );
                }

                if (handleSvg) {
                    acc.nodes.push(<g key={`handle-${rowIdx}-${colIdx}`}>{handleSvg}</g>);
                }
            }

            xCursor += colW;
        });

        if (rowIdx < rows.length - 1) {
            const ty = y0 + rowH;
            const rectY = ty - (mullion_mm / 2);
            const rectX = frame_mm;
            const rectW = innerW;
            const rectH = mullion_mm;

            // Riempimento traversa (il contorno viene dai bordi delle ante adiacenti)
            acc.nodes.push(
                <rect
                    key={`hz-fill-${rowIdx}`}
                    x={rectX}
                    y={rectY}
                    width={rectW}
                    height={rectH}
                    fill={frameColor}
                />
            );
        }

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
        acc.offsetMm += rowH + (rowIdx < rows.length - 1 ? mullion_mm : 0);
        acc.offsetLogicalMm += rowHeightLogicalMm;
        return acc;
    }, {
        nodes: [] as React.ReactNode[],
        offsetY: 0,
        offsetMm: 0,
        offsetLogicalMm: 0,
        rowLabels: [] as Array<{ rowIdx: number; y: number; position: "top" | "bottom"; rowTop: number; rowBottom: number; labels: Array<{ x: number; text: string; start: number; end: number }>; }>,
        rowDimensions: [] as Array<{ rowIdx: number; top: number; bottom: number; heightMm: number }>,
        seenSegments: new Set<string>(),
        rowBars: new Map<number, RowBarInfo>(),
        mullionLines: [] as Array<{ x: number; y1: number; y2: number; width: number }>,
        horzLines: [] as Array<{ x1: number; x2: number; y: number; width: number }>
    });

    const rowHeightSegments = rows.length > 1
        ? (() => {
            const boundaries: number[] = [0]; // always start at 0 (top perimeter)
            for (let i = 0; i < drawing.rowDimensions.length - 1; i++) {
                const currentBottom = drawing.rowDimensions[i].bottom;
                const nextTop = drawing.rowDimensions[i + 1].top;
                // split in the middle of the mullion/gap
                boundaries.push((currentBottom + nextTop) / 2);
            }
            boundaries.push(height_mm); // always end at height_mm (bottom perimeter)
            
            const segs = [];
            for (let i = 0; i < boundaries.length - 1; i++) {
                const start = boundaries[i];
                const end = boundaries[i + 1];
                // Calculate label based on distance (mm)
                // Note: The drawing logic uses `pxPerMmRow` which might theoretically vary if rows have different scaling, 
                // but usually scale is uniform. We can approximate mm from px or use the known mm heights.
                // However, since we are redefining the "section" to include frame/mullion parts, 
                // the simplest way is to assume uniform scale for Y: height_mm / height_px?
                // Actually `drawing` has `offsetMm` but that's cumulative.
                // Better: just calc diff in Px and convert to Mm using global scale or Ratio?
                // Or just use the visual height ratio.
                const distPx = end - start;
                // height_mm corresponds to height_mm. so scale is 1:1 in the SVG coordinate system if viewbox matches.
                // Wait, viewBox uses width_mm/height_mm. So 1 unit = 1 mm.
                // So start/end are already in mm units (because we draw rects at x=frame_mm etc).
                // Yes, `y0` starts at `frame_mm`. All coordinates are 1-1 with mm.
                const distMm = distPx; 
                segs.push({
                    startPx: start,
                    endPx: end,
                    midPx: (start + end) / 2,
                    label: formatMeasure(distMm, sashMeasureDecimals)
                });
            }
            return segs;
        })()
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

    const rightDimensionBaseOffset = labelGap + totalFontSize * 0.8;
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

    // Bars first (closer to window)
    barDimensionRows.forEach(entry => {
        pushDimensionGroup(entry.segments, entry.boundaries);
    });

    // Row heights second (further out)
    if (rowHeightSegments.length) {
        const boundarySet = new Set<number>();
        rowHeightSegments.forEach(seg => {
            boundarySet.add(seg.startPx);
            boundarySet.add(seg.endPx);
        });
        pushDimensionGroup(rowHeightSegments, Array.from(boundarySet));
    }

    const totalLabelY = height_mm + bottomStackHeight + labelGap + totalFontSize * 0.9;
    const leftLabelX = -(labelGap + totalFontSize * 0.75);
    const labelLineGap = totalFontSize * 0.6;
    
    // Logic to hide total width if duplicate of bottom row (requested by user)
    const isMultiRow = rows.length > 1;
    const lastRow = rows.length > 0 ? rows[rows.length - 1] : null;
    const lastRowIsSingle = lastRow 
        ? (lastRow.cols.length === 1 || lastRow.cols.filter(c => (Number(c.width_ratio ?? 1)) > 0).length === 1)
        : false;
    const showTotalWidth = !isMultiRow || !lastRowIsSingle;

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
            {/* Telaio esterno: fill + stroke (Colorato) */}
            <rect 
                x={0} y={0} width={width_mm} height={height_mm} 
                fill={frameColor} 
                stroke={TECH_STYLE.FRAME_STROKE} 
                strokeWidth={TECH_STYLE.STROKE_WIDTH_FRAME} 
            />
            {/* Bordo interno telaio (separazione telaio/ante) */}
            <rect 
                x={frame_mm} y={frame_mm} width={innerW} height={innerH} 
                fill="none" 
                stroke={TECH_STYLE.FRAME_STROKE} 
                strokeWidth={TECH_STYLE.STROKE_WIDTH_BEAD} 
            />
            {drawing.nodes}
            {showDims && drawing.rowLabels.length > 0 && (
                <>
                    <g stroke={outlineColor} strokeWidth={strokeWidth / 1.5} strokeDasharray={dimensionLineDash} fill="none">
                        {drawing.rowLabels.map(row => {
                            const fromY = row.position === "top" ? 0 : height_mm;
                            const targetY = row.position === "top" ? row.y + labelLineGap : row.y - labelLineGap;
                            // Raccogli tutti i punti unici (evita duplicati ai confini tra ante)
                            const uniquePoints = new Set<number>();
                            row.labels.forEach(label => {
                                uniquePoints.add(Math.round(label.start * 100) / 100);
                                uniquePoints.add(Math.round(label.end * 100) / 100);
                            });
                            return Array.from(uniquePoints).map((xPos, idx) => (
                                <line key={`row-ext-${row.rowIdx}-${idx}`} x1={xPos} y1={fromY} x2={xPos} y2={targetY} />
                            ));
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
                        {showTotalWidth && (
                            <>
                                <line x1={0} y1={height_mm} x2={0} y2={totalLabelY - labelLineGap} />
                                <line x1={width_mm} y1={height_mm} x2={width_mm} y2={totalLabelY - labelLineGap} />
                            </>
                        )}
                        <line x1={0} y1={0} x2={leftLabelX + labelLineGap} y2={0} />
                        <line x1={0} y1={height_mm} x2={leftLabelX + labelLineGap} y2={height_mm} />
                    </g>
                    <g style={{ fontFamily: 'sans-serif', textAnchor: 'middle', fill: '#1f2937', fontSize: totalFontSize }}>
                        {/* total width label (centered under drawing) */}
                        {showTotalWidth && (
                             <text x={width_mm / 2} y={totalLabelY + 6} dominantBaseline="hanging">{Math.round(width_mm)}</text>
                        )}
                        {/* height label (rotated at left) */}
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
