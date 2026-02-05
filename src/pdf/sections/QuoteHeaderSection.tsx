import { Image, Text, View } from '@react-pdf/renderer'
import xInfissiLogo from '../../assets/images/x-infissi-logo.png'
import type { Customer } from '../QuotePDF.utils'
import { formatISODate, safeText } from '../QuotePDF.utils'
import { s } from '../QuotePDF.styles'

type QuoteHeaderSectionProps = {
  companyLogoUrl?: string | null
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
  customer,
  quoteNumber,
  issueDate,
  validityLabel,
  installTime,
  shippingIncluded,
  hasWindows,
}: QuoteHeaderSectionProps) {
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
              X S.R.L.{"\n"}
              P.IVA 04062850120{"\n"}
              sede legale - Saronno (VA) 21047{"\n"}
              Via San Giuseppe, 95{"\n"}
              info@xinfissi.it · www.xinfissi.it · +39 345 457 3328
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
          <View style={s.stampCard}>
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
        <View style={[s.box]}>
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
