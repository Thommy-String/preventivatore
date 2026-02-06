export type TapparellaConfig = {
  width_mm: number
  height_mm: number
  color?: string | null
}

type TapparellaSvgProps = {
  cfg: TapparellaConfig
  stroke?: string
  className?: string
}

// Helper per scurire/schiarire hex
function adjustColor(hex: string, amount: number): string {
    const safeHex = hex.replace(/[^0-9A-F]/gi, '');
    let color = safeHex;
    if (color.length === 3) color = color.split('').map(c => c + c).join('');
    if (color.length !== 6) return hex; // fallback invalido

    const num = parseInt(color, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;

    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export default function TapparellaSvg({ cfg, stroke = '#000000', className }: TapparellaSvgProps) {
  const width = Math.max(200, Number(cfg.width_mm) || 1000)
  const height = Math.max(200, Number(cfg.height_mm) || 1400)
  const baseColor = cfg.color && cfg.color.length >= 3 ? cfg.color : null

  // Palette dinamica
  const cHighlight = baseColor ? adjustColor(baseColor, 40) : "#ffffff"
  const cMidHigh = baseColor ? adjustColor(baseColor, 20) : "#f9f9f9"
  const cBase = baseColor || "#e8e8e8"
  const cShadow = baseColor ? adjustColor(baseColor, -20) : "#dcdcdc"
  const cDeepShadow = baseColor ? adjustColor(baseColor, -40) : "#bfbfbf"
  
  const cHook = baseColor ? adjustColor(baseColor, -30) : "#d0d0d0"

  // Calcola stroke proporzionale
  const strokeWidth = Math.max(1, Math.min(2.5, Math.min(width, height) * 0.003))

  // --- Quote dimensionali (stile finestra) ---
  const baseDim = Math.max(60, Math.min(width, height))
  const baseFont = Math.max(9, Math.min(24, baseDim / 28))
  const dimFontSize = Math.max(42, Math.min(80, baseDim / 16))
  const labelGap = Math.max(14, Math.min(30, baseDim / 14))
  const padLeft = labelGap + dimFontSize * 1.3
  const padBottom = labelGap + dimFontSize * 1.6 + strokeWidth
  const padTop = Math.max(4, baseFont * 0.3) + strokeWidth
  const padRight = Math.max(4, baseFont * 0.3)
  const totalLabelY = height + labelGap + dimFontSize * 0.5
  const leftLabelX = -(labelGap + dimFontSize * 0.75)
  
  // Padding del disegno rispetto al viewBox
  const pad = Math.min(width, height) * 0.05
  
  // Area effettiva del disegno
  const drawX = pad
  const drawY = pad
  const drawW = width - pad * 2
  const drawH = height - pad * 2
  
  // Telo (full width nel box di disegno, senza guide laterali esplicite)
  const curtainX = drawX
  const curtainW = drawW
  const curtainH = drawH
  
  // Lamelle
  // Target: circa 55mm per lamella (standard)
  const targetSlatH = 55
  const numSlats = Math.max(4, Math.round(curtainH / targetSlatH))
  const slatHeight = curtainH / numSlats
  
  // Geometria della singola stecca in stato "aperto" (luce visibile)
  const holeSectionH = slatHeight * 0.2 // 20% altezza dedicata ai fori (collo)
  const bodySectionH = slatHeight * 0.8 // 80% corpo solido

  // Gradient ID univoco
  const gradId = `slatGradient-${baseColor ? baseColor.replace(/[^a-z0-9]/gi, '') : 'std'}`

  return (
    <svg
      viewBox={`${-padLeft} ${-padTop} ${width + padLeft + padRight} ${height + padTop + padBottom}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Tapparella ${width}x${height}`}
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={cMidHigh} />
            <stop offset="20%" stopColor={cHighlight} />
            <stop offset="50%" stopColor={cBase} />
            <stop offset="90%" stopColor={cShadow} />
            <stop offset="100%" stopColor={cDeepShadow} />
        </linearGradient>
      </defs>

      <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
        
        {/* Telo con lamelle */}
        <g strokeWidth={strokeWidth}>
            {Array.from({ length: numSlats }).map((_, i) => {
                const isFirst = i === 0
                const isLast = i === numSlats - 1
                const y = drawY + i * slatHeight
                
                // Coordinate relative alla stecca
                const holesY = y + holeSectionH / 2
                const bodyY = y + holeSectionH

                return (
                    <g key={i}>
                         {/* 1. SEZIONE SUPERIORE (Collo/Fori) */}
                         {!isFirst && (
                             // Gancio con fori standard (non visibile nella prima doga)
                             <g>
                                {/* Sfondo scuro per dare profondità al gancio */}
                                <rect 
                                    x={curtainX} 
                                    y={y} 
                                    width={curtainW} 
                                    height={holeSectionH}
                                    fill={cHook} 
                                    stroke="none"
                                />
                                {/* I fori - Luce passante */}
                                <line 
                                    x1={curtainX + curtainW * 0.02} 
                                    y1={holesY} 
                                    x2={curtainX + curtainW * 0.98} 
                                    y2={holesY} 
                                    stroke="#FFFFFF"
                                    strokeWidth={strokeWidth * 1.5}
                                    strokeDasharray={`${strokeWidth * 12} ${strokeWidth * 8}`} 
                                    strokeLinecap="butt"
                                    strokeOpacity={1}
                                />
                            </g>
                        )}

                        {/* 2. CORPO DELLA LAMELLA */}
                        {isLast ? (
                            // TERMINALE
                            <g>
                                {/* Il terminale ha bisogno del collo (disegnato sopra nel blocco standard se !isFirst) 
                                    per attaccarsi alla penultima.
                                    Qui disegniamo solo il corpo massiccio. */}
                                <rect 
                                    x={curtainX} 
                                    y={bodyY} 
                                    width={curtainW} 
                                    height={bodySectionH} 
                                    fill={`url(#${gradId})`}
                                    stroke={stroke}
                                />
                                {/* Guarnizione di battuta */}
                                <rect
                                    x={curtainX}
                                    y={bodyY + bodySectionH - strokeWidth * 2}
                                    width={curtainW}
                                    height={strokeWidth * 2}
                                    fill="#444444"
                                    stroke="none"
                                />
                                {/* Tappi laterali terminale */}
                                <circle cx={curtainX + strokeWidth * 4} cy={bodyY + bodySectionH / 2} r={strokeWidth * 1.5} fill="#888" stroke="none" />
                                <circle cx={curtainX + curtainW - strokeWidth * 4} cy={bodyY + bodySectionH / 2} r={strokeWidth * 1.5} fill="#888" stroke="none" />
                            </g>
                        ) : (
                            // Doga Standard
                            <g>
                                {/* Se è la prima doga, ingloba anche lo spazio del collo per fare un pezzo unico */}
                                <rect 
                                    x={curtainX} 
                                    y={isFirst ? y : bodyY} 
                                    width={curtainW} 
                                    height={isFirst ? slatHeight : bodySectionH} 
                                    fill={`url(#${gradId})`}
                                    stroke={stroke}
                                />
                                {/* Highlights curvatura */}
                                {/* Adattiamo la posizione per la prima doga affinché il riflesso sia coerente */}
                                <line 
                                    x1={curtainX} 
                                    y1={(isFirst ? y : bodyY) + (isFirst ? slatHeight : bodySectionH) * 0.2} 
                                    x2={curtainX + curtainW} 
                                    y2={(isFirst ? y : bodyY) + (isFirst ? slatHeight : bodySectionH) * 0.2} 
                                    stroke="white" 
                                    strokeWidth={strokeWidth}
                                    strokeOpacity={0.5}
                                />
                                <line 
                                    x1={curtainX} 
                                    y1={(isFirst ? y : bodyY) + (isFirst ? slatHeight : bodySectionH) * 0.85} 
                                    x2={curtainX + curtainW} 
                                    y2={(isFirst ? y : bodyY) + (isFirst ? slatHeight : bodySectionH) * 0.85} 
                                    stroke={stroke} 
                                    strokeWidth={strokeWidth * 0.5}
                                    strokeOpacity={0.2}
                                />
                            </g>
                        )}
                    </g>
                )
            })}
        </g>
        
        {/* Chiusura parte alta (tappo superiore) */}
        <line x1={curtainX} y1={drawY} x2={curtainX + curtainW} y2={drawY} stroke={stroke} strokeWidth={strokeWidth * 1.5} />

      </g>

      {/* --- Quote dimensionali --- */}
      <g style={{ fontFamily: 'sans-serif', textAnchor: 'middle' as const, fill: '#1f2937', fontSize: dimFontSize }}>
        <text x={width / 2} y={totalLabelY + 6} dominantBaseline="hanging">{Math.round(cfg.width_mm)}</text>
        <text x={leftLabelX} y={height / 2} transform={`rotate(-90, ${leftLabelX}, ${height / 2})`} dominantBaseline="middle">{Math.round(cfg.height_mm)}</text>
      </g>
    </svg>
  )
}
