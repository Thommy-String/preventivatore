//src/features/quotes/cassonetto/CassonettoSvg.tsx

// --- Tipi ---
export interface CassonettoConfig {
  width_mm: number;
  height_mm: number;
  depth_mm?: number | null;
  celino_mm?: number | null;
}

export interface CassonettoSvgProps {
  cfg: CassonettoConfig;
  stroke?: string;
}

// --- Renderer SVG Principale ---
export default function CassonettoSvg({ cfg, stroke = "#222" }: CassonettoSvgProps) {
  const {
    width_mm = 1000,
    height_mm = 250,
    depth_mm = 250,
    celino_mm = 0,
  } = cfg;

  // --- Logica per la Proiezione Assonometrica ---
  const angle = Math.PI / 6; 
  const depthFactor = 0.7;
  
  const dx = (depth_mm || 0) * Math.cos(angle) * depthFactor;
  const dy = (depth_mm || 0) * Math.sin(angle) * depthFactor;
  const cdx = (celino_mm || 0) * Math.cos(angle) * depthFactor;
  const cdy = (celino_mm || 0) * Math.sin(angle) * depthFactor;

  const drawingWidth = width_mm + dx + cdx;
  const drawingHeight = height_mm + dy + cdy;
  
  const strokeWidth = 1.5;
  const inset = Math.min(width_mm, height_mm) * 0.1;

  // --- Quote dimensionali (stile finestra) ---
  const baseDim = Math.max(60, Math.min(width_mm, height_mm));
  const baseFont = Math.max(9, Math.min(24, baseDim / 28));
  const dimFontSize = Math.max(42, Math.min(80, baseDim / 8));
  const labelGap = Math.max(14, Math.min(30, baseDim / 14));
  const padLeft = labelGap + dimFontSize * 1.3;
  const padBottom = labelGap + dimFontSize * 1.6 + strokeWidth;
  const padTop = Math.max(4, baseFont * 0.3) + dy + cdy + strokeWidth;
  const padRight = Math.max(4, baseFont * 0.3) + dx + cdx;
  const totalLabelY = height_mm + labelGap + dimFontSize * 0.5;
  const leftLabelX = -(labelGap + dimFontSize * 0.75);
  const viewBox = `${-padLeft} ${-padTop} ${width_mm + padLeft + padRight} ${height_mm + padTop + padBottom}`;

  return (
    <svg viewBox={viewBox} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Disegno tecnico del cassonetto">
      <g stroke={stroke} fill="none" strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round">
        
        {/* Disegno del Cassonetto Principale */}
        <path d={`M ${dx},${-dy} L ${width_mm + dx},${-dy} L ${width_mm},0 L 0,0 Z`} fill="#f0f0f0" />
        <path d={`M ${width_mm},0 L ${width_mm + dx},${-dy} L ${width_mm + dx},${height_mm - dy} L ${width_mm},${height_mm} Z`} fill="#e0e0e0" />
        
        {/* Faccia Frontale con Cornice */}
        <rect x="0" y="0" width={width_mm} height={height_mm} fill="#fafafa" />
        <rect x={inset} y={inset} width={width_mm - inset * 2} height={height_mm - inset * 2} fill="#f4f4f5" />
        <rect x="0" y="0" width={width_mm} height={height_mm} />
        <rect x={inset} y={inset} width={width_mm - inset * 2} height={height_mm - inset * 2} />
        
        {/* Disegno Semplificato del Celino */}
        {celino_mm && celino_mm > 0 && (
          <line
            x1={width_mm + dx}
            y1={height_mm - dy}
            x2={width_mm + dx + cdx}
            y2={height_mm - dy - cdy}
            strokeDasharray={`${strokeWidth * 3} ${strokeWidth * 2}`}
          />
        )}

        
      </g>

      {/* --- Quote dimensionali --- */}
      <g style={{ fontFamily: 'sans-serif', textAnchor: 'middle' as const, fill: '#1f2937', fontSize: dimFontSize }}>
        <text x={width_mm / 2} y={totalLabelY + 6} dominantBaseline="hanging">{Math.round(width_mm)}</text>
        <text x={leftLabelX} y={height_mm / 2} transform={`rotate(-90, ${leftLabelX}, ${height_mm / 2})`} dominantBaseline="middle">{Math.round(height_mm)}</text>
      </g>
    </svg>
  );
}
