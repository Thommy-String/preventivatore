import { Image, Text, View } from '@react-pdf/renderer'
import { s } from '../QuotePDF.styles'
import { describeItem, detailPairs, imageFor } from '../QuotePDF.utils'
import xInfissiLogo from '../../assets/images/x-infissi-logo.png'

type ItemsDetailSectionProps = {
  companyLogoUrl?: string | null
  items: any[]
}

export function ItemsDetailSection({ companyLogoUrl, items }: ItemsDetailSectionProps) {
  return (
    <>
      {companyLogoUrl && companyLogoUrl.trim() ? (
        <Image src={companyLogoUrl} style={s.logo} />
      ) : (
        <Image src={xInfissiLogo} style={s.logo} />
      )}
      <View style={s.block}>
        <Text style={s.h2}>Dettaglio voci</Text>
        {items.length > 0 ? (
          items.map((it: any, i: number) => {
            const isCustom = it?.kind === 'custom'
            const shouldBreak = i > 0 && i % 2 === 0

            const basePairs: Array<[string, string]> = isCustom ? [] : detailPairs(it)

            const extraPairs: Array<[string, string]> = Array.isArray(it?.custom_fields)
              ? it.custom_fields
                  .filter((f: any) => {
                    const key = f?.name ?? f?.label ?? f?.key
                    const val = f?.value
                    return key && String(key).trim() && val != null && String(val).trim()
                  })
                  .map((f: any) => [
                    String(f?.name ?? f?.label ?? f?.key).trim(),
                    String(f?.value).trim(),
                  ] as [string, string])
              : []

            const pairs: Array<[string, string]> = isCustom ? extraPairs : [...basePairs, ...extraPairs]

            const title = (() => {
              if (it?.title && it.title.trim()) return it.title.trim()
              const base = String(it?.kind || 'Voce').trim()
              return base.charAt(0).toUpperCase() + base.slice(1)
            })()
            const qty = `Q.tà ${Number.isFinite(Number(it?.qty)) ? String(it.qty) : '1'}`

            const description = describeItem(it)

            const pairCount = pairs.length
            const kindSlug = String(it?.kind || '').toLowerCase()
            const minPhotoHeight = 260
            const minH = Math.max(minPhotoHeight, 80 + Math.min(40, pairCount * 7))
            const photoWrapStyle = s.itemPhotoWrap

            const reference = typeof it?.reference === 'string' && it.reference.trim()
              ? it.reference.trim()
              : (typeof it?.riferimento === 'string' && it.riferimento.trim() ? it.riferimento.trim() : '')

            return (
              <View
                wrap={false}
                break={shouldBreak}
                key={`card-${it?.id || it?.kind || 'k'}-${i}`}
                style={[s.itemCard, { minHeight: minH }]}
              >
                <View style={photoWrapStyle}>
                  {(() => {
                    const raw = typeof it?.image_url === 'string' ? it.image_url : ''
                    const imgSrc = raw && !raw.startsWith('blob:') ? raw : imageFor(it?.kind)
                    return <Image src={imgSrc} style={s.photo} />
                  })()}

                  {(() => {
                    const widthText = (it?.width_mm ?? it?.larghezza_mm ?? it?.larghezza)
                      ? String(it?.width_mm ?? it?.larghezza_mm ?? it?.larghezza)
                      : '—'
                    const heightText = (it?.height_mm ?? it?.altezza_mm ?? it?.altezza)
                      ? String(it?.height_mm ?? it?.altezza_mm ?? it?.altezza)
                      : '—'

                    const isProportional = kindSlug === 'finestra' || kindSlug === 'cassonetto'

                    if (!isProportional) {
                      const widthOffsetBottom = (() => {
                        switch (kindSlug) {
                          case 'persiana':
                          case 'tapparella':
                          case 'zanzariera':
                          case 'custom':
                            return -6
                          default:
                            return -18
                        }
                      })()

                      const heightLeftOffset = (() => {
                        switch (kindSlug) {
                          case 'persiana':
                          case 'tapparella':
                          case 'zanzariera':
                          case 'custom':
                            return 6
                          default:
                            return 6
                        }
                      })()

                      return (
                        <>
                          <Text style={[s.dimW, { bottom: widthOffsetBottom }]}>{widthText}</Text>
                          <View style={[s.dimHWrap, { left: heightLeftOffset }]}>
                            <Text style={s.dimH}>{heightText}</Text>
                          </View>
                        </>
                      )
                    }

                    if (kindSlug === 'cassonetto') {
                      const WRAP_W = 170
                      const WRAP_H = 170
                      const PAD = 6
                      const INNER_W = WRAP_W - PAD * 2
                      const INNER_H = WRAP_H - PAD * 2

                      const w = Number(it?.width_mm ?? it?.larghezza_mm ?? it?.larghezza)
                      const h = Number(it?.height_mm ?? it?.altezza_mm ?? it?.altezza)
                      const hasDims = Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0

                      const widthLabel = Number.isFinite(w) ? String(Math.round(w)) : '—'
                      const heightLabel = Number.isFinite(h) ? String(Math.round(h)) : '—'
                      let widthLabelTop: number | undefined

                      if (hasDims) {
                        const ar = w / h
                        const arBox = INNER_W / INNER_H
                        let imgH = INNER_H
                        if (ar >= arBox) {
                          imgH = INNER_W / ar
                        }
                        const marginY = Math.max(0, (INNER_H - imgH) / 2)
                        const GAP = 32
                        widthLabelTop = PAD + marginY + imgH + GAP
                      }

                      const centerY = PAD + INNER_H / 2
                      const heightLabelY = centerY + 18

                      return (
                        <>
                          <Text
                            style={{
                              position: 'absolute',
                              ...(widthLabelTop !== undefined ? { top: widthLabelTop } : { bottom: -4 }),
                              left: 0,
                              right: 0,
                              textAlign: 'center',
                              fontSize: 12,
                              color: '#333',
                            }}
                          >
                            {widthLabel}
                          </Text>
                          <View
                            style={{
                              position: 'absolute',
                              left: -10,
                              top: heightLabelY,
                              transform: 'rotate(-90deg)',
                            }}
                          >
                            <Text style={{ fontSize: 12, color: '#333' }}>{heightLabel}</Text>
                          </View>
                        </>
                      )
                    }

                    return null
                  })()}
                </View>

                <View style={s.itemContent}>
                  <View style={s.itemHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                      <Text style={s.itemKind}>{title}</Text>
                      {(() => {
                        const dims = description
                        return dims ? <Text style={s.itemDims}>· {dims}</Text> : null
                      })()}
                    </View>
                    <Text style={s.itemQty}>{qty}</Text>
                  </View>
                  {reference ? <Text style={s.itemRef}>{reference}</Text> : null}
                  {pairs.length > 0 && <View style={s.hr} />}
                  <View style={s.detailGrid}>
                    {pairs.map(([k, v], idx) => (
                      <View key={`kv-${idx}`} style={s.detailRow}>
                        <Text style={s.detailLabel}>{k}</Text>
                        <Text style={s.detailValue}>{v}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )
          })
        ) : (
          <View style={[s.itemCard, { justifyContent: 'center' }]}>
            <Text style={{ color: '#666' }}>— Nessuna voce inserita —</Text>
          </View>
        )}
      </View>
    </>
  )
}
