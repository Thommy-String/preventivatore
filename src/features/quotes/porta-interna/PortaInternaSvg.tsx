import React from "react";
import type { PortaInternaItem } from "../types";

interface Props {
  item: PortaInternaItem;
  handle_color?: string | null;
}

/**
 * SVG schematic for Porta Interna (battente/scorrevole, maniglia sx/dx, freccia per scorrevole)
 * - Telaio con giunzioni a 45° corrette (poligoni)
 * - Maniglia: rettangolo per battente, cerchio per scorrevole
 * - Freccia centrale per scorrevole
 */
export const PortaInternaSvg: React.FC<Props> = ({ item, handle_color }) => {
  // Safety check: ensure item exists
  if (!item) {
    return (
      <svg viewBox="0 0 800 2100" width="800" height="2100">
        <rect x="0" y="0" width="800" height="2100" fill="#f0f0f0" stroke="#ccc" />
        <text x="400" y="1050" textAnchor="middle" fontSize="24" fill="#666">
          Porta Interna
        </text>
      </svg>
    );
  }

  console.log("PortaInternaSvg - handle_color:", handle_color);
  console.log("PortaInternaSvg - handle_color:", handle_color);
  const { width_mm, height_mm, apertura, handle_position, color, options } = item;
  
  // Dimensioni reali: anta = width_mm x height_mm, telaio fuori misura
  const leafW = width_mm || 800;
  const leafH = height_mm || 2100;
  const frameThick = 70;
  
  const W = leafW + frameThick * 2;
  const H = leafH + frameThick; // solo sopra/lati
  
  const padding = 150;
  const strokeColor = "#222";
  
  // Color parsing: prefer previewColor from options, fallback to color field
  let fillPanel = '#FFFFFF'; // Default panel color (White base)
  const colorSource = options?.previewColor || color;
  if (colorSource) {
    if (colorSource.startsWith('#')) {
      fillPanel = colorSource;
    } else {
      // Try to extract hex from RAL string like "RAL 9010 Bianco puro #FFFFFF"
      const parts = colorSource.split(' ');
      const hex = parts.find((p: string) => p.startsWith('#'));
      if (hex) fillPanel = hex;
    }
  }

  // Handle color parsing
  const handleFill = handle_color || '#a6a6a6'; // Default gray or custom
  
  const isHandleRight = handle_position !== 'left';
  
  // Anta
  const leafX = frameThick;
  const leafY = frameThick;
  
  // Maniglia
  const handleY = H / 2;
  
  // Maniglia battente: molto più verso il bordo (10% della larghezza anta)
  const battenteHandleOffset = Math.round((leafW * 0.1));
  const battenteHandleX = isHandleRight ? W - frameThick - battenteHandleOffset : frameThick + battenteHandleOffset;
  
  // Maniglia scorrevole: molto più verso il bordo (10% della larghezza anta)
  const slidingHandleOffset = Math.round((leafW * 0.1));
  const slidingHandleX = isHandleRight ? W - frameThick - slidingHandleOffset : frameThick + slidingHandleOffset;
  
  // Freccia scorrevole: punta sempre verso il lato opposto della maniglia
  const arrowY = H / 2;
  const arrowX = W / 2;
  const arrowLen = 180;
  const arrowHead = 32;
  const arrowPointsLeft = isHandleRight;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${-padding} ${-padding} ${W + padding * 2} ${H + padding * 2}`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
    >
      {/* ================= TELAIO CORRETTO (Poligoni) ================= */}
      {/* I poligoni disegnano i profili tagliati a 45° senza sovrapposizioni errate */}
      
      {/* Montante Sinistro: dal basso, sale dritto, taglio a 45 verso interno, scende dritto */}
      <polygon 
        points={`
          0,${H} 
          0,0 
          ${frameThick},${frameThick} 
          ${frameThick},${H}
        `}
        fill={fillPanel} 
        stroke={strokeColor} 
        strokeWidth={3} 
        strokeLinejoin="round"
      />

      {/* Montante Destro: dal basso interno, sale, taglio a 45 verso esterno, scende dritto */}
      <polygon 
        points={`
          ${W - frameThick},${H} 
          ${W - frameThick},${frameThick} 
          ${W},0 
          ${W},${H}
        `}
        fill={fillPanel} 
        stroke={strokeColor} 
        strokeWidth={3} 
        strokeLinejoin="round"
      />

      {/* Traverso Superiore: taglio 45 sx, dritto, taglio 45 dx, chiude sotto */}
      <polygon 
        points={`
          0,0 
          ${W},0 
          ${W - frameThick},${frameThick} 
          ${frameThick},${frameThick}
        `}
        fill={fillPanel} 
        stroke={strokeColor} 
        strokeWidth={3} 
        strokeLinejoin="round"
      />

      {/* ================= FINE TELAIO ================= */}


      {/* ANTA */}
      <rect x={leafX} y={leafY} width={leafW} height={leafH} fill={fillPanel} stroke={strokeColor} strokeWidth={2} />

      {/* MANIGLIA */}
      {apertura === 'battente' ? (
        <g>
          {/* Definizioni gradienti e filtri per acciaio satinato */}
          <defs>
            <linearGradient id="acciaio-leva" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="5%" stopColor="#e6e6e6" stopOpacity="1" />
              <stop offset="40%" stopColor="#c4c4c4" stopOpacity="1" />
              <stop offset="95%" stopColor="#8c8c8c" stopOpacity="1" />
            </linearGradient>
            <radialGradient id="acciaio-rosetta" cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
              <stop offset="0%" stopColor="#f2f2f2" stopOpacity="1" />
              <stop offset="100%" stopColor="#a6a6a6" stopOpacity="1" />
            </radialGradient>
            <filter id="dropShadow" height="130%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
              <feOffset dx="0" dy="1" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Rosetta tonda acciaio più grande */}
          <circle cx={battenteHandleX} cy={handleY} r={24} fill={handleFill} stroke="#777" strokeWidth={2} />
          <circle cx={battenteHandleX} cy={handleY} r={7} fill={handleFill} stroke="#666" strokeWidth={1.2} opacity="0.6" />
          {/* Rettangolo base leva */}
          <rect x={isHandleRight ? battenteHandleX - 15 : battenteHandleX} y={handleY - 7} width={18} height={13} fill={handleFill} />
          {/* Leva acciaio satinato con ombra (invertita) */}
          <g filter="url(#dropShadow)">
            <rect
              x={isHandleRight ? battenteHandleX - 95 : battenteHandleX + 7}
              y={handleY - 10}
              width={100}
              height={18}
              rx={9}
              fill={handleFill}
              stroke="#555"
              strokeWidth={1}
            />
          </g>
          {/* Highlight bianco sulla leva (invertito) */}
          <path
            d={isHandleRight
              ? `M${battenteHandleX - 88},${handleY - 8.5} L${battenteHandleX - 15},${handleY - 8.5}`
              : `M${battenteHandleX + 14},${handleY - 8.5} L${battenteHandleX + 107},${handleY - 8.5}`
            }
            stroke="#fff"
            strokeWidth={1}
            strokeOpacity={0.7}
            strokeLinecap="round"
          />
        </g>
      ) : (
        // Scorrevole: maniglietta a incasso rotonda realistica
        <g>
          <defs>
            <linearGradient id="metal-rim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f0f0f0" stopOpacity="1" />
              <stop offset="50%" stopColor="#d0d0d0" stopOpacity="1" />
              <stop offset="100%" stopColor="#808080" stopOpacity="1" />
            </linearGradient>
            <radialGradient id="hole-depth" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="70%" stopColor={handleFill} stopOpacity="1" />
              <stop offset="100%" stopColor="#555" stopOpacity="1" />
            </radialGradient>
            <filter id="softShadow" height="130%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
              <feOffset dx="1" dy="1" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g filter="url(#softShadow)">
            {/* Bordo metallico */}
            <circle cx={slidingHandleX} cy={handleY} r={35 * 0.6} fill="url(#metal-rim)" stroke="#666" strokeWidth={0.5} />
            {/* Profondità vaschetta */}
            <circle cx={slidingHandleX} cy={handleY} r={26 * 0.6} fill={handleFill} stroke="#444" strokeWidth={0.5} />
            {/* Highlight */}
            <path
              d={`M${slidingHandleX},${handleY + 15.6} A${26 * 0.6},${26 * 0.6} 0 0,0 ${slidingHandleX + 15.6},${handleY}`}
              fill="none"
              stroke="#fff"
              strokeWidth={1.5}
              strokeOpacity={0.4}
              strokeLinecap="round"
            />
          </g>
        </g>
      )}

      {/* Freccia per scorrevole: punta sempre verso il lato opposto della maniglia */}
      {apertura === 'scorrevole' && (
        <g>
          {arrowPointsLeft ? (
            <>
              <line
                x1={arrowX + arrowLen / 2}
                y1={arrowY}
                x2={arrowX - arrowLen / 2}
                y2={arrowY}
                stroke="#888"
                strokeWidth={7}
                strokeLinecap="round"
              />
              <polygon
                points={[
                  `${arrowX - arrowLen / 2},${arrowY}`,
                  `${arrowX - arrowLen / 2 + arrowHead},${arrowY - arrowHead / 2}`,
                  `${arrowX - arrowLen / 2 + arrowHead},${arrowY + arrowHead / 2}`
                ].join(' ')}
                fill="#888"
              />
            </>
          ) : (
            <>
              <line
                x1={arrowX - arrowLen / 2}
                y1={arrowY}
                x2={arrowX + arrowLen / 2}
                y2={arrowY}
                stroke="#888"
                strokeWidth={7}
                strokeLinecap="round"
              />
              <polygon
                points={[
                  `${arrowX + arrowLen / 2},${arrowY}`,
                  `${arrowX + arrowLen / 2 - arrowHead},${arrowY - arrowHead / 2}`,
                  `${arrowX + arrowLen / 2 - arrowHead},${arrowY + arrowHead / 2}`
                ].join(' ')}
                fill="#888"
              />
            </>
          )}
        </g>
      )}

      {/* Quote H/L */}
      <text
        x={W / 2}
        y={-80}
        textAnchor="middle"
        fontSize="90"
        fill={strokeColor}
        fontFamily="sans-serif"
      >
        {Math.round(W)}
      </text>
      <text
        x={-80}
        y={H / 2}
        textAnchor="end"
        alignmentBaseline="middle"
        fontSize="90"
        fill={strokeColor}
        transform={`rotate(-90 -80 ${H / 2})`}
        fontFamily="sans-serif"
      >
        {Math.round(H)}
      </text>
    </svg>
  );
};