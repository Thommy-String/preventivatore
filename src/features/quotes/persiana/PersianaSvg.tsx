import type { ReactElement } from 'react'

export type PersianaConfig = {
  width_mm: number
  height_mm: number
  ante?: number | null
  color?: string | null
}

type PersianaSvgProps = {
  cfg: PersianaConfig
  stroke?: string
  className?: string
}

// Helper per scurire/schiarire hex (come TapparellaSvg)
function adjustColor(hex: string, amount: number): string {
  const safeHex = hex.replace(/[^0-9A-F]/gi, '')
  let color = safeHex
  if (color.length === 3) color = color.split('').map(c => c + c).join('')
  if (color.length !== 6) return hex
  const num = parseInt(color, 16)
  let r = (num >> 16) + amount
  let g = ((num >> 8) & 0x00ff) + amount
  let b = (num & 0x0000ff) + amount
  r = Math.max(0, Math.min(255, r))
  g = Math.max(0, Math.min(255, g))
  b = Math.max(0, Math.min(255, b))
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

export default function PersianaSvg({ cfg, stroke = '#000000', className }: PersianaSvgProps) {
  const width = Math.max(200, Number(cfg.width_mm) || 1200)
  const height = Math.max(200, Number(cfg.height_mm) || 1400)
  const leaves = Math.max(1, Math.round(Number(cfg.ante ?? 2) || 2))
  const baseColor = cfg.color && cfg.color.length >= 3 ? cfg.color : null

  const strokeWidth = Math.max(1, Math.min(2.5, Math.min(width, height) * 0.003))

  // Palette colore
  const cFrame = baseColor ? adjustColor(baseColor, 10) : '#ffffff'
  const cFrameShadow = baseColor ? adjustColor(baseColor, -15) : '#e8e8e8'
  const cSlat = baseColor || '#f4f4f4'
  const cSlatHighlight = baseColor ? adjustColor(baseColor, 30) : '#ffffff'
  const cSlatShadow = baseColor ? adjustColor(baseColor, -25) : '#d6d6d6'

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
  const viewBox = `${-padLeft} ${-padTop} ${width + padLeft + padRight} ${height + padTop + padBottom}`

  // Proportions (design originale)
  const pad = Math.min(width, height) * 0.1
  const innerX = pad
  const innerY = pad
  const innerW = Math.max(20, width - pad * 2)
  const innerH = Math.max(20, height - pad * 2)

  const leafWidth = innerW / leaves
  const frameInset = leafWidth * 0.125
  const frameYInset = innerH * 0.0625
  const frameH = innerH * 0.875

  const slatGap = 50  // altezza fissa lamella in unità disegno (~50mm reali)
  const slatStroke = Math.max(0.6, strokeWidth * 0.7)
  const innerBorderStroke = Math.max(0.5, strokeWidth * 0.6)
  const innerInsetBorderStroke = Math.max(0.6, strokeWidth * 0.6)
  const innerInsetBorderInset = Math.max(2.6, innerInsetBorderStroke * 2.6)

  // Gradient ID unico per colore
  const slatGradId = `persiana-slat-${baseColor ? baseColor.replace(/[^a-z0-9]/gi, '') : 'std'}`

  return (
    <svg
      viewBox={viewBox}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Persiana ${width}x${height}, ${leaves} ante`}
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={slatGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cSlatHighlight} />
          <stop offset="40%" stopColor={cSlat} />
          <stop offset="100%" stopColor={cSlatShadow} />
        </linearGradient>
      </defs>

      <g stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {Array.from({ length: leaves }).map((_, idx) => {
          const leafX = innerX + idx * leafWidth
          const outerX = leafX
          const outerY = innerY
          const outerW = leafWidth
          const outerH = innerH

          const innerFrameX = outerX + frameInset
          const innerFrameY = outerY + frameYInset
          const innerFrameW = outerW - frameInset * 2
          const innerFrameH = frameH
          const slatInset = Math.max(6, innerInsetBorderInset + innerInsetBorderStroke * 3.6)

          return (
            <g key={`leaf-${idx}`}>
              {/* Anta esterna con colore telaio */}
              <rect x={outerX} y={outerY} width={outerW} height={outerH} fill={cFrame} />
              {/* Ombre leggere bordo destro e inferiore */}
              <line x1={outerX + outerW} y1={outerY + 2} x2={outerX + outerW} y2={outerY + outerH} stroke={cFrameShadow} strokeWidth={strokeWidth * 1.2} />
              <line x1={outerX + 2} y1={outerY + outerH} x2={outerX + outerW} y2={outerY + outerH} stroke={cFrameShadow} strokeWidth={strokeWidth * 1.2} />

              {/* Area interna con sfondo scuro per profondità */}
              <rect x={innerFrameX} y={innerFrameY} width={innerFrameW} height={innerFrameH} fill={cSlatShadow} stroke="none" />
              <rect
                x={innerFrameX}
                y={innerFrameY}
                width={innerFrameW}
                height={innerFrameH}
                fill="none"
                stroke={stroke}
                strokeWidth={innerBorderStroke}
              />
              {/* Cornice interna */}
              <rect
                x={innerFrameX + innerInsetBorderInset}
                y={innerFrameY + innerInsetBorderInset}
                width={innerFrameW - innerInsetBorderInset * 2}
                height={innerFrameH - innerInsetBorderInset * 2}
                fill="none"
                stroke={stroke}
                strokeWidth={innerInsetBorderStroke}
              />
              {/* Lamelle chiuse (adiacenti, senza spazi) */}
              {(() => {
                const lines: ReactElement[] = []
                const areaTop = innerFrameY + innerInsetBorderInset
                const areaBot = innerFrameY + innerFrameH - innerInsetBorderInset
                const areaH = areaBot - areaTop
                const nSlats = Math.max(1, Math.round(areaH / slatGap))
                const slatH = areaH / nSlats
                for (let i = 0; i < nSlats; i++) {
                  const y = areaTop + i * slatH
                  lines.push(
                    <g key={`slat-${idx}-${i}`}>
                      <rect
                        x={innerFrameX + slatInset}
                        y={y}
                        width={innerFrameW - slatInset * 2}
                        height={slatH}
                        fill={`url(#${slatGradId})`}
                        stroke={stroke}
                        strokeWidth={slatStroke}
                      />
                      {/* Highlight luce superiore */}
                      <line
                        x1={innerFrameX + slatInset + 1}
                        y1={y + slatStroke}
                        x2={innerFrameX + innerFrameW - slatInset - 1}
                        y2={y + slatStroke}
                        stroke={cSlatHighlight}
                        strokeWidth={slatStroke * 0.4}
                        strokeOpacity={0.5}
                      />
                    </g>
                  )
                }
                return lines
              })()}
            </g>
          )
        })}

        {leaves > 1 && (
          <line
            x1={innerX + leafWidth}
            y1={innerY}
            x2={innerX + leafWidth}
            y2={innerY + innerH}
          />
        )}
      </g>

      {/* --- Quote dimensionali --- */}
      <g style={{ fontFamily: 'sans-serif', textAnchor: 'middle' as const, fill: '#1f2937', fontSize: dimFontSize }}>
        <text x={width / 2} y={totalLabelY + 6} dominantBaseline="hanging">{Math.round(cfg.width_mm)}</text>
        <text x={leftLabelX} y={height / 2} transform={`rotate(-90, ${leftLabelX}, ${height / 2})`} dominantBaseline="middle">{Math.round(cfg.height_mm)}</text>
      </g>
    </svg>
  )
}