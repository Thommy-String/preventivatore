import { Image, Text, View } from '@react-pdf/renderer'
import { s } from '../QuotePDF.styles'

type ProfileOverviewFeature = {
  eyebrow?: string
  title?: string
  description?: string
}

type ProfileOverviewData = {
  imageUrl: string | null
  features: ProfileOverviewFeature[] | null
}

type ProfileOverviewSectionProps = {
  profileOverview?: ProfileOverviewData | null
}

export function ProfileOverviewSection({ profileOverview }: ProfileOverviewSectionProps) {
  const po = (profileOverview && (profileOverview as any)) || null
  const poFeatures: ProfileOverviewFeature[] = Array.isArray(po?.features) ? po!.features.filter(Boolean) : []

  if (!po?.imageUrl && poFeatures.length === 0) return null

  return (
    <View style={[s.block, s.poBlock, { paddingTop: 2, paddingBottom: 2 }]}>
      <View style={s.poGrid}>
        {poFeatures.map((f, idx) => {
          const isFirst = idx === 0
          return (
            <View key={`pof-${idx}`} style={isFirst ? [s.poCol, s.poFirstCol] : [s.poCol]} wrap={false}>
              {f.eyebrow ? <Text style={s.poEyebrow}>{String(f.eyebrow)}</Text> : null}
              {f.title ? <Text style={[s.poTitle, s.poTitleText]}>{String(f.title)}</Text> : null}
              {isFirst && po?.imageUrl ? (
                <View style={s.poHeroAbsWrap}>
                  <Image src={po.imageUrl} style={s.poHeroAbs} />
                </View>
              ) : null}
              {f.description ? <Text style={s.poDesc}>{String(f.description)}</Text> : null}
              <View style={s.poDivider} />
            </View>
          )
        })}
      </View>
    </View>
  )
}
