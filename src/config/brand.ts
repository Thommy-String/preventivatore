import type { TermsProfileId } from '../content/terms'
import xInfissiLogo from '../assets/images/x-infissi-logo.png'
import ecoSolutionsLogo from '../assets/images/eco-solutions-logo.jpeg'

export type PDFTheme = {
  accent: string
  soft: string
}

export type BrandProfile = {
  id: 'xinfissi' | 'ecosolution'
  label: string
  defaultTermsProfileId: TermsProfileId
  logoAsset: string
  companyDetails: string[]
  pdfTheme: PDFTheme
}

const XINFISSI_PROFILE: BrandProfile = {
  id: 'xinfissi',
  label: 'X Infissi',
  defaultTermsProfileId: 'privato',
  logoAsset: xInfissiLogo,
  companyDetails: [
    'X S.R.L.',
    'P.IVA 04062850120',
    'sede legale - Saronno (VA) 21047',
    'Via San Giuseppe, 95',
    'info@xinfissi.it · www.xinfissi.it · +39 345 457 3328',
  ],
  pdfTheme: {
    accent: '#3fb26b',
    soft: '#e8f7ec',
  },
}

const ECOSOLUTION_PROFILE: BrandProfile = {
  id: 'ecosolution',
  label: 'Ecosolution',
  defaultTermsProfileId: 'privato',
  logoAsset: ecoSolutionsLogo,
  companyDetails: [
    'Ecosolution',
    '04640600161',
    'Via Roma 8 - Lentate sul Seveso 20823 (MB)',
    'Indirizzo',
    'info@ecosolutionsas.it · www.ecosolutionsas.it · +39 377 576 3662',
  ],
  pdfTheme: {
    accent: '#3fb26b',
    soft: '#e8f7ec',
  },
}

const BRAND_PROFILES: Record<BrandProfile['id'], BrandProfile> = {
  xinfissi: XINFISSI_PROFILE,
  ecosolution: ECOSOLUTION_PROFILE,
}

export function getActiveBrandProfile(): BrandProfile {
  const raw = String(import.meta.env.VITE_BRAND_PROFILE || 'xinfissi').trim().toLowerCase()
  if (raw === 'ecosolution' || raw === 'eco_solutions' || raw === 'eco-solution') {
    return BRAND_PROFILES.ecosolution
  }
  return BRAND_PROFILES.xinfissi
}
