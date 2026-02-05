// src/pdf/QuotePDF.tsx
import { Document, Page } from '@react-pdf/renderer'
import type { TermsDocument, TermsProfile } from '../content/terms'
import { TERMS_PROFILES, GLOBAL_PAYMENT_NOTES, SUPPLY_ONLY_PLAN } from '../content/terms'
import { s } from './QuotePDF.styles'
import type { CategoryTotalInput, Customer } from './QuotePDF.utils'
import { normalizeItems, normalizeTotals, safeText } from './QuotePDF.utils'
import { QuoteHeaderSection } from './sections/QuoteHeaderSection'
import { ProfileOverviewSection } from './sections/ProfileOverviewSection'
import { SummarySection } from './sections/SummarySection'
import { ItemsDetailSection } from './sections/ItemsDetailSection'
import { TermsSection } from './sections/TermsSection'

export type QuotePDFProps = {
    companyLogoUrl?: string | null
    quoteNumber?: string | null
    issueDate?: string | null
    installTime?: string | null
    showShippingIncluded?: boolean | null
    totalMq?: number | null
    profileSystem?: string | null
    vatRateLabel?: string | null
    customer?: Customer | null
    catTotals?: CategoryTotalInput[]
    mountingCost?: number | null
    totalExcluded?: number | null
    validityLabel?: string | null
    validityDays?: number | null
    terms?: string | null
    termsStructured?: TermsDocument | null
    items?: any[] | null
    discount?: {
        mode: 'pct' | 'final'
        pct?: number | null
        final?: number | null
        originalTotal: number
        discountedTotal: number
    } | null
    profileOverview?: {
        imageUrl: string | null
        features: { eyebrow?: string; title?: string; description?: string }[] | null
    } | null
    showTotalIncl?: boolean | null
    vatPercent?: number | null
}

export default function QuotePDF(props: QuotePDFProps) {
    const {
        companyLogoUrl,
        quoteNumber,
        issueDate,
        installTime,
        showShippingIncluded,
        customer,
        catTotals,
        mountingCost,
        totalExcluded,
        validityLabel,
        validityDays,
        terms,
        termsStructured,
        items,
        profileOverview,
    } = props || {}

    const itemsSafe = normalizeItems(items)

    const shippingIncluded = showShippingIncluded !== false

    const hasWindows = itemsSafe.some((it: any) => {
        const k = String(it?.kind || '').toLowerCase()
        return k === 'finestra' || k === 'portafinestra' || k === 'scorrevole' || /serrament/i.test(k)
    })

    const totals = normalizeTotals(catTotals)
    const mnt = typeof mountingCost === 'number' && Number.isFinite(mountingCost) ? mountingCost : 0
    const fallbackTotal = totals.reduce((s, r) => s + r.amount, 0) + mnt

    const hasDiscount =
        !!(props?.discount &&
            typeof props.discount.discountedTotal === 'number' &&
            props.discount.discountedTotal >= 0 &&
            props.discount.discountedTotal < (props.discount.originalTotal ?? Infinity))

    const originalTotal = hasDiscount
        ? (props.discount?.originalTotal ?? fallbackTotal)
        : (typeof totalExcluded === 'number' && Number.isFinite(totalExcluded) ? totalExcluded : fallbackTotal)

    const discountedTotal = hasDiscount ? props.discount!.discountedTotal : originalTotal

    const computedValidity =
        (typeof validityDays === 'number' && isFinite(validityDays))
            ? `VALIDITÀ OFFERTA: ${validityDays} giorni`
            : safeText(validityLabel)

    const cleanValidityLabel = (computedValidity && computedValidity !== '—')
        ? computedValidity.replace(/VALIDIT[ÀA][’']?\s*OFFERTA\s*:\s*/i, '').trim()
        : '—'

    const structuredTerms = termsStructured && typeof termsStructured === 'object'
        ? termsStructured
        : null

    const basePaymentProfiles: TermsProfile[] = ['privato', 'azienda']
        .map((id) => TERMS_PROFILES.find((profile) => profile.id === id))
        .filter((profile): profile is TermsProfile => Boolean(profile))

    const paymentPlanColumns = basePaymentProfiles.map((profile) => ({
        id: profile.id,
        label: profile.label,
        tagline: profile.tagline,
        summary: profile.summary,
        steps: profile.paymentPlan,
    }))

    const supplyOnlyPlan = {
        label: SUPPLY_ONLY_PLAN.label,
        tagline: SUPPLY_ONLY_PLAN.tagline ?? SUPPLY_ONLY_PLAN.summary,
        summary: SUPPLY_ONLY_PLAN.summary,
        steps: SUPPLY_ONLY_PLAN.steps,
    }

    const sharedPaymentNotes = (GLOBAL_PAYMENT_NOTES && GLOBAL_PAYMENT_NOTES.length > 0)
        ? GLOBAL_PAYMENT_NOTES
        : []

    const sharedNotesMid = Math.ceil(sharedPaymentNotes.length / 2)
    const sharedNotesLeft = sharedPaymentNotes.slice(0, sharedNotesMid)
    const sharedNotesRight = sharedPaymentNotes.slice(sharedNotesMid)

    return (
        <Document>
            <Page size="A4" style={s.page}>
                <QuoteHeaderSection
                    companyLogoUrl={companyLogoUrl}
                    customer={customer}
                    quoteNumber={quoteNumber}
                    issueDate={issueDate}
                    validityLabel={cleanValidityLabel}
                    installTime={installTime}
                    shippingIncluded={shippingIncluded}
                    hasWindows={hasWindows}
                />

                <ProfileOverviewSection profileOverview={profileOverview} />

                <SummarySection
                    totals={totals}
                    items={itemsSafe}
                    mountingCost={mountingCost}
                    hasDiscount={hasDiscount}
                    originalTotal={originalTotal}
                    discountedTotal={discountedTotal}
                    discount={props.discount ?? null}
                    showTotalIncl={props.showTotalIncl}
                    vatPercent={props.vatPercent}
                />
            </Page>

            <Page size="A4" style={s.page}>
                <ItemsDetailSection companyLogoUrl={companyLogoUrl} items={itemsSafe} />
            </Page>

            <Page size="A4" style={s.page}>
                <TermsSection
                    companyLogoUrl={companyLogoUrl}
                    structuredTerms={structuredTerms}
                    terms={terms}
                    supplyOnlyPlan={supplyOnlyPlan}
                    paymentPlanColumns={paymentPlanColumns}
                    sharedPaymentNotes={sharedPaymentNotes}
                    sharedNotesLeft={sharedNotesLeft}
                    sharedNotesRight={sharedNotesRight}
                />
            </Page>
        </Document>
    )
}

export { QuotePDF }
