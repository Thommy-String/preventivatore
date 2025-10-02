import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import QuoteActionsMenu from '../components/QuoteActionsMenu'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import finestraIcon from '../assets/images/finestra.png'
import portaFinestraIcon from '../assets/images/portaFinestra.png'
import cassonettoIcon from '../assets/images/cassonetto.png'
import persianaIcon from '../assets/images/persiana.png'
import tapparellaIcon from '../assets/images/tapparella.png'
import zanzarieraIcon from '../assets/images/zanzariera.png'

// Types
 type QuoteRow = {
  id: string
  number: string
  status: 'bozza'|'inviato'|'accettato'|'rifiutato'|'scaduto'
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
const STATUS_ORDER: QuoteRow['status'][] = ['bozza','inviato','accettato','rifiutato','scaduto']

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
    list.sort((a,b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    const latest = list[0]
    const others = list.slice(1).map(x => x.number).filter(Boolean)
    result.push({ ...latest, groupCount: list.length, siblingsNumbers: others })
  }
  result.push(...noKey)
  result.sort((a,b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
  return result
}

function fmtDate(d: string){
  try {
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '' }
}

function statusColor(s: QuoteRow['status']){
  switch (s) {
    case 'bozza': return '#9ca3af'
    case 'inviato': return '#3b82f6'
    case 'accettato': return '#10b981'
    case 'rifiutato': return '#ef4444'
    case 'scaduto': return '#f59e0b'
  }
}

export default function Home(){
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<QuoteRow[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [filters, setFilters] = useState<Set<QuoteRow['status']>>(new Set())
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  // hotkeys: N = nuovo, / = focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'n') { e.preventDefault(); handleNew() }
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

  async function loadPage(p = 1, reset = false){
    try {
      setLoading(true)
      const from = (p-1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase
        .from('quotes')
        .select('id, number, status, customer_name, job_address, created_at, validity_days, reference, reference_key')
        .order('created_at', { ascending: false })
        .range(from, to)

      if (filters.size > 0) query = query.in('status', Array.from(filters))
      if (debounced) {
        const term = debounced
        const or = `customer_name.ilike.%${term}%,number.ilike.%${term}%,job_address.ilike.%${term}%,reference.ilike.%${term}%`
        query = query.or(or)
      }

      const { data, error } = await query
      if (error) throw error

      const arr = (data ?? []) as QuoteRow[]
      setHasMore(arr.length === PAGE_SIZE)
      setPage(p)
      setItems(prev => {
        const base = reset ? arr : [...prev, ...arr]
        return groupByReferenceLatest(base)
      })
    } catch (e:any) {
      console.error(e)
      toast.error(e.message || 'Errore caricamento preventivi')
    } finally {
      setLoading(false)
    }
  }

  function toggleFilter(s: QuoteRow['status']){
    const next = new Set(filters)
    next.has(s) ? next.delete(s) : next.add(s)
    setFilters(next)
  }

  async function handleNew(){
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
    } catch (e:any) {
      toast.error(e.message || 'Errore creazione preventivo')
    } finally { setLoading(false) }
  }

  const headerCounts = useMemo(() => {
    const map: Record<QuoteRow['status'], number> = { bozza:0, inviato:0, accettato:0, rifiutato:0, scaduto:0 }
    for (const it of items) map[it.status]++
    return map
  }, [items])

  return (
    <div className="space-y-6">
      {/* Header title + CTA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1>Preventivi</h1>
          <div className="mt-1 text-sm text-gray-600">Gestisci e crea preventivi per i tuoi clienti</div>
        </div>
        <Button onClick={handleNew} disabled={loading}>+ Nuovo preventivo</Button>
      </div>

      {/* Sticky toolbar: search + filtri */}
      <div className="sticky top-[52px] z-10 border-b bg-[color:var(--bg)]/90 backdrop-blur">
        <div className="py-3 flex flex-col md:flex-row md:items-center gap-3">
          <div className="md:w-96 relative">
            <Input
              id="dashboard-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per numero, cliente o via…"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 kbd">/</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_ORDER.map(s => (
              <button key={s}
                onClick={() => toggleFilter(s)}
                className={`chip ${filters.has(s) ? 'chip-active' : ''}`}
                title={`${headerCounts[s]} visibili in questa pagina`}
              >{s}</button>
            ))}
            <button onClick={() => setFilters(new Set())} className="chip">Azzera</button>
          </div>
        </div>
      </div>

      {/* Lista */}
      {items.length === 0 && !loading ? (
        <Card className="text-center py-10 text-gray-600">
          Nessun preventivo trovato.
          <div className="mt-3">
            <Button onClick={handleNew}>Crea il primo preventivo</Button>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map(q => (
            <CardQuote
              key={q.id}
              q={q}
              onOpen={() => nav(`/quotes/${q.id}`)}
              onDuplicate={() => toast.info('Duplica: in arrivo')}
              onPdf={() => toast.info('PDF: in arrivo')}
              onDelete={() => toast.info('Elimina: in arrivo')}
              onFilterByReference={(ref) => setSearch(ref)}
            />
          ))}
          {loading && Array.from({length:4}).map((_,i) => <SkeletonCard key={`s-${i}`}/>) }
        </div>
      )}

      {/* Sentinel per auto-load */}
      {hasMore && <div ref={sentinelRef} className="h-8" />}
    </div>
  )
}

function daysLeft(created_at: string | null, validity_days: number){
  if(!created_at) return null
  const created = new Date(created_at)
  const expires = new Date(created)
  expires.setDate(created.getDate() + (validity_days || 0))
  const ms = expires.getTime() - Date.now()
  const d = Math.ceil(ms / (1000*60*60*24))
  return d
}

function BadgeStatus({ s }: { s: QuoteRow['status'] }){
  const cls = `badge badge-${s}`
  const label = s.charAt(0).toUpperCase() + s.slice(1)
  return <Badge className={cls}>{label}</Badge>
}

function CardQuote({
  q, onOpen, onDuplicate, onPdf, onDelete, onFilterByReference
}: {
  q: QuoteRow
  onOpen: () => void
  onDuplicate: () => void
  onPdf: () => void
  onDelete: () => void
  onFilterByReference: (reference: string) => void
}){
  const left = daysLeft(q.created_at, q.validity_days)
  const accentClass = `card-accent card-accent--${q.status}`
  const expiryBadgeClass = left == null ? 'badge-soft' : left < 0 ? 'badge-soft-danger' : left <= 3 ? 'badge-soft-warn' : 'badge-soft'

  return (
    <Card className={`group ${accentClass} transition-transform will-change-transform hover:-translate-y-px`}>
      <div className="flex items-start justify-between gap-3">
        <div className="cursor-pointer" onClick={onOpen}>
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
          {/* Meta: stato, data, scadenza e badge gruppo */}
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
            <span className="inline-flex items-center gap-1">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor(q.status) }} />
              <BadgeStatus s={q.status} />
            </span>
            <span className={expiryBadgeClass}>
              {left == null ? '—' : left < 0 ? `Scaduto da ${Math.abs(left)}g` : `Scade tra ${left}g`}
            </span>
            {q.groupCount && q.groupCount > 1 && (q.reference || q.job_address) && (
              <button
                className="badge-soft"
                title={q.siblingsNumbers && q.siblingsNumbers.length ? `Altri: ${q.siblingsNumbers.join(', ')}` : 'Mostra tutti i preventivi con questo riferimento'}
                onClick={(e) => { e.stopPropagation(); onFilterByReference((q.reference ?? q.job_address)!) }}
              >
                Altre {q.groupCount - 1}
              </button>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <QuoteActionsMenu
            onOpen={onOpen}
            onDuplicate={onDuplicate}
            onPdf={onPdf}
            onDelete={onDelete}
          />
        </div>
      </div>
      {/* Anteprima: totale e voci principali (placeholder per futura implementazione) */}
      <div className="mt-3 border-t pt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="truncate">Totale preventivo: <span className="font-mono">—</span></div>
        <div className="truncate ml-4 flex items-center gap-1">
          <img src={finestraIcon} alt="Finestra" className="w-[34px] h-[34px] object-contain" />
          <img src={portaFinestraIcon} alt="Porta finestra" className="w-[34px] h-[34px] object-contain" />
          <img src={cassonettoIcon} alt="Cassonetto" className="w-[34px] h-[34px] object-contain" />
        </div>
      </div>
    </Card>
  )
}

function SkeletonCard(){
  return (
    <Card className="animate-pulse">
      <div className="h-4 w-1/2 bg-gray-200 rounded" />
      <div className="mt-3 h-3 w-2/3 bg-gray-200 rounded" />
      <div className="mt-3 h-3 w-1/4 bg-gray-200 rounded" />
    </Card>
  )
}