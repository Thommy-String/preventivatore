//src/ui/Editor.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { supabase } from '../lib/supabase'
import { uploadQuoteItemImage } from '../lib/uploadImages'
import { toast } from 'sonner'
import { Card } from '../components/ui/Card'


// Store & Quote items
import { useQuoteStore } from '../stores/useQuoteStore'
import type { ManualTotalRow, ManualTotalSurfaceEntry, QuoteItem } from '../features/quotes/types'
import { registry } from '../features/quotes/registry'
import { ProductPickerModal } from '../features/quotes/modals/ProductPickerModal'
import { gridWindowToPngBlob } from '../features/quotes/svg/windowToPng'
import { cassonettoToPngBlob } from '../features/quotes/cassonetto/cassonettoToPng'
import { persianaToPngBlob } from '../features/quotes/persiana/persianaToPng'
import { tapparellaToPngBlob } from '../features/quotes/tapparella/tapparellaToPng'
import { TERMS_PROFILES, buildTermsDocument } from '../content/terms'
import type { TermsProfile } from '../content/terms'
import { normalizeSurfaceEntries } from '../features/quotes/utils/surfaceSelections'

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
  shipping_included?: boolean | null
  total_mq: number | null
  profile_system: string | null
  notes: string | null
  terms?: string | null
  manual_totals?: ManualTotalRow[]
  discount_json?: {
    mode: 'pct' | 'final';
    pct?: number | null;
    final?: number | null;
  } | null
}

type BrandingSettings = { logo_url?: string | null }
// Modular components
import { ItemModal } from '../features/quotes/modals/ItemModal'
import { SurfaceModal } from '../components/editor/SurfaceModal'
import { CostSummarySection } from '../components/editor/CostSummarySection.tsx'
import { QuoteItemsSection } from '../components/editor/QuoteItemsSection'
import { QuoteToolbar } from '../components/editor/QuoteToolbar'
import { QuoteHeaderSection } from '../components/editor/QuoteHeaderSection'

const DEFAULT_INSTALL_TIME = '6-8 settimane'

const EMPTY_TERMS_PROFILE: TermsProfile = {
  id: 'privato',
  label: 'Termini standard',
  tagline: '',
  summary: '',
  validityTemplate: "VALIDITA' OFFERTA: {days} GG DALLA PRESENTE",
  notesIntro: 'Note del cliente (termini particolari o richieste specifiche).',
  paymentPlan: [],
  sections: [],
  privacy: { title: 'Privacy e trattamento dei dati', body: [] }
}

const createEmptyManualRow = (): ManualTotalRow => ({
  id: crypto.randomUUID(),
  label: '',
  amount: 0,
  pieces: null,
})

const cleanManualRow = (row: any): ManualTotalRow => {
  const id = typeof row?.id === 'string' ? row.id : crypto.randomUUID()
  const label = typeof row?.label === 'string' ? row.label : ''
  const amountVal = Number(row?.amount)
  const amount = Number.isFinite(amountVal) ? amountVal : 0
  const pieces = typeof row?.pieces === 'number' && Number.isFinite(row.pieces) ? row.pieces : null
  const surfaces = normalizeSurfaceEntries(row?.surfaces)
  const base: ManualTotalRow = { id, label, amount, pieces }
  if (surfaces.length > 0) base.surfaces = surfaces
  return base
}

const hydrateManualTotals = (rows: any): ManualTotalRow[] => {
  if (!Array.isArray(rows)) return []
  return rows.map(cleanManualRow)
}


// Convert a Blob to a data URL (browser-safe, no Buffer)
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = (e) => reject(e);
    fr.readAsDataURL(blob);
  });
}

// Convert data URLs to File/Blob without using fetch (works on Safari too)
function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [metadata, base64] = dataUrl.split(',');
  if (!metadata || !base64) throw new Error('URL dati dell\'immagine non valido');
  const mimeMatch = metadata.match(/data:(.*?)(;base64)?$/i);
  const mimeType = mimeMatch?.[1] ?? 'application/octet-stream';
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  if (typeof File === 'function') {
    return new File([buffer], fileName, { type: mimeType });
  }
  const blob = new Blob([buffer], { type: mimeType });
  (blob as any).name = fileName;
  return blob as File;
}


export default function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Header (DB)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [branding, setBranding] = useState<BrandingSettings | null>(null)
  const [saving, setSaving] = useState(false)

  // Riepilogo costi (manuale per categoria)
  const [manualTotals, setManualTotals] = useState<ManualTotalRow[]>([])
  const [surfaceRowId, setSurfaceRowId] = useState<string | null>(null)
  const surfaceModalRow = surfaceRowId ? manualTotals.find((r) => r.id === surfaceRowId) ?? null : null

  type ManualRowPatch = Partial<Omit<ManualTotalRow, 'id'>> & { surfaces?: ManualTotalSurfaceEntry[] | null }

  const addTotalRow = () =>
    setManualTotals((rows) => [...rows, createEmptyManualRow()])

  const updateRow = (id: string, patch: ManualRowPatch) =>
    setManualTotals((rows) =>
      rows.map((row) => {
        if (row.id !== id) return row
        const next: ManualTotalRow = { ...row, ...patch }
        if (Object.prototype.hasOwnProperty.call(patch, 'surfaces')) {
          const normalized = normalizeSurfaceEntries(patch?.surfaces)
          if (normalized.length > 0) {
            next.surfaces = normalized
          } else {
            delete next.surfaces
          }
        }
        return next
      })
    )

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
    setNoteKey('P.IVA', nextPiva || null)
  }

  // --- Notes helpers: parse simple `Key: value; KEY2: value2` format ---
  function parseNotesMap(notes?: string | null) {
    const map: Record<string, string> = {};
    if (!notes) return map;
    const parts = notes.split(';').map(p => p).filter(p => p.trim());
    for (const p of parts) {
      const m = p.match(/^([^:]+)\s*:\s*([\s\S]+)$/);
      if (m) {
        const k = m[1].trim();
        const key = k.toUpperCase();
        const raw = m[2] ?? '';
        const v = key === 'NOTE_INTERNE'
          ? String(raw).replace(/^\s+/, '')
          : String(raw).trim();
        map[key] = v;
      }
    }
    return map;
  }

  function serializeNotesMap(map: Record<string, string | null | undefined>) {
    const parts: string[] = [];
    for (const [k, v] of Object.entries(map)) {
      const raw = v == null ? '' : String(v);
      if (raw.trim() === '') continue;
      const isInternal = k.toUpperCase() === 'NOTE_INTERNE';
      parts.push(`${k}: ${isInternal ? raw : raw.trim()}`);
    }
    return parts.length ? parts.join('; ') : null;
  }

  function setNoteKey(key: string, value: string | null) {
    const raw = quote?.notes ?? '';
    const map = parseNotesMap(String(raw));
    const upperKey = key.toUpperCase();
    const nextVal = value == null ? '' : String(value);
    if (nextVal.trim() === '') {
      delete map[upperKey];
    } else {
      map[upperKey] = upperKey === 'NOTE_INTERNE' ? nextVal : nextVal.trim();
    }
    const next = serializeNotesMap(map as Record<string, string | null | undefined>);
    updateField('notes', next as any);
  }

  // --- Sconto totale (solo UI) ---
  const [showDiscountEditor, setShowDiscountEditor] = useState(false);
  const [discountMode, setDiscountMode] = useState<'pct' | 'final' | null>(null);
  const [discountPct, setDiscountPct] = useState<number | null>(null);       // es. 10 = 10%
  const [discountFinal, setDiscountFinal] = useState<number | null>(null);   // nuovo totale (IVA esclusa)
  const [isMigratingImages, setIsMigratingImages] = useState(false);
  const migrationFailuresRef = useRef<Set<string>>(new Set());

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
      : []
  const setItems = useQuoteStore(s => s.setItems)
  const addItem = useQuoteStore(s => s.addItem)
  const replaceItem = useQuoteStore(s => s.replaceItem)
  const duplicateItem = useQuoteStore(s => s.duplicateItem)
  const removeItem = useQuoteStore(s => s.removeItem)
  // Profile Overview (editor → PDF)
  const profileOverview = useQuoteStore(s => s.profileOverview)
  const setProfileOverview = useQuoteStore(s => s.setProfileOverview)

  // Item editor state
  const [pickerOpen, setPickerOpen] = useState(false)
  const [draft, setDraft] = useState<QuoteItem | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const isModalOpen = !!draft

  const defaultTermsProfile = TERMS_PROFILES[0] ?? EMPTY_TERMS_PROFILE

  const termsDoc = useMemo(() => {
    return buildTermsDocument(defaultTermsProfile, { validityDays: quote?.validity_days ?? 15 })
  }, [defaultTermsProfile, quote?.validity_days])


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
    const quoteIdStr = quote?.id ? String(quote.id) : null

    const pickedFile: File | undefined = (toSave as any).__pickedFile
    if (pickedFile) {
      let uploaded: string | null = null
      if (quoteIdStr) {
        try {
          uploaded = await uploadQuoteItemImage(pickedFile, quoteIdStr)
        } catch (err) {
          console.warn('Upload file personalizzato fallito', err)
        }
      }
      try {
        if (uploaded) {
          toSave.image_url = uploaded
          // @ts-ignore
          toSave.__previewUrl = uploaded
          // @ts-ignore
          delete toSave.__needsUpload
        } else {
          const dataUrl = await blobToDataURL(pickedFile)
          toSave.image_url = dataUrl
          // @ts-ignore
          toSave.__previewUrl = dataUrl
          // @ts-ignore
          toSave.__needsUpload = 'user-file'
        }
      } catch (err: any) {
        console.warn('Conversione file → data URL fallita', err)
      } finally {
        // @ts-ignore
        delete toSave.__pickedFile
      }
    } else {
      // in ogni caso non persistiamo il File
      // @ts-ignore
      delete toSave.__pickedFile
    }

    // --- Genera o riallinea l'immagine per finestre (grid) e cassonetti ---
    const isCassonetto = String(toSave.kind).toLowerCase() === 'cassonetto'
    if (!pickedFile && isCassonetto) {
      try {
        const cfg = {
          width_mm: Number(toSave.width_mm) || 0,
          height_mm: Number(toSave.height_mm) || 0,
          depth_mm: (toSave.depth_mm ?? null),
          celino_mm: (toSave.celino_mm ?? toSave.extension_mm ?? null),
        } as const
        if (cfg.width_mm > 0 && cfg.height_mm > 0) {
          const blob = await cassonettoToPngBlob(cfg as any, 640, 640)
          const dataUrl = await blobToDataURL(blob)
          toSave.image_url = dataUrl
          // @ts-ignore
          toSave.__previewUrl = dataUrl
          // @ts-ignore
          delete toSave.__needsUpload
        }
      } catch (e) {
        console.warn('Rasterizzazione cassonetto → PNG fallita', e)
      }
    }

    const hasGridWindow = Boolean((toSave as any)?.options?.gridWindow)
    if (!pickedFile && hasGridWindow) {
      try {
        const blob = await gridWindowToPngBlob((toSave as any).options.gridWindow, 640, 640)
        const dataUrl = await blobToDataURL(blob)
        toSave.image_url = dataUrl
        // @ts-ignore
        toSave.__previewUrl = dataUrl
        // @ts-ignore
        delete toSave.__needsUpload
      } catch (e) {
        console.warn('Rasterizzazione finestra → PNG fallita', e)
      }
    }

    // --- Se rimangono data URL (es. vecchie voci), prova a caricarle su storage ---
    if (
      typeof toSave.image_url === 'string' &&
      toSave.image_url.startsWith('data:') &&
      // @ts-ignore
      (
        // @ts-ignore
        toSave.__needsUpload === 'user-file' ||
        // support legacy boolean flag
        // @ts-ignore
        toSave.__needsUpload === true
      ) &&
      quoteIdStr
    ) {
      try {
        const fileName = `item-${toSave.id || Date.now()}.png`
        const file = dataUrlToFile(String(toSave.image_url), fileName)
        const uploaded = await uploadQuoteItemImage(file, quoteIdStr)
        if (uploaded) {
          toSave.image_url = uploaded
          // @ts-ignore
          toSave.__previewUrl = uploaded
          // @ts-ignore
          delete toSave.__needsUpload
        }
      } catch (e) {
        console.warn('Upload immagine da data URL fallito', e)
      }
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
          } else if (String(clean?.kind || '').toLowerCase() === 'persiana') {
            try {
              const cfg = {
                width_mm: Number(clean.width_mm) || 1000,
                height_mm: Number(clean.height_mm) || 1400,
                ante: Number(clean.ante) || 2,
              } as const;
              const blob = await persianaToPngBlob(cfg as any, 640, 640);
              const dataUrl = await blobToDataURL(blob);
              clean.image_url = dataUrl;
            } catch (e) {
              console.warn('Rasterizzazione persiana → PNG fallita', e);
              const raw = typeof clean.image_url === 'string' ? clean.image_url.trim() : '';
              const isHttp = /^https?:\/\//i.test(raw);
              const isData = /^data:image\//i.test(raw);
              clean.image_url = (isHttp || isData) ? raw : undefined;
            }
          } else if (String(clean?.kind || '').toLowerCase() === 'tapparella') {
            try {
              // Recupera il colore dalle options
              const previewColor = (clean as any).options?.previewColor;
              const cfg = {
                width_mm: Number(clean.width_mm) || 1000,
                height_mm: Number(clean.height_mm) || 1400,
                color: previewColor, // Passa il colore per la generazione PNG
              } as const;
              const blob = await tapparellaToPngBlob(cfg as any, 640, 640);
              const dataUrl = await blobToDataURL(blob);
              clean.image_url = dataUrl;
            } catch (e) {
              console.warn('Rasterizzazione tapparella → PNG fallita', e);
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
        surfaces: r.surfaces ? normalizeSurfaceEntries(r.surfaces) : undefined,
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



      const notesMap = parseNotesMap(quote?.notes);
      const computedShowTotalIncl = notesMap['SHOW_TOTAL_INCL'] === 'true';
      const computedVatPercent = Number.isFinite(Number(notesMap['VAT_PERCENT']))
        ? Number(notesMap['VAT_PERCENT'])
        : Number.isFinite(Number(quote.vat))
          ? Number(quote.vat)
          : 22;

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
        showShippingIncluded: quote.shipping_included !== false,
        catTotals,
        totalExcluded,
        validityDays: quote.validity_days ?? 15,
        validityLabel: termsDoc.validityLabel || `VALIDITA' OFFERTA: ${quote.validity_days ?? 15} giorni`,
        terms: termsDoc.text,
        termsStructured: termsDoc,

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
        showTotalIncl: computedShowTotalIncl,
        vatPercent: computedVatPercent,
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
      setManualTotals(hydrateManualTotals((data as any)?.manual_totals))
      const savedItems = Array.isArray((data as any)?.items_json) ? (data as any).items_json : []
      setItems(savedItems as any)
      setProfileOverview(((data as any)?.profile_overview) ?? null)
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
    })()
  }, [])


  useEffect(() => {
    if (!quote) return
    debouncedSave({ manual_totals: manualTotals } as any)
  }, [manualTotals])

  useEffect(() => {
    if (!quote) return
    if (!quote.install_time || !quote.install_time.trim()) {
      updateField('install_time', DEFAULT_INSTALL_TIME as any)
    }
    if (quote.shipping_included == null) {
      updateField('shipping_included', true as any)
    }
  }, [quote])

  useEffect(() => {
    if (!quote?.id) return
    if (isMigratingImages) return
    const arr: any[] = Array.isArray(items) ? items : []
    const needUpload = arr
      .map((item, idx) => ({ item, idx }))
      .filter(({ item, idx }) => {
        const flag = (item as any)?.__needsUpload
        const wantsUpload = flag === 'user-file' || flag === true
        if (!wantsUpload) return false
        const raw = typeof item?.image_url === 'string' ? item.image_url : null
        if (!raw || !raw.startsWith('data:')) return false
        const key = String(item?.id ?? `idx-${idx}`)
        return !migrationFailuresRef.current.has(key)
      })
    if (needUpload.length === 0) return

    let cancelled = false
    setIsMigratingImages(true)

    ;(async () => {
      const next = arr.slice()
      let mutated = false
      for (const { item, idx } of needUpload) {
        const key = String(item?.id ?? `idx-${idx}`)
        try {
          const fileName = `item-${key}-${Date.now()}.png`
          const file = dataUrlToFile(String(item.image_url), fileName)
          const url = await uploadQuoteItemImage(file, String(quote.id))
          if (cancelled) return
          if (url) {
            const updated: any = { ...(item as any), image_url: url, __previewUrl: (item as any).__previewUrl ?? url }
            delete updated.__needsUpload
            next[idx] = updated
            mutated = true
          } else {
            migrationFailuresRef.current.add(key)
          }
        } catch (err) {
          migrationFailuresRef.current.add(key)
          console.warn('Migrazione immagine base64 fallita', err)
        }
      }
      if (!cancelled && mutated) {
        setItems(next as any)
      }
      if (!cancelled) {
        setIsMigratingImages(false)
      }
    })()

    return () => {
      cancelled = true
      setIsMigratingImages(false)
    }
  }, [quote?.id, items, isMigratingImages, setItems])

  useEffect(() => {
    if (!quote) return
    if (!termsDoc.text) return
    if (quote.terms === termsDoc.text) return
    updateField('terms', termsDoc.text as Quote['terms'])
  }, [quote?.terms, termsDoc.text])

  useEffect(() => {
    if (!quote) return
    if (isMigratingImages) return

    const entries = Array.isArray(items)
      ? items.map((it: any, idx: number) => ({
          item: it,
          key: String(it?.id ?? `idx-${idx}`),
          image: typeof it?.image_url === 'string' ? it.image_url : null,
          needsUpload: (it?.__needsUpload === 'user-file' || it?.__needsUpload === true),
        }))
      : []

    const pendingDataUpload = entries.some(
      ({ image, key, needsUpload }) =>
        needsUpload && !!image && image.startsWith('data:') && !migrationFailuresRef.current.has(key)
    )
    if (pendingDataUpload) return

    // Sanitize items before persistere: drop transient fields e URL temporanei
    const payload = entries.map(({ item }) => {
      if (!item || typeof item !== 'object') return item
      const { __pickedFile, __previewUrl, __needsUpload, ...rest } = item as any
      if (typeof rest.image_url === 'string' && (rest.image_url.startsWith('blob:') || rest.image_url.startsWith('data:'))) {
        delete rest.image_url
      }
      return rest
    })
    debouncedSave({ items_json: payload } as any)
  }, [items, isMigratingImages])

  useEffect(() => {
    if (!quote) return
    const po = profileOverview
    const hasContent = !!po?.imageUrl || (Array.isArray(po?.features) && po.features.length > 0)
    debouncedSave({ profile_overview: hasContent ? po : null } as any)
  }, [profileOverview])

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

  const notesMap = useMemo(() => parseNotesMap(quote?.notes), [quote?.notes])
  const internalNote = notesMap['NOTE_INTERNE'] ?? ''

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

  const handleBackClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const historyState = typeof window !== 'undefined' ? window.history.state : null;
    const idx = typeof historyState?.idx === 'number' ? historyState.idx : null;
    if (idx !== null && idx > 0) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  };

  if (!quote) {
    return <div className="animate-pulse h-8 w-40 rounded bg-gray-200" />
  }

  return (
    <div className="space-y-6">
      {/* Toolbar titolo */}
      <QuoteToolbar
        quote={quote}
        saving={saving}
        hasDiscount={hasDiscount}
        totalExcluded={totalExcluded}
        discountedTotal={discountedTotal}
        discountMode={discountMode}
        discountPct={discountPct}
        onBackClick={handleBackClick}
        onStatusChange={(status) => updateField('status', status)}
        onOpenPdf={openPdfPreview}
        onDuplicate={onDuplicateQuote}
      />

      {/* Note interne (non stampate) */}
      <div className="rounded-xl border border-dashed border-amber-200 bg-[#FFFCF4] px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="flex items-start justify-between gap-2">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            Note interne 
          </div>
        </div>
        <textarea
          className="mt-2 w-full rounded-lg border border-dashed border-amber-200/80 bg-[#FFFEF8] px-3 py-2 text-sm text-gray-800 placeholder:text-amber-700/60 focus:outline-none focus:ring-2 focus:ring-amber-100"
          placeholder="Appunti interni segreti… (non visibili al cliente nel pdf)"
          rows={3}
          value={internalNote}
          onChange={(e) => setNoteKey('NOTE_INTERNE', e.target.value)}
        />
      </div>

      {/* Info testata / Header editable */}
      <QuoteHeaderSection
        quote={quote}
        piva={piva}
        defaultInstallTime={DEFAULT_INSTALL_TIME}
        updateField={updateField}
        onPivaChange={(value) => { setPiva(value); upsertNotes(value) }}
        parseNotesMap={parseNotesMap}
        setNoteKey={setNoteKey}
      />

      {/* Riepilogo costi (manuale) */}
      <Card>
        <CostSummarySection
          manualTotals={manualTotals}
          itemsArray={itemsArray as QuoteItem[]}
          dragTotalId={dragTotalId}
          piecesStr={piecesStr}
          amountStr={amountStr}
          totalExcluded={totalExcluded}
          hasDiscount={hasDiscount}
          discountedTotal={discountedTotal}
          discountMode={discountMode}
          discountPct={discountPct}
          discountFinal={discountFinal}
          showDiscountEditor={showDiscountEditor}
          onAddRow={addTotalRow}
          onUpdateRow={updateRow}
          onRemoveRow={removeRow}
          onMoveRow={moveTotalRow}
          onTotalDragStart={onTotalDragStart}
          onTotalDragOver={onTotalDragOver}
          onTotalDrop={onTotalDrop}
          onPiecesChange={onPiecesChange}
          onPiecesBlur={onPiecesBlur}
          onAmountChange={onAmountChange}
          onAmountBlur={onAmountBlur}
          onOpenSurfaceModal={setSurfaceRowId}
          onToggleDiscountEditor={() => {
            setShowDiscountEditor((v) => !v)
            if (!discountMode) setDiscountMode('pct')
          }}
          onSetDiscountMode={setDiscountMode}
          onSetDiscountPct={setDiscountPct}
          onSetDiscountFinal={setDiscountFinal}
          onClearDiscount={() => {
            setDiscountMode(null)
            setDiscountPct(null)
            setDiscountFinal(null)
          }}
        />
      </Card>

      {/* Voci */}
      <Card>
        <QuoteItemsSection
          itemsArray={itemsArray as QuoteItem[]}
          onOpenPicker={() => setPickerOpen(true)}
          onItemDragStart={onItemDragStart}
          onItemDragOver={onItemDragOver}
          onItemDrop={onItemDrop}
          onMoveItemRow={moveItemRow}
          onEditItem={startEdit}
          onDuplicateItem={duplicateItem}
          onRemoveItem={removeItem}
        />
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

      <SurfaceModal
        open={!!surfaceModalRow}
        row={surfaceModalRow}
        items={itemsArray as QuoteItem[]}
        onClose={() => setSurfaceRowId(null)}
        onSave={(entries) => {
          if (surfaceModalRow) {
            updateRow(surfaceModalRow.id, { surfaces: entries })
          }
          setSurfaceRowId(null)
        }}
      />
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
