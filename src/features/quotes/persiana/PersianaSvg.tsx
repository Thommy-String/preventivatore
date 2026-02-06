import type { ReactElement } from 'react'

export type PersianaConfig = {
  width_mm: number
  height_mm: number
  ante?: number | null
}

type PersianaSvgProps = {
  cfg: PersianaConfig
  stroke?: string
  className?: string
}

export default function PersianaSvg({ cfg, stroke = '#000000', className }: PersianaSvgProps) {
  const width = Math.max(200, Number(cfg.width_mm) || 1200)
  const height = Math.max(200, Number(cfg.height_mm) || 1400)
  const leaves = Math.max(1, Math.round(Number(cfg.ante ?? 2) || 2))

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
  const viewBox = `${-padLeft} ${-padTop} ${width + padLeft + padRight} ${height + padTop + padBottom}`

  // proportions from reference: outer padding 10%
  const pad = Math.min(width, height) * 0.1
  const innerX = pad
  const innerY = pad
  const innerW = Math.max(20, width - pad * 2)
  const innerH = Math.max(20, height - pad * 2)

  const leafWidth = innerW / leaves
  const frameInset = leafWidth * 0.125
  const frameYInset = innerH * 0.0625
  const frameH = innerH * 0.875

  const slatStart = Math.max(18, innerH * 0.06)
  const slatGap = Math.max(22, innerH * 0.05)
  const slatStroke = Math.max(0.7, strokeWidth * 0.75)
  const innerBorderStroke = Math.max(0.5, strokeWidth * 0.6)
  const innerInsetBorderStroke = Math.max(0.6, strokeWidth * 0.6)
  const innerInsetBorderInset = Math.max(2.6, innerInsetBorderStroke * 2.6)

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
              <rect x={outerX} y={outerY} width={outerW} height={outerH} fill="#ffffff" />
              <rect x={innerFrameX} y={innerFrameY} width={innerFrameW} height={innerFrameH} fill="#ffffff" stroke="none" />
              <rect
                x={innerFrameX}
                y={innerFrameY}
                width={innerFrameW}
                height={innerFrameH}
                fill="none"
                stroke={stroke}
                strokeWidth={innerBorderStroke}
              />
              <rect
                x={innerFrameX + innerInsetBorderInset}
                y={innerFrameY + innerInsetBorderInset}
                width={innerFrameW - innerInsetBorderInset * 2}
                height={innerFrameH - innerInsetBorderInset * 2}
                fill="none"
                stroke={stroke}
                strokeWidth={innerInsetBorderStroke}
              />
              {(() => {
                const lines: ReactElement[] = []
                for (let y = innerFrameY + slatStart; y < innerFrameY + innerFrameH - slatStart; y += slatGap) {
                  lines.push(
                    <line
                      key={`slat-${idx}-${Math.round(y)}`}
                      x1={innerFrameX + slatInset}
                      y1={y}
                      x2={innerFrameX + innerFrameW - slatInset}
                      y2={y}
                      stroke={stroke}
                      strokeWidth={slatStroke}
                    />
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