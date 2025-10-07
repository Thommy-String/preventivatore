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
  // Scala del font più conservativa per grandi larghezze
  const fontSize = Math.max(12, Math.min(50, drawingWidth / 40));
  const inset = Math.min(width_mm, height_mm) * 0.1;

  // --- NUOVO: Calcolo del ViewBox corretto per un centraggio perfetto ---
  // Calcola il box che contiene tutto il disegno, incluse le quote
  const quotePadding = fontSize * 2.5;
  const minX = -quotePadding;
  const minY = -dy - cdy - quotePadding;
  const contentWidth = drawingWidth + quotePadding * 2;
  const contentHeight = drawingHeight + quotePadding * 2;
  const viewBox = `${minX} ${minY} ${contentWidth} ${contentHeight}`;

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
    </svg>
  );
}

