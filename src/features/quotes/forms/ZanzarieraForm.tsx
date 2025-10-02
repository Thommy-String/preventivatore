import type { ItemFormProps } from "../registry"
import type { ZanzarieraItem } from "../types"

const PROFILO_COLORI = [
  "015 BIANCO OPACO P9016",
  "030 GRIGIO OPACO",
  "090 ANTRACITE RUVIDO OPACO P7016 - NOVITA' 2024",
  "097 NERO RUVIDO OPACO P9005 - NOVITA' 2024",
  "110 PERLA OPACO P1013",
  "202 MARRONE RUVIDO OPACO P8017 - NOVITA' 2024",
  "210 BRONZO CHIARO OPACO",
  "211 BRONZO SCURO OPACO",
  "501 VERDE RUVIDO OPACO P6005 - NOVITA' 2024",
  "700 ARGENTO ANODIZZATO",
  "751 GRIGIO MAREZZATO",
  "810 QUERCIA SCURA",
  "811 QUERCIA CHIARA",
  "888 LEGNO NON A CARTELLA",
  "999 RAL NON A CARTELLA",
  "000 GREZZO",
]

const TIPI = [
  "Tondo verticale molla",
  "Tondo plus verticale molla",
  "Tondo verticale catenella",
  "Tondo verticale motore",
  "Tondo laterale molla",
  "Tondo doppia zanz laterale molla",
] as const

const MODELLI = ["Tondo 38", "Tondo 46", "Tondo 65", "Tondo 105"] as const

export function ZanzarieraForm(
  props: ItemFormProps<ZanzarieraItem> & { draft?: ZanzarieraItem }
) {
  const draft = props.value ?? props.draft
  const onChange = props.onChange

  // Usa sempre il draft corrente come base; se assente preserva il kind
  const set = <K extends keyof ZanzarieraItem>(k: K, v: ZanzarieraItem[K]) => {
    const base = (draft ?? ({ kind: "zanzariera" } as ZanzarieraItem))
    onChange({ ...base, [k]: v })
  }
  // valori di fallback per evitare accessi a undefined
  const qty = draft?.qty ?? 1
  const width = draft?.width_mm ?? 1000
  const height = draft?.height_mm ?? 1500
  const misura = draft?.misura_tipo ?? 'vano'
  const modello = draft?.modello ?? ''
  const tipologia = draft?.tipologia ?? 'Tondo verticale molla'
  const profiloColore = draft?.profilo_colore ?? '030 GRIGIO OPACO'
  const accessoriColore = draft?.accessori_colore ?? 'Nero'
  const mesh = draft?.mesh ?? 'Antracite'
  const deceleratore = draft?.deceleratore ?? true

  return (
    <div className="space-y-4">
      {/* SEZIONE: Quantità (solo informativa) */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Quantità</div>
        <div className="grid grid-cols-2 gap-2 items-start">
          <div>
            <div className="text-xs text-gray-500">Pezzi</div>
            <input
              className="input"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => set('qty', Math.max(1, Number(e.target.value || 1)))}
            />
          </div>
        </div>
      </section>

      {/* SEZIONE: Modello & Tipologia */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Modello & Tipologia</div>
        <div className="grid grid-cols-2 gap-2 items-start">
          <div>
            <div className="text-xs text-gray-500">Modello</div>
            <select
              className="input"
              value={modello}
              onChange={(e) => set('modello', (e.target.value || null) as any)}
            >
              <option value="">—</option>
              {MODELLI.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-500">Tipologia</div>
            <select
              className="input"
              value={tipologia}
              onChange={(e) => set('tipologia', (e.target.value || null) as any)}
            >
              {TIPI.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* SEZIONE: Misure */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Misure</div>
        <div className="grid grid-cols-3 gap-2 items-start">
          <div>
            <div className="text-xs text-gray-500">Larghezza (mm)</div>
            <input
              className="input"
              type="number"
              value={width}
              onChange={(e) => set('width_mm', Number(e.target.value || 0))}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500">Altezza (mm)</div>
            <input
              className="input"
              type="number"
              value={height}
              onChange={(e) => set('height_mm', Number(e.target.value || 0))}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500">Tipo di misura</div>
            <select
              className="input"
              value={misura}
              onChange={(e) => set('misura_tipo', (e.target.value || null) as any)}
            >
              <option value="vano">Vano</option>
            </select>
          </div>
        </div>
      </section>

      {/* SEZIONE: Colori & Rete */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Colori & Rete</div>
        <div className="grid grid-cols-2 gap-2 items-start">
          <div>
            <div className="text-xs text-gray-500">Colore profilo</div>
            <select
              className="input"
              value={profiloColore}
              onChange={(e) => set('profilo_colore', e.target.value || null)}
            >
              {PROFILO_COLORI.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-500">Colore accessori</div>
            <input
              className="input"
              placeholder="Nero"
              value={accessoriColore}
              onChange={(e) => set('accessori_colore', e.target.value || null)}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500">Tipo di rete</div>
            <input
              className="input"
              placeholder="Antracite"
              value={mesh}
              onChange={(e) => set('mesh', e.target.value || null)}
            />
          </div>
        </div>
      </section>

      {/* SEZIONE: Extra */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Extra</div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={deceleratore}
            onChange={(e) => set('deceleratore', e.target.checked)}
          />
          Deceleratore
        </label>
      </section>
    </div>
  )
}