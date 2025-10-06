//src/features/quotes/window/WindowSvg.tsx
import * as React from "react";

// --- Tipi ---
// Ritorno alle proporzioni (ratio) per la distribuzione interna dello spazio
export type LeafState =
    | "fissa"
    | "apre_sx"
    | "apre_dx"
    | "vasistas"
    | "apre_sx+vasistas"
    | "apre_dx+vasistas"
    | "scorrevole_sx"
    | "scorrevole_dx";

export interface GridWindowConfig {
    width_mm: number;
    height_mm: number;
    frame_mm: number;
    mullion_mm: number;
    glazing: "singolo" | "doppio" | "triplo" | "satinato";
    showDims?: boolean;
    rows: Array<{
        height_ratio: number;
        cols: Array<{ width_ratio: number; leaf?: { state: LeafState } }>;
    }>;
}

export interface WindowSvgProps {
    cfg?: GridWindowConfig;
    radius?: number;
    stroke?: string;
}

// --- Funzioni Helper ---
function makeFallbackCfg(): GridWindowConfig {
    return {
        width_mm: 1200, height_mm: 1500, frame_mm: 70, mullion_mm: 60,
        glazing: "doppio", showDims: true,
        rows: [{ height_ratio: 1, cols: [{ width_ratio: 1, leaf: { state: "apre_sx" } }] }]
    };
}

const sum = (a: number[]) => (a && a.length ? a.reduce((s, v) => s + v, 0) : 0);

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


// --- Componenti di Disegno ---

function OpeningGlyph({ x, y, w, h, state, stroke, strokeWidth }: { x: number; y: number; w: number; h: number; state: LeafState; stroke: string; strokeWidth: number }) {
    const dash = `${strokeWidth * 4} ${strokeWidth * 4}`;

    const drawVasistas = () => <polyline points={`${x},${y + h} ${x + w / 2},${y} ${x + w},${y + h}`} stroke={stroke} strokeDasharray={dash} strokeWidth={strokeWidth} fill="none" />;
// VERSIONE NUOVA (CORRETTA)
const drawApreSx = () => <polyline points={`${x + w},${y} ${x},${y + h / 2} ${x + w},${y + h}`} stroke={stroke} strokeDasharray={dash} strokeWidth={strokeWidth} fill="none" />;
const drawApreDx = () => <polyline points={`${x},${y} ${x + w},${y + h / 2} ${x},${y + h}`} stroke={stroke} strokeDasharray={dash} strokeWidth={strokeWidth} fill="none" />;    const drawArrow = (direction: 'left' | 'right') => {
        const arrowHeight = Math.min(h * 0.2, 40);
        const arrowWidth = arrowHeight * 1.5;
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

// --- Renderer SVG Principale ---
export default function WindowSvg({ cfg, radius = 6, stroke = "#222" }: WindowSvgProps) {
    const safe = cfg ?? makeFallbackCfg();

    const { width_mm, height_mm, rows, frame_mm, mullion_mm, glazing } = safe;

    // Calcolo delle dimensioni interne disponibili per i vetri
    const innerW = width_mm - frame_mm * 2;
    const innerH = height_mm - frame_mm * 2;
    const totalRowsGapY = (rows.length - 1) * mullion_mm;
    const usableH = innerH - totalRowsGapY;
    const totalRowRatios = sum(rows.map(r => r.height_ratio));

    // Scala dinamica per font e spessori
    const avgDim = (width_mm + height_mm) / 2;
    const strokeWidth = Math.max(0.5, Math.min(2.5, avgDim / 800));
    const fontSize = Math.max(10, Math.min(40, avgDim / 50));
    const textPadding = fontSize * 1.2;

    const glassColor = glassFill(glazing);
    const satinPatternId = React.useMemo(() => `satin-dots-${Math.random().toString(36).slice(2, 8)}`, []);

    return (
        <svg viewBox={`0 0 ${width_mm} ${height_mm}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Anteprima finestra">
            <defs>
                <pattern id={satinPatternId} patternUnits="userSpaceOnUse" width={strokeWidth * 8} height={strokeWidth * 8}>
                    <rect x="0" y="0" width={strokeWidth * 8} height={strokeWidth * 8} fill="transparent" />
                    <circle cx={strokeWidth * 2} cy={strokeWidth * 2} r={strokeWidth * 0.8} fill="#d1d5db" />
                </pattern>
            </defs>

            {/* Disegno Telaio */}
            <rect x={0} y={0} width={width_mm} height={height_mm} rx={radius} ry={radius} fill="#fdfdfd" />
            <rect x={strokeWidth / 2} y={strokeWidth / 2} width={width_mm - strokeWidth} height={height_mm - strokeWidth} rx={radius} ry={radius} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
            <rect x={frame_mm} y={frame_mm} width={innerW} height={innerH} fill="none" stroke={stroke} strokeWidth={strokeWidth / 1.5} />

            {/* Disegno Righe e Ante */}
            {rows.reduce((acc, row, rowIdx) => {
                // Calcola l'altezza reale della riga in base alla proporzione
                const rowH = (usableH * row.height_ratio) / totalRowRatios;
                const y0 = frame_mm + acc.offsetY;

                const totalColsGapX = (row.cols.length - 1) * mullion_mm;
                const usableW = innerW - totalColsGapX;
                const totalColRatios = sum(row.cols.map(c => c.width_ratio));

                let xCursor = frame_mm;

                row.cols.forEach((col, colIdx) => {
                    // Calcola la larghezza reale dell'anta in base alla proporzione
                    const colW = (usableW * col.width_ratio) / totalColRatios;
                    const sashInset = Math.max(2, frame_mm * 0.15); // Piccolo bordo interno per il profilo dell'anta
                    const gx = xCursor + sashInset;
                    const gy = y0 + sashInset;
                    const gw = colW - sashInset * 2;
                    const gh = rowH - sashInset * 2;

                    // Disegna il montante verticale (se non è la prima anta)
                    if (colIdx > 0) {
                        const mx = xCursor - (mullion_mm / 2);
                        acc.nodes.push(<line key={`vm-${rowIdx}-${colIdx}`} x1={mx} y1={y0} x2={mx} y2={y0 + rowH} stroke={stroke} strokeWidth={strokeWidth} />);
                    }

                    // Disegna il vetro e il simbolo di apertura
                    acc.nodes.push(
                        <g key={`g-${rowIdx}-${colIdx}`}>
                            <rect x={gx} y={gy} width={gw} height={gh} fill={glassColor} stroke={stroke} strokeWidth={strokeWidth / 1.5} />
                            {isSatin(glazing) && <rect x={gx} y={gy} width={gw} height={gh} fill={`url(#${satinPatternId})`} opacity={0.6} />}
                        </g>
                    );
                    acc.nodes.push(<OpeningGlyph key={`o-${rowIdx}-${colIdx}`} x={gx} y={gy} w={gw} h={gh} state={col.leaf?.state ?? "fissa"} stroke={stroke} strokeWidth={strokeWidth} />);

                    xCursor += colW + mullion_mm;
                });

                // Disegna il traverso orizzontale (se non è l'ultima riga)
                if (rowIdx < rows.length - 1) {
                    const ty = y0 + rowH + (mullion_mm / 2);
                    acc.nodes.push(<line key={`hz-${rowIdx}`} x1={frame_mm} y1={ty} x2={width_mm - frame_mm} y2={ty} stroke={stroke} strokeWidth={strokeWidth} />);
                }

                acc.offsetY += rowH + mullion_mm;
                return acc;
            }, { nodes: [] as React.ReactNode[], offsetY: 0 }).nodes}

            {/* Disegno Quote */}
            {safe.showDims && (
                <g style={{ fontFamily: 'sans-serif', textAnchor: 'middle', fill: '#374151', fontSize }}>
                    <text x={width_mm / 2} y={-textPadding / 2}>{`L ${Math.round(width_mm)}`}</text>
                    <text x={-textPadding / 2} y={height_mm / 2} transform={`rotate(-90, ${-textPadding / 2}, ${height_mm / 2})`}>{`H ${Math.round(height_mm)}`}</text>
                </g>
            )}
        </svg>
    );
}

