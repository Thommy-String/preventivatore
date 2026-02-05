import { type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Copy, FileText } from 'lucide-react'
import { Button } from '../ui/Button'
import { euro } from '../../features/quotes/utils/pricing'

type QuoteStatus = 'bozza' | 'inviato' | 'accettato' | 'rifiutato' | 'scaduto'

type QuoteToolbarQuote = {
  number: string
  customer_name: string | null
  status: QuoteStatus
  created_at: string | null
}

type QuoteToolbarProps = {
  quote: QuoteToolbarQuote
  saving: boolean
  hasDiscount: boolean
  totalExcluded: number
  discountedTotal: number
  discountMode: 'pct' | 'final' | null
  discountPct: number | null
  onBackClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onStatusChange: (status: QuoteStatus) => void
  onOpenPdf: () => void
  onDuplicate: () => void
}

export function QuoteToolbar({
  quote,
  saving,
  hasDiscount,
  totalExcluded,
  discountedTotal,
  discountMode,
  discountPct,
  onBackClick,
  onStatusChange,
  onOpenPdf,
  onDuplicate,
}: QuoteToolbarProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <Link
          to="/"
          onClick={onBackClick}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} /> Indietro
        </Link>
        <h1>
          {quote.number} <span className="text-gray-500 font-normal">· {quote.customer_name ?? '—'}</span>
        </h1>
        <div className="flex items-center gap-2">
          <select
            className="input !py-1 !h-7 w-25 text-sm"
            value={quote.status}
            onChange={(e) => onStatusChange(e.target.value as QuoteStatus)}
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
          <Button className="bg-gray-800 text-white hover:bg-gray-900" onClick={onOpenPdf}>
            <FileText size={16} /> PDF
          </Button>
          <Button variant="outline" onClick={onDuplicate}>
            <Copy size={16} /> Duplica
          </Button>
        </div>
      </div>
    </div>
  )
}
