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
import xInfissiLogo from "../assets/images/x-infissi-logo.png";

// Accept both shapes: `{category, amount}` or `{label, amount}`
export type CategoryTotalInput = { category?: string | null; label?: string | null; amount?: number | null; pieces?: number | null }

type Customer = { name?: string | null; address?: string | null; email?: string | null; phone?: string | null; vat?: string | null };

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
    validityDays?: number | null;
    terms?: string | null;                // testo condizioni (pagina 2)
    items?: any[] | null;               // elenco voci del preventivo
    discount?: {
        mode: 'pct' | 'final';
        pct?: number | null;
        final?: number | null;
        originalTotal: number;
        discountedTotal: number;
    } | null;
};

const s = StyleSheet.create({
    page: { padding: 38, fontSize: 11, color: "#111" },
    row: { flexDirection: "row" },
    col: { flexGrow: 1 },
    h1: { fontSize: 32, fontWeight: 700, marginBottom: 4 },
    h2: { fontSize: 13, fontWeight: 700, marginTop: 14, marginBottom: 6 },
    h2Tight: { fontSize: 13, fontWeight: 700, marginTop: 0, marginBottom: 4 },
    label: { color: "#555" },
    box: { borderWidth: 1, borderStyle: "solid", borderColor: "#e6e6e6", borderRadius: 6, padding: 8 },
    table: { borderWidth: 1, borderStyle: "solid", borderColor: "#e6e6e6", borderRadius: 6, marginTop: 8 },
    tr: { flexDirection: "row", borderBottomWidth: 1, borderStyle: "solid", borderColor: "#e0e0e0" },
    th: { flex: 1, fontWeight: 700, fontSize: 11, padding: 8, backgroundColor: "#f7f7f7" },
    td: { flex: 1, padding: 8, fontSize: 11 },
    right: { textAlign: "right" as const },
    small: { fontSize: 10, color: "#555" },
    logo: { width: 140, height: 55, objectFit: "contain", marginBottom: 0, marginTop: -20 },
    companyDetails: { fontSize: 9, color: '#555', lineHeight: 1.4 },
    sep: { height: 8 },
    footerNote: { marginTop: 14, fontSize: 9, color: "#555" },
    block: { marginTop: 6 },

    // colore verde pastello per sconto
    pastelGreen: { backgroundColor: '#e8f7ec' },
    strike: { textDecoration: 'line-through', color: '#777' },

    // --- STILI CARD "DETTAGLIO VOCI" ---
    itemCard: {
        backgroundColor: "#f5f6f8",
        borderRadius: 8,
        padding: 14,
        marginBottom: 10,
        flexDirection: "row",
    },
    itemPhotoWrap: {
        width: 170,
        height: 170,
        backgroundColor: 'transparent',
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        padding: 6,
        position: "relative",
        marginRight: 12,
    },
    dimW: {
        position: "absolute",
        bottom: -18,
        left: 0,
        right: 0,
        textAlign: "center",
        fontSize: 10,
        color: "#333",
        paddingVertical: 3
    },
    dimHWrap: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: -20,
        alignItems: "center",
        justifyContent: "center"
    },
    dimH: {
        fontSize: 10,
        color: "#333",
        transform: "rotate(-90deg)",
        paddingVertical: 3,
        paddingHorizontal: 3
    },
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
        fontSize: 13,
        fontWeight: 700,
        color: '#111',
    },
    itemDims: {
        fontSize: 9,
        color: '#666',
        marginLeft: 6,
    },
    itemQty: {
        fontSize: 11,
        color: '#555',
        fontWeight: 500,
    },
    itemDescription: {
        fontSize: 9,
        color: '#666',
        marginBottom: 4,
    },
    itemRef: {
        fontSize: 9,
        color: '#666',
        marginTop: 2,
        marginBottom: 6,
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
        fontSize: 11,
    },
    detailValue: {
        flex: 1, // Value takes remaining space
        fontWeight: 500,
        color: '#111',
        fontSize: 11,
    },
    piecesNote: {
        color: "#777",
        fontSize: 10,
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
        pieces: (typeof (r as any)?.pieces === "number" && Number.isFinite((r as any).pieces) && (r as any).pieces > 0)
            ? (r as any).pieces
            : null,
    }));
}

function normalizeItems(input?: any[] | Record<string, any> | null) {
    if (Array.isArray(input)) return input.filter(Boolean);
    if (input && typeof input === 'object') return Object.values(input).filter(Boolean);
    return [];
}

function describeItem(it: any): string {
    if (!it || typeof it !== 'object') return '';
    const w = it.width_mm || it.larghezza_mm || it.larghezza;
    const h = it.height_mm || it.altezza_mm || it.altezza;

    if (w && h) {
        return `L ${w} × H ${h} mm`;
    }
    if (w) return `L ${w} mm`;
    if (h) return `H ${h} mm`;

    return '';
}

// Rettangolo contenuto (equivalente di object-fit: contain)
function containRect(boxW: number, boxH: number, imgW: number, imgH: number, padding = 0) {
    const cW = Math.max(0, boxW - padding * 2);
    const cH = Math.max(0, boxH - padding * 2);
    const arBox = cW > 0 && cH > 0 ? cW / cH : 1;
    const arImg = imgW > 0 && imgH > 0 ? imgW / imgH : 1;

    let w = cW, h = cH;
    if (arImg > arBox) { w = cW; h = cW / arImg; }
    else { h = cH; w = cH * arImg; }

    const x = (boxW - w) / 2;
    const y = (boxH - h) / 2;
    return { x, y, w, h };
}

// Stima dimensioni “intrinseche” da L/H dell’item (in mm)
function guessImageSizeFromItem(it: any) {
    const w = Number(it?.width_mm ?? it?.larghezza_mm ?? it?.larghezza) || 1;
    const h = Number(it?.height_mm ?? it?.altezza_mm ?? it?.altezza) || 1;
    return { w, h };
}

function getDimOffsets(it: any) {
    const w = Number(it?.width_mm ?? it?.larghezza_mm ?? it?.larghezza);
    const h = Number(it?.height_mm ?? it?.altezza_mm ?? it?.altezza);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
        return { bottom: -18, left: -20 };
    }
    const ar = h / w; // aspect ratio (H/W)
    // Per elementi "schiacciati" (basso e largo) avvicina la quota L al box
    // Per elementi molto alti, tienila un po' più distante
    const bottom =
        ar < 0.55 ? -8   // molto bassi → vicino
            : ar < 0.8 ? -12
                : ar < 1.2 ? -16
                    : -18;             // alti → come prima
    // La quota H a sinistra: se l'oggetto è molto alto, tienila più distante; altrimenti avvicina
    const left =
        ar > 1.6 ? -28   // molto alti → più esterna
            : ar > 1.2 ? -24
                : ar > 0.9 ? -22
                    : -18;             // bassi/larghi → più vicina
    return { bottom, left };
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
        if (["si", "sì", "yes", "true", "1", "on"].includes(s)) return yes
        if (["no", "false", "0", "off"].includes(s)) return no
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
                const qty = Number(it.qty);
                const total = Number.isFinite(qty) ? areaM2 * qty : areaM2;
                const aTot = total.toFixed(2);
                pairs.push(["Superficie totale", `${aTot} m²`]);
            }
            const ps = pickFirst(it, ["profile_system", "system_profile"]); if (ps) pairs.push(["Sistema profilo", String(ps)])
            const col = pickFirst(it, ["color", "colore", "profilo_colore"]); if (col) pairs.push(["Colore", String(col)])
            // --- Vetro (singola riga, con supporto per mix per-anta) ---
            const baseGlazing = pickFirst(it, ["glass", "vetro", "glazing"]);
            let glazingValue: string | null = null;
            try {
                const rows = it?.options?.gridWindow?.rows;
                const defaultGridGlazing = (typeof it?.options?.gridWindow?.glazing === 'string' && it.options.gridWindow.glazing.trim())
                    ? it.options.gridWindow.glazing.trim()
                    : null;
                // Base fallback from item-level (glass/vetro/glazing)
                const fallbackGlazing = (typeof baseGlazing === 'string' && String(baseGlazing).trim())
                    ? String(baseGlazing).trim()
                    : null;

                if (Array.isArray(rows) && rows.length > 0) {
                    const counts: Record<string, number> = {};
                    for (const row of rows) {
                        const cols = Array.isArray(row?.cols) ? row.cols : [];
                        for (const col of cols) {
                            // Prefer glazing set on the sash, then grid default, then item fallback
                            const local =
                                (col?.leaf && typeof col.leaf.glazing === 'string' && col.leaf.glazing.trim())
                                    ? col.leaf.glazing.trim()
                                    : (typeof col?.glazing === 'string' && col.glazing.trim()
                                        ? col.glazing.trim()
                                        : (defaultGridGlazing || fallbackGlazing));
                            if (local) {
                                const key = local.toLowerCase();
                                counts[key] = (counts[key] || 0) + 1;
                            }
                        }
                    }
                    const entries = Object.entries(counts);
                    if (entries.length > 0) {
                        const order = ["singolo", "doppio", "triplo", "satinato"]; // ordine preferito
                        const pretty: Record<string, string> = { singolo: "Singolo", doppio: "Doppio", triplo: "Triplo", satinato: "Satinato" };
                        entries.sort((a, b) => {
                            const ia = order.indexOf(a[0].toLowerCase());
                            const ib = order.indexOf(b[0].toLowerCase());
                            if (ia === -1 && ib === -1) return a[0].localeCompare(b[0]);
                            if (ia === -1) return 1;
                            if (ib === -1) return -1;
                            return ia - ib;
                        });
                        if (entries.length === 1) {
                            const [g] = entries[0];
                            glazingValue = pretty[g.toLowerCase()] || (g.charAt(0).toUpperCase() + g.slice(1));
                        } else {
                            glazingValue = entries
                                .map(([g, c]) => `x${c} ${pretty[g.toLowerCase()] || (g.charAt(0).toUpperCase() + g.slice(1))}`)
                                .join(', ');
                        }
                    }
                }
            } catch {}
            if (!glazingValue && baseGlazing) glazingValue = String(baseGlazing);
            if (glazingValue) pairs.push(["Vetro", glazingValue]);

            // --- UW ---
            const uwRaw = pickFirst(it, ["uw"]);
            if (uwRaw !== undefined && uwRaw !== null && String(uwRaw).trim() !== "") {
                const uwNum = Number(uwRaw);
                const uwStr = Number.isFinite(uwNum) ? `<= ${uwNum} W/m²K` : `<= ${String(uwRaw)} W/m²K`;
                pairs.push(["Uw", uwStr]);
            }

            // --- Stratigrafia vetro ---
            const gspec = pickFirst(it, ["glass_spec", "vetro_stratigrafia", "stratigrafia_vetro"]);
            if (gspec) pairs.push(["Stratigrafia vetro", String(gspec)]);

            // ---
            const cern = pickFirst(it, ["hinge_color", "colore_cerniere"]); if (cern) pairs.push(["Colore cerniere", String(cern)])
            break
        }
        case "zanzariera": {
            const mod = pickFirst(it, ["modello"]); if (mod) pairs.push(["Modello", String(mod)])
            const tip = pickFirst(it, ["tipologia"]); if (tip) pairs.push(["Tipologia", String(tip)])
            const reteRaw = pickFirst(it, ["rete_colore", "rete_tipo", "tipo_rete", "mesh"]);
            if (reteRaw) {
                const reteClean = String(reteRaw).replace(/^mesh\s*/i, "").trim();
                pairs.push(["Colore rete", reteClean]);
            }
            const dec = asBoolLabel(pickFirst(it, ["deceleratore", "has_deceleratore", "con_deceleratore"]));
            if (dec) pairs.push(["Deceleratore", dec])
            break
        }
        case "cassonetto": {
            const mat = pickFirst(it, ["material", "materiale"]); if (mat) pairs.push(["Materiale", String(mat)])
            const d = pickFirst(it, ["depth_mm", "profondita_mm", "profondità_mm"]); if (d) pairs.push(["Profondità", `${d} mm`])
            const sp = pickFirst(it, ["spalletta_mm", "extension_mm", "spalletta"]); if (sp) pairs.push(["Celino", `${sp} mm`])
            const col = pickFirst(it, ["color", "colore"]); if (col) pairs.push(["Colore", String(col)])
            break
        }
        case "persiana": {
            pairs.push(["Materiale", "Alluminio"])
            const lam = pickFirst(it, ["lamelle_type", "lamelle"]); if (lam) pairs.push(["Lamelle", String(lam)])
            const telLab = asBoolLabel(pickFirst(it, ["con_telaio", "telaio"]), "Con telaio", "Senza telaio"); if (telLab) pairs.push(["Telaio", telLab])
            const col = pickFirst(it, ["color", "colore"]); if (col) pairs.push(["Colore", String(col)])
            break
        }
        case "tapparella": {
            const mat = pickFirst(it, ["material", "materiale"]); if (mat) pairs.push(["Materiale", String(mat)])
            const col = pickFirst(it, ["color", "colore"]); if (col) pairs.push(["Colore", String(col)])
            break
        }
        case "custom": {
            const title = pickFirst(it, ["label", "title"]); if (title) pairs.push(["Titolo", String(title)])
            const note = pickFirst(it, ["note", "descrizione"]); if (note) pairs.push(["Note", String(note)])
            break
        }
    }

    const shownKeys = new Set(pairs.map(([k]) => k.toLowerCase()))
    const skip = new Set([
        "id", "kind", "qty",
        "width_mm", "height_mm", "larghezza_mm", "altezza_mm", "larghezza", "altezza",
        "price_mode", "price_total", "price_per_mq", "unit_price", "unitPrice", "price", "prezzo", "misura_tipo",
        "accessori_colore",
        // Exclude reference/image fields
        "reference", "riferimento", "image_url", "imageUrl"
    ])
    for (const [k, v] of Object.entries(it)) {
        if (v === undefined || v === null || String(v).trim() === '') continue
        if (typeof v === "object" || typeof v === "function") continue
        if (skip.has(k)) continue

        const pretty: Record<string, string> = {
            profile_system: "Sistema profilo", system_profile: "Sistema profilo",
            color: "Colore", colore: "Colore", profilo_colore: "Colore profilo",
            glass: "Vetro", vetro: "Vetro",
            glazing: "Vetro",
            uw: "Uw",
            modello: "Modello",
            tipologia: "Tipologia",
            rete_colore: "Colore rete", rete_tipo: "Colore rete", tipo_rete: "Colore rete", mesh: "Colore rete",
            deceleratore: "Deceleratore", has_deceleratore: "Deceleratore", con_deceleratore: "Deceleratore",
            material: "Materiale", materiale: "Materiale",
            depth_mm: "Profondità", profondita_mm: "Profondità",
            spalletta_mm: "Celino", extension_mm: "Celino",
            lamelle_type: "Lamelle", lamelle: "Lamelle",
            con_telaio: "Telaio",
            hinge_color: "Colore cerniere", hinges_color: "Colore cerniere",
            glass_spec: "Stratigrafia vetro",
            vetro_stratigrafia: "Stratigrafia vetro",
            stratigrafia_vetro: "Stratigrafia vetro",
        }
        const label = pretty[k] || k
        if (!shownKeys.has(label.toLowerCase())) {
            let displayVal = String(v)
            if (label === "Profondità" || label === "Spalletta" || label === "Celino") {
                if (!/mm\b/i.test(displayVal)) displayVal = `${displayVal} mm`
            }
            if (label === "Colore rete") {
                displayVal = displayVal.replace(/^mesh\s*/i, "").trim()
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
        validityDays,
        vatRateLabel,
        terms,
        items,
    } = props || {};

    const itemsSafe = normalizeItems(items);

    const hasWindows = itemsSafe.some((it: any) => {
        const k = String(it?.kind || '').toLowerCase();
        return k === 'finestra' || k === 'portafinestra' || k === 'scorrevole' || /serrament/i.test(k);
    });

    // Superficie totale (somma di tutte le voci con misure), in m²
    const totalM2 = itemsSafe.reduce((acc: number, it: any) => {
        const w = Number(it?.width_mm ?? it?.larghezza_mm ?? it?.larghezza);
        const h = Number(it?.height_mm ?? it?.altezza_mm ?? it?.altezza);
        const q = Number(it?.qty ?? 1);
        if (Number.isFinite(w) && Number.isFinite(h)) {
            const m2 = (w * h) / 1_000_000;
            return acc + (Number.isFinite(q) ? m2 * q : m2);
        }
        return acc;
    }, 0);

    // Superficie solo finestre (finestra, portafinestra, scorrevole)
    const windowsM2 = itemsSafe.reduce((acc: number, it: any) => {
        const kind = String(it?.kind || "").toLowerCase();
        if (!["finestra", "portafinestra", "scorrevole"].includes(kind)) return acc;
        const w = Number(it?.width_mm ?? it?.larghezza_mm ?? it?.larghezza);
        const h = Number(it?.height_mm ?? it?.altezza_mm ?? it?.altezza);
        const q = Number(it?.qty ?? 1);
        if (Number.isFinite(w) && Number.isFinite(h)) {
            const m2 = (w * h) / 1_000_000;
            return acc + (Number.isFinite(q) ? m2 * q : m2);
        }
        return acc;
    }, 0);

    const totals = normalizeTotals(catTotals);
    const mnt = typeof mountingCost === 'number' && Number.isFinite(mountingCost) ? mountingCost : 0;
    const fallbackTotal = totals.reduce((s, r) => s + r.amount, 0) + mnt;

    const hasDiscount =
        !!(props?.discount &&
            typeof props.discount.discountedTotal === 'number' &&
            props.discount.discountedTotal >= 0 &&
            props.discount.discountedTotal < (props.discount.originalTotal ?? Infinity));

    const originalTotal = hasDiscount
        ? (props.discount?.originalTotal ?? fallbackTotal)
        : (typeof totalExcluded === 'number' && Number.isFinite(totalExcluded) ? totalExcluded : fallbackTotal);

    const discountedTotal = hasDiscount ? props.discount!.discountedTotal : originalTotal;
    const discountDelta = Math.max(0, originalTotal - discountedTotal);

    // --- MODIFICA QUI ---
    // Calcola la validità da validityDays se presente, altrimenti da validityLabel
    const computedValidity =
        (typeof validityDays === 'number' && isFinite(validityDays))
            ? `VALIDITÀ OFFERTA: ${validityDays} giorni`
            : safeText(validityLabel);

    const cleanValidityLabel = (computedValidity && computedValidity !== '—')
        ? computedValidity.replace(/VALIDIT[ÀA][’']?\s*OFFERTA\s*:\s*/i, '').trim()
        : '—';

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
                            <Image src={xInfissiLogo} style={s.logo} />
                        )}
                        <Text style={s.companyDetails}>
                            X S.R.L.{"\n"}
                            P.IVA 04062850120{"\n"}
                            sede legale - Saronno (VA) 21047{"\n"}
                            Via San Giuseppe, 95{"\n"}
                            info@xinfissi.it · www.xinfissi.it · +39 345 457 3328
                        </Text>
                    </View>
                    <View style={{ width: 300, marginTop: 0 }}>
                        <Text style={s.h2Tight}>Spettabile</Text>
                        <Text>{safeText(customer?.name)}</Text>
                        {safeText(customer?.address, "") !== "" ? <Text>{safeText(customer?.address)}</Text> : null}
                        {(() => {
                            const parts = [
                                safeText(customer?.email, ""),
                                safeText(customer?.phone, ""),
                                (customer?.vat && customer.vat.trim()) ? `P.IVA ${customer.vat.trim()}` : ""
                            ].filter(p => p && p.trim() !== "");
                            return parts.length > 0 ? (
                                <Text style={s.small}>{parts.join(" · ")}</Text>
                            ) : null;
                        })()}
                    </View>
                </View>

                {/* Dati documento */}
                <View style={s.block}>
                    <Text style={s.h2}>Offerta n° {safeText(quoteNumber, "-")}</Text>
                    <View style={[s.box]}>
                        <View style={s.row}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                                <Text style={s.label}>Data emissione preventivo</Text>
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
                                <Text style={s.label}>Termini di completamento</Text>
                                <Text wrap={false}>{safeText(installTime)}</Text>
                            </View>
                            <View style={{ flex: 1, paddingLeft: 8 }}>
                                <Text style={s.label}>Sistema profilo</Text>
                                <Text wrap={false}>{safeText(profileSystem)}</Text>
                            </View>
                        </View>
                        {hasWindows && (
                            <View style={[s.row, { marginTop: 6 }]}> 
                                <View style={{ flex: 1, paddingRight: 8 }}>
                                    <Text style={s.label}>Ferramenta</Text>
                                    <Text wrap={false}>WINKHAUS + HOPPE</Text>
                                </View>
                                <View style={{ flex: 1, paddingLeft: 8 }}>
                                    <Text style={s.label}>Servizi</Text>
                                    <Text wrap={false}>Trasporto incluso</Text>
                                </View>
                            </View>
                        )}
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
                                const label = safeText(r.category, "-");
                                const k = `row-${label}-${Number.isFinite(r.amount) ? r.amount : 0}-${i}`;
                                const showWindowsM2 = /finestr|serramenti/i.test(label) && windowsM2 > 0; const pieces = (r as any).pieces as number | null;
                                return (
                                    <View key={k} style={s.tr}>
                                        <Text style={[s.td, { flex: 2 }]}>
                                            <Text>{label}</Text>
                                            {typeof pieces === "number" && pieces > 0 ? (
                                                <Text style={s.piecesNote}> · {pieces} pezzi </Text>
                                            ) : null}
                                            {showWindowsM2 ? (
                                                <Text style={s.piecesNote}> · {windowsM2.toFixed(2)} m²</Text>
                                            ) : null}
                                        </Text>
                                        <Text style={[s.td, s.right]}>{euro(r.amount)}</Text>
                                    </View>
                                );
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
                        {hasDiscount ? (
                          <>
                            {/* Totale originale, senza barrato e senza riga SCONTO */}
                            <View style={[s.tr]}>
                              <Text style={[s.td, { flex: 2, fontWeight: 700, backgroundColor: '#f7f7f7' }]}>TOTALE (IVA ESCLUSA)</Text>
                              <Text style={[s.td, s.right, { fontWeight: 700, backgroundColor: '#f7f7f7' }]}>{euro(originalTotal)}</Text>
                            </View>

                            {/* Totale scontato, con sfondo verde; mostra la % solo se lo sconto è percentuale */}
                            <View style={[s.tr, s.pastelGreen, { borderBottomWidth: 0 }]}>
                              <Text style={[s.td, { flex: 2, fontWeight: 700 }]}>
                                {`TOTALE SCONTATO (IVA ESCLUSA)${
                                  props.discount?.mode === 'pct' && typeof props.discount?.pct === 'number' && props.discount.pct > 0
                                    ? ` (${props.discount.pct}%)`
                                    : ''
                                }`}
                              </Text>
                              <Text style={[s.td, s.right, { fontWeight: 700 }]}>{euro(discountedTotal)}</Text>
                            </View>
                          </>
                        ) : (
                            <View style={[s.tr, { borderBottomWidth: 0 }]}>
                                <Text style={[s.td, { flex: 2, fontWeight: 700, backgroundColor: '#f7f7f7' }]}>TOTALE (IVA ESCLUSA)</Text>
                                <Text style={[s.td, s.right, { fontWeight: 700, backgroundColor: '#f7f7f7' }]}>{euro(originalTotal)}</Text>
                            </View>
                        )}
                    </View>
                </View>

            </Page>

            {/* Pagina 2: dettaglio voci */}
            <Page size="A4" style={s.page}>
                {companyLogoUrl && companyLogoUrl.trim() ? (
                    <Image src={companyLogoUrl} style={s.logo} />
                ) : (
                    <Image src={xInfissiLogo} style={s.logo} />
                )}
                {/* Dettaglio voci (spostato a pagina 2) */}
                <View style={s.block}>
                    <Text style={s.h2}>Dettaglio voci</Text>
                    {itemsSafe.length > 0 ? (
                        itemsSafe.map((it: any, i: number) => {
                            const isCustom = it?.kind === 'custom';

                            // Dettagli base (solo per voci non custom)
                            const basePairs: Array<[string, string]> = isCustom ? [] : detailPairs(it);

                            // Campi personalizzati (per tutte le voci): label/name/key + value, ignorando vuoti
                            const extraPairs: Array<[string, string]> = Array.isArray(it?.custom_fields)
                              ? it.custom_fields
                                  .filter((f: any) => {
                                    const key = (f?.name ?? f?.label ?? f?.key);
                                    const val = f?.value;
                                    return key && String(key).trim() && val != null && String(val).trim();
                                  })
                                  .map((f: any) => [
                                    String(f?.name ?? f?.label ?? f?.key).trim(),
                                    String(f?.value).trim(),
                                  ] as [string, string])
                              : [];

                            // Per le voci custom mostriamo solo i custom fields; per le altre, appende in fondo
                            const pairs: Array<[string, string]> = isCustom ? extraPairs : [...basePairs, ...extraPairs];

                            // Titolo: per custom mostra il titolo libero (senza uppercase aggressivo); per gli altri usa il kind in uppercase
                            const title = isCustom
                                ? String(it?.title || it?.label || "Voce personalizzata").trim()
                                : String(it?.kind || "Voce").toUpperCase();

                            const qty = `Q.tà ${Number.isFinite(Number(it?.qty)) ? String(it.qty) : "1"}`;

                            // mostra misure anche per custom
                            const description = describeItem(it);

                            const pairCount = pairs.length;
                            const minH = Math.max(260, 80 + Math.min(40, pairCount * 7));

                            // Riferimento opzionale (sia "reference" che "riferimento")
                            const reference = typeof it?.reference === 'string' && it.reference.trim()
                                ? it.reference.trim()
                                : (typeof it?.riferimento === 'string' && it.riferimento.trim() ? it.riferimento.trim() : '');

                            const dimOff = getDimOffsets(it);

                            return (
                                <View
                                    wrap={false}
                                    key={`card-${it?.id || it?.kind || "k"}-${i}`}
                                    style={[s.itemCard, { minHeight: minH }]}
                                >
                                    <View style={s.itemPhotoWrap}>
                                        {(() => {
                                            const raw = typeof it?.image_url === 'string' ? it.image_url : '';
                                            const imgSrc = raw && !raw.startsWith('blob:') ? raw : imageFor(it?.kind);
                                            return <Image src={imgSrc} style={s.photo} />;
                                        })()}

                                        {(() => {
                                            const kind = String(it?.kind || "").toLowerCase();

                                            // Common texts
                                            const widthText = (it?.width_mm ?? it?.larghezza_mm ?? it?.larghezza)
                                                ? `${String(it?.width_mm ?? it?.larghezza_mm ?? it?.larghezza)} mm`
                                                : "—";
                                            const heightText = (it?.height_mm ?? it?.altezza_mm ?? it?.altezza)
                                                ? `${String(it?.height_mm ?? it?.altezza_mm ?? it?.altezza)} mm`
                                                : "—";

                                            // Apply "smart" placement only for proportional drawings
                                            const isProportional = kind === "finestra" || kind === "cassonetto";

                                            if (!isProportional) {
                                                // Fixed positions (icons, tapparella, zanzariera, persiana, ecc.)
                                                return (
                                                    <>
                                                        <Text style={s.dimW}>{widthText}</Text>
                                                        <View style={s.dimHWrap}>
                                                            <Text style={s.dimH}>{heightText}</Text>
                                                        </View>
                                                    </>
                                                );
                                            }

                                            // ---- Proportional drawings (finestra, cassonetto) ----
                                            // Wrapper box and its inner padding (must match s.itemPhotoWrap.padding)
                                            const WRAP_W = 170;
                                            const WRAP_H = 170;
                                            const PAD = 6; // <-- s.itemPhotoWrap.padding
                                            const INNER_W = WRAP_W - PAD * 2;
                                            const INNER_H = WRAP_H - PAD * 2;

                                            const w = Number(it?.width_mm ?? it?.larghezza_mm ?? it?.larghezza);
                                            const h = Number(it?.height_mm ?? it?.altezza_mm ?? it?.altezza);
                                            const hasDims = Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0;

                                            // Estimate margins produced by "contain" within the INNER box.
                                            let marginX = 0, marginY = 0;
                                            if (hasDims) {
                                                const ar = w / h;
                                                const arBox = INNER_W / INNER_H;
                                                if (ar >= arBox) {
                                                    // Wide: width touches INNER_W, height shrinks
                                                    const imgH = INNER_W / ar;
                                                    marginY = Math.max(0, (INNER_H - imgH) / 2);
                                                } else {
                                                    // Tall: height touches INNER_H, width shrinks
                                                    const imgW = INNER_H * ar;
                                                    marginX = Math.max(0, (INNER_W - imgW) / 2);
                                                }
                                            }

                                            const GAP = 4;
                                            const centerX = WRAP_W / 2;
                                            const centerY = PAD + INNER_H / 2;

                                            // Larghezza: subito sotto l’immagine reale
                                            const widthLabelTop = PAD + (INNER_H - marginY) + GAP;

                                            // Altezza: a sinistra dell’immagine reale, ruotata
                                            const heightLabelLeft = Math.max(2, PAD + marginX - 8);

                                            return (
                                                <>
                                                    {/* Larghezza (sotto l’immagine, centrata) */}
                                                    <Text
                                                        style={{
                                                            position: "absolute",
                                                            top: widthLabelTop,
                                                            left: centerX - 60,
                                                            width: 120,
                                                            textAlign: "center",
                                                            fontSize: 10,
                                                            color: "#333",
                                                        }}
                                                    >
                                                        {widthText}
                                                    </Text>

                                                    {/* Altezza (a sinistra dell’immagine, ruotata e centrata verticalmente) */}
                                                    <View
                                                        style={{
                                                            position: "absolute",
                                                            left: -22,
                                                            top: centerY,
                                                            transform: "rotate(-90deg)",
                                                        }}
                                                    >
                                                        <Text style={{ fontSize: 10, color: "#333" }}>{heightText}</Text>
                                                    </View>
                                                </>
                                            );
                                        })()}
                                    </View>

                                    <View style={s.itemContent}>
                                        <View style={s.itemHeader}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                                                <Text style={s.itemKind}>{title}</Text>
                                                {(() => {
                                                    const dims = description; // già vuoto per custom
                                                    return dims ? <Text style={s.itemDims}>· {dims}</Text> : null;
                                                })()}
                                            </View>
                                            <Text style={s.itemQty}>{qty}</Text>
                                        </View>
                                        {reference ? <Text style={s.itemRef}>{reference}</Text> : null}
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
                        <View style={[s.itemCard, { justifyContent: 'center' }]}>
                            <Text style={{ color: '#666' }}>— Nessuna voce inserita —</Text>
                        </View>
                    )}
                </View>
            </Page>

            {/* Pagina 3: condizioni */}
            <Page size="A4" style={s.page}>
                {companyLogoUrl && companyLogoUrl.trim() ? (
                    <Image src={companyLogoUrl} style={s.logo} />
                ) : (
                    <Image src={xInfissiLogo} style={s.logo} />
                )}

                <Text style={[s.h2, { marginTop: 6 }]}>Condizioni di Fornitura</Text>
                <View style={{ height: 1, backgroundColor: "#eee", marginVertical: 10 }} />
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