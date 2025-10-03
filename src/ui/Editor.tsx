//src/ui/Editor.tsx
import { useParams, Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft, FileText, User, Building, Copy, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

import { uploadQuoteItemImage } from '../lib/uploadImages'

// Store & Quote items
import { useQuoteStore } from '../stores/useQuoteStore'
import type { QuoteItem } from '../features/quotes/types'
import { registry } from '../features/quotes/registry'
import { euro } from '../features/quotes/utils/pricing'
import { ProductPickerModal } from '../features/quotes/modals/ProductPickerModal'
import { gridWindowToPngBlob } from '../features/quotes/svg/windowToPng'

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
}

type BrandingSettings = { logo_url?: string | null }
type TermsSettings = { validity_label?: string | null, conditions?: string | null }

// Modular components
import { ItemCard } from '../features/quotes/components/ItemCard'
import { ItemModal } from '../features/quotes/modals/ItemModal'


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
  const [manualTotals, setManualTotals] = useState<{ id: string; label: string; amount: number }[]>([])

  const addTotalRow = () =>
    setManualTotals(r => [...r, { id: crypto.randomUUID(), label: '', amount: 0 }])

  const updateRow = (id: string, patch: Partial<{ label: string; amount: number }>) =>
    setManualTotals(r => r.map(x => x.id === id ? { ...x, ...patch } : x))

  const removeRow = (id: string) =>
    setManualTotals(r => r.filter(x => x.id !== id))

  const duplicateRow = (id: string) =>
    setManualTotals(r => {
      const it = r.find(x => x.id === id)
      if (!it) return r
      return [...r, { ...it, id: crypto.randomUUID() }]
    })

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

  // Items (store)
  const items = useQuoteStore(s => s.items)
  const setItems = useQuoteStore(s => s.setItems)
  const addItem = useQuoteStore(s => s.addItem)
  const replaceItem = useQuoteStore(s => s.replaceItem)
  const duplicateItem = useQuoteStore(s => s.duplicateItem)
  const removeItem = useQuoteStore(s => s.removeItem)

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

  // Se nel draft è presente un file scelto dall'utente, effettua l'upload e sostituisci image_url con l'URL pubblico
  const pickedFile: File | undefined = (toSave as any).__pickedFile
  if (pickedFile && quote?.id) {
    try {
      const publicUrl = await uploadQuoteItemImage(pickedFile, quote.id)
      toSave.image_url = publicUrl
    } catch (err: any) {
      toast.error(err?.message || 'Errore upload immagine')
    } finally {
      // rimuovi i marker interni non serializzabili
      // @ts-ignore
      delete toSave.__pickedFile
      // @ts-ignore
      delete toSave.__previewUrl
    }
  }

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

          // Se la voce ha una configurazione finestra, rasterizza l'SVG -> PNG e usa un data URL
          if (clean?.options?.gridWindow) {
            try {
              const blob = await gridWindowToPngBlob(clean.options.gridWindow, 640, 640);
              const dataUrl = await blobToDataURL(blob); // data:image/png;base64,...
              clean.image_url = dataUrl;
            } catch (e) {
              console.warn("Rasterizzazione finestra → PNG fallita", e);
              // fallback: se c’era un URL http(s) valido lo manteniamo, altrimenti nessuna immagine
              const raw = typeof clean.image_url === 'string' ? clean.image_url.trim() : '';
              const isHttp = /^https?:\/\//i.test(raw);
              const isData = /^data:image\//i.test(raw);
              clean.image_url = (isHttp || isData) ? raw : undefined;
            }
          } else {
            // Voci NON finestra: consenti solo http(s) o data URL; MAI blob:
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
      }));
      const totalExcluded = catTotals.reduce((s, r) => s + (r.amount || 0), 0);

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
          <div className="text-xs text-gray-500">Totale documento</div>
          <div className="text-2xl font-bold tracking-tight">{euro(totalExcluded)}</div>
          <div className="flex items-center justify-end gap-2">
            <Button
              className="bg-gray-800 text-white hover:bg-gray-900"
              onClick={openPdfPreview}
            >
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
              <div className="text-xs text-gray-500">Tempi posa in opera</div>
              <input
                className="input"
                placeholder="es. 4-6 settimane"
                value={quote.install_time ?? ''}
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
                className="rounded-lg border p-3 bg-white/60"
              >
                <div className="space-y-2">
                  {/* Top row: Title + Delete (inline on mobile) */}
                  <div className="flex items-center gap-2">
                    <input
                      className="input flex-1 min-w-0"
                      placeholder="Es. Finestre / Portoncino cantina / Montaggio…"
                      value={row.label}
                      onChange={(e) => updateRow(row.id, { label: e.target.value })}
                    />
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

                  {/* Amount (second row) */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 sm:flex-none sm:w-40">
                      <input
                        className="input w-full text-right"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        value={row.amount}
                        onChange={(e) =>
                          updateRow(row.id, { amount: Number(e.target.value || 0) })
                        }
                      />
                    </div>
                    <span className="hidden sm:inline text-sm text-gray-500">€</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <div className="text-sm text-gray-600">Totale (IVA esclusa)</div>
          <div className="text-xl font-semibold">{euro(totalExcluded)}</div>
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

        {items.length === 0 ? (
          <div className="mt-4 rounded border border-dashed p-6 text-center text-sm text-gray-600">
            Nessuna voce. Premi <span className="font-medium">Aggiungi</span> e scegli la categoria.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((it) => (
              <ItemCard
                key={it.id}
                item={it}
                onEdit={startEdit}
                onDuplicate={duplicateItem}
                onRemove={removeItem}
              />
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
          onChange={(next) => setDraft(next)}
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