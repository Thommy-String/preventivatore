import React from 'react'
import {
  Document,
  Font,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  renderToFile,
} from '@react-pdf/renderer'
import fs from 'node:fs/promises'
import path from 'node:path'


const h = React.createElement

const BASE_FONT = 'Arial'
Font.register({
  family: BASE_FONT,
  fonts: [
    { src: 'C:/Windows/Fonts/arial.ttf', fontWeight: 'normal' },
    { src: 'C:/Windows/Fonts/arialbd.ttf', fontWeight: 'bold' },
  ],
})

const THEME = {
  ink: '#121317',
  muted: '#4F5561',
  strong: '#0C0D11',
  deepRed: '#821414',
  border: '#181A20',
  line: '#B9BEC8',
  accentGreen: '#2F9E64',
  accentGreenSoft: '#F2FAF6',
}

const DATA = {
  offerNumber: 'OFFERTA № OFR/0725-',
  company: {
    name: 'Barda S.R.L.',
    vat: 'P.IVA 13786090962',
    legalAddress: 'Sede Legale: Monza (MB) 20900 via Santuario delle grazie vecchie\u00A017',
    email: 'Mail - info@bardasrl.it',
    web: 'https://bardasrl.it',
    phone: '+393515354507',
  },
  customer: {
    reference: 'Rif Nello',
    address: '',
    phone: '',
  },
  issueDate: '18.02.2026',
  leadTime: '5-7 settimane',
  profileSystem: 'WDS 76 MD',
  hardware: 'WINKHAUS + HOPPE',
  baseProfileImageRel: 'src/assets/images/profiles/wds-76-md.jpg',
  metrics: [
    { label: 'Mq', value: '20,990 mq' },
    { label: 'Perimetro', value: '52,600 m' },
    { label: 'Peso', value: '806,147 kg' },
    { label: 'Quantita', value: '8' },
  ],
  rows: [
    { label: 'Finestre, Portafinestre, Scorrevole', price: '6 200 euro' },
    { label: 'Coprifili', price: '230 euro' },
    { label: 'Montaggio', price: '1 150 euro' },
    { label: 'Montaggio scorrevole', price: '500 euro' },
  ],
  totalLabel: 'TOTALE ( IVA esclusa )',
  totalValue: '8 080 euro',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingHorizontal: 34,
    paddingBottom: 20,
    fontFamily: BASE_FONT,
    color: THEME.ink,
    backgroundColor: '#FFFFFF',
  },
  topHalf: {
    minHeight: 398.5,
    maxHeight: 398.5,
    paddingTop: 6,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  bottomHalfSpacer: {
    height: 398.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 13,
  },
  logoWrap: {
    width: 142,
    height: 54,
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'left center',
  },
  logoPlaceholder: {
    fontSize: 8,
    color: THEME.muted,
    textTransform: 'uppercase',
  },
  companyTopRight: {
    width: 335,
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  companyTopLine: {
    fontSize: 7.8,
    color: THEME.muted,
    lineHeight: 1.2,
    textAlign: 'right',
    marginBottom: 1,
  },
  companyTopLineTight: {
    fontSize: 7.2,
    letterSpacing: -0.1,
  },
  offerBand: {
    marginTop: -2,
    marginBottom: 12,
  },
  offerTitle: {
    fontSize: 11.6,
    textAlign: 'center',
    fontFamily: BASE_FONT,
    fontWeight: 'bold',
    letterSpacing: 0,
    color: THEME.strong,
  },
  offerLine: {
    marginTop: 1,
    borderBottomWidth: 1.4,
    borderBottomColor: THEME.border,
    marginHorizontal: 136,
  },
  mainGrid: {
    flexDirection: 'row',
    marginTop: 0,
  },
  leftCol: {
    width: '48%',
    paddingRight: 20,
  },
  rightCol: {
    width: '52%',
    paddingLeft: 8,
  },
  systemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  systemText: {
    paddingRight: 4,
  },
  systemLabel: {
    fontSize: 8.7,
    fontFamily: BASE_FONT,
    fontWeight: 'bold',
    color: THEME.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  systemValue: {
    fontSize: 12,
    fontFamily: BASE_FONT,
    fontWeight: 'bold',
    color: THEME.ink,
  },
  profileWrap: {
    width: 62,
    height: 62,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  profileImage: {
    width: 58,
    height: 58,
    objectFit: 'contain',
  },
  profilePlaceholder: {
    fontSize: 6,
    color: THEME.muted,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 8.8,
    fontFamily: BASE_FONT,
    fontWeight: 'bold',
    color: THEME.strong,
    marginBottom: 4,
  },
  headlineValue: {
    fontSize: 10,
    fontFamily: BASE_FONT,
    fontWeight: 'bold',
    color: THEME.ink,
  },
  statsBox: {
    marginTop: 0,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 10,
    color: THEME.muted,
  },
  statValue: {
    fontSize: 10.6,
    color: THEME.ink,
    fontFamily: BASE_FONT,
    fontWeight: 'bold',
  },
  contactRows: {
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  contactLabel: {
    width: 45,
    fontSize: 8.3,
    color: THEME.ink,
    marginRight: 3,
  },
  contactValue: {
    flex: 1,
    fontSize: 10.9,
    color: THEME.ink,
    borderBottomWidth: 0.6,
    borderBottomColor: '#BFC5CF',
    minHeight: 12,
    fontFamily: BASE_FONT,
    fontWeight: 'bold',
  },
  datesInline: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 0.6,
    borderColor: '#E2E7EF',
    borderStyle: 'dashed',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  leftDatesInline: {
    marginBottom: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 0.6,
    borderColor: '#E2E7EF',
    borderStyle: 'dashed',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  dateSingleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 3,
  },
  dateRows: {
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 0,
  },
  dateLabel: {
    fontSize: 7.5,
    color: THEME.muted,
    width: 142,
  },
  leftDateLabel: {
    fontSize: 8,
    color: THEME.muted,
    width: 112,
  },
  dateValue: {
    fontSize: 8.8,
    color: THEME.ink,
    fontFamily: BASE_FONT,
  },
  leftDateValue: {
    fontSize: 9.3,
    color: THEME.ink,
    fontFamily: BASE_FONT,
  },
  hardwareChip: {
    marginTop: 4,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 2,
    borderLeftColor: THEME.accentGreen,
    backgroundColor: '#F8F9FB',
    borderRadius: 6,
    borderTopWidth: 0.4,
    borderTopColor: '#E3F2E9',
    borderRightWidth: 0.4,
    borderRightColor: '#E3F2E9',
    borderBottomWidth: 0.4,
    borderBottomColor: '#E3F2E9',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  hardwareLabel: {
    fontSize: 8.7,
    color: THEME.ink,
    fontFamily: BASE_FONT,
    fontWeight: 'bold',
    marginRight: 8,
  },
  hardwareValue: {
    fontSize: 11,
    color: THEME.ink,
    fontFamily: BASE_FONT,
    fontWeight: 'bold',
  },
  pricesBox: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  pricesSection: {
    marginTop: 13,
  },
  pricesSectionLine: {
    borderBottomWidth: 0.6,
    borderBottomColor: '#D5DBE4',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priceLabel: {
    width: '68%',
    fontSize: 10.9,
    color: THEME.deepRed,
    fontFamily: BASE_FONT,
    fontWeight: 'bold',
  },
  priceValue: {
    width: '32%',
    textAlign: 'right',
    fontSize: 10.9,
    color: THEME.deepRed,
    fontFamily: BASE_FONT,
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    marginTop: 8,
  },
  totalLabel: {
    width: '68%',
    fontSize: 13.2,
    fontFamily: BASE_FONT,
    fontWeight: 'bold',
    color: THEME.deepRed,
  },
  totalValue: {
    width: '32%',
    textAlign: 'right',
    fontSize: 13.2,
    fontFamily: BASE_FONT,
    fontWeight: 'bold',
    color: THEME.deepRed,
  },
  pageWideDivider: {
    marginTop: 16,
    width: '96%',
    alignSelf: 'center',
    borderBottomWidth: 1.3,
    borderBottomColor: '#111111',
  },
})

function sanitizePdfText(value) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/"?__needsUpload"?\s*:?\s*true,?/gi, '')
    .replace(/__needsUpload\s*:?\s*true/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function Header({ logoSrc }) {
  return h(
    View,
    { style: styles.header },
    h(
      View,
      { style: styles.logoWrap },
      logoSrc
        ? h(Image, { src: logoSrc, style: styles.logo })
        : h(Text, { style: styles.logoPlaceholder }, 'Barda logo')
    ),
    h(
      View,
      { style: styles.companyTopRight },
      h(Text, { style: styles.companyTopLine }, sanitizePdfText(DATA.company.name)),
      h(Text, { style: styles.companyTopLine }, sanitizePdfText(DATA.company.vat)),
      h(Text, { style: [styles.companyTopLine, styles.companyTopLineTight] }, sanitizePdfText(DATA.company.legalAddress)),
      h(Text, { style: styles.companyTopLine }, sanitizePdfText(DATA.company.email)),
      h(Text, { style: styles.companyTopLine }, sanitizePdfText(DATA.company.web)),
      h(Text, { style: styles.companyTopLine }, sanitizePdfText(DATA.company.phone))
    )
  )
}

function OnePageOfferPdf({ logoSrc, profileSrc }) {
  return h(
    Document,
    null,
    h(
      Page,
      { size: 'A4', style: styles.page },
      h(
        View,
        { style: styles.topHalf },
        h(Header, { logoSrc }),

        h(
          View,
          { style: styles.offerBand },
          h(Text, { style: styles.offerTitle }, sanitizePdfText(DATA.offerNumber)),
          h(View, { style: styles.offerLine })
        ),

        h(
          View,
          { style: styles.mainGrid },
          h(
            View,
            { style: styles.leftCol },
            h(
              View,
              { style: styles.systemRow },
              h(
                View,
                { style: styles.systemText },
                h(Text, { style: styles.systemLabel }, 'Sistema profilo'),
                h(Text, { style: styles.systemValue }, sanitizePdfText(DATA.profileSystem))
              ),
              h(
                View,
                { style: styles.profileWrap },
                profileSrc
                  ? h(Image, { src: profileSrc, style: styles.profileImage })
                  : h(Text, { style: styles.profilePlaceholder }, 'foto')
              )
            ),

            h(
              View,
              { style: styles.leftDatesInline },
              h(
                View,
                { style: styles.dateSingleRow },
                h(Text, { style: styles.leftDateLabel }, 'Data Emissione:'),
                h(Text, { style: styles.leftDateValue }, sanitizePdfText(DATA.issueDate))
              ),
              h(
                View,
                { style: styles.dateSingleRow },
                h(Text, { style: styles.leftDateLabel }, 'Completamento:'),
                h(Text, { style: styles.leftDateValue }, sanitizePdfText(DATA.leadTime))
              )
            ),

            h(
              View,
              { style: styles.hardwareChip },
              h(Text, { style: styles.hardwareLabel }, 'Ferramenta :'),
              h(Text, { style: styles.hardwareValue }, sanitizePdfText(DATA.hardware))
            ),

            h(Text, { style: styles.sectionTitle }, 'Riepilogo tecnico'),
            h(
              View,
              { style: styles.statsBox },
              ...DATA.metrics.map((metric) =>
                h(
                  View,
                  { key: metric.label, style: styles.statRow },
                  h(Text, { style: styles.statLabel }, `${sanitizePdfText(metric.label)}:`),
                  h(Text, { style: styles.statValue }, sanitizePdfText(metric.value))
                )
              )
            )
          ),

          h(
            View,
            { style: styles.rightCol },
            h(
              View,
              { style: styles.contactRows },
              h(
                View,
                { style: styles.contactRow },
                h(Text, { style: styles.contactLabel }, 'Spett.le:'),
                h(Text, { style: styles.contactValue }, sanitizePdfText(DATA.customer.reference))
              ),
              h(
                View,
                { style: styles.contactRow },
                h(Text, { style: styles.contactLabel }, 'Via'),
                h(Text, { style: styles.contactValue }, sanitizePdfText(DATA.customer.address))
              ),
              h(
                View,
                { style: styles.contactRow },
                h(Text, { style: styles.contactLabel }, 'Tel.'),
                h(Text, { style: styles.contactValue }, sanitizePdfText(DATA.customer.phone))
              )
            ),

            h(
              View,
              { style: styles.pricesSection },
              h(View, { style: styles.pricesSectionLine }),
              h(
                View,
                { style: styles.pricesBox },
                ...DATA.rows.map((row) =>
                  h(
                    View,
                    { key: row.label, style: styles.priceRow },
                    h(Text, { style: styles.priceLabel }, sanitizePdfText(row.label)),
                    h(Text, { style: styles.priceValue }, sanitizePdfText(row.price))
                  )
                ),
                h(
                  View,
                  { style: styles.totalRow },
                  h(Text, { style: styles.totalLabel }, sanitizePdfText(DATA.totalLabel)),
                  h(Text, { style: styles.totalValue }, sanitizePdfText(DATA.totalValue))
                )
              )
            )
          )
        ),

        h(View, { style: styles.pageWideDivider })
      ),
      h(View, { style: styles.bottomHalfSpacer })
    )
  )
}

function parseArgs(argv) {
  const args = { logo: undefined, profile: undefined, out: undefined }
  argv.forEach((arg, index) => {
    if (arg.startsWith('--logo=')) args.logo = arg.slice('--logo='.length)
    if (arg === '--logo') args.logo = argv[index + 1]
    if (arg.startsWith('--profile=')) args.profile = arg.slice('--profile='.length)
    if (arg === '--profile') args.profile = argv[index + 1]
    if (arg.startsWith('--out=')) args.out = arg.slice('--out='.length)
    if (arg === '--out') args.out = argv[index + 1]
  })
  return args
}

async function resolveOptionalFile(inputPath) {
  if (!inputPath) return null
  const absolute = path.isAbsolute(inputPath) ? inputPath : path.resolve(process.cwd(), inputPath)
  try {
    await fs.access(absolute)
    return absolute
  } catch {
    return null
  }
}

async function buildImageSource(filePath) {
  if (!filePath) return null
  try {
    const data = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const format = ext === '.png' ? 'png' : 'jpg'
    return { data, format }
  } catch {
    return null
  }
}

async function resolveDefaultLogo() {
  const baseDir = path.resolve(process.cwd(), 'experiments', 'barda-terms-pdf')
  const preferred = ['Barda - Logo.jpeg', 'barda-logo.jpeg', 'logo.png']
  for (const fileName of preferred) {
    const candidate = await resolveOptionalFile(path.join(baseDir, fileName))
    if (candidate) return candidate
  }
  return null
}

async function resolveDefaultProfile() {
  const baseDir = path.resolve(process.cwd(), 'experiments', 'barda-terms-pdf')
  const preferred = [
    DATA.baseProfileImageRel,
    'profilo.png',
    'profile.png',
    'sezione-profilo.png',
  ]
  for (const fileName of preferred) {
    const candidate = fileName.includes('/')
      ? await resolveOptionalFile(path.resolve(process.cwd(), fileName))
      : await resolveOptionalFile(path.join(baseDir, fileName))
    if (candidate) return candidate
  }
  return null
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const logoFilePath = args.logo ? await resolveOptionalFile(args.logo) : await resolveDefaultLogo()
  const profileFilePath = args.profile ? await resolveOptionalFile(args.profile) : await resolveDefaultProfile()

  const logoSrc = await buildImageSource(logoFilePath)
  const profileSrc = await buildImageSource(profileFilePath)

  const outputPath = args.out
    ? (path.isAbsolute(args.out) ? args.out : path.resolve(process.cwd(), args.out))
    : path.resolve(process.cwd(), 'experiments', 'barda-terms-pdf', 'output', 'barda-offerta-1page.pdf')

  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await renderToFile(h(OnePageOfferPdf, { logoSrc, profileSrc }), outputPath)
  console.log(`✅ PDF generato: ${outputPath}`)
}

main().catch((error) => {
  console.error('❌ Errore durante la generazione PDF')
  console.error(error)
  process.exit(1)
})
