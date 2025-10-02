// src/pdf/usePDFData.ts
import { useMemo } from "react";
import { shallow } from "zustand/shallow";
import { useQuoteStore } from "../stores/useQuoteStore";
import type { QuotePDFProps } from "./QuotePDF";

/** Utility sicure */
const isNum = (v: any) => typeof v === "number" && Number.isFinite(v);
const isStr = (v: any) => typeof v === "string" && v.trim().length > 0;

/** Normalizza array/oggetto items -> array */
function normalizeItems(items: any): any[] {
    if (Array.isArray(items)) return items;
    if (items && typeof items === "object") return Object.values(items);
    return [];
}

/** Prende solo campi “piatti” e noti per il PDF, evitando funzioni/proxy */
function toPlainItem(it: any) {
    if (!it || typeof it !== "object") return null;

    const base: any = {
        id: isStr(it.id) ? it.id : undefined,
        kind: isStr(it.kind) ? it.kind : "-",
        qty: isNum(it.qty) ? it.qty : 1,
        // misure
        width_mm: isNum(it.width_mm) ? it.width_mm : undefined,
        height_mm: isNum(it.height_mm) ? it.height_mm : undefined,
        // comuni finestra/porta/scorrevole
        profile_system: isStr(it.profile_system) ? it.profile_system : undefined,
        color: isStr(it.color) ? it.color : undefined,
        glass: isStr(it.glass) ? it.glass : undefined,
        uw: isStr(it.uw) || isNum(it.uw) ? String(it.uw) : undefined,

        // zanzariera
        modello: isStr(it.modello) ? it.modello : undefined,
        tipologia: isStr(it.tipologia) ? it.tipologia : undefined,
        accessori_colore: isStr(it.accessori_colore) ? it.accessori_colore : undefined,
        rete_tipo: isStr(it.rete_tipo) ? it.rete_tipo : undefined,

        // cassonetto
        material: isStr(it.material) ? it.material : undefined,
        depth_mm: isNum(it.depth_mm) ? it.depth_mm : undefined,
        spalletta_mm: isNum(it.spalletta_mm) ? it.spalletta_mm : undefined,

        // persiana
        lamelle_type: isStr(it.lamelle_type) ? it.lamelle_type : undefined,
        con_telaio: typeof it.con_telaio === "boolean" ? it.con_telaio : undefined,

        // tapparella
        // (riutilizziamo material/color/width/height già sopra)
    };

    // Rimuove undefined per tenere l’oggetto più pulito
    Object.keys(base).forEach((k) => base[k] === undefined && delete base[k]);
    return base;
}

export function usePDFData(): QuotePDFProps {
    // Tipi difensivi: lo store potrebbe non avere quote/manualTotals tipizzati.
    const [quote, manualTotals, items] = useQuoteStore(
        (s: any) =>
            [
                (s as any).quote ?? null,
                (s as any).manualTotals ?? [],
                (s as any).items ?? [],
            ] as const
    ) as unknown as [any, any[], any[]];

    return useMemo<QuotePDFProps>(() => {
        // Header / meta
        const header = quote || ({} as any);

        // Totali per categoria (supporta label/category)
        const catTotals = Array.isArray(manualTotals)
            ? manualTotals.map((r: any) => ({
                label: isStr(r?.label) ? r.label : (isStr(r?.category) ? r.category : "-"),
                amount: isNum(r?.amount) ? r.amount : 0,
            }))
            : [];

        // Items normalizzati e “piatti”
        const raw = normalizeItems(items);
        const plainItems = raw
            .map(toPlainItem)
            .filter(Boolean);

        // NOTE: React-PDF preferisce dati serializzabili "puri"
        const pdfSafeItems = JSON.parse(JSON.stringify(plainItems));

        return {
            companyLogoUrl: isStr(header.companyLogoUrl) ? header.companyLogoUrl : null,
            quoteNumber: isStr(header.number) ? header.number : null,

            issueDate: isStr(header.issueDate)
                ? header.issueDate
                : (isStr(header.created_at) ? header.created_at : null),

            installTime: isStr(header.installTime) ? header.installTime : null,
            totalMq: isNum(header.totalMq) ? header.totalMq : null,
            profileSystem: isStr(header.profileSystem) ? header.profileSystem : null,
            vatRateLabel: isStr(header.vatRateLabel)
                ? header.vatRateLabel
                : (isStr(header.vat) ? `IVA ${header.vat}%` : "IVA 22%"),

            customer: {
                name: isStr(header.customer_name) ? header.customer_name : (isStr(header.customerName) ? header.customerName : null),
                address: isStr(header.job_address) ? header.job_address : (isStr(header.address) ? header.address : null),
                email: isStr(header.customer_email) ? header.customer_email : (isStr(header.email) ? header.email : null),
                phone: isStr(header.customer_phone) ? header.customer_phone : (isStr(header.phone) ? header.phone : null),
            },

            catTotals,
            mountingCost: isNum(header.mountingCost) ? header.mountingCost : null,
            totalExcluded: isNum(header.totalExcluded) ? header.totalExcluded : null,
            validityLabel: isStr(header.validityLabel) ? header.validityLabel : null,
            terms: isStr(header.terms) ? header.terms : null,

            // 👇 finalmente passiamo items “veri”
            items: pdfSafeItems,
        };
    }, [quote, manualTotals, items]);
}