import { useEffect, useState } from "react"
import type { ItemFormProps } from "../types"
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
  const draft = props.draft
  const onChange = props.onChange

  // Mobile-friendly numeric editing (allow empty while typing, commit on blur)
  const [qtyStr, setQtyStr] = useState(draft?.qty == null ? "1" : String(draft.qty))
  const [widthStr, setWidthStr] = useState(draft?.width_mm == null ? "" : String(draft.width_mm))
  const [heightStr, setHeightStr] = useState(draft?.height_mm == null ? "" : String(draft.height_mm))

  // Keep local strings in sync when draft changes externally
  useEffect(() => {
    setQtyStr(draft?.qty == null ? "1" : String(draft?.qty))
    setWidthStr(draft?.width_mm == null ? "" : String(draft?.width_mm))
    setHeightStr(draft?.height_mm == null ? "" : String(draft?.height_mm))
  }, [draft?.qty, draft?.width_mm, draft?.height_mm])

  // Usa sempre il draft corrente come base; se assente preserva il kind
  const set = <K extends keyof ZanzarieraItem>(k: K, v: ZanzarieraItem[K]) => {
    const base = (draft ?? ({ kind: "zanzariera" } as ZanzarieraItem))
    onChange({ ...base, [k]: v })
  }
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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={qtyStr}
              onChange={(e) => {
                const v = e.target.value
                if (v === "" || /^\d+$/.test(v)) setQtyStr(v)
              }}
              onBlur={() => {
                const n = qtyStr === "" ? 1 : Math.max(1, Number(qtyStr) || 1)
                set("qty", n as any)
                setQtyStr(String(n))
              }}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              onKeyDown={(e) => { if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault() }}
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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={widthStr}
              onChange={(e) => {
                const v = e.target.value
                if (v === "" || /^\d+$/.test(v)) setWidthStr(v)
              }}
              onBlur={() => {
                if (widthStr === "") {
                  set("width_mm", null as any)
                } else {
                  const n = Number(widthStr)
                  set("width_mm", Number.isNaN(n) ? null as any : (n as any))
                  setWidthStr(Number.isNaN(n) ? "" : String(n))
                }
              }}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              onKeyDown={(e) => { if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault() }}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500">Altezza (mm)</div>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={heightStr}
              onChange={(e) => {
                const v = e.target.value
                if (v === "" || /^\d+$/.test(v)) setHeightStr(v)
              }}
              onBlur={() => {
                if (heightStr === "") {
                  set("height_mm", null as any)
                } else {
                  const n = Number(heightStr)
                  set("height_mm", Number.isNaN(n) ? null as any : (n as any))
                  setHeightStr(Number.isNaN(n) ? "" : String(n))
                }
              }}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              onKeyDown={(e) => { if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault() }}
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
            <div className="text-xs text-gray-500">Colore rete</div>
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

      {/* Riferimento */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-gray-500">Riferimento</div>
        <input
          className="input"
          type="text"
          placeholder="es. Bagno piccolo, Salotto..."
          value={draft?.reference ?? ''}
          onChange={(e) => set('reference', e.target.value)}
        />
      </section>
    </div>
  )
}