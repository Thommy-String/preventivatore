import { Text, View } from '@react-pdf/renderer'
import type { CategoryTotalInput } from '../QuotePDF.utils'
import { euro, safeText } from '../QuotePDF.utils'
import { buildSurfaceSummary, formatMq } from '../../features/quotes/utils/surfaceSelections'
import { s } from '../QuotePDF.styles'

type SummarySectionProps = {
  totals: ReturnType<(input?: CategoryTotalInput[] | null) => Array<{ category: string; amount: number; pieces: number | null; surfaces?: any }>>
  items: any[]
  mountingCost?: number | null
  hasDiscount: boolean
  originalTotal: number
  discountedTotal: number
  discount?: { mode: 'pct' | 'final'; pct?: number | null } | null
  showTotalIncl?: boolean | null
  vatPercent?: number | null
}

export function SummarySection({
  totals,
  items,
  mountingCost,
  hasDiscount,
  originalTotal,
  discountedTotal,
  discount,
  showTotalIncl,
  vatPercent,
}: SummarySectionProps) {
  return (
    <View style={s.block}>
      <Text style={s.h2}>Riepilogo preventivo</Text>
      <View style={s.table}>
        <View style={s.tr}>
          <Text style={[s.th, { flex: 2 }]}>Categoria</Text>
          <Text style={[s.th, s.right]}>Importo</Text>
        </View>
        {totals.length > 0 ? (
          totals.map((r, i) => {
            const label = safeText(r.category, '-')
            const k = `row-${label}-${Number.isFinite(r.amount) ? r.amount : 0}-${i}`
            const pieces = (r as any).pieces as number | null
            const surfaceRows = buildSurfaceSummary((r as any).surfaces, items as any)
            return (
              <View key={k} style={s.tr}>
                <Text style={[s.td, { flex: 2 }]}> 
                  <Text>{label}</Text>
                  {typeof pieces === 'number' && pieces > 0 ? (
                    <Text style={s.piecesNote}> · {pieces} pezzi </Text>
                  ) : null}
                  {surfaceRows.map((row) => (
                    <Text key={`${k}-${row.id}`} style={s.piecesNote}>
                      {' '}· {formatMq(row.mq)}
                      {row.missingDimensions > 0 ? ` (${row.missingDimensions} senza dimensioni)` : ''}
                    </Text>
                  ))}
                </Text>
                <Text style={[s.td, s.right]}>{euro(r.amount)}</Text>
              </View>
            )
          })
        ) : (
          <View style={s.tr}>
            <Text style={[s.td, { flex: 2, color: '#777' }]}>—</Text>
            <Text style={[s.td, s.right, { color: '#777' }]}>—</Text>
          </View>
        )}
        {typeof mountingCost === 'number' && Number.isFinite(mountingCost) && (
          <View style={s.tr}>
            <Text style={[s.td, { flex: 2 }]}>Montaggio</Text>
            <Text style={[s.td, s.right]}>{euro(mountingCost)}</Text>
          </View>
        )}
        {hasDiscount ? (
          <>
            <View style={[s.tr]}>
              <Text style={[s.td, { flex: 2, fontWeight: 700, backgroundColor: '#f7f7f7' }]}>TOTALE (IVA ESCLUSA)</Text>
              <Text style={[s.td, s.right, { fontWeight: 700, backgroundColor: '#f7f7f7' }]}>{euro(originalTotal)}</Text>
            </View>

            <View style={[s.tr, s.pastelGreen, { borderBottomWidth: 0 }]}> 
              <Text style={[s.td, { flex: 2, fontWeight: 700 }]}> 
                {(
                  discount?.mode === 'pct' &&
                  typeof discount?.pct === 'number' &&
                  discount.pct > 0
                )
                  ? `TOTALE SCONTATO DEL ${discount.pct}% (IVA ESCLUSA)`
                  : 'TOTALE SCONTATO (IVA ESCLUSA)'
                }
              </Text>
              <Text style={[s.td, s.right, { fontWeight: 700 }]}>{euro(discountedTotal)}</Text>
            </View>
          </>
        ) : (
          <View style={[s.tr, { borderBottomWidth: 0 }]}> 
            <Text style={[s.td, { flex: 2, fontWeight: 700, backgroundColor: '#f7f7f7' }]}>TOTALE (IVA ESCLUSA)</Text>
            <Text style={[s.td, s.right, { fontWeight: 700, backgroundColor: '#f7f7f7' }]}>{euro(originalTotal)}</Text>
          </View>
        )}
        {(() => {
          const showIncl = !!showTotalIncl
          const vatPct = typeof vatPercent === 'number' && Number.isFinite(vatPercent) ? vatPercent : 22
          const displayedFinal = hasDiscount ? discountedTotal : originalTotal
          if (!showIncl) return null
          const totalIncl = displayedFinal * (1 + vatPct / 100)
          return (
            <View style={[s.tr, { borderTopWidth: 0 }]}> 
              <Text style={[s.td, { flex: 2, fontWeight: 700 }]}>TOTALE (IVA INCLUSA)</Text>
              <Text style={[s.td, s.right, { fontWeight: 700 }]}>{euro(totalIncl)}</Text>
            </View>
          )
        })()}
      </View>
    </View>
  )
}
