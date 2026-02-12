import { Image, Text, View } from '@react-pdf/renderer'
import xInfissiLogo from '../../assets/images/x-infissi-logo.png'
import type { Customer } from '../QuotePDF.utils'
import { formatISODate, safeText } from '../QuotePDF.utils'
import { s } from '../QuotePDF.styles'
import type { PDFTheme } from '../../config/brand'

type QuoteHeaderSectionProps = {
  companyLogoUrl?: string | null
  brandId?: 'xinfissi' | 'ecosolution' | null
  companyDetails?: string[] | null
  theme?: PDFTheme | null
  customer?: Customer | null
  quoteNumber?: string | null
  issueDate?: string | null
  validityLabel?: string | null
  installTime?: string | null
  shippingIncluded: boolean
  hasWindows: boolean
}

export function QuoteHeaderSection({
  companyLogoUrl,
  brandId,
  companyDetails,
  theme,
  customer,
  quoteNumber,
  issueDate,
  validityLabel,
  installTime,
  shippingIncluded,
  hasWindows,
}: QuoteHeaderSectionProps) {
  const accent = theme?.accent || '#3fb26b'
  const soft = theme?.soft || '#e8f7ec'
  const isEco = brandId === 'ecosolution'

  const details = Array.isArray(companyDetails) && companyDetails.length > 0
    ? companyDetails
    : [
      'X S.R.L.',
      'P.IVA 04062850120',
      'sede legale - Saronno (VA) 21047',
      'Via San Giuseppe, 95',
      'info@xinfissi.it · www.xinfissi.it · +39 345 457 3328',
    ]

  if (isEco) {
    const contacts = details.slice(1).filter(Boolean)
    const contactLineTop = contacts.slice(0, 2).join(' · ')
    const contactLineBottom = contacts.slice(2).join(' · ')

    return (
      <>
        <View style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase' }}>Ecosolutions</Text>
              <Text style={{ fontSize: 10, color: '#111827', marginTop: 2 }}>{details[0] || 'Ecosolutions'}</Text>
              {contactLineTop ? <Text style={{ fontSize: 8.6, color: '#6b7280', marginTop: 1 }}>{contactLineTop}</Text> : null}
              {contactLineBottom ? <Text style={{ fontSize: 8.6, color: '#6b7280' }}>{contactLineBottom}</Text> : null}
            </View>
            {companyLogoUrl && companyLogoUrl.trim() ? (
              <Image src={companyLogoUrl} style={s.logo} />
            ) : (
              <Image src={xInfissiLogo} style={s.logo} />
            )}
          </View>
          <View style={{ height: 1, backgroundColor: accent, marginTop: 6 }} />
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1.2, backgroundColor: '#f8fafc', borderRadius: 10, padding: 9 }}>
            <Text style={[s.label, { color: '#6b7280' }]}>Spettabile</Text>
            <Text>{safeText(customer?.name)}</Text>
            {safeText(customer?.address, '') !== '' ? <Text>{safeText(customer?.address)}</Text> : null}
            {(() => {
              const parts = [
                safeText(customer?.email, ''),
                safeText(customer?.phone, ''),
                customer?.vat && customer.vat.trim() ? `P.IVA ${customer.vat.trim()}` : '',
              ].filter((p) => p && p.trim() !== '')
              return parts.length > 0 ? <Text style={s.small}>{parts.join(' · ')}</Text> : null
            })()}
          </View>

          <View style={{ flex: 0.9, backgroundColor: soft, borderRadius: 10, padding: 9 }}>
            <Text style={{ fontSize: 8, color: '#6b7280', textTransform: 'uppercase' }}>Offerta</Text>
            <Text style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginTop: 2 }}>{safeText(quoteNumber, '-')}</Text>
            <Text style={{ fontSize: 9, color: '#374151', marginTop: 5 }}>Emesso: {formatISODate(issueDate)}</Text>
            <Text style={{ fontSize: 9, color: '#374151', marginTop: 1 }}>Validità: {safeText(validityLabel)}</Text>
            <Text style={{ fontSize: 9, color: '#374151', marginTop: 1 }}>Tempi di produzione: {safeText(installTime)}</Text>
          </View>
        </View>

        {!isEco && hasWindows && (
          <View style={{ marginTop: 8, backgroundColor: '#f9fafb', borderRadius: 9, paddingVertical: 7, paddingHorizontal: 9 }}>
            <View style={[s.row, { marginTop: 0 }]}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={s.label}>Ferramenta</Text>
                <Text wrap={false}>WINKHAUS + HOPPE</Text>
              </View>
              {shippingIncluded && (
                <View style={{ flex: 1, paddingLeft: 8 }}>
                  <Text style={s.label}>Servizi</Text>
                  <Text wrap={false}>Trasporto incluso</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </>
    )
  }

  return (
    <>
      <View style={[s.headerGrid]}>
        <View style={s.colThird}>
          <View style={s.brandCard}>
            {companyLogoUrl && companyLogoUrl.trim() ? (
              <Image src={companyLogoUrl} style={s.logo} />
            ) : (
              <Image src={xInfissiLogo} style={s.logo} />
            )}
            <Text style={s.companyDetails}>
              {details.join('\n')}
            </Text>
          </View>
        </View>

        <View style={s.colThird}>
          <View style={s.clientCard}>
            <Text style={s.h2Tight}>Spettabile</Text>
            <Text>{safeText(customer?.name)}</Text>
            {safeText(customer?.address, '') !== '' ? <Text>{safeText(customer?.address)}</Text> : null}
            {(() => {
              const parts = [
                safeText(customer?.email, ''),
                safeText(customer?.phone, ''),
                customer?.vat && customer.vat.trim() ? `P.IVA ${customer.vat.trim()}` : '',
              ].filter((p) => p && p.trim() !== '')
              return parts.length > 0 ? <Text style={s.small}>{parts.join(' · ')}</Text> : null
            })()}
          </View>
        </View>

        <View style={s.colThird}>
          <View style={[s.stampCard, { borderColor: accent, backgroundColor: soft }] }>
            <Text style={s.stampTitle}>Offerta n° {safeText(quoteNumber, '-')}</Text>
            <Text style={s.metaRow}>
              <Text style={s.metaLabel}>Emesso:</Text> {formatISODate(issueDate)}
            </Text>
            <Text style={s.metaRow}>
              <Text style={s.metaLabel}>Validità:</Text> {safeText(validityLabel)}
            </Text>
            <Text style={s.metaRow}>
              <Text style={s.metaLabel}>Termini completamento:</Text> {safeText(installTime)}
            </Text>
          </View>
        </View>
      </View>

      <View style={s.block}>
        <View style={s.box}>
          {hasWindows && (
            <View style={[s.row, { marginTop: 0 }]}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={s.label}>Ferramenta</Text>
                <Text wrap={false}>WINKHAUS + HOPPE</Text>
              </View>
              {shippingIncluded && (
                <View style={{ flex: 1, paddingLeft: 8 }}>
                  <Text style={s.label}>Servizi</Text>
                  <Text wrap={false}>Trasporto incluso</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </>
  )
}
