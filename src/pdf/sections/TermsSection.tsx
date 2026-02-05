import { Image, Path, Svg, Text, View } from '@react-pdf/renderer'
import xInfissiLogo from '../../assets/images/x-infissi-logo.png'
import { s } from '../QuotePDF.styles'
import { safeText } from '../QuotePDF.utils'
import type { TermsDocument } from '../../content/terms'

type SupplyOnlyPlan = {
  label: string
  tagline?: string | null
  summary: string
  steps: { label: string; description: string }[]
}

type TermsColumn = {
  id: string
  label: string
  tagline?: string | null
  summary?: string | null
  steps: { label: string; description: string }[]
}

type TermsSectionProps = {
  companyLogoUrl?: string | null
  structuredTerms: TermsDocument | null
  terms?: string | null
  supplyOnlyPlan: SupplyOnlyPlan
  paymentPlanColumns: TermsColumn[]
  sharedPaymentNotes: string[]
  sharedNotesLeft: string[]
  sharedNotesRight: string[]
}

const UserIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24">
    <Path
      d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"
      fill="#475467"
    />
  </Svg>
)

const BuildingIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24">
    <Path
      d="M4 20V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6h4v10h-6v-3h-4v3H4zm4-12h2v2H8V8zm0 4h2v2H8v-2zm4-4h2v2h-2V8zm0 4h2v2h-2v-2z"
      fill="#475467"
    />
  </Svg>
)

export function TermsSection({
  companyLogoUrl,
  structuredTerms,
  terms,
  supplyOnlyPlan,
  paymentPlanColumns,
  sharedPaymentNotes,
  sharedNotesLeft,
  sharedNotesRight,
}: TermsSectionProps) {
  return (
    <>
      {companyLogoUrl && companyLogoUrl.trim() ? (
        <Image src={companyLogoUrl} style={s.logo} />
      ) : (
        <Image src={xInfissiLogo} style={s.logo} />
      )}

      <Text style={[s.h2, { marginTop: 6 }]}>Condizioni di Fornitura</Text>
      <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 10 }} />
      {structuredTerms ? (
        <>
          <View style={s.termsPaymentSection}>
            <Text style={s.termsPaymentHeader}>Metodi di pagamento</Text>
            <View style={s.termsSupplyCard} wrap={false}>
              <Text style={s.termsSupplyTitle}>Solo fornitura (senza posa)</Text>
              <Text style={s.termsSupplySummary}>{supplyOnlyPlan.summary}</Text>
              <View style={s.termsSupplySteps}>
                {(supplyOnlyPlan.steps || []).map((step, idx) => (
                  <View key={`supply-step-${idx}`} style={s.termsSupplyStepCol}>
                    <View style={s.termsPlanStepRow}>
                      <View style={s.termsPlanStepCircle}>
                        <Text style={s.termsPlanStepCircleText}>{String(idx + 1)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.termsPlanStepLabel}>{step.label}</Text>
                        <Text style={s.termsPlanStepDesc}>{step.description}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <Text style={s.termsPaymentGroupLabel}>Fornitura e posa</Text>
            <View style={s.termsPaymentRow}>
              {paymentPlanColumns.map((column) => (
                <View key={`terms-plan-${column.id}`} style={s.termsPlanCard} wrap={false}>
                  <View style={s.termsPlanHeaderRow}>
                    <View style={s.termsIconWrap}>
                      {column.id === 'azienda' ? <BuildingIcon /> : <UserIcon />}
                    </View>
                    <Text style={s.termsPlanTitleInline}>
                      {column.id === 'azienda' ? 'Aziende' : 'Privati'}
                    </Text>
                  </View>
                  {column.summary ? <Text style={s.termsParagraph}>{column.summary}</Text> : null}
                  {(column.steps || []).map((step, stepIdx) => (
                    <View key={`terms-plan-${column.id}-${stepIdx}`} style={s.termsPlanStep}>
                      <View style={s.termsPlanStepRow}>
                        <View style={s.termsPlanStepCircle}>
                          <Text style={s.termsPlanStepCircleText}>{String(stepIdx + 1)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.termsPlanStepLabel}>{step.label}</Text>
                          <Text style={s.termsPlanStepDesc}>{step.description}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>

          {sharedPaymentNotes.length > 0 && (
            <View style={s.termsSharedCard} wrap={false}>
              <Text style={s.termsSharedTitle}>Regole generali sui pagamenti</Text>
              <View style={s.termsSharedGrid}>
                <View style={s.termsSharedCol}>
                  {sharedNotesLeft.map((note, idx) => (
                    <View key={`shared-note-left-${idx}`} style={s.termsNoteRow}>
                      <View style={s.termsNoteBullet} />
                      <Text style={s.termsNoteText}>{note}</Text>
                    </View>
                  ))}
                </View>
                <View style={s.termsSharedCol}>
                  {sharedNotesRight.map((note, idx) => (
                    <View key={`shared-note-right-${idx}`} style={s.termsNoteRow}>
                      <View style={s.termsNoteBullet} />
                      <Text style={s.termsNoteText}>{note}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {(structuredTerms.sections || []).map((section, idx) => (
            <View key={`section-${idx}`} style={s.termsSectionBlock} wrap={false}>
              <Text style={s.termsSectionTitle}>{section.title}</Text>
              {(section.body || []).map((paragraph, pIdx) => (
                <Text key={`section-${idx}-p-${pIdx}`} style={s.termsParagraph}>
                  {paragraph}
                </Text>
              ))}
            </View>
          ))}

          <View style={s.termsPrivacyCard} wrap={false}>
            <Text style={s.termsPrivacyTitle}>{structuredTerms.privacy.title}</Text>
            {(structuredTerms.privacy.body || []).map((paragraph, idx) => (
              <Text key={`privacy-${idx}`} style={s.termsPrivacyParagraph}>
                {paragraph}
              </Text>
            ))}
          </View>
        </>
      ) : (
        <Text>{safeText(terms)}</Text>
      )}

      <View style={{ marginTop: 22 }}>
        <Text>Letto e confermato in ______________________ in data _____________________</Text>
        <View style={{ height: 28 }} />
        <View style={s.row}>
          <View style={[s.col]}>
            <Text>Cliente</Text>
            <View
              style={{
                height: 40,
                borderBottomWidth: 1,
                borderStyle: 'solid',
                borderColor: '#e6e6e6',
                marginRight: 18,
              }}
            />
          </View>
          <View style={[s.col]}>
            <Text>Fornitore</Text>
            <View
              style={{
                height: 40,
                borderBottomWidth: 1,
                borderStyle: 'solid',
                borderColor: '#e6e6e6',
                marginRight: 18,
              }}
            />
          </View>
        </View>
      </View>
    </>
  )
}
