// src/pdf/QuotePDF.tsx
import {
  Document, Page, View, Text, Image, StyleSheet
} from "@react-pdf/renderer";

import finestraImg from "../assets/images/finestra.png";
import portaFinestraImg from "../assets/images/portaFinestra.png";
import scorrevoleImg from "../assets/images/scorrevole.png";
import zanzarieraImg from "../assets/images/zanzariera.png";
import cassonettoImg from "../assets/images/cassonetto.png";
import persianaImg from "../assets/images/persiana.png";
import tapparellaImg from "../assets/images/tapparella.png";

// Accept both shapes: `{category, amount}` or `{label, amount}`
export type CategoryTotalInput = { category?: string | null; label?: string | null; amount?: number | null }

type Customer = { name?: string|null; address?: string|null; email?: string|null; phone?: string|null };

export type QuotePDFProps = {
  companyLogoUrl?: string | null;
  quoteNumber?: string | null;
  issueDate?: string | null;            // ISO yyyy-mm-dd
  installTime?: string | null;          // Tempi di posa
  totalMq?: number | null;              // m²
  profileSystem?: string | null;        // es. WDS 76 MD
  vatRateLabel?: string | null;         // "IVA 22%"
  customer?: Customer | null;
  catTotals?: CategoryTotalInput[];     // es. [{category:'Serramenti',amount:590}, ...] o [{label:'Serramenti',...}]
  mountingCost?: number | null;         // montaggio
  totalExcluded?: number | null;        // totale imponibile (IVA esclusa)
  validityLabel?: string | null;        // "VALIDITA’ OFFERTA: 15 GG…"
  terms?: string | null;                // testo condizioni (pagina 2)
  items?: any[] | null;               // elenco voci del preventivo
};

const s = StyleSheet.create({
  page: { padding: 38, fontSize: 10, color: "#111" },
  row: { flexDirection: "row" },
  col: { flexGrow: 1 },
  h1: { fontSize: 32, fontWeight: 700, marginBottom: 4 },
  h2: { fontSize: 12, fontWeight: 700, marginTop: 14, marginBottom: 6 },
  h2Tight: { fontSize: 12, fontWeight: 700, marginTop: 0, marginBottom: 4 },
  label: { color: "#555" },
  box: { borderWidth: 1, borderStyle: "solid", borderColor: "#e6e6e6", borderRadius: 6, padding: 8 },
  table: { borderWidth: 1, borderStyle: "solid", borderColor: "#e6e6e6", borderRadius: 6, marginTop: 8 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderStyle: "solid", borderColor: "#e0e0e0" },
  th: { flex: 1, fontWeight: 700, fontSize: 10, padding: 8, backgroundColor: "#f7f7f7" },
  td: { flex: 1, padding: 8 },
  right: { textAlign: "right" as const },
  small: { fontSize: 9, color: "#555" },
  logo: { width: 90, height: 32, objectFit: "contain", marginBottom: 6 },
  companyDetails: { fontSize: 9, color: '#555', lineHeight: 1.4 },
  sep: { height: 8 },
  footerNote: { marginTop: 14, fontSize: 9, color: "#555" },
  block: { marginTop: 6 },

  // --- STILI CARD "DETTAGLIO VOCI" ---
  itemCard: {
    backgroundColor: "#f5f6f8",
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
    flexDirection: "row",
  },
  itemPhotoWrap: {
    width: 95,
    height: 95,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    position: "relative",
    borderWidth: 1,
    borderColor: '#eee',
  },
  dimW: { position: "absolute", bottom: 2, left: 0, right: 0, textAlign: "center", fontSize: 7, color: "#666" },
  dimHWrap: { position: "absolute", top: 0, bottom: 0, left: 1, alignItems: "center", justifyContent: "center" },
  dimH: { fontSize: 7, color: "#666", transform: "rotate(-90deg)" },
  photo: { width: "100%", height: "100%", objectFit: "contain" },

  itemContent: {
    flex: 1,
    paddingLeft: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemKind: {
    fontSize: 12,
    fontWeight: 700,
    color: '#111',
  },
  itemQty: {
    fontSize: 10,
    color: '#555',
    fontWeight: 500,
  },
  itemDescription: {
    fontSize: 9,
    color: '#666',
    marginBottom: 8,
  },
  hr: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  detailGrid: {
    // Container for key-value pairs
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 2,
    marginTop: 6,
  },
  detailLabel: {
    width: '45%', // Fixed width for labels
    color: '#555',
    paddingRight: 5,
  },
  detailValue: {
    flex: 1, // Value takes remaining space
    fontWeight: 500,
    color: '#111'
  },
});

function euro(n?: number | null) {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(v);
}

function safeText(v?: string | null, fallback = "—") {
  if (typeof v === "string" && v.trim().length > 0) return v;
  return fallback;
}

function formatISODate(iso?: string | null) {
  if (!iso) return "—";
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso.slice(0, 10);
  return String(iso);
}

function normalizeTotals(input?: CategoryTotalInput[] | null) {
  const arr = Array.isArray(input) ? input : [];
  return arr.map((r) => ({
    category: safeText(r?.label ?? r?.category ?? "", "-"),
    amount: (typeof r?.amount === "number" && Number.isFinite(r.amount)) ? r.amount : 0,
  }));
}

function normalizeItems(input?: any[] | Record<string, any> | null) {
  if (Array.isArray(input)) return input.filter(Boolean);
  if (input && typeof input === 'object') return Object.values(input).filter(Boolean);
  return [];
}

function describeItem(it: any): string {
  if (!it || typeof it !== 'object') return 'Dettagli non disponibili';
  const w = it.width_mm || it.larghezza_mm || it.larghezza;
  const h = it.height_mm || it.altezza_mm || it.altezza;

  if (w && h) {
    return `${w} × ${h} mm`;
  }
  if (w) {
    return `Larghezza ${w} mm`;
  }
  if (h) {
    return `Altezza ${h} mm`;
  }

  // Fallback se non ci sono misure
  if (it.kind === 'custom') {
    return it.note || it.label || 'Voce personalizzata';
  }
  return 'Dimensioni non specificate';
}

function imageFor(kind?: string | null) {
  switch (kind) {
    case "finestra": return finestraImg;
    case "portafinestra": return portaFinestraImg;
    case "scorrevole": return scorrevoleImg;
    case "zanzariera": return zanzarieraImg;
    case "cassonetto": return cassonettoImg;
    case "persiana": return persianaImg;
    case "tapparella": return tapparellaImg;
    default: return finestraImg;
  }
}

function pickFirst(obj: any, keys: string[]): any {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).toString().trim() !== "") return obj[k]
  }
  return undefined
}

function asBoolLabel(v: any, yes = "Sì", no = "No"): string | undefined {
  if (typeof v === "boolean") return v ? yes : no
  if (typeof v === "string") {
    const s = v.trim().toLowerCase()
    if (["si","sì","yes","true","1","on"].includes(s)) return yes
    if (["no","false","0","off"].includes(s)) return no
  }
  return undefined
}

function detailPairs(it: any): Array<[string, string]> {
  if (!it || typeof it !== "object") return []
  const pairs: Array<[string, string]> = []

  // Calcola superficie in m² se le misure sono numeriche (mm)
  const wNum = Number(it.width_mm ?? it.larghezza_mm ?? it.larghezza);
  const hNum = Number(it.height_mm ?? it.altezza_mm ?? it.altezza);
  const areaM2 = Number.isFinite(wNum) && Number.isFinite(hNum) ? (wNum * hNum) / 1_000_000 : undefined

  switch (it.kind) {
    case "finestra":
    case "portafinestra":
    case "scorrevole": {
      if (typeof areaM2 === 'number') {
        const a = areaM2.toFixed(2)
        pairs.push(["Superficie", `${a} m²`])
      }
      const ps = pickFirst(it, ["profile_system","system_profile"]) ; if (ps) pairs.push(["Sistema profilo", String(ps)])
      const col = pickFirst(it, ["color","colore","profilo_colore"]) ; if (col) pairs.push(["Colore", String(col)])
      const vetro = pickFirst(it, ["glass","vetro"]) ; if (vetro) pairs.push(["Vetro", String(vetro)])
      const uw = pickFirst(it, ["uw"]) ; if (uw) pairs.push(["Uw (trasmittanza termica)", String(uw)])
      const cern = pickFirst(it, ["hinge_color","colore_cerniere"]) ; if (cern) pairs.push(["Colore cerniere", String(cern)])
      break
    }
    case "zanzariera": {
      const mod = pickFirst(it, ["modello"]) ; if (mod) pairs.push(["Modello", String(mod)])
      const tip = pickFirst(it, ["tipologia"]) ; if (tip) pairs.push(["Tipologia", String(tip)])
      const rete = pickFirst(it, ["rete_tipo","tipo_rete"]) ; if (rete) pairs.push(["Colore rete", String(rete)])
      const dec = asBoolLabel(pickFirst(it, ["deceleratore","has_deceleratore","con_deceleratore"])) ; if (dec) pairs.push(["Deceleratore", dec])
      break
    }
    case "cassonetto": {
      const mat = pickFirst(it, ["material","materiale"]) ; if (mat) pairs.push(["Materiale", String(mat)])
      const d = pickFirst(it, ["depth_mm","profondita_mm","profondità_mm"]) ; if (d) pairs.push(["Profondità", `${d} mm`])
      const sp = pickFirst(it, ["spalletta_mm","extension_mm","spalletta"]) ; if (sp) pairs.push(["Celino", `${sp} mm`])
      const col = pickFirst(it, ["color","colore"]) ; if (col) pairs.push(["Colore", String(col)])
      break
    }
    case "persiana": {
      pairs.push(["Materiale", "Alluminio"])
      const lam = pickFirst(it, ["lamelle_type","lamelle"]) ; if (lam) pairs.push(["Lamelle", String(lam)])
      const telLab = asBoolLabel(pickFirst(it, ["con_telaio","telaio"]), "Con telaio", "Senza telaio") ; if (telLab) pairs.push(["Telaio", telLab])
      const col = pickFirst(it, ["color","colore"]) ; if (col) pairs.push(["Colore", String(col)])
      break
    }
    case "tapparella": {
      const mat = pickFirst(it, ["material","materiale"]) ; if (mat) pairs.push(["Materiale", String(mat)])
      const col = pickFirst(it, ["color","colore"]) ; if (col) pairs.push(["Colore", String(col)])
      break
    }
    case "custom": {
      const title = pickFirst(it, ["label","title"]) ; if (title) pairs.push(["Titolo", String(title)])
      const note = pickFirst(it, ["note","descrizione"]) ; if (note) pairs.push(["Note", String(note)])
      break
    }
  }

  const shownKeys = new Set(pairs.map(([k]) => k.toLowerCase()))
  const skip = new Set([
    "id","kind","qty",
    "width_mm","height_mm","larghezza_mm","altezza_mm","larghezza","altezza",
    "price_mode","price_total","price_per_mq","unit_price","unitPrice","price","prezzo","misura_tipo",
    "accessori_colore" // Rimuovi questo campo
  ])
  for (const [k, v] of Object.entries(it)) {
    if (v === undefined || v === null || String(v).trim() === '') continue
    if (typeof v === "object" || typeof v === "function") continue
    if (skip.has(k)) continue
    
    const pretty: Record<string, string> = {
      profile_system: "Sistema profilo", system_profile: "Sistema profilo",
      color: "Colore", colore: "Colore", profilo_colore: "Colore profilo",
      glass: "Vetro", vetro: "Vetro",
      uw: "Uw (trasmittanza termica)",
      modello: "Modello",
      tipologia: "Tipologia",
      rete_tipo: "Colore rete", tipo_rete: "Colore rete", // Aggiorna etichetta
      deceleratore: "Deceleratore", has_deceleratore: "Deceleratore", con_deceleratore: "Deceleratore",
      material: "Materiale", materiale: "Materiale",
      depth_mm: "Profondità", profondita_mm: "Profondità",
      spalletta_mm: "Celino", extension_mm: "Celino",
      lamelle_type: "Lamelle", lamelle: "Lamelle",
      con_telaio: "Telaio",
      hinge_color: "Colore cerniere", hinges_color: "Colore cerniere"
    }
    const label = pretty[k] || k
    if (!shownKeys.has(label.toLowerCase())) {
      let displayVal = String(v)
      if (label === "Profondità" || label === "Spalletta" || label === "Celino") {
        if (!/mm\b/i.test(displayVal)) displayVal = `${displayVal} mm`
      }
      pairs.push([label, displayVal])
      shownKeys.add(label.toLowerCase())
    }
  }

  return pairs
}

export default function QuotePDF(props: QuotePDFProps) {
  const {
    companyLogoUrl,
    quoteNumber,
    issueDate,
    installTime,
    profileSystem,
    customer,
    catTotals,
    mountingCost,
    totalExcluded,
    validityLabel,
    terms,
    items,
  } = props || {};

  const itemsSafe = normalizeItems(items);

  const totals = normalizeTotals(catTotals);
  const mnt = typeof mountingCost === 'number' && Number.isFinite(mountingCost) ? mountingCost : 0
  const totalImponibile = (typeof totalExcluded === 'number' && Number.isFinite(totalExcluded))
    ? totalExcluded
    : totals.reduce((s, r) => s + r.amount, 0) + mnt

  // --- MODIFICA QUI ---
  // Pulisci la stringa 'validityLabel' per rimuovere il prefisso
  const cleanValidityLabel = safeText(validityLabel)
    .replace(/VALIDITA’\s*OFFERTA\s*:\s*/i, '')
    .trim();

  return (
    <Document>
      {/* Pagina 1 */}
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={[s.row, { alignItems: "flex-start", justifyContent: "space-between" }]}>
          <View style={{ flexGrow: 1, flexBasis: 0, paddingRight: 12 }}>
            {companyLogoUrl && companyLogoUrl.trim() ? (
              <Image src={companyLogoUrl} style={s.logo} />
            ) : (
              <Text style={s.h1}>X INFISSI</Text>
            )}
            <Text style={s.companyDetails}>
              X INFISSI S.R.L.{"\n"}
              Via Esempio 123, 20100 Milano (MI){"\n"}
              P.IVA IT01234567890 · +39 02 1234 5678{"\n"}
              info@xinfissi.it · www.xinfissi.it
            </Text>
          </View>
          <View style={{ width: 300, marginTop: 0 }}>
            <Text style={s.h2Tight}>Spettabile</Text>
            <Text>{safeText(customer?.name)}</Text>
            {safeText(customer?.address, "") !== "" ? <Text>{safeText(customer?.address)}</Text> : null}
            {(safeText(customer?.email, "") !== "" || safeText(customer?.phone, "") !== "") ? (
              <Text style={s.small}>
                {safeText(customer?.email, "—")} {safeText(customer?.phone, "") ? ` · ${safeText(customer?.phone)}` : ""}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Dati documento */}
        <View style={s.block}>
          <Text style={s.h2}>Offerta n° {safeText(quoteNumber, "-")}</Text>
          <View style={[s.box]}>
            <View style={s.row}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={s.label}>Data emissione</Text>
                <Text wrap={false}>{formatISODate(issueDate)}</Text>
              </View>
              <View style={{ flex: 1, paddingLeft: 8 }}>
                <Text style={s.label}>Validità offerta</Text>
                {/* --- USA LA VARIABILE PULITA --- */}
                <Text wrap={false}>{cleanValidityLabel}</Text>
              </View>
            </View>
            <View style={[s.row, { marginTop: 6 }]}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={s.label}>Tempi di completamento</Text>
                <Text wrap={false}>{safeText(installTime)}</Text>
              </View>
              <View style={{ flex: 1, paddingLeft: 8 }}>
                <Text style={s.label}>Sistema profilo</Text>
                <Text wrap={false}>{safeText(profileSystem)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Riepilogo per categoria */}
        <View style={s.block}>
          <Text style={s.h2}>Riepilogo preventivo</Text>
          <View style={s.table}>
            <View style={s.tr}>
              <Text style={[s.th, { flex: 2 }]}>Categoria</Text>
              <Text style={[s.th, s.right]}>Importo</Text>
            </View>
            {totals.length > 0 ? (
              totals.map((r, i) => {
                const k = `row-${safeText(r.category, '-')}-${Number.isFinite(r.amount) ? r.amount : 0}-${i}`
                return (
                  <View key={k} style={s.tr}>
                    <Text style={[s.td, { flex: 2 }]}>{safeText(r.category, "-")}</Text>
                    <Text style={[s.td, s.right]}>{euro(r.amount)}</Text>
                  </View>
                )
              })
            ) : (
              <View style={s.tr}>
                <Text style={[s.td, { flex: 2, color: '#777' }]}>—</Text>
                <Text style={[s.td, s.right, { color: '#777' }]}>—</Text>
              </View>
            )}
            {typeof mountingCost === "number" && Number.isFinite(mountingCost) && (
              <View style={s.tr}>
                <Text style={[s.td, { flex: 2 }]}>Montaggio</Text>
                <Text style={[s.td, s.right]}>{euro(mountingCost)}</Text>
              </View>
            )}
            <View style={[s.tr, { borderBottomWidth: 0 }]}>
              <Text style={[s.td, { flex: 2, fontWeight: 700 }]}>TOTALE (IVA ESCLUSA)</Text>
              <Text style={[s.td, s.right, { fontWeight: 700 }]}>{euro(totalImponibile)}</Text>
            </View>
          </View>
        </View>

        {/* Dettaglio voci */}
        <View style={s.block}>
          <Text style={s.h2}>Dettaglio voci</Text>
          {itemsSafe.length > 0 ? (
            itemsSafe.map((it: any, i: number) => {
              const pairs = detailPairs(it);
              const title = String(it?.kind || "Voce").toUpperCase();
              const qty = `Quantità ${Number.isFinite(Number(it?.qty)) ? String(it.qty) : "1"}`;
              const description = describeItem(it);
              const pairCount = pairs.length;
              const minH = 60 + Math.min(36, pairCount * 6);

              return (
                <View
                  wrap={false}
                  key={`card-${it?.id || it?.kind || "k"}-${i}`}
                  style={[s.itemCard, { minHeight: minH }]}
                >
                  <View style={s.itemPhotoWrap}>
                    <Image src={imageFor(it?.kind)} style={s.photo} />
                    <Text style={s.dimW}>
                      { (it?.width_mm ?? it?.larghezza_mm ?? it?.larghezza) ? `${String(it?.width_mm ?? it?.larghezza_mm ?? it?.larghezza)} mm` : "—" }
                    </Text>
                    <View style={s.dimHWrap}>
                      <Text style={s.dimH}>
                        { (it?.height_mm ?? it?.altezza_mm ?? it?.altezza) ? `${String(it?.height_mm ?? it?.altezza_mm ?? it?.altezza)} mm` : "—" }
                      </Text>
                    </View>
                  </View>

                  <View style={s.itemContent}>
                    <View style={s.itemHeader}>
                      <Text style={s.itemKind}>{title}</Text>
                      <Text style={s.itemQty}>{qty}</Text>
                    </View>
                    <Text style={s.itemDescription}>{description}</Text>
                    {pairs.length > 0 && <View style={s.hr} />}
                    <View style={s.detailGrid}>
                      {pairs.map(([k, v], idx) => (
                        <View key={`kv-${idx}`} style={s.detailRow}>
                          <Text style={s.detailLabel}>{k}</Text>
                          <Text style={s.detailValue}>{v}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={[s.itemCard, {justifyContent: 'center'}]}>
              <Text style={{color: '#666'}}>— Nessuna voce inserita —</Text>
            </View>
          )}
        </View>
      </Page>

      {/* Pagina 2: condizioni */}
      <Page size="A4" style={s.page}>
        {companyLogoUrl && companyLogoUrl.trim() ? (
          <Image src={companyLogoUrl} style={s.logo} />
        ) : (
          <Text style={s.h1}>X INFISSI</Text>
        )}
        <Text style={[s.h2, { marginTop: 6 }]}>Condizioni di Fornitura</Text>
        <View style={{height: 1, backgroundColor: "#eee", marginVertical: 10}} />
        <Text>{safeText(terms)}</Text>

        <View style={{ marginTop: 22 }}>
          <Text>Letto e confermato in ______________________ in data _____________________</Text>
          <View style={{ height: 28 }} />
          <View style={s.row}>
            <View style={[s.col]}>
              <Text>Cliente</Text>
              <View style={{ height: 40, borderBottomWidth: 1, borderStyle: "solid", borderColor: "#e6e6e6", marginRight: 18 }} />
            </View>
            <View style={[s.col]}>
              <Text>Fornitore</Text>
              <View style={{ height: 40, borderBottomWidth: 1, borderStyle: "solid", borderColor: "#e6e6e6", marginRight: 18 }} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}