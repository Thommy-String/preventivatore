import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Svg,
  Path,
  renderToFile,
} from '@react-pdf/renderer'
import fs from 'node:fs/promises'
import path from 'node:path'

const h = React.createElement

// --- DATA ---
const COMPANY = {
  name: 'BARDA srl',
  vat: '13786090962',
  address: 'Monza (MB) 20900 via Santuario delle grazie vecchie 17',
}

const paymentPrivate = [
  {
    step: '40% alla conferma ordine',
    text: 'Acconto a conferma per avviare produzione e approvvigionamenti.',
  },
  {
    step: "40% all'avviso di pronta merce",
    text: 'Seconda tranche quando il materiale è pronto a magazzino.',
  },
  {
    step: '20% a posa ultimata',
    text: 'Saldo finale entro 7 giorni dal completamento della posa.',
  },
]

const paymentBusiness = [
  {
    step: '50% alla conferma ordine',
    text: 'Acconto iniziale per l’avvio produzione.',
  },
  {
    step: '50% prima della consegna/posa',
    text: 'Saldo all’avviso di pronta merce e prima della consegna.',
  },
]

// NUOVO DATO AGGIUNTO
const paymentSupply = [
  {
    step: '40% alla conferma',
    text: 'Acconto iniziale per avviare produzione e bloccare i materiali.',
  },
  {
    step: '60% all\'avviso di pronta merce',
    text: 'Saldo da corrispondere prima del ritiro o spedizione del materiale.',
  },
]

const paymentGeneralRules = [
  'Il cliente non potra ritrattare o ritardare i pagamenti dopo la sottoscrizione del contratto.',
  'In caso di mancato saldo del 60% all avviso di pronta merce, la consegna non verra effettuata, la merce restera in giacenza presso il nostro magazzino e saranno addebitate le relative spese.',
  'Eventuali contestazioni saranno prese in considerazione solo dopo l integrale pagamento e previo sopralluogo congiunto.',
]

const termsPage1 = [
  {
    title: 'Consegna',
    body: [
      "I tempi di consegna sono indicativi e variano in base alla tipologia di prodotto e alla complessità della commessa.",
      'Eventuali ritardi dovuti a produzione, logistica o cause di forza maggiore saranno comunicati appena possibile al cliente.',
    ],
  },
  {
    title: "Modifiche ordine in corso d'opera",
    body: [
      'Le modifiche richieste dopo conferma ordine possono comportare revisione economica e aggiornamento dei tempi di consegna.',
      'Ogni variazione sarà valida solo dopo accettazione scritta di entrambe le parti.',
    ],
  },
]

const termsPage2 = [
  {
    title: 'Posa in opera',
    body: [
      'Il costo della posa può variare in fase di conferma ordine a seguito del rilievo tecnico definitivo. Qualora durante i lavori emergano difformità rispetto alle condizioni pattuite, il cliente può fissare un termine congruo (minimo 30 giorni) entro cui il fornitore dovrà adeguarsi. La posa è eseguita secondo le buone pratiche di settore e le condizioni tecniche rilevate in cantiere, Eventuali lavorazioni extra non previste in offerta saranno quotate separatamente.',
    ],
  },
  {
    title: 'Garanzia e contestazioni',
    body: [
      'Le contestazioni devono essere comunicate per iscritto entro termini congrui dalla rilevazione del vizio o difformità.',
      'Fermo restando quanto previsto dalla normativa applicabile, il fornitore si impegna a verificare e proporre una soluzione tecnica adeguata.',
    ],
  },
  {
    title: 'Privacy e trattamento dati',
    body: [
      'La sottoscrizione del presente documento costituisce informativa ai sensi del Regolamento (UE) 2016/679 e del D.Lgs. 196/2003 s.m.i.; i dati saranno trattati in modo lecito, corretto e trasparente.',
      `BARDA srl, con sede legale in ${COMPANY.address}, tratta dati identificativi, fiscali e tecnici del cliente per finalita precontrattuali, contrattuali, amministrative e di assistenza post vendita su base giuridica contrattuale e di obbligo legale.`,
      'I dati potranno essere comunicati a vettori, installatori, consulenti fiscali o enti pubblici nei limiti strettamente necessari all esecuzione del rapporto; non e previsto trasferimento extra UE salvo sistemi che garantiscano un adeguato livello di protezione.',
      'Il cliente puo richiedere accesso, rettifica, limitazione, cancellazione o opposizione scrivendo al referente privacy aziendale; la conservazione avviene per il tempo necessario agli obblighi contrattuali e fiscali.',
    ],
  },
]

// --- DESIGN SYSTEM (Apple Inspired) ---
const THEME = {
  black: '#1D1D1F',        // Apple "Rich Black"
  darkGray: '#4a4a50',     // Darker body gray for better readability
  lightGray: '#D2D2D7',    // Apple "Divider Gray"
  bgCard: '#F5F5F7',       // Apple "System Gray 6" (Light BG)
  accent: '#1E8E5A',       // Brand Green
  accentPastel: '#DFF3E8',
  accentText: '#195B3F',
}

const FONT_SCALE = 1.18
const fz = (size) => Math.round(size * FONT_SCALE * 100) / 100

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 30,
    paddingHorizontal: 34,
    fontFamily: 'Helvetica',
    color: THEME.black,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 22,
    borderBottomWidth: 0.5,
    borderBottomColor: THEME.lightGray,
    paddingBottom: 9,
  },
  logoBox: {
    width: 182,
    height: 72,
    justifyContent: 'flex-end',
  },
  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'left bottom',
  },
  logoPlaceholder: {
    fontSize: fz(10),
    color: THEME.lightGray,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  companyMetaBox: {
    alignItems: 'flex-end',
  },
  companyMetaText: {
    fontSize: fz(7),
    color: THEME.darkGray,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  
  // Titoli
  mainTitle: {
    fontSize: fz(16),
    fontFamily: 'Helvetica-Bold',
    color: THEME.black,
    letterSpacing: -0.8,
    marginBottom: 3,
  },
  subTitle: {
    fontSize: fz(7.8),
    color: THEME.darkGray,
    marginBottom: 10,
    letterSpacing: 0.2,
  },

  // Sezioni
  paymentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  sectionLabelInline: {
    fontSize: fz(8),
    fontFamily: 'Helvetica-Bold',
    color: THEME.darkGray,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  paymentInlineMeta: {
    fontSize: fz(6.8),
    color: '#8D8D95',
    letterSpacing: 0.1,
    textAlign: 'right',
  },
  sectionLabel: {
    fontSize: fz(8),
    fontFamily: 'Helvetica-Bold',
    color: THEME.darkGray,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
    marginTop: 6,
  },
  paymentHeaderTitle: {
    fontSize: fz(13),
    fontFamily: 'Helvetica-Bold',
    color: THEME.black,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  paymentHeaderSubtitle: {
    fontSize: fz(8.5),
    color: THEME.darkGray,
    marginBottom: 14,
  },
  
  // Payment Cards
  gridRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 9,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.8,
    borderColor: '#DCDDDF',
    borderRadius: 4,
    paddingTop: 9,
    paddingBottom: 8,
    paddingHorizontal: 9,
    flex: 1,
  },
  cardWithGap: {
    marginRight: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardIconWrap: {
    width: 18,
    height: 18,
    borderRadius: 3,
    backgroundColor: '#F2F7F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 7,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fz(8.9),
    fontFamily: 'Helvetica-Bold',
    marginBottom: 1,
    color: THEME.black,
  },
  cardSubtitle: {
    fontSize: fz(7),
    color: '#5D5D64',
    marginBottom: 0,
    fontFamily: 'Helvetica',
  },
  cardDivider: {
    height: 0.6,
    backgroundColor: '#E1E2E5',
    marginBottom: 5,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: THEME.accentPastel,
    color: THEME.accentText,
    fontSize: fz(6),
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    paddingTop: 1.8,
    marginRight: 6,
  },
  stepTextBold: {
    fontSize: fz(7.9),
    fontFamily: 'Helvetica-Bold',
    color: '#222225',
  },
  stepDesc: {
    fontSize: fz(6.95),
    color: '#56565C',
    lineHeight: 1.2,
  },

  // Testi Termini
  termBlock: {
    marginBottom: 10,
  },
  termTitle: {
    fontSize: fz(9),
    fontFamily: 'Helvetica-Bold',
    color: THEME.black,
    marginBottom: 2,
  },
  termBody: {
    fontSize: fz(8),
    color: THEME.darkGray,
    lineHeight: 1.24,
    marginBottom: 1,
    textAlign: 'justify',
  },

  // Note e Footer
  noteBox: {
    marginTop: 3,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: THEME.lightGray,
  },
  noteText: {
    fontSize: fz(7.3),
    color: THEME.darkGray,
    marginBottom: 3,
  },
  
  // Firme
  acceptanceBox: {
    backgroundColor: THEME.bgCard,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    marginBottom: 10,
    borderLeftWidth: 2,
    borderLeftColor: THEME.accent,
  },
  acceptanceTitle: {
    fontSize: fz(9.2),
    fontFamily: 'Helvetica-Bold',
    color: THEME.black,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  acceptanceLegalText: {
    fontSize: fz(7.6),
    color: '#3F3F45',
    lineHeight: 1.35,
  },
  signatureSection: {
    marginTop: 2,
  },
  signRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  signCol: {
    flex: 1,
  },
  signLabel: {
    fontSize: fz(7),
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: THEME.darkGray,
    marginBottom: 20,
  },
  signLine: {
    height: 0.5,
    backgroundColor: THEME.lightGray,
    width: '90%',
  },
  
  footerHint: {
    position: 'absolute',
    bottom: 16,
    left: 34,
    right: 34,
    textAlign: 'center',
    fontSize: fz(7),
    color: '#D2D2D7',
  }
})

function UserIcon() {
  return h(
    Svg,
    { width: 12, height: 12, viewBox: '0 0 24 24' },
    h(Path, {
      d: 'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z',
      fill: THEME.accent,
    })
  )
}

function BuildingIcon() {
  return h(
    Svg,
    { width: 12, height: 12, viewBox: '0 0 24 24' },
    h(Path, {
      d: 'M4 20V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6h4v10h-6v-3h-4v3H4zm4-12h2v2H8V8zm0 4h2v2H8v-2zm4-4h2v2h-2V8zm0 4h2v2h-2v-2z',
      fill: THEME.accent,
    })
  )
}

function SupplyIcon() {
  return h(
    Svg,
    { width: 12, height: 12, viewBox: '0 0 24 24' },
    h(Path, {
      d: 'M21 8.5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5M12 3l9 5.5-9 5.5-9-5.5L12 3z',
      fill: THEME.accent,
    })
  )
}

// --- HELPERS ---

function sanitizePdfText(value) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/"?__needsUpload"?\s*:?\s*true,?/gi, '')
    .replace(/__needsUpload\s*:?\s*true/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// --- COMPONENTS ---

function Header({ logoSrc }) {
  return h(
    View,
    { style: styles.header },
    h(
      View,
      { style: styles.logoBox },
      logoSrc
        ? h(Image, { src: logoSrc, style: styles.logo })
        : h(Text, { style: styles.logoPlaceholder }, 'BARDA Logo')
    ),
    h(
      View,
      { style: styles.companyMetaBox },
      h(Text, { style: styles.companyMetaText }, sanitizePdfText(COMPANY.name)),
      h(Text, { style: styles.companyMetaText }, sanitizePdfText(COMPANY.vat)),
      h(Text, { style: styles.companyMetaText }, sanitizePdfText(COMPANY.address))
    )
  )
}

// Ho aggiornato questo componente per accettare "subtitle"
function PaymentCard({ title, subtitle, rows, isLast, icon }) {
  const cardStyle = [styles.card, isLast ? null : styles.cardWithGap]
  
  return h(
    View,
    { style: cardStyle },
    h(
      View,
      { style: styles.cardHeader },
      h(View, { style: styles.cardIconWrap }, icon),
      h(
        View,
        { style: styles.cardTitleWrap },
        h(Text, { style: styles.cardTitle }, sanitizePdfText(title)),
        subtitle ? h(Text, { style: styles.cardSubtitle }, sanitizePdfText(subtitle)) : null
      )
    ),
    h(View, { style: styles.cardDivider }),
    rows.map((row, idx) => 
      h(
        View,
        { key: idx, style: styles.cardRow },
        h(Text, { style: styles.stepNumber }, String(idx + 1)),
        h(
          View,
          { style: { flex: 1 } },
          h(Text, { style: styles.stepTextBold }, sanitizePdfText(row.step)),
          h(Text, { style: styles.stepDesc }, sanitizePdfText(row.text))
        )
      )
    )
  )
}

function TermSection({ title, body }) {
  return h(
    View,
    { style: styles.termBlock },
    h(Text, { style: styles.termTitle }, sanitizePdfText(title)),
    body.map((p, idx) => 
      h(Text, { key: idx, style: styles.termBody }, sanitizePdfText(p))
    )
  )
}

function BardaTermsPdf({ logoSrc }) {
  return h(
    Document,
    null,
    // PAGINA 1
    h(
      Page,
      { size: 'A4', style: styles.page },
      h(Header, { logoSrc }),

      h(
        View,
        { style: styles.paymentTopRow },
        h(Text, { style: styles.sectionLabelInline }, 'Metodi di Pagamento'),
        h(
          Text,
          { style: styles.paymentInlineMeta },
          'Condizioni di Fornitura · Termini e condizioni d’uso commerciale · rev. 2026'
        )
      ),
      
      // RIGA 1: Privati e Aziende (Affiancati)
      h(
        View,
        { style: styles.gridRow },
        h(PaymentCard, {
          title: 'Privati · Formula 40/40/20',
          subtitle: 'Pagamenti in tre fasi',
          rows: paymentPrivate,
          icon: h(UserIcon),
          isLast: false,
        }),
        h(PaymentCard, {
          title: 'Aziende · Formula 50/50',
          subtitle: 'Pagamenti in due tranche',
          rows: paymentBusiness,
          icon: h(BuildingIcon),
          isLast: true,
        })
      ),

      // RIGA 2: Solo Fornitura (Larghezza intera sotto le altre)
      h(
        View,
        { style: styles.gridRow },
        h(PaymentCard, { 
          title: 'Solo fornitura (senza posa) · Formula 40/60', 
          subtitle: 'Pensata per consegne senza installazione.',
          rows: paymentSupply, 
          icon: h(SupplyIcon),
          isLast: true
        })
      ),

      h(
        View,
        { style: styles.noteBox },
        h(Text, { style: styles.noteText }, '• In caso di ritardo nei pagamenti, la consegna può essere sospesa fino a regolarizzazione.'),
        h(Text, { style: styles.noteText }, '• Eventuali reclami sono gestiti previa verifica tecnica e documentale.')
      ),

      h(View, { style: { height: 12 } }),
      h(Text, { style: styles.sectionLabel }, 'R E G O L E   G E N E R A L I   S U I   P A G A M E N T I'),
      ...paymentGeneralRules.map((p, idx) =>
        h(Text, { key: `payment-rule-${idx}`, style: styles.termBody }, sanitizePdfText(p))
      ),
      
      h(Text, { style: styles.footerHint }, '1 / 2')
    ),

    // PAGINA 2
    h(
      Page,
      { size: 'A4', style: styles.page },
      h(Header, { logoSrc }),
      
      h(Text, { style: styles.mainTitle }, 'Condizioni di Fornitura'),
      h(Text, { style: styles.subTitle }, 'Segue da pagina precedente'),

      h(Text, { style: styles.sectionLabel }, 'Termini Generali'),
      ...termsPage1.map(t => h(TermSection, { key: `p2-${t.title}`, ...t })),
      h(View, { style: { height: 8 } }),
      
      h(Text, { style: styles.sectionLabel }, 'Normative e Specifiche'),
      ...termsPage2.map(t => h(TermSection, { key: t.title, ...t })),

      h(View, { style: { height: 20 } }),

      h(
        View,
        { style: styles.acceptanceBox },
        h(Text, { style: styles.acceptanceTitle }, 'Accettazione e valore contrattuale'),
        h(
          Text,
          { style: styles.acceptanceLegalText },
          'Con la sottoscrizione del presente documento, il Cliente dichiara di aver letto, compreso e accettato integralmente tutte le condizioni economiche e contrattuali ivi riportate, riconoscendone pieno valore ai fini dell efficacia dell accordo.'
        )
      ),

      h(View, { style: styles.signatureSection },
        h(Text, { style: styles.termBody }, 'Luogo e data: ________________________________'),
        h(
          View,
          { style: styles.signRow },
          h(
            View,
            { style: styles.signCol },
            h(Text, { style: styles.signLabel }, 'Firma Cliente'),
            h(View, { style: styles.signLine })
          ),
           h(
            View,
            { style: styles.signCol },
            h(Text, { style: styles.signLabel }, `Firma ${COMPANY.name}`),
            h(View, { style: styles.signLine })
          )
        )
      ),

      h(Text, { style: styles.footerHint }, '2 / 2')
    )
  )
}

// --- ARG PARSING & MAIN ---

function parseArgs(argv) {
  const args = { logo: undefined, out: undefined }
  argv.forEach((arg, index) => {
    if (arg.startsWith('--logo=')) args.logo = arg.slice('--logo='.length)
    if (arg === '--logo') args.logo = argv[index + 1]
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

async function buildLogoSource(filePath) {
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

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const logoFilePath = args.logo ? await resolveOptionalFile(args.logo) : await resolveDefaultLogo()
  const logoSrc = await buildLogoSource(logoFilePath)
  const outputPath = args.out
    ? (path.isAbsolute(args.out) ? args.out : path.resolve(process.cwd(), args.out))
    : path.resolve(process.cwd(), 'experiments', 'barda-terms-pdf', 'output', 'barda-condizioni-fornitura.pdf')

  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await renderToFile(h(BardaTermsPdf, { logoSrc }), outputPath)
  console.log(`✅ PDF generato: ${outputPath}`)
}

main().catch((error) => {
  console.error('❌ Errore durante la generazione PDF')
  console.error(error)
  process.exit(1)
})