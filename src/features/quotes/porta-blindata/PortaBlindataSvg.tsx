import React, { useId } from 'react';

type PortaBlindataSvgProps = {
  width_mm: number;
  height_mm: number;
  color?: string | null;
  serratura?: boolean | null;
  spioncino?: boolean | null;
  handle_position?: 'left' | 'right' | null;
  handle_color?: string | null;
  viewBox?: boolean;
};

export const PortaBlindataSvg: React.FC<PortaBlindataSvgProps> = ({
  width_mm,
  height_mm,
  color,
  serratura,
  spioncino,
  handle_position = 'right',
  handle_color,
  viewBox = true,
}) => {
  const maskId = useId();

  // Color parsing
  let fillPanel = '#FFFFFF'; // Default panel color (White base)
  
  if (color) {
    if (color.startsWith('#')) {
       fillPanel = color;
    } else {
       const parts = color.split(' ');
       const hex = parts.find(p => p.startsWith('#'));
       if(hex) fillPanel = hex;
    }
  }
  
  // "coloriamo anche il telaio del colore della porta"
  const fillMain = fillPanel; 

  // Configuration based on handle position
  // If handle is RIGHT, Hinges are LEFT
  const isHandleRight = handle_position !== 'left'; 

  // Dimensions
  const frameThick = 60; 

  // Frame outer
  const W = width_mm;
  const H = height_mm;

  // Leaf
  const leafX = frameThick;
  const leafY = frameThick;
  const leafW = W - (frameThick * 2);
  const leafH = H - frameThick; // Threshold at bottom

  // Styles
  const strokeColor = "#222222";
  const strokeWidth = 2; // Scaled up slightly for visibility
  const hingeFill = "#EEEEEE";
  const handleFill = handle_color || "#d1d5db"; // Lighter gray default or custom
  
  // Hinges
  const hingeW = 14;
  const hingeH = 80;
  // "Appiccicate all'anta": Hinges need to touch the leaf edge.
  // If handleRight -> Hinges Left. Leaf starts at frameThick. Hinge ends at frameThick.
  // If handleLeft -> Hinges Right. Leaf ends at W-frameThick. Hinge starts at W-frameThick.
  const hingeX = isHandleRight ? (frameThick - hingeW) : (W - frameThick); 
  const hingeTopY = H * 0.2;
  const hingeBotY = H * 0.8;

  // Handle
  // "Maniglia più grande da portoncino" -> Larger plate + robust lever
  const handleX = isHandleRight ? W - frameThick - 60 : frameThick + 60; 
  const handleY = 1050; // Standard height
  
  // Peephole (Spioncino) - "non deve mai stare troppo in alto, forse massimo a 170cm di altezza"
  // Assuming 170cm from floor = H - 1700. If door is 2100, that's 400 from top.
  // Standard comfortable height is ~150-160cm. Let's fix it at 1550 from floor but clamped.
  // Actually, user thinks it was too high. Let's ensure it's visually balanced.
  // Let's settle at 1550mm from bottom (standard ISO).
  // SVG Y = H - 1550.
  const peepX = W / 2;
  const peepY = Math.max(250, H - 1550); 

  const svgContent = (
    <g>
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* TELAIO (Frame) */}
      <rect
        x={0}
        y={0}
        width={W}
        height={H}
        fill={fillMain}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      
      {/* (Removed inner frame rect as requested) */}

      {/* ANTA (Leaf) */}
      <rect
        x={frameThick}
        y={frameThick}
        width={leafW}
        height={leafH}
        fill={fillPanel}
        stroke={strokeColor}
        strokeWidth={1}
      />

      {/* Decorazione Pannello (Lines) - Expanded to be closer to edges */}
      <rect 
        x={frameThick + leafW * 0.08} 
        y={frameThick + leafH * 0.04} 
        width={leafW * 0.84} 
        height={leafH * 0.92} 
        fill="none"
        stroke="#444444" 
        strokeWidth="1"
        opacity="0.5"
      />

      {/* SOGLIA (Threshold) line at bottom */}
      <line 
        x1={frameThick} 
        y1={H} 
        x2={W - frameThick} 
        y2={H} 
        stroke={strokeColor} 
        strokeWidth={2} 
      />

      {/* CERNIERE (Hinges) */}
      <g>
         <rect x={hingeX} y={hingeTopY} width={hingeW} height={hingeH} rx={4} fill={hingeFill} stroke={strokeColor} strokeWidth={1} />
         <rect x={hingeX} y={hingeBotY} width={hingeW} height={hingeH} rx={4} fill={hingeFill} stroke={strokeColor} strokeWidth={1} />
      </g>

      {/* OPERA MORTA (Opening direction dashed lines) */}
      {/* Triangle pointing to handle side */}
      <path 
        d={`M ${isHandleRight ? frameThick : W - frameThick} ${frameThick} L ${isHandleRight ? W - frameThick : frameThick} ${frameThick + leafH/2} L ${isHandleRight ? frameThick : W - frameThick} ${frameThick + leafH}`}
        fill="none"
        stroke="#888888"
        strokeWidth="1"
        strokeDasharray="15,15"
      />

      {/* SPIONCINO (Peephole) */}
      {spioncino && (
        <g>
          <circle cx={peepX} cy={peepY} r={12} fill={hingeFill} stroke={strokeColor} strokeWidth={1} />
          <circle cx={peepX} cy={peepY} r={4} fill="#222" />
        </g>
      )}

      {/* MANIGLIA (Handle) & SERRATURA */}
      <g transform={`translate(${handleX}, ${handleY})`}>
         {/* Placca lunga */}
         <rect x={-20} y={-100} width={40} height={200} rx={4} fill={handleFill} stroke={strokeColor} strokeWidth={1} />
         
         {/* Leva Maniglia */}
         <circle cx={0} cy={-40} r={6} fill={handleFill} stroke="#555" strokeWidth={0.5} />
         <path 
            d={isHandleRight ? "M 0 -40 L -60 -40 L -60 -20 L -10 -20 Z" : "M 0 -40 L 60 -40 L 60 -20 L 10 -20 Z"} 
            fill={handleFill} 
            stroke="none" 
            filter="url(#shadow)"
         />

         {/* Toppa chiave / Cilindro */}
         {serratura ? (
            <g transform="translate(0, 40)">
               <circle cx={0} cy={0} r={10} fill="#6b7280" />
               <rect x={-2} y={5} width={4} height={10} fill="#6b7280" />
            </g>
         ) : (
            <circle cx={0} cy={40} r={8} fill="none" stroke="#6b7280" strokeWidth={1} />
         )}
      </g>

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
    </g>
  );

  if (!viewBox) return svgContent;

  const padding = 150;
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${-padding} ${-padding} ${W + padding * 2} ${H + padding * 2}`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
    >
      {svgContent}
    </svg>
  );
};
