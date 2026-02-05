import { Building, User } from 'lucide-react'
import { Card } from '../ui/Card'
import { ProfileOverview } from './ProfileOverview'

type CustomerType = 'privato' | 'azienda'

type QuoteHeaderQuote = {
  customer_type: CustomerType | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  job_address: string | null
  issue_date: string | null
  install_time: string | null
  validity_days: number | null
  vat: '22' | '10' | '4'
  shipping_included?: boolean | null
  notes?: string | null
}

type QuoteHeaderField =
  | 'customer_type'
  | 'customer_name'
  | 'customer_email'
  | 'customer_phone'
  | 'job_address'
  | 'issue_date'
  | 'install_time'
  | 'validity_days'
  | 'shipping_included'

type QuoteHeaderSectionProps = {
  quote: QuoteHeaderQuote
  piva: string
  defaultInstallTime: string
  updateField: (field: QuoteHeaderField, value: any) => void
  onPivaChange: (value: string) => void
  parseNotesMap: (notes?: string | null) => Record<string, string>
  setNoteKey: (key: string, value: string | null) => void
}

export function QuoteHeaderSection({
  quote,
  piva,
  defaultInstallTime,
  updateField,
  onPivaChange,
  parseNotesMap,
  setNoteKey,
}: QuoteHeaderSectionProps) {
  return (
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
                onChange={(e) => onPivaChange(e.target.value)}
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
              placeholder="es. 6-8 settimane"
              value={quote.install_time ?? defaultInstallTime}
              onChange={(e) => updateField('install_time', (e.target.value || defaultInstallTime) as any)}
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
                  const v = e.target.value === '' ? 15 : Math.max(1, parseInt(e.target.value || '15', 10))
                  updateField('validity_days', v as any)
                }}
              />
            </div>

            <div>
              <div className="text-xs text-gray-500">Mostra totale IVA inclusa</div>
              <div className="flex items-center gap-2">
                {(() => {
                  const notesMap = parseNotesMap(quote?.notes)
                  const checked = notesMap['SHOW_TOTAL_INCL'] === 'true'
                  const vatVal = notesMap['VAT_PERCENT'] ?? String(quote.vat ?? '22')
                  return (
                    <>
                      <input
                        id="show_total_incl"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600"
                        checked={checked}
                        onChange={(e) => setNoteKey('SHOW_TOTAL_INCL', e.target.checked ? 'true' : 'false')}
                      />
                      <input
                        type="number"
                        className="input w-24"
                        min={0}
                        max={100}
                        value={vatVal}
                        onChange={(e) => {
                          const v = e.target.value === '' ? null : Math.max(0, Math.min(100, Number(e.target.value)))
                          setNoteKey('VAT_PERCENT', v == null ? null : String(v))
                        }}
                      />
                    </>
                  )
                })()}
              </div>
            </div>
          </div>

          <div className="sm:col-span-2 flex items-center gap-2 pt-1">
            <input
              id="shipping_included"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              checked={quote.shipping_included !== false}
              onChange={(e) => updateField('shipping_included', e.target.checked as any)}
            />
            <label htmlFor="shipping_included" className="text-sm text-gray-600">
              Mostra “Trasporto incluso” nel PDF
            </label>
          </div>
        </div>
      </Card>

      <ProfileOverview />
    </div>
  )
}
