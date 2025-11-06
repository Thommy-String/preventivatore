//src/ui/Home.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import QuoteActionsMenu from '../components/QuoteActionsMenu'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

import { Card } from '../components/ui/Card'




// Anteprima preventivo: totale senza IVA e riepilogo per tipo
// Anteprima preventivo: TOTALE (senza IVA) da manual_totals + charges - sconti
// e CONTEGGIO per tipo da quotes.items_json (kind + qty)
function QuotePreview({ quoteId }: { quoteId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{
    totalNet: number
    counts: Record<string, number>
  } | null>(null)

  useEffect(() => {
    let alive = true
      ; (async () => {
        try {
          setLoading(true)
          setError(null)

          // 1) Leggi dal record della quote il SOMMARIO prezzi e gli ITEMS grezzi
          const { data: q, error: eq } = await supabase
            .from('quotes')
            .select('id, manual_totals, items_json')
            .eq('id', quoteId)
            .maybeSingle()
          if (eq) throw eq
          if (!q) { if (alive) setData({ totalNet: 0, counts: {} }); return }

          // 2) Prendi l’ULTIMA versione per collegare charges + sconti totali
          const { data: v, error: ev } = await supabase
            .from('quote_versions')
            .select('id, created_at')
            .eq('quote_id', quoteId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (ev) throw ev

          // 3) Somma spese extra (trasporto/montaggio/smaltimento)
          let extra = 0
          if (v?.id) {
            const { data: charges, error: ech } = await supabase
              .from('quote_charges')
              .select('amount')
              .eq('quote_version_id', v.id)
            if (ech) throw ech
            extra = (charges ?? []).reduce((s, c) => s + Number(c?.amount ?? 0), 0)
          }

          // 4) Somma del SOMMARIO (manual_totals) – questi sono gli importi “di listino” netti
          const manualTotals = Array.isArray(q.manual_totals) ? q.manual_totals : []
          const manualSum = manualTotals.reduce((s: number, r: any) => {
            const amt = Number(r?.amount ?? 0)
            return s + (Number.isFinite(amt) ? amt : 0)
          }, 0)

          // 5) Applica SCONTI TOTALI (quote_totals) alla somma netta (manual + extra)
          let net = manualSum + extra
          if (v?.id) {
            const { data: tot, error: et } = await supabase
              .from('quote_totals')
              .select('total_discount_pct, total_discount_abs')
              .eq('quote_version_id', v.id)
              .maybeSingle()
            if (et) throw et
            if (tot?.total_discount_pct) net *= (1 - Number(tot.total_discount_pct) / 100)
            if (tot?.total_discount_abs) net -= Number(tot.total_discount_abs)
          }
          if (net < 0) net = 0

          // 6) Conteggio per TIPO (kind) dagli items della quote (items_json)
          const rawItems = Array.isArray(q.items_json) ? q.items_json : []
          const counts: Record<string, number> = {}
          for (const it of rawItems) {
            const kind = typeof it?.kind === 'string' ? it.kind : 'altro'
            const qty = Number(it?.qty ?? 1)
            counts[kind] = (counts[kind] ?? 0) + (Number.isFinite(qty) ? qty : 0)
          }

          if (alive) setData({ totalNet: net, counts })
        } catch (e: any) {
          if (alive) setError(e.message || 'Errore caricamento anteprima')
        } finally {
          if (alive) setLoading(false)
        }
      })()
    return () => { alive = false }
  }, [quoteId])

  if (loading) {
    return (
      <div className="mt-3 border-t pt-3 text-xs text-gray-500">
        <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }
  if (error) {
    return <div className="mt-3 border-t pt-3 text-xs text-red-600">{error}</div>
  }
  if (!data) return null

  const labelMap: Record<string, string> = {
    finestra: 'Finestre',
    cassonetto: 'Cassonetti',
    zanzariera: 'Zanzariere',
    persiana: 'Persiane',
    tapparella: 'Tapparelle',
    custom: 'Voci custom',
    altro: 'Altro',
  }

  // Ordine elegante dei tipi in output
  const order = ['finestra', 'porta_finestra', 'scorrevole', 'cassonetto', 'zanzariera', 'persiana', 'tapparella', 'custom', 'altro']
  const parts = Object.entries(data.counts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))

  return (
    <div className="mt-3 border-t pt-3 flex items-center justify-between text-xs text-gray-700">
      {/* SINISTRA: chip con icone + conteggio */}
      <div className="min-w-0 flex flex-wrap items-center gap-1.5">
        {parts.length === 0 ? (
          <span className="badge-soft">—</span>
        ) : parts.map(([k, v]) => (
          <span
            key={k}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 border border-gray-200 bg-white/60 shadow-sm"
            title={labelMap[k] ?? k}
          >
            <KindIcon kind={k} />
            <span className="truncate max-w-[14ch]">
              {v} {(labelMap[k] ?? k)}
            </span>
          </span>
        ))}
      </div>

      {/* DESTRA: totale senza IVA */}
      <div className="ml-4 shrink-0 text-right">
        <div className="uppercase tracking-wide text-[10px] text-gray-500">Totale (senza IVA)</div>
        <div className="font-mono text-sm font-semibold">
          € {data.totalNet.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  )
}

// Piccole icone inline per i tipi
function KindIcon({ kind }: { kind: string }) {
  const common = "inline-block align-[-2px]"
  switch (kind) {
    case 'finestra':
      return (
        <svg className={common} width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" />
          <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
    case 'cassonetto':
      return (
        <svg className={common} width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <rect x="6.5" y="8.5" width="11" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      )
    case 'zanzariera':
      return (
        <svg className={common} width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="1" />
        </svg>
      )
    case 'persiana':
      return (
        <svg className={common} width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="6" y="4" width="12" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 7h10M7 10h10M7 13h10M7 16h10" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      )
    case 'tapparella':
      return (
        <svg className={common} width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="4" width="14" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="5" y="9" width="14" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="5" y="14" width="14" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
    case 'custom':
    default:
      return (
        <svg className={common} width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
  }
}


// Types
type QuoteRow = {
  id: string
  number: string
  status: 'bozza' | 'inviato' | 'accettato' | 'rifiutato' | 'scaduto'
  customer_name: string | null
  job_address: string | null
  created_at: string | null
  validity_days: number
  reference: string | null
  reference_key: string | null
  // computed client-side when grouping
  groupCount?: number
  siblingsNumbers?: string[]
}

const PAGE_SIZE = 12
const MONTH_TOTALS_LIMIT = 20000
const STATUS_ORDER: QuoteRow['status'][] = ['bozza', 'inviato', 'accettato', 'rifiutato', 'scaduto']

// Keep only the most recent quote for each reference_key; attach groupCount for badge.
function groupByReferenceLatest(rows: QuoteRow[]): QuoteRow[] {
  const byKey = new Map<string, QuoteRow[]>()
  const noKey: QuoteRow[] = []
  for (const r of rows) {
    if (r.reference_key) {
      const k = r.reference_key
      if (!byKey.has(k)) byKey.set(k, [])
      byKey.get(k)!.push(r)
    } else {
      noKey.push(r)
    }
  }
  const result: QuoteRow[] = []
  for (const [, list] of byKey) {
    list.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    const latest = list[0]
    const others = list.slice(1).map(x => x.number).filter(Boolean)
    result.push({ ...latest, groupCount: list.length, siblingsNumbers: others })
  }
  result.push(...noKey)
  result.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
  return result
}

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '' }
}


function statusColor(s: QuoteRow['status']) {
  switch (s) {
    case 'bozza': return '#9ca3af'
    case 'inviato': return '#3b82f6'
    case 'accettato': return '#10b981'
    case 'rifiutato': return '#ef4444'
    case 'scaduto': return '#f59e0b'
  }
}

function monthKey(d?: string | null){
  if(!d) return 'no-date'
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return 'no-date'
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`
}
function monthLabel(d?: string | null){
  if(!d) return 'Senza data'
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return 'Senza data'
  return dt.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
}

export default function Home() {
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<QuoteRow[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [filters, setFilters] = useState<Set<QuoteRow['status']>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [monthTotals, setMonthTotals] = useState<Record<string, number>>({})
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  // hotkeys: / = focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/') {
        const el = document.getElementById('dashboard-search') as HTMLInputElement | null
        if (el) { e.preventDefault(); el.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => { void loadPage(1, true) }, [])
  useEffect(() => { void loadPage(1, true) }, [Array.from(filters).join(','), debounced])

  const applyFilters = useCallback((query: any) => {
    let q = query
    if (filters.size > 0) {
      q = q.in('status', Array.from(filters))
    }
    if (debounced) {
      const term = debounced
      const or = `customer_name.ilike.%${term}%,number.ilike.%${term}%,job_address.ilike.%${term}%,reference.ilike.%${term}%`
      q = q.or(or)
    }
    return q
  }, [filters, debounced])

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loading) return
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          void loadPage(page + 1)
          break
        }
      }
    }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [page, hasMore, loading])

  async function loadPage(p = 1, reset = false) {
    try {
      setLoading(true)
      if (reset) setMonthTotals({})
      const from = (p - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const dataQuery = applyFilters(
        supabase
          .from('quotes')
          .select('id, number, status, customer_name, job_address, created_at, validity_days, reference, reference_key')
          .order('created_at', { ascending: false })
          .range(from, to)
      )

      const groupedTotalsQuery = reset
        ? applyFilters(
            supabase
              .from('quotes')
              .select('reference_key, created_at')
              .not('reference_key', 'is', null)
              .order('created_at', { ascending: false })
              .range(0, MONTH_TOTALS_LIMIT - 1)
          )
        : null

      const noRefTotalsQuery = reset
        ? applyFilters(
            supabase
              .from('quotes')
              .select('id, created_at')
              .is('reference_key', null)
              .order('created_at', { ascending: false })
              .range(0, MONTH_TOTALS_LIMIT - 1)
          )
        : null

      const emptyResult = { data: null, error: null } as const

      const [dataResult, groupedTotalsResult, noRefTotalsResult] = await Promise.all([
        dataQuery,
        groupedTotalsQuery ?? Promise.resolve(emptyResult),
        noRefTotalsQuery ?? Promise.resolve(emptyResult),
      ])

      const { data, error } = dataResult
      if (error) throw error

      if (reset) {
        if (groupedTotalsResult?.error) throw groupedTotalsResult.error
        if (noRefTotalsResult?.error) throw noRefTotalsResult.error

        const totals: Record<string, number> = {}
        const bump = (date: string | null | undefined) => {
          const key = monthKey(date)
          totals[key] = (totals[key] ?? 0) + 1
        }

        if (Array.isArray(groupedTotalsResult?.data)) {
          const seenRef = new Set<string>()
          for (const row of groupedTotalsResult.data as { reference_key: string | null; created_at: string | null }[]) {
            const ref = typeof row.reference_key === 'string' ? row.reference_key : null
            if (!ref || seenRef.has(ref)) continue
            seenRef.add(ref)
            bump(row.created_at)
          }
        }

        if (Array.isArray(noRefTotalsResult?.data)) {
          for (const row of noRefTotalsResult.data as { created_at: string | null }[]) {
            bump(row.created_at)
          }
        }

        setMonthTotals(totals)
      }

      const arr = (data ?? []) as QuoteRow[]
      setHasMore(arr.length === PAGE_SIZE)
      setPage(p)
      setItems(prev => {
        const base = reset ? arr : [...prev, ...arr]
        return groupByReferenceLatest(base)
      })
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || 'Errore caricamento preventivi')
    } finally {
      setLoading(false)
    }
  }

  function toggleFilter(s: QuoteRow['status']) {
    const next = new Set(filters)
    next.has(s) ? next.delete(s) : next.add(s)
    setFilters(next)
  }

  async function handleNew() {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('fn_create_quote', {
        p_customer_type: 'privato',
        p_customer_name: 'Cliente temporaneo',
        p_customer_email: null, p_customer_phone: null, p_job_address: null,
        p_price_list_id: null, p_vat: '22', p_validity_days: 15,
        p_terms: 'Pagamenti a 30gg.', p_notes: null,
        // p_reference: you can pass from a dialog if desired
      })
      if (error) throw error
      const res = data?.[0]
      toast.success(`Bozza creata: ${res.quote_number}`)
      nav(`/quotes/${res.quote_id}`)
    } catch (e: any) {
      toast.error(e.message || 'Errore creazione preventivo')
    } finally { setLoading(false) }
  }

  async function handleDeleteQuote(q: QuoteRow) {
    const confirmed = window.confirm(`Eliminare il preventivo ${q.number}? Questa azione è irreversibile.`)
    if (!confirmed) return
    try {
      setDeletingId(q.id)

      // 1) Trova le versioni di questo preventivo
      const { data: versions, error: ev } = await supabase
        .from('quote_versions')
        .select('id')
        .eq('quote_id', q.id)
      if (ev) throw ev
      const vIds = (versions ?? []).map(v => v.id)

      // 2) Cancella elementi collegati alle versioni (se esistono)
      if (vIds.length > 0) {
        const delItems = supabase.from('quote_items').delete().in('quote_version_id', vIds)
        const delCharges = supabase.from('quote_charges').delete().in('quote_version_id', vIds)
        const delTotals = supabase.from('quote_totals').delete().in('quote_version_id', vIds)
        const [e1, e2, e3] = await Promise.all([delItems, delCharges, delTotals])
        if (e1.error) throw e1.error
        if (e2.error) throw e2.error
        if (e3.error) throw e3.error

        const delVersions = await supabase.from('quote_versions').delete().eq('quote_id', q.id)
        if (delVersions.error) throw delVersions.error
      }

      // 3) Cancella la quote
      const delQuote = await supabase.from('quotes').delete().eq('id', q.id)
      if (delQuote.error) throw delQuote.error

      // 4) Aggiorna UI
      setItems(prev => prev.filter(it => it.id !== q.id))
      toast.success(`Preventivo ${q.number} eliminato`)
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || 'Errore durante l’eliminazione')
    } finally {
      setDeletingId(null)
    }
  }

  const headerCounts = useMemo(() => {
    const map: Record<QuoteRow['status'], number> = { bozza: 0, inviato: 0, accettato: 0, rifiutato: 0, scaduto: 0 }
    for (const it of items) map[it.status]++
    return map
  }, [items])

  const groupedByMonth = useMemo(() => {
    const map = new Map<string, { key: string; label: string; items: QuoteRow[] }>()
    for (const it of items) {
      const key = monthKey(it.created_at)
      const label = monthLabel(it.created_at)
      if (!map.has(key)) map.set(key, { key, label, items: [] })
      map.get(key)!.items.push(it)
    }
    const arr = Array.from(map.values())
    arr.sort((a, b) => {
      if (a.key === 'no-date') return 1
      if (b.key === 'no-date') return -1
      return b.key.localeCompare(a.key)
    })
    for (const g of arr) {
      g.items.sort((a,b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    }
    return arr
  }, [items])

  return (
    <div className="space-y-6">
      {/* Header title + CTA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="leading-tight">Preventivi</h1>
            <div className="mt-0.5 text-sm text-gray-600">Gestisci e crea preventivi per i tuoi clienti</div>
          </div>
        </div>
        <Button onClick={handleNew} disabled={loading}>+ Nuovo preventivo</Button>
      </div>

      {/* Sticky toolbar: search + filtri */}
      <div className="md:sticky md:top-[52px] md:z-10 md:border-b md:bg-[color:var(--bg)]/90 md:backdrop-blur">
        <div className="py-3 flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search */}
          <div className="w-full md:w-[28rem] relative">
            <svg
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd"/>
            </svg>
            <Input
              id="dashboard-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per numero, cliente o via…"
              className="pl-9 text-base md:text-sm"
              inputMode="search"
            />
            <span className="hidden md:inline absolute right-2 top-1/2 -translate-y-1/2 kbd">/</span>
          </div>
          {/* Segmented filter */}
          <div
            role="tablist"
            aria-label="Stato preventivi"
            className="overflow-x-auto -mx-2 md:mx-0 px-2 flex flex-nowrap md:flex-wrap md:overflow-visible [-webkit-overflow-scrolling:touch]"
          >
            <div className="inline-flex bg-gray-100 rounded-xl p-1 shadow-inner min-w-0">
              {STATUS_ORDER.map((s) => {
                const active = filters.has(s)
                const label = s.charAt(0).toUpperCase() + s.slice(1)
                const count = headerCounts[s]
                return (
                  <button
                    key={s}
                    role="tab"
                    aria-selected={active}
                    onClick={() => toggleFilter(s)}
                    className={[
                      "shrink-0 px-3 py-1.5 text-sm rounded-lg transition",
                      active
                        ? "bg-white shadow-sm ring-1 ring-gray-200 text-gray-900"
                        : "text-gray-600 hover:bg-white/60"
                    ].join(" ")}
                    title={`${count} visibili in questa pagina`}
                  >
                    <span className="font-medium">{label}</span>
                    {typeof count === "number" && count > 0 && (
                      <span className={active ? "ml-1 text-gray-900/70" : "ml-1 text-gray-500"}>· {count}</span>
                    )}
                  </button>
                )
              })}
              <button
                role="tab"
                aria-selected={filters.size === 0}
                onClick={() => setFilters(new Set())}
                className="shrink-0 px-3 py-1.5 text-sm rounded-lg text-gray-600 hover:bg-white/60"
                title="Mostra tutti"
              >
                Azzera
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista raggruppata per mese/anno */}
      {items.length === 0 && !loading ? (
        <Card className="text-center py-10 text-gray-600">
          Nessun preventivo trovato.
          <div className="mt-3">
            <Button onClick={handleNew}>Crea il primo preventivo</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedByMonth.map((group) => {
            const totalForMonth = monthTotals[group.key] ?? group.items.length
            return (
              <div key={group.key} className="space-y-3">
                <div className="md:sticky md:top-[96px] md:z-10 md:bg-[color:var(--bg)]/85 md:backdrop-blur border-b py-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-800 capitalize">{group.label}</div>
                    <div className="text-xs text-gray-500">{totalForMonth} preventivi</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.items.map(q => (
                    <CardQuote
                      key={q.id}
                      q={q}
                      onOpen={() => nav(`/quotes/${q.id}`)}
                      onDuplicate={() => toast.info('Duplica: in arrivo')}
                      onPdf={() => toast.info('PDF: in arrivo')}
                      onDelete={() => handleDeleteQuote(q)}
                      onDeleteDisabled={deletingId === q.id}
                      onFilterByReference={(ref) => setSearch(ref)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
          {loading && (
            <div className="grid md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`s-${i}`} />)}
            </div>
          )}
        </div>
      )}

      {/* Sentinel per auto-load */}
      {hasMore && <div ref={sentinelRef} className="h-8" />}
    </div>
  )
}

function daysLeft(created_at: string | null, validity_days: number) {
  if (!created_at) return null
  const created = new Date(created_at)
  const expires = new Date(created)
  expires.setDate(created.getDate() + (validity_days || 0))
  const ms = expires.getTime() - Date.now()
  const d = Math.ceil(ms / (1000 * 60 * 60 * 24))
  return d
}


function CardQuote({
  q, onOpen, onDuplicate, onPdf, onDelete, onDeleteDisabled = false, onFilterByReference
}: {
  q: QuoteRow
  onOpen: () => void
  onDuplicate: () => void
  onPdf: () => void
  onDelete: () => void
  onDeleteDisabled?: boolean
  onFilterByReference: (reference: string) => void
}) {
  const left = daysLeft(q.created_at, q.validity_days)
  const accentClass = `card-accent card-accent--${q.status}`
  const expiryLabel = left == null ? '—' : left < 0 ? `Scaduto da ${Math.abs(left)}g` : `Scade tra ${left}g`

  return (
    <Card className={`group ${accentClass} transition-transform will-change-transform hover:-translate-y-px ${onDeleteDisabled ? 'opacity-60' : ''}`}>
      {/* Make entire content clickable */}
      <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen() }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            {/* Numero piccolo e grassetto */}
            <div className="text-[11px] font-semibold text-gray-900 tracking-tight truncate max-w-[28ch] flex items-center gap-2 font-mono">
              <span>{q.number}</span>
              {q.created_at && <span className="text-[11px] font-normal text-gray-500">{fmtDate(q.created_at)}</span>}
            </div>
            {/* Nome cliente ben visibile */}
            <div className="mt-0.5 text-lg font-semibold truncate max-w-[28ch]">
              {q.customer_name ?? '—'}
            </div>
            {/* Riferimento (se presente) oppure indirizzo lavori */}
            {(q.reference || q.job_address) && (
              <div className="mt-1 text-xs text-gray-700 truncate max-w-[38ch]">
                {q.reference ?? q.job_address}
              </div>
            )}
          </div>
          <div
            className={onDeleteDisabled ? 'opacity-50 pointer-events-none' : ''}
            onClick={(e) => e.stopPropagation()}
          >
            <QuoteActionsMenu
              onOpen={onOpen}
              onDuplicate={onDuplicate}
              onPdf={onPdf}
              onDelete={onDelete}
            />
          </div>
        </div>
        {/* Meta footer: stato + scadenza (senza progress) */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusPill s={q.status} />
            {q.groupCount && q.groupCount > 1 && (q.reference || q.job_address) && (
              <button
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 border border-gray-200 text-xs text-gray-600 bg-white/60 hover:bg-white"
                title={q.siblingsNumbers && q.siblingsNumbers.length ? `Altri: ${q.siblingsNumbers.join(', ')}` : 'Mostra tutti i preventivi con questo riferimento'}
                onClick={(e) => { e.stopPropagation(); onFilterByReference((q.reference ?? q.job_address)!) }}
              >
                Versioni {q.groupCount}
              </button>
            )}
          </div>
          <div className="text-xs text-gray-600">{expiryLabel}</div>
        </div>
        {/* Anteprima: totale e voci principali */}
        <QuotePreview quoteId={q.id} />
      </div>
    </Card>
  )
}
function StatusPill({ s }: { s: QuoteRow['status'] }){
  const label = s.charAt(0).toUpperCase() + s.slice(1)
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/70 px-2 py-0.5 text-[11px]">
      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor(s) }} />
      <span className="font-medium">{label}</span>
    </span>
  )
}

function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <div className="h-4 w-1/2 bg-gray-200 rounded" />
      <div className="mt-3 h-3 w-2/3 bg-gray-200 rounded" />
      <div className="mt-3 h-3 w-1/4 bg-gray-200 rounded" />
    </Card>
  )
}
