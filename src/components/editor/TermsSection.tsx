import { type ComponentType } from 'react'
import { Copy } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { TermsDocument, TermsProfile } from '../../content/terms'

type TermsStep = { label: string; description: string }

type SupplyOnlyColumn = {
  icon: ComponentType<{ size?: number }>
  label: string
  tagline: string
  summary: string
  steps: TermsStep[]
}

type InstallColumn = {
  id: string
  icon: ComponentType<{ size?: number }>
  label: string
  tagline: string
  summary: string
  steps: TermsStep[]
}

type TermsSectionProps = {
  termsDoc: TermsDocument
  supplyOnlyColumn: SupplyOnlyColumn
  installColumns: InstallColumn[]
  paymentNotes: string[]
  defaultTermsProfile: TermsProfile
  onCopyTerms: () => void
}

export function TermsSection({
  termsDoc,
  supplyOnlyColumn,
  installColumns,
  paymentNotes,
  defaultTermsProfile,
  onCopyTerms,
}: TermsSectionProps) {
  const SupplyIcon = supplyOnlyColumn.icon

  return (
    <Card>
      <div className="space-y-1">
        <h2>Termini &amp; Condizioni</h2>
        <p className="text-sm text-gray-600">
          Due colonne parallele mettono subito a confronto formule per privati e aziende; tutte le versioni vengono
          incluse nel PDF insieme alle note generali e alla privacy aggiornata.
        </p>
      </div>

      <div className="mt-6 space-y-6">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Validità offerta</p>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">{termsDoc.validityLabel}</div>
          <p className="mt-3 text-sm text-gray-600">
            Questo quadro riassume formule economiche, note operative e privacy che si applicano a ogni preventivo,
            indipendentemente dalla tipologia di cliente o dalla presenza di posa.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start gap-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-700">
              <SupplyIcon size={20} />
            </span>
            <div className="flex-1 min-w-[220px] space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-500">{supplyOnlyColumn.label}</p>
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="text-xl font-semibold tracking-tight text-gray-900">{supplyOnlyColumn.tagline}</p>
                <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] uppercase tracking-wide text-gray-600">
                  Solo fornitura
                </span>
              </div>
              <p className="text-sm text-gray-600">{supplyOnlyColumn.summary}</p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>{termsDoc.validityLabel}</p>
              <p>Adatta anche a ritiro materiale</p>
            </div>
          </div>
          <ol className="mt-5 grid gap-3 md:grid-cols-2">
            {supplyOnlyColumn.steps.map((step, idx) => (
              <li key={`supply-${step.label}`} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Step {idx + 1}</div>
                <div className="mt-2 text-base font-semibold text-gray-900">{step.label}</div>
                <p className="mt-1 text-sm text-gray-600">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {installColumns.map((column) => {
            const Icon = column.icon
            return (
              <div key={column.id} className="rounded-2xl border bg-white p-5 shadow-sm flex flex-col">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-900/5 text-gray-900">
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">{column.label}</p>
                      <p className="text-lg font-semibold text-gray-900">{column.tagline}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-gray-400">{column.steps.length} step</span>
                </div>
                <p className="mt-3 text-sm text-gray-600">{column.summary}</p>
                <ol className="mt-4 space-y-4 border-l border-gray-200 pl-4">
                  {column.steps.map((step, idx) => (
                    <li key={`${column.id}-${step.label}`} className="space-y-1">
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Step {idx + 1}</div>
                      <div className="text-base font-semibold text-gray-900">{step.label}</div>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )
          })}
        </div>

        {paymentNotes.length > 0 && (
          <div className="rounded-2xl border bg-gray-50 p-5 shadow-sm">
            <div className="text-xs uppercase tracking-widest text-gray-500">Regole generali sui pagamenti</div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
              {paymentNotes.map((note, idx) => (
                <li key={`global-note-${idx}`}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-2xl border border-dashed bg-gray-50 p-5">
          <div className="text-xs uppercase tracking-widest text-gray-500">Note del cliente</div>
          <p className="mt-2 text-sm text-gray-600">{defaultTermsProfile.notesIntro}</p>
          <div className="mt-4 space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={`note-line-${idx}`} className="h-10 border-b border-dashed border-gray-300" />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {defaultTermsProfile.sections.map((section) => (
            <div key={section.title} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="text-xs uppercase tracking-widest text-gray-500">{section.title}</div>
              {section.body.map((paragraph, idx) => (
                <p key={`${section.title}-${idx}`} className="mt-3 text-sm leading-relaxed text-gray-700">
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
          <div className="text-xs uppercase tracking-widest text-gray-700">{defaultTermsProfile.privacy.title}</div>
          {defaultTermsProfile.privacy.body.map((paragraph, idx) => (
            <p key={`privacy-${idx}`} className="mt-3 text-sm leading-relaxed text-gray-800">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-sm text-gray-600">
          <span>Il testo sopra viene salvato nel preventivo e mostrato nella pagina delle condizioni.</span>
          <Button variant="outline" onClick={onCopyTerms} className="flex items-center gap-2 text-sm">
            <Copy size={14} /> Copia testo completo
          </Button>
        </div>
      </div>
    </Card>
  )
}