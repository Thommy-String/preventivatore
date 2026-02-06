import { useState, useRef, useEffect } from "react"
import { Palette, Check, Search, X } from "lucide-react"

export type RalColor = {
  code: string
  name: string
  hex: string
}

const RAL_LIST: RalColor[] = [
  // Gialli
  { code: 'RAL 1000', name: 'Beige verdastro', hex: '#CCC58F' },
  { code: 'RAL 1001', name: 'Beige', hex: '#D1BC8A' },
  { code: 'RAL 1002', name: 'Giallo sabbia', hex: '#D2B773' },
  { code: 'RAL 1003', name: 'Giallo segnale', hex: '#F7BA0B' },
  { code: 'RAL 1004', name: 'Giallo oro', hex: '#E2B007' },
  { code: 'RAL 1005', name: 'Giallo miele', hex: '#C89F04' },
  { code: 'RAL 1006', name: 'Giallo mais', hex: '#E1A100' },
  { code: 'RAL 1007', name: 'Giallo narciso', hex: '#E79600' },
  { code: 'RAL 1011', name: 'Beige marrone', hex: '#AF804F' },
  { code: 'RAL 1012', name: 'Giallo limone', hex: '#D9C022' },
  { code: 'RAL 1013', name: 'Bianco perla', hex: '#E9E5CE' },
  { code: 'RAL 1014', name: 'Avorio', hex: '#DED09F' },
  { code: 'RAL 1015', name: 'Alvorio chiaro', hex: '#E6D2B5' },
  { code: 'RAL 1016', name: 'Giallo zolfo', hex: '#EDFF21' },
  { code: 'RAL 1017', name: 'Giallo zafferano', hex: '#F5D033' },
  { code: 'RAL 1018', name: 'Giallo zinco', hex: '#F8F32B' },
  { code: 'RAL 1019', name: 'Beige grigiastro', hex: '#9E9764' },
  { code: 'RAL 1020', name: 'Giallo oliva', hex: '#999950' },
  { code: 'RAL 1021', name: 'Giallo navone', hex: '#F3DA0B' },
  { code: 'RAL 1023', name: 'Giallo traffico', hex: '#FAD201' },
  { code: 'RAL 1024', name: 'Giallo ocra', hex: '#BA8F4C' },
  { code: 'RAL 1027', name: 'Giallo curry', hex: '#9D9101' },
  { code: 'RAL 1028', name: 'Giallo melone', hex: '#FFAB00' },
  { code: 'RAL 1032', name: 'Giallo ginestra', hex: '#E2A300' },
  { code: 'RAL 1033', name: 'Giallo dahla', hex: '#F99A1C' },
  { code: 'RAL 1034', name: 'Giallo pastello', hex: '#EB9C52' },
  { code: 'RAL 1037', name: 'Giallo sole', hex: '#EA9300' },

  // Arancio
  { code: 'RAL 2000', name: 'Arancio giallastro', hex: '#ED760E' },
  { code: 'RAL 2001', name: 'Arancio rossastro', hex: '#BB4D00' },
  { code: 'RAL 2002', name: 'Arancio sanguigno', hex: '#C63927' },
  { code: 'RAL 2003', name: 'Arancio pastello', hex: '#FA842B' },
  { code: 'RAL 2004', name: 'Arancio puro', hex: '#E75B12' },
  { code: 'RAL 2008', name: 'Arancio rosso chiaro', hex: '#F3752C' },
  { code: 'RAL 2009', name: 'Arancio traffico', hex: '#E15501' },
  { code: 'RAL 2010', name: 'Arancio segnale', hex: '#D4652F' },
  { code: 'RAL 2011', name: 'Arancio profondo', hex: '#EC7C25' },
  { code: 'RAL 2012', name: 'Arancio salmone', hex: '#DB6850' },

  // Rossi
  { code: 'RAL 3000', name: 'Rosso fuoco', hex: '#AB2524' },
  { code: 'RAL 3001', name: 'Rosso segnale', hex: '#A02128' },
  { code: 'RAL 3002', name: 'Rosso carminio', hex: '#962323' },
  { code: 'RAL 3003', name: 'Rosso rubino', hex: '#8D1D2C' },
  { code: 'RAL 3004', name: 'Rosso porpora', hex: '#701F29' },
  { code: 'RAL 3005', name: 'Rosso vino', hex: '#5E2028' },
  { code: 'RAL 3007', name: 'Rosso nerastro', hex: '#402225' },
  { code: 'RAL 3009', name: 'Rosso ossido', hex: '#703731' },
  { code: 'RAL 3011', name: 'Rosso marrone', hex: '#7C292B' },
  { code: 'RAL 3012', name: 'Rosso beige', hex: '#C68858' },
  { code: 'RAL 3013', name: 'Rosso pomodoro', hex: '#99332D' },
  { code: 'RAL 3014', name: 'Rosso antico', hex: '#D36E70' },
  { code: 'RAL 3015', name: 'Rosa chiaro', hex: '#E6A1B1' },
  { code: 'RAL 3016', name: 'Rosso corallo', hex: '#A6412D' },
  { code: 'RAL 3017', name: 'Rosso rosa', hex: '#D15965' },
  { code: 'RAL 3018', name: 'Rosso fragola', hex: '#CC4154' },
  { code: 'RAL 3020', name: 'Rosso traffico', hex: '#C1121C' },
  { code: 'RAL 3022', name: 'Rosso salmone', hex: '#D36D55' },
  { code: 'RAL 3027', name: 'Rosso lampone', hex: '#B42041' },
  { code: 'RAL 3031', name: 'Rosso oriente', hex: '#AC323B' },

  // Blu
  { code: 'RAL 5000', name: 'Blu violaceo', hex: '#384E70' },
  { code: 'RAL 5001', name: 'Blu verdastro', hex: '#1F4764' },
  { code: 'RAL 5002', name: 'Blu oltremare', hex: '#2B3C8E' },
  { code: 'RAL 5003', name: 'Blu zaffiro', hex: '#2A3756' },
  { code: 'RAL 5004', name: 'Blu nerastro', hex: '#20262E' },
  { code: 'RAL 5005', name: 'Blu segnale', hex: '#154889' },
  { code: 'RAL 5007', name: 'Blu brillante', hex: '#41678D' },
  { code: 'RAL 5008', name: 'Blu grigiastro', hex: '#313C48' },
  { code: 'RAL 5009', name: 'Blu azzurro', hex: '#2E5978' },
  { code: 'RAL 5010', name: 'Blu genziana', hex: '#13447C' },
  { code: 'RAL 5011', name: 'Blu acciaio', hex: '#232C3F' },
  { code: 'RAL 5012', name: 'Blu luce', hex: '#3481B8' },
  { code: 'RAL 5013', name: 'Blu cobalto', hex: '#232D53' },
  { code: 'RAL 5014', name: 'Blu colomba', hex: '#6C7C98' },
  { code: 'RAL 5015', name: 'Blu cielo', hex: '#2874B2' },
  { code: 'RAL 5017', name: 'Blu traffico', hex: '#0E518D' },
  { code: 'RAL 5018', name: 'Blu turchese', hex: '#21888F' },
  { code: 'RAL 5019', name: 'Blu capri', hex: '#1A5784' },
  { code: 'RAL 5020', name: 'Blu oceano', hex: '#0B4151' },
  { code: 'RAL 5021', name: 'Blu acqua', hex: '#257179' },
  { code: 'RAL 5022', name: 'Blu notte', hex: '#2B3244' },
  { code: 'RAL 5023', name: 'Blu distante', hex: '#4A6589' },
  { code: 'RAL 5024', name: 'Blu pastello', hex: '#6A93B0' },

  // Verdi
  { code: 'RAL 6000', name: 'Verde patina', hex: '#327662' },
  { code: 'RAL 6001', name: 'Verde smeraldo', hex: '#28713E' },
  { code: 'RAL 6002', name: 'Verde foglia', hex: '#276235' },
  { code: 'RAL 6003', name: 'Verde oliva', hex: '#515645' },
  { code: 'RAL 6004', name: 'Verde bluastro', hex: '#1F4242' },
  { code: 'RAL 6005', name: 'Verde muschio', hex: '#2F4538' },
  { code: 'RAL 6006', name: 'Verde oliva grigio', hex: '#3E3F3A' },
  { code: 'RAL 6007', name: 'Verde bottiglia', hex: '#2C3222' },
  { code: 'RAL 6008', name: 'Verde bruno', hex: '#37342A' },
  { code: 'RAL 6009', name: 'Verde abete', hex: '#26392F' },
  { code: 'RAL 6010', name: 'Verde erba', hex: '#447C38' },
  { code: 'RAL 6011', name: 'Verde reseda', hex: '#68825B' },
  { code: 'RAL 6012', name: 'Verde nero', hex: '#313F36' },
  { code: 'RAL 6013', name: 'Verde canna', hex: '#7D7F66' },
  { code: 'RAL 6014', name: 'Verde oliva giallo', hex: '#474536' },
  { code: 'RAL 6015', name: 'Verde oliva nero', hex: '#3D3D37' },
  { code: 'RAL 6016', name: 'Verde turchese', hex: '#056A4E' },
  { code: 'RAL 6017', name: 'Verde maggio', hex: '#538C44' },
  { code: 'RAL 6018', name: 'Verde giallo', hex: '#639F38' },
  { code: 'RAL 6019', name: 'Verde bianco', hex: '#B9DABB' },
  { code: 'RAL 6020', name: 'Verde cromo', hex: '#36422F' },
  { code: 'RAL 6021', name: 'Verde pallido', hex: '#8C9C7B' },
  { code: 'RAL 6022', name: 'Verde bruno oliva', hex: '#3E3C32' },
  { code: 'RAL 6024', name: 'Verde traffico', hex: '#008455' },
  { code: 'RAL 6025', name: 'Verde felce', hex: '#527038' },
  { code: 'RAL 6026', name: 'Verde opale', hex: '#005D52' },
  { code: 'RAL 6027', name: 'Verde luce', hex: '#77BBBD' },
  { code: 'RAL 6028', name: 'Verde pino', hex: '#315444' },
  { code: 'RAL 6029', name: 'Verde menta', hex: '#167347' },
  { code: 'RAL 6032', name: 'Verde segnale', hex: '#2A7F54' },
  { code: 'RAL 6033', name: 'Turchese menta', hex: '#468682' },
  { code: 'RAL 6034', name: 'Turchese pastello', hex: '#7AACAC' },

  // Grigi
  { code: 'RAL 7000', name: 'Grigio vaio', hex: '#7E8B92' },
  { code: 'RAL 7001', name: 'Grigio argento', hex: '#8F999F' },
  { code: 'RAL 7002', name: 'Grigio oliva', hex: '#817F68' },
  { code: 'RAL 7003', name: 'Grigio muschio', hex: '#7A7B6E' },
  { code: 'RAL 7004', name: 'Grigio segnale', hex: '#9EA0A1' },
  { code: 'RAL 7005', name: 'Grigio topo', hex: '#6B6E6B' },
  { code: 'RAL 7006', name: 'Grigio beige', hex: '#756F61' },
  { code: 'RAL 7008', name: 'Grigio kaki', hex: '#74664F' },
  { code: 'RAL 7009', name: 'Grigio verde', hex: '#5B6259' },
  { code: 'RAL 7010', name: 'Grigio tenda', hex: '#575D57' },
  { code: 'RAL 7011', name: 'Grigio ferro', hex: '#555D61' },
  { code: 'RAL 7012', name: 'Grigio basalto', hex: '#596163' },
  { code: 'RAL 7013', name: 'Grigio brunastro', hex: '#555548' },
  { code: 'RAL 7015', name: 'Grigio ardesia', hex: '#51565C' },
  { code: 'RAL 7016', name: 'Grigio antracite', hex: '#383E42' },
  { code: 'RAL 7021', name: 'Grigio nerastro', hex: '#2F3234' },
  { code: 'RAL 7022', name: 'Grigio ombra', hex: '#4B4D46' },
  { code: 'RAL 7023', name: 'Grigio calcestruzzo', hex: '#818479' },
  { code: 'RAL 7024', name: 'Grigio grafite', hex: '#474A51' },
  { code: 'RAL 7026', name: 'Grigio granito', hex: '#374447' },
  { code: 'RAL 7030', name: 'Grigio pietra', hex: '#939388' },
  { code: 'RAL 7031', name: 'Grigio bluastro', hex: '#5D6970' },
  { code: 'RAL 7032', name: 'Grigio ghiaia', hex: '#B8B799' },
  { code: 'RAL 7033', name: 'Grigio cemento', hex: '#7D8471' },
  { code: 'RAL 7034', name: 'Grigio giallastro', hex: '#939176' },
  { code: 'RAL 7035', name: 'Grigio luce', hex: '#D7D7D7' },
  { code: 'RAL 7036', name: 'Grigio platino', hex: '#9DA1AA' },
  { code: 'RAL 7037', name: 'Grigio polvere', hex: '#7D7F7D' },
  { code: 'RAL 7038', name: 'Grigio agata', hex: '#B5B8B1' },
  { code: 'RAL 7039', name: 'Grigio quarzo', hex: '#6C6960' },
  { code: 'RAL 7040', name: 'Grigio finestra', hex: '#9DA3A6' },
  { code: 'RAL 7042', name: 'Grigio traffico A', hex: '#8D948D' },
  { code: 'RAL 7043', name: 'Grigio traffico B', hex: '#4E5452' },
  { code: 'RAL 7044', name: 'Grigio seta', hex: '#CAC4B0' },
  { code: 'RAL 7045', name: 'Grigio tele 1', hex: '#8F9695' },
  { code: 'RAL 7046', name: 'Grigio tele 2', hex: '#82898F' },
  { code: 'RAL 7047', name: 'Grigio tele 4', hex: '#D0D0D0' },

  // Marroni
  { code: 'RAL 8000', name: 'Marrone verde', hex: '#89693E' },
  { code: 'RAL 8001', name: 'Marrone ocra', hex: '#9C6B30' },
  { code: 'RAL 8002', name: 'Marrone segnale', hex: '#7B5141' },
  { code: 'RAL 8003', name: 'Marrone argilla', hex: '#80542F' },
  { code: 'RAL 8004', name: 'Marrone rame', hex: '#8F4E35' },
  { code: 'RAL 8007', name: 'Marrone capriolo', hex: '#6F4A2F' },
  { code: 'RAL 8008', name: 'Marrone oliva', hex: '#6F4F28' },
  { code: 'RAL 8011', name: 'Marrone noce', hex: '#5B3A29' },
  { code: 'RAL 8012', name: 'Marrone rosso', hex: '#663B36' },
  { code: 'RAL 8014', name: 'Marrone seppia', hex: '#49392D' },
  { code: 'RAL 8015', name: 'Marrone castagna', hex: '#633A34' },
  { code: 'RAL 8016', name: 'Marrone mogano', hex: '#4C2F27' },
  { code: 'RAL 8017', name: 'Marrone cioccolato', hex: '#45322E' },
  { code: 'RAL 8019', name: 'Marrone grigiastro', hex: '#403A3A' },
  { code: 'RAL 8022', name: 'Marrone nerastro', hex: '#212121' },
  { code: 'RAL 8023', name: 'Marrone arancio', hex: '#A65E2E' },
  { code: 'RAL 8024', name: 'Marrone beige', hex: '#79553D' },
  { code: 'RAL 8025', name: 'Marrone pallido', hex: '#755C48' },
  { code: 'RAL 8028', name: 'Marrone terra', hex: '#4E3B31' },

  // Bianchi e Neri
  { code: 'RAL 9001', name: 'Bianco crema', hex: '#EBE7D8' },
  { code: 'RAL 9002', name: 'Grigio bianco', hex: '#D7D7D7' },
  { code: 'RAL 9003', name: 'Bianco segnale', hex: '#F4F4F4' },
  { code: 'RAL 9004', name: 'Nero segnale', hex: '#282828' },
  { code: 'RAL 9005', name: 'Nero intenso', hex: '#0A0A0A' },
  { code: 'RAL 9006', name: 'Alluminio bianco', hex: '#A5A5A5' },
  { code: 'RAL 9007', name: 'Alluminio grigio', hex: '#8F8F8F' },
  { code: 'RAL 9010', name: 'Bianco puro', hex: '#FFFFFF' },
  { code: 'RAL 9011', name: 'Nero grafite', hex: '#1C1C1C' },
  { code: 'RAL 9016', name: 'Bianco traffico', hex: '#F1F5F9' },
  { code: 'RAL 9017', name: 'Nero traffico', hex: '#1E1E1E' },
  { code: 'RAL 9018', name: 'Bianco papiro', hex: '#D0D0D0' },
  
  // Tinte Legno (Simulati)
  { code: 'Golden Oak', name: 'Quercia Dorata', hex: '#D68029' },
  { code: 'Noce', name: 'Noce Scuro', hex: '#5D3A25' },
  { code: 'Noce Chiaro', name: 'Noce Chiaro', hex: '#8F5E38' },
  { code: 'Winchester', name: 'Winchester', hex: '#A87B4E' },
  { code: 'Mogano', name: 'Mogano', hex: '#4C2F27' },
  { code: 'Ciliegio', name: 'Ciliegio', hex: '#9C4533' },
]

type Props = {
  /** Il colore esadecimale usato per l'anteprima */
  previewColor: string
  /** La descrizione testuale (es. "RAL 9010") */
  labelValue: string
  /** Callback quando cambia il colore anteprima (hex) */
  onPreviewColorChange: (hex: string) => void
  /** Callback per aggiornare il testo manuale */
  onLabelChange: (text: string) => void
  /** Callback opzionale per gestire la selezione unificata (es. per evitare race condition) */
  onRalSelect?: (ral: RalColor) => void
}

export function RalColorPicker({ previewColor, labelValue, onPreviewColorChange, onLabelChange, onRalSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Filtra la lista
  const filteredRals = RAL_LIST.filter(r => 
    r.code.toLowerCase().includes(search.toLowerCase()) || 
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  // Chiudi cliccando fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleRalSelect = (ral: RalColor) => {
    if (onRalSelect) {
      onRalSelect(ral)
    } else {
      onPreviewColorChange(ral.hex)
      onLabelChange(`${ral.code} ${ral.name}`)
    }
    setIsOpen(false)
    setSearch('')
  }

  return (
    <div className="flex gap-2 w-full" ref={containerRef}>
      {/* 1. Trigger Colore + Modale Lista */}
      <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 rounded border shadow-sm ring-offset-1 focus:ring-2 focus:ring-blue-500 overflow-hidden relative"
            title="Scegli colore da lista o personalizzato"
          >
             {/* Sfondo colore attivo */}
             <div className="absolute inset-0" style={{ backgroundColor: previewColor || '#fff' }} />
             {/* Icona lista se vuoto o per indicare azione */}
             <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 hover:opacity-100 transition-opacity">
                 <Search size={16} className="text-white drop-shadow-md" />
             </div>
          </button>

          {/* === POPUP SELECTOR === */}
          {isOpen && (
             <div className="absolute top-full left-0 mt-2 w-[300px] bg-white border rounded-lg shadow-xl z-[9999] flex flex-col h-[320px]">
                {/* Header Ricerca */}
                <div className="p-2 border-b bg-gray-50 flex gap-2 items-center">
                    <Search size={16} className="text-gray-400" />
                    <input 
                        className="flex-1 bg-transparent border-none text-sm focus:ring-0 px-0 outline-none"
                        placeholder="Cerca RAL..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                    />
                    <button onClick={() => setIsOpen(false)}><X size={16} className="text-gray-400 hover:text-red-500"/></button>
                </div>

                {/* Selettore Custom in cima */}
                <div className="p-2 border-b bg-purple-50/50">
                    <label className="flex items-center gap-3 cursor-pointer hover:bg-black/5 p-1 rounded transition-colors">
                        <div className="relative w-8 h-8 rounded-full shadow-sm border overflow-hidden shrink-0">
                            <input 
                                type="color" 
                                className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 p-0 border-0 cursor-pointer"
                                value={previewColor && previewColor.startsWith('#') ? previewColor : '#ffffff'}
                                onChange={(e) => {
                                    const c = { code: 'CUSTOM', name: 'Personalizzato', hex: e.target.value };
                                    if(onRalSelect) onRalSelect(c);
                                    else {
                                        onPreviewColorChange(c.hex);
                                        onLabelChange(c.name);
                                    }
                                    // Non chiudiamo automaticamente per permettere aggiustamenti (dragging)
                                }}
                            />
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">Custom / Personale</div>
                            <div className="text-xs text-gray-500">Scegli dalla tavolozza</div>
                        </div>
                    </label>
                </div>
                
                {/* Lista Griglia/Elenco */}
                <div className="flex-1 overflow-y-auto p-1">
                    {filteredRals.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-400">Nessun colore trovato</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-1">
                            {filteredRals.map(ral => (
                                <button
                                    key={ral.code}
                                    type="button"
                                    onClick={() => handleRalSelect(ral)}
                                    className="flex items-center gap-3 px-2 py-1.5 hover:bg-blue-50 rounded text-left transition-colors group w-full"
                                >
                                    <div 
                                        className="w-8 h-8 rounded border shrink-0 shadow-sm"
                                        style={{ backgroundColor: ral.hex }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-gray-700 truncate">{ral.code}</div>
                                        <div className="text-[11px] text-gray-500 truncate group-hover:text-blue-600">{ral.name}</div>
                                    </div>
                                    {labelValue.includes(ral.code) && <Check size={14} className="text-blue-600" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer: Custom Picker nativo */}
                <div className="p-2 border-t bg-gray-50 text-center relative">
                     <label className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer flex items-center justify-center gap-2 py-1">
                        <Palette size={14} />
                        Usa selettore manuale (Picker)
                        <input 
                            type="color" 
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            value={previewColor}
                            onChange={(e) => {
                                onPreviewColorChange(e.target.value)
                                // Non cambiamo l'etichetta testo automaticamente col custom picker
                                // Non chiudiamo automaticamente per permettere aggiustamenti
                            }}
                        />
                     </label>
                </div>
             </div>
          )}
      </div>

      {/* 2. Input Testuale (Pieno controllo utente) */}
      <div className="flex-1 relative">
         <input
            type="text"
            className="input w-full"
            placeholder="Descrizione colore (es. RAL 9010)"
            value={labelValue}
            onChange={(e) => onLabelChange(e.target.value)}
         />
      </div>
    </div>
  )
}
