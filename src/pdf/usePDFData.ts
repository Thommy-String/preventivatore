// src/pdf/usePDFData.ts
import { createElement, useEffect, useMemo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useShallow } from "zustand/react/shallow";
import { useQuoteStore } from "../stores/useQuoteStore";
import type { QuotePDFProps } from "./QuotePDF";
import { normalizeSurfaceEntries } from "../features/quotes/utils/surfaceSelections";
import { TERMS_PROFILES, buildTermsDocument, detectTermsProfile } from "../content/terms";
import type { TermsDocument } from "../content/terms";
import { persianaToPngBlob } from "../features/quotes/persiana/persianaToPng";
import PersianaSvg from "../features/quotes/persiana/PersianaSvg";

// Debug helper: taglia le stringhe nei log
const __short = (s?: string) =>
  typeof s === "string" ? s.slice(0, 60) : s === null ? "null" : typeof s;

const isNum = (v: any) => typeof v === "number" && Number.isFinite(v);
const isStr = (v: any) => typeof v === "string" && v.trim().length > 0;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = () => reject(fr.error || new Error("FileReader error"));
    fr.readAsDataURL(blob);
  });
}

function svgToDataUrl(svg: string) {
  const withNs = svg.includes("xmlns=") ? svg : svg.replace("<svg ", "<svg xmlns=\"http://www.w3.org/2000/svg\" ");
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(withNs)}`;
}

/** Normalizza array/oggetto items -> array semplice */
function normalizeItems(items: any): any[] {
  if (Array.isArray(items)) return items;
  if (items && typeof items === "object") return Object.values(items);
  return [];
}

/** Normalizza custom_fields a [{label,value}] */
function normalizeCustomFields(cf: any): { label: string; value: string }[] | undefined {
  if (!cf) return undefined;
  if (!Array.isArray(cf)) return undefined;
  const out = cf
    .map((e: any) => {
      if (!e) return null;
      const label = isStr(e.label)
        ? e.label
        : (isStr(e.name)
            ? e.name
            : (isStr(e.key) ? e.key : null));
      const value = isStr(e.value) ? e.value : null;
      if (!label || value == null) return null;
      return { label, value };
    })
    .filter(Boolean) as { label: string; value: string }[];
  return out.length ? out : undefined;
}

/** Estrae solo campi “piatti” e noti per il PDF, evitando funzioni/proxy */
function toPlainItem(it: any) {
  if (!it || typeof it !== "object") return null;

  // Deriva vetro (glass) e stratigrafia vetro anche da campi annidati (options.gridWindow)
  const nestedGlass =
    (typeof it?.glass === "string" && it.glass.trim()) ? it.glass :
    (typeof it?.options?.glass === "string" && it.options.glass.trim()) ? it.options.glass :
    (typeof it?.options?.gridWindow?.glazing === "string" && it.options.gridWindow.glazing.trim()) ? it.options.gridWindow.glazing :
    undefined;

  const nestedGlassSpec =
    (typeof it?.glass_spec === "string" && it.glass_spec.trim()) ? it.glass_spec :
    (typeof it?.options?.glass_spec === "string" && it.options.glass_spec.trim()) ? it.options.glass_spec :
    (typeof it?.options?.gridWindow?.glass_spec === "string" && it.options.gridWindow.glass_spec.trim()) ? it.options.gridWindow.glass_spec :
    undefined;

  const base: any = {
    id: isStr(it.id) ? it.id : undefined,
    kind: isStr(it.kind) ? it.kind : "-",
    qty: isNum(it.qty) ? it.qty : 1,

    // titolo/riferimento per tutte le voci (es. custom)
    title: isStr(it.title) ? it.title : undefined,
    reference: isStr(it.reference) ? it.reference : undefined,

    // misure
    width_mm: isNum(it.width_mm) ? it.width_mm : undefined,
    height_mm: isNum(it.height_mm) ? it.height_mm : undefined,

    // immagine voce (solo URL pubblico/dataURL valido; escludi blob:)
    ...( (() => {
      const img = isStr(it.image_url) ? it.image_url : undefined;
      return (img && !img.startsWith('blob:')) ? { image_url: img } : {};
    })() ),

    // comuni finestra/porta/scorrevole
    profile_system: isStr(it.profile_system) ? it.profile_system : undefined,
    color: isStr(it.color) ? it.color : undefined,
    glass: isStr(nestedGlass) ? nestedGlass : undefined,
    glass_spec: isStr(nestedGlassSpec) ? nestedGlassSpec : undefined,
    uw: isStr(it.uw) || isNum(it.uw) ? String(it.uw) : undefined,

    // zanzariera
    modello: isStr(it.modello) ? it.modello : undefined,
    tipologia: isStr(it.tipologia) ? it.tipologia : undefined,
    accessori_colore: isStr(it.accessori_colore) ? it.accessori_colore : undefined,
    rete_tipo: isStr(it.rete_tipo) ? it.rete_tipo : undefined,
    rete_colore: isStr(it.rete_colore) ? it.rete_colore : undefined, // eventuale alias

    // cassonetto
    material: isStr(it.material) ? it.material : undefined,
    depth_mm: isNum(it.depth_mm) ? it.depth_mm : undefined,
    spalletta_mm: isNum(it.spalletta_mm) ? it.spalletta_mm : undefined,

    // persiana
    lamelle_type: isStr(it.lamelle_type) ? it.lamelle_type : undefined,
    con_telaio: typeof it.con_telaio === "boolean" ? it.con_telaio : undefined,
    ante: isNum(it.ante) ? it.ante : undefined,

    // tapparella: (material/color/width/height già sopra)
  };

  // campi custom della voce (solo per kind==='custom', ma non fa male lasciarli anche se presenti altrove)
  const cf = normalizeCustomFields(it.custom_fields);
  if (cf) base.custom_fields = cf;

  // ---- DEBUG: ispezione item finestra/porta/scorrevole ----
  try {
    if (base.kind === "finestra" || base.kind === "portafinestra" || base.kind === "scorrevole") {
      // Log essenziale per capire cosa arriverà al PDF
      // (usiamo __short per non intasare la console con dataURL lunghissimi)
      // Nota: questi log sono innocui in produzione ma puoi toglierli in seguito.
      // eslint-disable-next-line no-console
      console.log("[PDF toPlainItem]", {
        id: base.id,
        kind: base.kind,
        w: base.width_mm,
        h: base.height_mm,
        qty: base.qty,
        image_url_prefix: __short(base.image_url as any),
      });
    }
  } catch {}

  // ripulisci undefined
  Object.keys(base).forEach((k) => base[k] === undefined && delete base[k]);
  return base;
}

export function usePDFData(): QuotePDFProps {
const [quote, manualTotals, items, profileOverview] = useQuoteStore(
  useShallow((s: any) => [
    (s as any).quote ?? null,
    (s as any).manualTotals ?? [],
    (s as any).items ?? [],
    (s as any).profileOverview ?? null,
  ])
) as unknown as [any, any[], any[], any];

  const [persianaImages, setPersianaImages] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const list = normalizeItems(items).filter((it) => it?.kind === "persiana");
      for (const it of list) {
        const id = it?.id;
        if (!id || persianaImages[id]) continue;
        const existing = typeof it?.image_url === "string" ? it.image_url : "";
        if (existing && !existing.startsWith("blob:")) {
          continue;
        }
        try {
          const cfg = {
            width_mm: Number(it?.width_mm) || 1000,
            height_mm: Number(it?.height_mm) || 1400,
            ante: Number(it?.ante) || 2,
          };
          const blob = await persianaToPngBlob(cfg, 900, 900);
          const dataUrl = await blobToDataUrl(blob);
          if (!cancelled) {
            setPersianaImages((prev) => ({ ...prev, [id]: dataUrl }));
          }
        } catch {
          // ignore generation failures
        }
      }
    }

    run();
    return () => { cancelled = true; };
  }, [items, persianaImages]);



  return useMemo<QuotePDFProps>(() => {
    const q = quote || ({} as any);

    // Totali per categoria
    const catTotals = Array.isArray(manualTotals)
      ? manualTotals.map((r: any) => ({
          label: isStr(r?.label) ? r.label : (isStr(r?.category) ? r.category : "-"),
          amount: isNum(r?.amount) ? r.amount : 0,
          pieces: isNum((r as any)?.pieces) && (r as any).pieces > 0 ? (r as any).pieces : null,
          surfaces: normalizeSurfaceEntries((r as any)?.surfaces),
        }))
      : [];

    // Items “puri”
    const plainItems = normalizeItems(items)
      .map(toPlainItem)
      .filter(Boolean)
      .map((it: any) => {
        if (it?.kind === "persiana" && !it.image_url) {
          const cfg = {
            width_mm: Number(it?.width_mm) || 1000,
            height_mm: Number(it?.height_mm) || 1400,
            ante: Number(it?.ante) || 2,
          };
          const svg = renderToStaticMarkup(createElement(PersianaSvg, { cfg }));
          return { ...it, image_url: svgToDataUrl(svg) };
        }
        if (it?.kind === "persiana" && it?.id && persianaImages[it.id] && !it.image_url) {
          return { ...it, image_url: persianaImages[it.id] };
        }
        return it;
      });
    const pdfSafeItems = JSON.parse(JSON.stringify(plainItems));

    // ---- DEBUG: items finali passati al PDF ----
    try {
      // eslint-disable-next-line no-console
      console.log("[PDF usePDFData] items ->", pdfSafeItems.map((it: any) => ({
        id: it.id,
        kind: it.kind,
        w: it.width_mm,
        h: it.height_mm,
        qty: it.qty,
        imgPrefix: __short(it.image_url),
      })));
    } catch {}

    // Header: supporto sia camelCase che snake_case dal DB
    const issueDate =
      (isStr(q.issueDate) && q.issueDate) ||
      (isStr(q.issue_date) && q.issue_date) ||
      (isStr(q.created_at) && q.created_at) ||
      null;

    const installTime =
      (isStr(q.installTime) && q.installTime) ||
      (isStr(q.install_time) && q.install_time) ||
      null;

    const profileSystem =
      (isStr(q.profileSystem) && q.profileSystem) ||
      (isStr(q.profile_system) && q.profile_system) ||
      null;

    const vat =
      (isStr(q.vat) && q.vat) ||
      null;

    const validityDays = isNum(q.validity_days) ? q.validity_days : (isNum(q.validityDays) ? q.validityDays : null);
    const validityLabel =
      (isStr(q.validityLabel) && q.validityLabel) ||
      (validityDays ? `VALIDITÀ OFFERTA: ${validityDays} giorni dalla presente` : null);

    const vatRateLabel =
      (isStr(q.vatRateLabel) && q.vatRateLabel) ||
      (vat ? `IVA ${vat}%` : "IVA 22%");

    const termsText = isStr(q.terms) ? q.terms : null;
    let termsStructured: TermsDocument | null = (q as any)?.termsStructured && typeof (q as any).termsStructured === 'object'
      ? (q as any).termsStructured as TermsDocument
      : null;

    if (!termsStructured && termsText) {
      const fallbackProfile = detectTermsProfile(
        termsText,
        (q.customer_type === 'azienda' || q.customerType === 'azienda') ? 'azienda' : 'privato'
      );
      const profile = TERMS_PROFILES.find(p => p.id === fallbackProfile) ?? TERMS_PROFILES[0];
      const rebuilt = buildTermsDocument(profile, validityDays ? { validityDays } : undefined);
      if (rebuilt.text.trim() === termsText.trim()) {
        termsStructured = rebuilt;
      }
    }

    let showTotalIncl = typeof q.show_total_incl === 'boolean' ? q.show_total_incl : (typeof q.showTotalIncl === 'boolean' ? q.showTotalIncl : false);
    let vatPercent = (typeof q.vat_percent === 'number' && Number.isFinite(q.vat_percent)) ? q.vat_percent : (vat ? Number(String(vat)) : 22);

    // Fallback: try to parse from free-text `notes` if DB columns aren't present
    try {
      const notesRaw = typeof q.notes === 'string' ? q.notes : '';
      if (!showTotalIncl) {
        const mShow = notesRaw.match(/SHOW_TOTAL_INCL\s*:\s*(true|1|yes)/i);
        showTotalIncl = !!mShow;
      }
      if (!(typeof vatPercent === 'number' && Number.isFinite(vatPercent))) {
        const mVat = notesRaw.match(/VAT_PERCENT\s*:\s*(\d{1,3})/i);
        if (mVat) vatPercent = Number(mVat[1]);
      }
    } catch {}

    // Dati cliente (con P.IVA/CF)
    const customer = {
      name: isStr(q.customer_name) ? q.customer_name : (isStr(q.customerName) ? q.customerName : null),
      address: isStr(q.job_address) ? q.job_address : (isStr(q.address) ? q.address : null),
      email: isStr(q.customer_email) ? q.customer_email : (isStr(q.email) ? q.email : null),
      phone: isStr(q.customer_phone) ? q.customer_phone : (isStr(q.phone) ? q.phone : null),
      vat: isStr(q.customer_vat) ? q.customer_vat : (isStr(q.vat_number) ? q.vat_number : null),
    };

    // Profile Overview (from store) — sanitize and collapse to null if empty
    let po: QuotePDFProps['profileOverview'] = null;
    if (profileOverview && typeof profileOverview === 'object') {
      // Avoid blob: URLs in PDF
      const imgRaw = isStr(profileOverview.imageUrl) ? profileOverview.imageUrl : null;
      const img = imgRaw && !imgRaw.startsWith('blob:') ? imgRaw : null;

      const featsRaw = Array.isArray(profileOverview.features) ? profileOverview.features : [];
      const feats = featsRaw
        .map((f: any) => ({
          eyebrow: isStr(f?.eyebrow) ? f.eyebrow : undefined,
          title: isStr(f?.title) ? f.title : undefined,
          description: isStr(f?.description) ? f.description : undefined,
        }))
        // keep only features that have at least one non-empty field
        .filter((f: any) => !!(f.eyebrow || f.title || f.description));

      po = (img || feats.length > 0) ? { imageUrl: img, features: feats } : null;
    }

    const showShippingIncluded =
      typeof q.shipping_included === 'boolean' ? q.shipping_included :
      typeof q.shippingIncluded === 'boolean' ? q.shippingIncluded :
      true;

    return {
      companyLogoUrl: isStr(q.companyLogoUrl) ? q.companyLogoUrl : null,
      quoteNumber: isStr(q.number) ? q.number : null,

      issueDate,
      installTime,
      showShippingIncluded,
      totalMq: isNum(q.total_mq) ? q.total_mq : (isNum(q.totalMq) ? q.totalMq : null),
      profileSystem,
      vatRateLabel,

      customer,

      catTotals,
      mountingCost: isNum(q.mountingCost) ? q.mountingCost : null,
      totalExcluded: isNum(q.totalExcluded) ? q.totalExcluded : null,
      validityLabel,
      terms: termsText,
      termsStructured,

      profileOverview: po,

      showTotalIncl,
      vatPercent,
      items: pdfSafeItems,
    };
  }, [quote, manualTotals, items, profileOverview]);
}
