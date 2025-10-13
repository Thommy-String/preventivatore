//src/ui/Editor.tsx
import { useParams, Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft, FileText, User, Building, Copy, Plus, Trash2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { BadgePercent, X } from "lucide-react";


// Store & Quote items
import { useQuoteStore } from '../stores/useQuoteStore'
import type { QuoteItem } from '../features/quotes/types'
import { registry } from '../features/quotes/registry'
import { euro } from '../features/quotes/utils/pricing'
import { ProductPickerModal } from '../features/quotes/modals/ProductPickerModal'
import { gridWindowToPngBlob } from '../features/quotes/svg/windowToPng'
import { cassonettoToPngBlob } from '../features/quotes/cassonetto/cassonettoToPng'

// Types for the Quote header (DB)
type Quote = {
  id: string
  number: string
  status: 'bozza' | 'inviato' | 'accettato' | 'rifiutato' | 'scaduto'
  customer_type: 'privato' | 'azienda'
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  job_address: string | null
  validity_days: number
  vat: '22' | '10' | '4'
  created_at: string | null
  issue_date: string | null
  install_time: string | null
  total_mq: number | null
  profile_system: string | null
  notes: string | null
  manual_totals?: { id: string; label: string; amount: number }[]
  discount_json?: {
    mode: 'pct' | 'final';
    pct?: number | null;
    final?: number | null;
  } | null
}

type BrandingSettings = { logo_url?: string | null }
type TermsSettings = { validity_label?: string | null, conditions?: string | null }

// Modular components
import { ItemCard } from '../features/quotes/components/ItemCard'
import { ItemModal } from '../features/quotes/modals/ItemModal'
import { ProfileOverview } from '../components/editor/ProfileOverview'


const PROFILE_SYSTEMS = [
  "WDS 76 MD",
  "WDS 76 AD",
  "WDS 76 PORTE",
  "WDS 76 SCORREVOLE",
  "ULTRA 70",
  "ULTRA 60",
] as const;

// Convert a Blob to a data URL (browser-safe, no Buffer)
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = (e) => reject(e);
    fr.readAsDataURL(blob);
  });
}

export default function Editor() {
  const { id } = useParams()

  // Header (DB)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [branding, setBranding] = useState<BrandingSettings | null>(null)
  const [terms, setTerms] = useState<TermsSettings | null>(null)
  const [saving, setSaving] = useState(false)

  // Riepilogo costi (manuale per categoria)
  const [manualTotals, setManualTotals] = useState<{ id: string; label: string; amount: number; pieces?: number | null }[]>([])

  const addTotalRow = () =>
    setManualTotals(r => [...r, { id: crypto.randomUUID(), label: '', amount: 0, pieces: null }])

  const updateRow = (id: string, patch: Partial<{ label: string; amount: number; pieces?: number | null }>) =>
    setManualTotals(r => r.map(x => x.id === id ? { ...x, ...patch } : x))

  const removeRow = (id: string) =>
    setManualTotals(r => r.filter(x => x.id !== id))

  // --- Mobile-friendly local strings for Riepilogo costi inputs ---
  const [piecesStr, setPiecesStr] = useState<Record<string, string>>({});
  const [amountStr, setAmountStr] = useState<Record<string, string>>({});

  // Keep local strings in sync with manualTotals (and hide the initial 0 for amount)
  useEffect(() => {
    const nextPieces: Record<string, string> = {};
    const nextAmount: Record<string, string> = {};
    manualTotals.forEach(r => {
      nextPieces[r.id] = (typeof r.pieces === 'number' && isFinite(r.pieces)) ? String(r.pieces) : '';
      // UI nicer: if amount is 0, show empty string so "0" isn't forced
      nextAmount[r.id] = (typeof r.amount === 'number' && isFinite(r.amount) && r.amount !== 0) ? String(r.amount) : '';
    });
    setPiecesStr(nextPieces);
    setAmountStr(nextAmount);
  }, [manualTotals]);
  // --- Handlers: commit on blur, allow empty while typing ---
  const onPiecesChange = (id: string, v: string) => {
    if (v === '' || /^\d+$/.test(v)) setPiecesStr(prev => ({ ...prev, [id]: v }));
  };
  const onPiecesBlur = (id: string) => {
    const raw = piecesStr[id] ?? '';
    const n = raw === '' ? null : Math.max(0, parseInt(raw || '0', 10));
    updateRow(id, { pieces: n });
    setPiecesStr(prev => ({ ...prev, [id]: raw === '' ? '' : String(n) }));
  };

  // Accept comma or dot, keep up to 2 decimals in UI, but store full number
  const normalizeAmountInput = (s: string) => s.replace(',', '.');
  const onAmountChange = (id: string, v: string) => {
    if (v === '') { setAmountStr(prev => ({ ...prev, [id]: '' })); return; }
    // allow digits, optional one separator, optional decimals
    if (/^\d+([.,]\d{0,2})?$/.test(v)) {
      setAmountStr(prev => ({ ...prev, [id]: v }));
    }
  };
  const onAmountBlur = (id: string) => {
    const raw = amountStr[id] ?? '';
    if (raw === '') {
      // keep amount 0 but show empty field
      updateRow(id, { amount: 0 });
      setAmountStr(prev => ({ ...prev, [id]: '' }));
      return;
    }
    const parsed = Number(normalizeAmountInput(raw));
    const n = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    updateRow(id, { amount: n });
    // format back with up to 2 decimals only if user typed decimals; otherwise integer
    const hasSep = /[.,]/.test(raw);
    setAmountStr(prev => ({ ...prev, [id]: hasSep ? n.toFixed(2).replace('.', ',') : String(n) }));
  };



  // piva local state
  const [piva, setPiva] = useState<string>("")

  useEffect(() => {
    if (!quote) return
    const n = quote.notes || ""
    const mP = n.match(/P\.IVA:\s*([^;]+)(;|$)/i)
    if (mP) {
      const next = mP[1].trim()
      if (next !== piva) setPiva(next)
    }
  }, [quote?.id])

  function upsertNotes(nextPiva: string) {
    const newNotes = nextPiva ? `P.IVA: ${nextPiva}` : ''
    updateField('notes', newNotes || null)
  }

  // --- Sconto totale (solo UI) ---
  const [showDiscountEditor, setShowDiscountEditor] = useState(false);
  const [discountMode, setDiscountMode] = useState<'pct' | 'final' | null>(null);
  const [discountPct, setDiscountPct] = useState<number | null>(null);       // es. 10 = 10%
  const [discountFinal, setDiscountFinal] = useState<number | null>(null);   // nuovo totale (IVA esclusa)

  // Persist discount to DB whenever it changes (so it survives reloads and is visible on other devices)
  useEffect(() => {
    if (!quote) return;
    // Build the payload following the same "hasDiscount" semantics
    const payload =
      (discountMode === 'pct' && typeof discountPct === 'number' && discountPct > 0)
        ? { mode: 'pct' as const, pct: discountPct, final: null }
        : (discountMode === 'final' && typeof discountFinal === 'number' && discountFinal >= 0)
          ? { mode: 'final' as const, pct: null, final: discountFinal }
          : null;

    // Avoid needless writes if unchanged
    const prev = quote.discount_json ?? null;
    const same = JSON.stringify(prev) === JSON.stringify(payload);
    if (same) return;

    // Update local quote and persist
    setQuote({ ...(quote as any), discount_json: payload as any });
    debouncedSave({ discount_json: payload } as any);
  }, [discountMode, discountPct, discountFinal]);

  // --- Reorder helpers ---
  function arrayMove<T>(arr: T[], from: number, to: number) {
    const a = arr.slice();
    if (from < 0 || from >= a.length) return a;
    if (to < 0 || to >= a.length) return a;
    const [it] = a.splice(from, 1);
    a.splice(to, 0, it);
    return a;
  }

  // DnD state for manualTotals
  const [dragTotalId, setDragTotalId] = useState<string | null>(null);
  // DnD state for items
  const [dragItemId, setDragItemId] = useState<string | null>(null);

  // --- ManualTotals reorder functions ---
  function moveTotalRow(id: string, dir: -1 | 1) {
    setManualTotals((rows) => {
      const i = rows.findIndex(r => r.id === id);
      if (i === -1) return rows;
      const j = i + dir;
      return arrayMove(rows, i, j);
    });
  }

  function onTotalDragStart(e: React.DragEvent<HTMLDivElement>, id: string) {
    setDragTotalId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }
  function onTotalDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }
  function onTotalDrop(e: React.DragEvent<HTMLDivElement>, targetId: string) {
    e.preventDefault();
    const sourceId = dragTotalId || e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;
    setManualTotals((rows) => {
      const from = rows.findIndex(r => r.id === sourceId);
      const to = rows.findIndex(r => r.id === targetId);
      if (from === -1 || to === -1) return rows;
      return arrayMove(rows, from, to);
    });
    setDragTotalId(null);
  }

  // --- Items reorder functions ---
  function moveItemRow(id: string, dir: -1 | 1) {
    const curr = Array.isArray(items)
      ? items.slice()
      : (items && typeof items === 'object') ? Object.values(items as any) : [];
    const i = curr.findIndex((r: any) => r?.id === id);
    if (i === -1) return;
    const j = Math.max(0, Math.min(curr.length - 1, i + dir));
    if (j === i) return;
    const next = arrayMove(curr, i, j);
    setItems(next as any);
  }

  function onItemDragStart(e: React.DragEvent<HTMLDivElement>, id: string) {
    setDragItemId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }
  function onItemDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }
  function onItemDrop(e: React.DragEvent<HTMLDivElement>, targetId: string) {
    e.preventDefault();
    const sourceId = dragItemId || e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;
    const curr = Array.isArray(items)
      ? items.slice()
      : (items && typeof items === 'object') ? Object.values(items as any) : [];
    const from = curr.findIndex((r: any) => r?.id === sourceId);
    const to = curr.findIndex((r: any) => r?.id === targetId);
    if (from === -1 || to === -1) { setDragItemId(null); return; }
    const next = arrayMove(curr, from, to);
    setItems(next as any);
    setDragItemId(null);
  }

  // Items (store)
  const items = useQuoteStore(s => s.items)
  // Normalize items to an array for rendering/ordering safety
  const itemsArray: any[] = Array.isArray(items)
    ? items
    : (items && typeof items === 'object')
      ? Object.values(items as any)
      : [];
  const setItems = useQuoteStore(s => s.setItems)
  const addItem = useQuoteStore(s => s.addItem)
  const replaceItem = useQuoteStore(s => s.replaceItem)
  const duplicateItem = useQuoteStore(s => s.duplicateItem)
  const removeItem = useQuoteStore(s => s.removeItem)
  // Profile Overview (editor → PDF)
  const profileOverview = useQuoteStore(s => s.profileOverview)

  // Item editor state
  const [pickerOpen, setPickerOpen] = useState(false)
  const [draft, setDraft] = useState<QuoteItem | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const isModalOpen = !!draft

  function startAdd(kind: keyof typeof registry) {
    const base = registry[kind].makeDefaults()
    setEditingId(null)
    setDraft(base)
  }
  function startEdit(it: QuoteItem) {
    setEditingId(it.id)
    // deep clone to avoid accidental mutations while editing
    setDraft(JSON.parse(JSON.stringify(it)))
  }
  async function saveDraft() {
    if (!draft) return
    let toSave: any = { ...draft }

    // --- Auto-genera PNG per Cassonetto (solo data URL, nessun upload) ---
    if (!toSave.__pickedFile && String(toSave.kind).toLowerCase() === 'cassonetto') {
      try {
        const cfg = {
          width_mm: Number(toSave.width_mm) || 0,
          height_mm: Number(toSave.height_mm) || 0,
          depth_mm: (toSave.depth_mm ?? null),
          celino_mm: (toSave.celino_mm ?? toSave.extension_mm ?? null),
        } as const;
        if (cfg.width_mm > 0 && cfg.height_mm > 0) {
          const blob = await cassonettoToPngBlob(cfg as any, 640, 640);
          const dataUrl = await blobToDataURL(blob);
          toSave.image_url = dataUrl;
          // anteprima locale
          // @ts-ignore
          toSave.__previewUrl = dataUrl;
        }
      } catch (e) {
        console.warn('Rasterizzazione cassonetto → PNG fallita', e);
      }
    }

    // --- Se l’utente ha caricato un file: convertilo in data URL (niente upload) ---
    const pickedFile: File | undefined = (toSave as any).__pickedFile
    if (pickedFile) {
      try {
        const dataUrl = await blobToDataURL(pickedFile);
        toSave.image_url = dataUrl;
        // @ts-ignore
        toSave.__previewUrl = dataUrl;
      } catch (err: any) {
        console.warn('Conversione file → data URL fallita', err);
      } finally {
        // rimuovi i marker non serializzabili
        // @ts-ignore
        delete toSave.__pickedFile
      }
    } else {
      // in ogni caso non persistiamo il File
      // @ts-ignore
      delete toSave.__pickedFile
    }

    // Nota: __previewUrl può rimanere in memoria locale; la persistenza su DB lo rimuove già (vedi effetto items_json)

    if (editingId) {
      replaceItem(editingId, { ...toSave, id: editingId })
      toast.success('Voce aggiornata')
    } else {
      addItem(toSave)
      toast.success('Voce aggiunta')
    }
    setDraft(null)
    setEditingId(null)
  }

  // PDF Preview (open in new tab)
  async function openPdfPreview() {
    if (!quote) {
      toast.error('Preventivo non caricato');
      return;
    }
    try {
      // 1) Prepara gli items per il PDF: per le finestre genera PNG on-the-fly come data URL
      const itemsForPdf = await Promise.all(
        items.map(async (it: any) => {
          const { __previewUrl, __pickedFile, ...clean } = it ?? {};

          // Gestione rasterizzazione e normalizzazione immagini per PDF
          if (clean?.options?.gridWindow) {
            try {
              const blob = await gridWindowToPngBlob(clean.options.gridWindow, 640, 640);
              const dataUrl = await blobToDataURL(blob);
              clean.image_url = dataUrl;
            } catch (e) {
              console.warn('Rasterizzazione finestra → PNG fallita', e);
              const raw = typeof clean.image_url === 'string' ? clean.image_url.trim() : '';
              const isHttp = /^https?:\/\//i.test(raw);
              const isData = /^data:image\//i.test(raw);
              clean.image_url = (isHttp || isData) ? raw : undefined;
            }
          } else if (String(clean?.kind || '').toLowerCase() === 'cassonetto') {
            try {
              const cfg = {
                width_mm: Number(clean.width_mm) || 0,
                height_mm: Number(clean.height_mm) || 0,
                depth_mm: (clean.depth_mm ?? null),
                celino_mm: (clean.celino_mm ?? clean.extension_mm ?? null),
              } as const;
              if (cfg.width_mm > 0 && cfg.height_mm > 0) {
                const blob = await cassonettoToPngBlob(cfg as any, 640, 640);
                const dataUrl = await blobToDataURL(blob);
                clean.image_url = dataUrl;
              } else {
                // fallback se misure mancanti
                const raw = typeof clean.image_url === 'string' ? clean.image_url.trim() : '';
                const isHttp = /^https?:\/\//i.test(raw);
                const isData = /^data:image\//i.test(raw);
                clean.image_url = (isHttp || isData) ? raw : undefined;
              }
            } catch (e) {
              console.warn('Rasterizzazione cassonetto → PNG fallita', e);
              const raw = typeof clean.image_url === 'string' ? clean.image_url.trim() : '';
              const isHttp = /^https?:\/\//i.test(raw);
              const isData = /^data:image\//i.test(raw);
              clean.image_url = (isHttp || isData) ? raw : undefined;
            }
          } else {
            const raw = typeof clean.image_url === 'string' ? clean.image_url.trim() : '';
            const isHttp = /^https?:\/\//i.test(raw);
            const isData = /^data:image\//i.test(raw);
            clean.image_url = (isHttp || isData) ? raw : undefined;
          }

          return clean;
        })
      );

      // 2) Lazy import del PDF
      const [{ pdf }, qpdf] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../pdf/QuotePDF')
      ]);
      if (!qpdf?.default) {
        toast.error('Componente PDF mancante');
        return;
      }

      // 3) Totali e meta
      const catTotals = manualTotals.map(r => ({
        label: r.label || '-',
        amount: Number.isFinite(Number(r.amount)) ? Number(r.amount) : 0,
        pieces: (typeof r.pieces === 'number' && isFinite(r.pieces) && r.pieces > 0) ? r.pieces : null,
      }));
      const totalExcluded = catTotals.reduce((s, r) => s + (r.amount || 0), 0);

      // ↓ SCONTO (solo UI)
      const hasDiscount =
        (discountMode === 'pct' && typeof discountPct === 'number' && discountPct > 0) ||
        (discountMode === 'final' && typeof discountFinal === 'number' && discountFinal >= 0);

      const discountedTotal =
        discountMode === 'pct'
          ? Math.max(0, totalExcluded * (1 - (discountPct ?? 0) / 100))
          : discountMode === 'final' && discountFinal != null
            ? Math.max(0, discountFinal)
            : totalExcluded;

      const extractedVat =
        (quote.customer_type === 'azienda')
          ? (
            (piva && piva.trim())
            || (quote.notes?.match(/P\.IVA:\s*([^;]+)(;|$)/i)?.[1]?.trim() ?? null)
          )
          : null;



      const data = {
        companyLogoUrl: branding?.logo_url ?? null,
        quoteNumber: quote.number ?? null,
        issueDate: quote.issue_date || new Date().toISOString().slice(0, 10),
        installTime: quote.install_time || null,
        totalMq: typeof quote.total_mq === 'number' ? quote.total_mq : null,
        profileSystem: quote.profile_system || null,
        vatRateLabel: `IVA ${quote.vat ?? '22'}%`,
        customer: {
          name: quote.customer_name || null,
          address: quote.job_address || null,
          email: quote.customer_email || null,
          phone: quote.customer_phone || null,
          vat: extractedVat,
        },
        catTotals,
        totalExcluded,
        validityDays: quote.validity_days ?? 15,
        validityLabel: (terms?.validity_label && terms.validity_label.trim())
          ? terms.validity_label
          : `VALIDITÀ OFFERTA: ${quote.validity_days ?? 15} giorni`,
        terms: terms?.conditions || null,

        // passa gli items già normalizzati (no blob:)
        items: itemsForPdf,

        // Sezione "Panoramica profilo" dal nostro store → PDF
        profileOverview: profileOverview
          ? {
              imageUrl: profileOverview.imageUrl ?? null,
              features: (profileOverview.features || []).map(f => ({
                eyebrow: f.eyebrow,
                title: f.title,
                description: f.description,
              })),
            }
          : null,

        discount: hasDiscount ? {
          mode: discountMode!,                       // 'pct' | 'final'
          pct: discountMode === 'pct' ? (discountPct ?? null) : null,
          final: discountMode === 'final' ? (discountFinal ?? null) : null,
          originalTotal: totalExcluded,              // prima dello sconto
          discountedTotal,                           // dopo lo sconto
        } : null,
      };

      const element = <qpdf.default {...data} />;
      const blob = await pdf(element).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e: any) {
      toast.error(e?.message || 'Errore apertura PDF');
    }
  }

  useEffect(() => {
    // Load quote
    (async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) { toast.error(error.message); return }
      setQuote(data as any)
      setManualTotals(((data as any)?.manual_totals) ?? [])
      const savedItems = Array.isArray((data as any)?.items_json) ? (data as any).items_json : []
      setItems(savedItems as any)
      // Hydrate discount UI state from DB
      const dq = (data as any)?.discount_json;
      if (dq && typeof dq === 'object') {
        const mode = dq.mode === 'pct' || dq.mode === 'final' ? dq.mode : null;
        setDiscountMode(mode);
        setDiscountPct(mode === 'pct' ? (typeof dq.pct === 'number' ? dq.pct : null) : null);
        setDiscountFinal(mode === 'final' ? (typeof dq.final === 'number' ? dq.final : null) : null);
      } else {
        // fallback: no discount persisted
        setDiscountMode(null);
        setDiscountPct(null);
        setDiscountFinal(null);
      }
    })()
  }, [id, setItems])

  useEffect(() => {
    // Load app settings (branding + terms)
    ; (async () => {
      const { data: b } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'branding')
        .maybeSingle()
      if (b?.value) setBranding(b.value as BrandingSettings)

      const { data: t } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'terms')
        .maybeSingle()
      if (t?.value) setTerms(t.value as TermsSettings)
    })()
  }, [])


  useEffect(() => {
    if (!quote) return
    debouncedSave({ manual_totals: manualTotals } as any)
  }, [manualTotals])

  useEffect(() => {
    if (!quote) return
    // Sanitize items before persisting: drop transient fields and any blob: URLs
    const payload = (items as any[]).map((it) => {
      if (!it || typeof it !== 'object') return it
      const { __pickedFile, __previewUrl, ...rest } = it as any
      if (typeof rest.image_url === 'string' && rest.image_url.startsWith('blob:')) {
        delete rest.image_url
      }
      return rest
    })
    debouncedSave({ items_json: payload } as any)
  }, [items])

  // --- Autosave helpers ---
  function updateField<K extends keyof Quote>(key: K, value: Quote[K]) {
    if (!quote) return
    // Prevent needless loops if the same value is set repeatedly
    // Handles primitives stored in Quote; for objects/arrays, extend as needed.
    if ((quote as any)[key] === value) return
    setQuote({ ...quote, [key]: value })
    debouncedSave({ [key]: value } as Partial<Quote>)
  }

  const debouncedSave = useDebouncedCallback(async (patch: Partial<Quote>) => {
    if (!quote) return
    try {
      setSaving(true)
      const { error } = await supabase
        .from('quotes')
        .update(patch)
        .eq('id', quote.id)
      if (error) throw error
    } catch (e: any) {
      toast.error(e.message || 'Errore salvataggio')
    } finally {
      setSaving(false)
    }
  }, 500)


  function onDuplicateQuote() { toast.info('Duplica preventivo in arrivo') }

  const totalExcluded = manualTotals.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)

  // --- Derivati sconto (usati nella UI e nel PDF) ---
  const hasDiscount =
    (discountMode === 'pct' && typeof discountPct === 'number' && discountPct > 0) ||
    (discountMode === 'final' && typeof discountFinal === 'number' && discountFinal >= 0);

  const discountedTotal =
    discountMode === 'pct'
      ? Math.max(0, totalExcluded * (1 - (discountPct ?? 0) / 100))
      : discountMode === 'final' && discountFinal != null
        ? Math.max(0, discountFinal)
        : totalExcluded;

  if (!quote) {
    return <div className="animate-pulse h-8 w-40 rounded bg-gray-200" />
  }

  return (
    <div className="space-y-6">
      {/* Toolbar titolo */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft size={16} /> Indietro
          </Link>
          <h1>
            {quote.number} <span className="text-gray-500 font-normal">· {quote.customer_name ?? '—'}</span>
          </h1>
          <div className="flex items-center gap-2">
            <select
              className="input !py-1 !h-7 w-25 text-sm"
              value={quote.status}
              onChange={(e) => updateField('status', e.target.value as any)}
            >
              <option value="bozza">Bozza</option>
              <option value="inviato">Inviato</option>
              <option value="accettato">Accettato</option>
              <option value="rifiutato">Rifiutato</option>
              <option value="scaduto">Scaduto</option>
            </select>
            {quote.created_at && (
              <span className="text-sm text-gray-500">Creato {new Date(quote.created_at).toLocaleString()}</span>
            )}
            {saving && <span className="text-xs text-gray-500">Salvataggio…</span>}
          </div>
        </div>
        <div className="text-right space-y-2">
          <div className="text-xs text-gray-500">Totale documento (IVA esclusa)</div>

          {!hasDiscount ? (
            <div className="text-2xl font-bold tracking-tight">{euro(totalExcluded)}</div>
          ) : (
            <div className="space-y-1">
              <div className="text-sm text-gray-500 line-through">{euro(totalExcluded)}</div>
              <div className="text-2xl font-bold tracking-tight">{euro(discountedTotal)}</div>
              {discountMode === 'pct' && (
                <div className="text-xs text-gray-600">Sconto {discountPct}%</div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">

            <Button className="bg-gray-800 text-white hover:bg-gray-900" onClick={openPdfPreview}>
              <FileText size={16} /> PDF
            </Button>
            <Button variant="outline" onClick={onDuplicateQuote}>
              <Copy size={16} /> Duplica
            </Button>
          </div>
        </div>
      </div>

      {/* Info testata / Header editable */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-gray-500">Cliente</div>
            <div className="inline-flex rounded-md border bg-white overflow-hidden">
              <button
                type="button"
                className={`px-3 py-1.5 text-sm ${(quote.customer_type ?? 'privato') === 'privato' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={() => updateField('customer_type', 'privato')}
              ><User size={14} /> Privato</button>
              <button
                type="button"
                className={`px-3 py-1.5 text-sm border-l ${(quote.customer_type ?? 'privato') === 'azienda' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={() => updateField('customer_type', 'azienda')}
              ><Building size={14} /> Azienda</button>
            </div>
          </div>

          {(quote.customer_type ?? 'privato') === 'privato' ? (
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-500">Nome e cognome</div>
                <input
                  className="input"
                  placeholder="Nome cliente"
                  value={quote.customer_name ?? ''}
                  onChange={(e) => updateField('customer_name', e.target.value || null)}
                />
              </div>
              <div>
                <div className="text-xs text-gray-500">Email</div>
                <input
                  className="input"
                  placeholder="email@esempio.it"
                  value={quote.customer_email ?? ''}
                  onChange={(e) => updateField('customer_email', e.target.value || null)}
                />
              </div>
              <div>
                <div className="text-xs text-gray-500">Telefono</div>
                <input
                  className="input"
                  placeholder="es. 333 1234567"
                  value={quote.customer_phone ?? ''}
                  onChange={(e) => updateField('customer_phone', e.target.value || null)}
                />
              </div>
              <div>
                <div className="text-xs text-gray-500">Indirizzo lavori</div>
                <input
                  className="input"
                  placeholder="Via, n°, città"
                  value={quote.job_address ?? ''}
                  onChange={(e) => updateField('job_address', e.target.value || null)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-500">Ragione sociale</div>
                <input
                  className="input"
                  placeholder="Nome azienda"
                  value={quote.customer_name ?? ''}
                  onChange={(e) => updateField('customer_name', e.target.value || null)}
                />
              </div>
              <div>
                <div className="text-xs text-gray-500">P.IVA</div>
                <input
                  className="input"
                  placeholder="es. IT01234567890"
                  value={piva}
                  onChange={(e) => { const v = e.target.value; setPiva(v); upsertNotes(v); }}
                />
              </div>
              <div>
                <div className="text-xs text-gray-500">Email</div>
                <input
                  className="input"
                  placeholder="email@azienda.it"
                  value={quote.customer_email ?? ''}
                  onChange={(e) => updateField('customer_email', e.target.value || null)}
                />
              </div>
              <div>
                <div className="text-xs text-gray-500">Telefono</div>
                <input
                  className="input"
                  placeholder="es. 02 1234567"
                  value={quote.customer_phone ?? ''}
                  onChange={(e) => updateField('customer_phone', e.target.value || null)}
                />
              </div>
              <div>
                <div className="text-xs text-gray-500">Indirizzo lavori</div>
                <input
                  className="input"
                  placeholder="Via, n°, città"
                  value={quote.job_address ?? ''}
                  onChange={(e) => updateField('job_address', e.target.value || null)}
                />
              </div>
            </div>
          )}
        </Card>
        <Card>
          <div className="text-xs font-medium text-gray-500 mb-2">Dati documento</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-gray-500">Data emissione</div>
              <input
                type="date"
                className="input"
                value={quote.issue_date ?? ''}
                onChange={(e) => updateField('issue_date', e.target.value)}
              />
            </div>
            <div>
              <div className="text-xs text-gray-500">Termine di completamento</div>
              <input
                className="input"
                placeholder="es. 4-6 settimane"
                value={quote.install_time ?? '4-6 settimane'}
                onChange={(e) => updateField('install_time', e.target.value || null)}
              />
            </div>
            <div>
              <div>
                <div className="text-xs text-gray-500">Validità offerta (giorni)</div>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={quote.validity_days ?? 15}
                  onChange={(e) => {
                    const v = e.target.value === '' ? 15 : Math.max(1, parseInt(e.target.value || '15', 10));
                    updateField('validity_days', v as any);
                  }}
                />
              </div>

              <div>
                <div className="text-xs text-gray-500">IVA</div>
                <select
                  className="input"
                  value={quote.vat ?? '22'}
                  onChange={(e) => updateField('vat', (e.target.value as any))}
                >
                  <option value="22">22%</option>
                  <option value="10">10%</option>
                  <option value="4">4%</option>
                </select>
              </div>
              <div>
                <div className="text-xs text-gray-500">Sistema profilo generale</div>
                <select
                  className="input"
                  value={
                    quote.profile_system && (PROFILE_SYSTEMS as readonly string[]).includes(quote.profile_system)
                      ? (quote.profile_system as string)
                      : ''
                  }
                  onChange={(e) => updateField('profile_system', e.target.value === '' ? null : (e.target.value as any))}
                >
                  <option value="">— Seleziona —</option>
                  {PROFILE_SYSTEMS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>
        </Card>

        <ProfileOverview />
      </div>

      {/* Riepilogo costi (manuale) */}
      <Card>
        <div className="flex items-center justify-between gap-2">
          <h2>Riepilogo costi</h2>
          <Button variant="ghost" onClick={addTotalRow}><Plus size={16} /> Aggiungi costo</Button>
        </div>

        {manualTotals.length === 0 ? (
          <div className="mt-4 rounded border border-dashed p-6 text-center text-sm text-gray-600">
            Aggiungi le voci di costo per categoria (es. “Finestre”, “Zanzariere”, “Montaggio”…).
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {manualTotals.map((row) => (
              <div
                key={row.id}
                className={`rounded-lg border p-3 bg-white/60 ${dragTotalId===row.id ? 'ring-2 ring-gray-300' : ''}`}
                draggable
                onDragStart={(e) => onTotalDragStart(e, row.id)}
                onDragOver={onTotalDragOver}
                onDrop={(e) => onTotalDrop(e, row.id)}
              >
                <div className="space-y-2">
                  {/* Top row: Title + Delete (inline on mobile) */}
                  <div className="flex items-center gap-2">
                    <span className="cursor-grab text-gray-400 hover:text-gray-700" title="Trascina per riordinare">
                      <GripVertical size={16} />
                    </span>
                    <input
                      className="input flex-1 min-w-0"
                      placeholder="Es. Finestre / Portoncino cantina / Montaggio…"
                      value={row.label}
                      onChange={(e) => updateRow(row.id, { label: e.target.value })}
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-md border bg-white hover:bg-gray-50"
                        aria-label="Sposta su"
                        title="Sposta su"
                        onClick={() => moveTotalRow(row.id, -1)}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-md border bg-white hover:bg-gray-50"
                        aria-label="Sposta giù"
                        title="Sposta giù"
                        onClick={() => moveTotalRow(row.id, +1)}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-md border bg-white hover:bg-gray-50"
                        aria-label="Rimuovi riga"
                        onClick={() => removeRow(row.id)}
                        title="Rimuovi"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Amount (second row) */}
                  <div className="flex items-center gap-2">
                    {/* Pezzi opzionale */}
                    <div className="w-20">
                      <input
                        className="input w-full text-right"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="pz."
                        value={piecesStr[row.id] ?? (typeof row.pieces === 'number' ? String(row.pieces) : '')}
                        onChange={(e) => onPiecesChange(row.id, e.target.value)}
                        onBlur={() => onPiecesBlur(row.id)}
                        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                        onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                      />
                    </div>

                    {/* Importo */}
                    <div className="flex-1 sm:flex-none sm:w-40">
                      <input
                        className="input w-full text-right"
                        type="text"
                        inputMode="decimal"
                        // allow comma or dot while typing; we'll sanitize on blur
                        value={amountStr[row.id] ?? (row.amount === 0 ? '' : String(row.amount))}
                        onChange={(e) => onAmountChange(row.id, e.target.value)}
                        onBlur={() => onAmountBlur(row.id)}
                        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                        onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                        placeholder="0,00"
                      />
                    </div>
                    <span className="hidden sm:inline text-sm text-gray-500">€</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 border-t pt-3 space-y-2 relative">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Totale (IVA esclusa)</div>

            <div className="flex items-center gap-2">
              {!hasDiscount ? (
                <div className="text-xl font-semibold">{euro(totalExcluded)}</div>
              ) : (
                <div className="text-right">
                  <div className="text-sm text-gray-500 line-through">{euro(totalExcluded)}</div>
                  <div className="text-[11px] text-gray-500">
                    {discountMode === 'pct' ? `Sconto ${discountPct}%` : 'Totale impostato manualmente'}
                  </div>
                </div>
              )}

              {/* ← nuovo bottone qui */}
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm hover:bg-gray-50"
                onClick={() => {
                  setShowDiscountEditor((v) => !v);
                  if (!discountMode) setDiscountMode('pct');
                }}
                title="Applica sconto"
              >
                <BadgePercent size={14} /> Sconto
              </button>
            </div>
          </div>

          {/* Popover Sconto spostato qui */}
          {showDiscountEditor && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border bg-white p-3 shadow-lg z-10">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Imposta sconto</div>
                <button className="text-gray-500 hover:text-gray-800" onClick={() => setShowDiscountEditor(false)}>
                  <X size={16} />
                </button>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <button
                  className={`rounded-md border px-2 py-1.5 ${discountMode === 'pct' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}
                  onClick={() => setDiscountMode('pct')}
                >
                  In percentuale
                </button>
                <button
                  className={`rounded-md border px-2 py-1.5 ${discountMode === 'final' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}
                  onClick={() => setDiscountMode('final')}
                >
                  Sul totale
                </button>
              </div>

              {discountMode === 'pct' ? (
                <div className="mt-3">
                  <label className="text-xs text-gray-500">Sconto (%)</label>
                  <input
                    className="input w-full"
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    value={discountPct ?? ''}
                    onChange={(e) => setDiscountPct(e.target.value === '' ? null : Number(e.target.value))}
                  />
                  <div className="mt-1 text-xs text-gray-600">
                    Nuovo totale: <b>{euro(Math.max(0, totalExcluded * (1 - (discountPct ?? 0) / 100)))}</b>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <label className="text-xs text-gray-500">Nuovo totale (IVA esclusa)</label>
                  <input
                    className="input w-full"
                    type="number"
                    min={0}
                    step="0.01"
                    value={discountFinal ?? ''}
                    onChange={(e) => setDiscountFinal(e.target.value === '' ? null : Number(e.target.value))}
                  />
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <button
                  className="text-sm text-red-600 hover:underline"
                  onClick={() => { setDiscountMode(null); setDiscountPct(null); setDiscountFinal(null); }}
                >
                  Rimuovi sconto
                </button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowDiscountEditor(false)}>Annulla</Button>
                  <Button onClick={() => setShowDiscountEditor(false)}>Applica</Button>
                </div>
              </div>
            </div>
          )}

          {hasDiscount && (
            <div className="flex items-center justify-between rounded-md px-3 py-2" style={{ background: '#e8f7ec' }}>
              <div className="text-sm font-medium text-gray-800">Totale scontato (IVA esclusa)</div>
              <div className="text-xl font-bold">{euro(discountedTotal)}</div>
            </div>
          )}
        </div>
      </Card>

      {/* Voci */}
      <Card>
        <div className="flex items-center justify-between">
          <h2>Voci del preventivo</h2>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setPickerOpen(true)}><Plus size={16} />  Aggiungi voce</Button>
          </div>
        </div>

        {itemsArray.length === 0 ? (
          <div className="mt-4 rounded border border-dashed p-6 text-center text-sm text-gray-600">
            Nessuna voce. Premi <span className="font-medium">Aggiungi</span> e scegli la categoria.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {itemsArray.map((it) => (
              <div
                key={it.id}
                className={`relative group rounded-lg`}
                draggable
                onDragStart={(e) => onItemDragStart(e, it.id)}
                onDragOver={onItemDragOver}
                onDrop={(e) => onItemDrop(e, it.id)}
              >
                {/* Drag handle (left) */}
                <div className="absolute -left-6 top-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-gray-400 hover:text-gray-700" title="Trascina per riordinare">
                  <GripVertical size={16} />
                </div>

                {/* Controls (right) */}
                <div className="absolute -right-6 top-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md border bg-white hover:bg-gray-50"
                    title="Sposta su"
                    onClick={() => moveItemRow(it.id, -1)}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md border bg-white hover:bg-gray-50"
                    title="Sposta giù"
                    onClick={() => moveItemRow(it.id, +1)}
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>

                <ItemCard
                  item={it}
                  onEdit={startEdit}
                  onDuplicate={duplicateItem}
                  onRemove={removeItem}
                />
              </div>
            ))}
          </div>
        )}
      </Card>


      {/* Termini */}
      <Card>
        <h2>Termini &amp; Condizioni</h2>
        <p className="text-sm text-gray-600 mt-2">
          Il contenuto viene inserito nella seconda pagina del PDF. Modulo di editing avanzato in arrivo.
        </p>
      </Card>


      {/* Picker Modal */}
      <ProductPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(k) => { setPickerOpen(false); startAdd(k) }}
      />

      {/* Item Editor Modal */}
      {isModalOpen && draft && (
        <ItemModal
          draft={draft}
          editingId={editingId}
          onChange={(next: QuoteItem) => setDraft(next)}
          onCancel={() => { setDraft(null); setEditingId(null) }}
          onSave={saveDraft}
        />
      )}
    </div>
  )
}

// --- tiny debounce helper ---
function useDebouncedCallback<T extends (...args: any[]) => any>(fn: T, delay = 400) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null)
  return (...args: Parameters<T>) => {
    if (t.current) clearTimeout(t.current)
    t.current = setTimeout(() => fn(...args), delay)
  }
}
