export type TermsProfileId = 'privato' | 'azienda';

export type TermsSection = {
    title: string;
    body: string[];
};

export type TermsProfile = {
    id: TermsProfileId;
    label: string;
    tagline: string;
    summary: string;
    validityTemplate: string;
    notesIntro: string;
    paymentPlan: Array<{ label: string; description: string }>;
    sections: TermsSection[];
    privacy: TermsSection;
};

export type BuildTermsOptions = {
    validityDays?: number;
};

export type TermsDocument = {
    profileId: TermsProfileId;
    profileLabel: string;
    tagline: string;
    summary: string;
    validityLabel: string;
    notesIntro: string;
    paymentPlan: Array<{ label: string; description: string }>;
    sections: TermsSection[];
    privacy: TermsSection;
    text: string;
};

const NOTE_LINE = '___________________________________________________________________________________________________________';

function injectDays(template: string, days: number): string {
    return template.replace('{days}', String(days));
}

export function buildTermsDocument(profile: TermsProfile, options?: BuildTermsOptions): TermsDocument {
    const validityDays = Number.isFinite(options?.validityDays) && options?.validityDays ? options.validityDays : 15;
    const validityLabel = injectDays(profile.validityTemplate, validityDays);

    const paymentPlan = profile.paymentPlan.map(step => ({ ...step }));
    const paymentNotes = GLOBAL_PAYMENT_NOTES.slice();
    const sections = profile.sections.map(section => ({
        title: section.title,
        body: section.body.slice(),
    }));
    const privacy = {
        title: profile.privacy.title,
        body: profile.privacy.body.slice(),
    };

    const lines: string[] = [];
    lines.push(validityLabel.toUpperCase());
    lines.push('');
    lines.push(profile.notesIntro.trim());
    lines.push(NOTE_LINE);
    lines.push(NOTE_LINE);
    lines.push(NOTE_LINE);
    lines.push('');
    lines.push('CONDIZIONI');
    lines.push('- Termini e modalita di pagamento');

    paymentPlan.forEach((step, idx) => {
        lines.push(`${idx + 1}. ${step.label}`);
        lines.push(step.description.trim());
    });

    paymentNotes.forEach(note => {
        lines.push(note.trim());
    });

    sections.forEach(section => {
        lines.push('');
        lines.push(section.title.trim());
        section.body.forEach(paragraph => {
            lines.push(paragraph.trim());
        });
    });

    lines.push('');
    lines.push(privacy.title.trim());
    privacy.body.forEach(paragraph => {
        lines.push(paragraph.trim());
    });

    lines.push('');
    lines.push('Letto e confermato in ______________________ in data _____________________');
    lines.push('Cliente');
    lines.push('_________________________');
    lines.push('Fornitore');
    lines.push('_________________________');

    return {
        profileId: profile.id,
        profileLabel: profile.label,
        tagline: profile.tagline,
        summary: profile.summary,
        validityLabel,
        notesIntro: profile.notesIntro,
        paymentPlan,
        sections,
        privacy,
        text: lines.join('\n'),
    };
}

export function detectTermsProfile(content?: string | null, fallback: TermsProfileId = 'privato'): TermsProfileId {
    if (typeof content === 'string' && content.trim()) {
        const normalized = content.toLowerCase();
        if (
            normalized.includes('formula 50') ||
            normalized.includes('50% alla conferma') ||
            normalized.includes('50% prima della consegna')
        ) {
            return 'azienda';
        }
        if (
            normalized.includes('40 · 40 · 20') ||
            normalized.includes('40-40-20') ||
            normalized.includes('20% a posa') ||
            normalized.includes('formula 40')
        ) {
            return 'privato';
        }
    }
    return fallback;
}

export const TERMS_PROFILES: TermsProfile[] = [
    {
        id: 'privato',
        label: 'Privati',
        tagline: 'Formula 40 · 40 · 20',
        summary: 'Tre fasi per accompagnare produzione, consegna e posa con cadenze equilibrate.',
        validityTemplate: "VALIDITA' OFFERTA: {days} GG DALLA PRESENTE",
        notesIntro: 'Note del cliente (esigenze particolari in merito a termini di consegna, di pagamento e modifiche tecniche dell\'ordine)',
        paymentPlan: [
            {
                label: '40% alla conferma',
                description: 'Acconto a conferma dell\'ordine comprensivo di posa in opera.'
            },
            {
                label: '40% all\'avviso di pronta merce',
                description: 'Saldo intermedio da versare quando il materiale è pronto alla consegna presso il nostro magazzino.'
            },
            {
                label: '20% a posa ultimata',
                description: 'Saldo finale entro e non oltre 7 giorni dalla posa completata e collaudata.'
            },
        ],
        sections: [
            {
                title: 'Consegna',
                body: [
                    'I tempi di consegna variano da 4 a 10 settimane dal ricevimento dell\'acconto, in funzione della tipologia di prodotto richiesta.',
                    'I termini possono subire variazioni dovute a produzione o trasporto; in tal caso comunicheremo la nuova data di consegna. Se il ritardo supera 45 giorni e non è dovuto a forza maggiore, il cliente può richiedere un indennizzo.'
                ]
            },
            {
                title: 'Modifiche ordine in corso d\'opera',
                body: [
                    'Il fornitore può accettare o meno modifiche richieste in corso d\'opera. Se la richiesta arriva dopo l\'avvio della produzione, verranno ricalcolati prezzo e termini di consegna.'
                ]
            },
            {
                title: 'Posa in opera',
                body: [
                    'Il costo della posa può variare in fase di conferma ordine a seguito del rilievo tecnico definitivo.',
                    'Qualora durante i lavori emergano difformità rispetto alle condizioni pattuite, il cliente può fissare un termine congruo (minimo 30 giorni) entro cui il fornitore dovrà adeguarsi.'
                ]
            }
        ],
        privacy: {
            title: 'Privacy e trattamento dei dati',
            body: [
                'La sottoscrizione del presente documento costituisce informativa ai sensi del Regolamento (UE) 2016/679 e del D.Lgs. 196/2003 s.m.i.; i dati saranno trattati in modo lecito, corretto e trasparente.',
                'X S.R.L., con sede legale in Via San Giuseppe 95 - 21047 Saronno (VA), tratta dati identificativi, fiscali e tecnici del cliente per finalita precontrattuali, contrattuali, amministrative e di assistenza post vendita su base giuridica contrattuale e di obbligo legale.',
                'I dati potranno essere comunicati a vettori, installatori, consulenti fiscali o enti pubblici nei limiti strettamente necessari all esecuzione del rapporto; non e previsto trasferimento extra UE salvo sistemi che garantiscano un adeguato livello di protezione.',
                'Il cliente puo richiedere accesso, rettifica, limitazione, cancellazione o opposizione scrivendo a info@xinfissi.it; la conservazione avviene per il tempo necessario agli obblighi contrattuali e fiscali.'
            ]
        }
    },
    {
        id: 'azienda',
        label: 'Aziende',
        tagline: 'Formula 50 · 50',
        summary: 'Due tranche amministrative: conferma ordine e consegna/posa.',
        validityTemplate: "VALIDITA' OFFERTA: {days} GG DALLA PRESENTE",
        notesIntro: 'Note del cliente (esigenze particolari in merito a termini di consegna, di pagamento e modifiche tecniche dell ordine)',
        paymentPlan: [
            {
                label: '50% alla conferma',
                description: 'Acconto del 50% del totale (con o senza posa) da versare a conferma dell\'ordine e per l\'avvio della produzione.'
            },
            {
                label: '50% prima della consegna/posa',
                description: 'Saldo del 50% da corrispondere all\'avviso di pronta merce e comunque prima della consegna o della posa in opera.'
            }
        ],
        sections: [
            {
                title: 'Consegna',
                body: [
                    'Tempi indicativi 4-10 settimane dal ricevimento dell\'acconto, variabili in base alla complessità del progetto e alle disponibilità produttive.',
                    'Eventuali variazioni dovute a produzione o logistica verranno comunicate prontamente. Ritardi oltre 45 giorni non dovuti a forza maggiore danno facoltà di richiedere un indennizzo.'
                ]
            },
            {
                title: 'Modifiche ordine in corso d\'opera',
                body: [
                    'Richieste di modifica dopo l\'avvio delle lavorazioni potranno essere accolte previo aggiornamento economico e ridefinizione dei tempi di consegna.'
                ]
            },
            {
                title: 'Posa in opera / cantiere',
                body: [
                    'La voce posa può subire conguagli dopo il rilievo tecnico definitivo e l\'analisi delle condizioni di cantiere.',
                    'In caso di non conformità rilevate durante le lavorazioni il cliente può fissare un termine (minimo 30 giorni) per l\'adeguamento del fornitore alle condizioni pattuite.'
                ]
            }
        ],
        privacy: {
            title: 'Privacy e trattamento dei dati',
            body: [
                'La presente offerta integra l\'informativa privacy ai sensi del Regolamento (UE) 2016/679 e del D.Lgs. 196/2003 s.m.i.; il trattamento avviene nel rispetto dei principi di liceità, correttezza e trasparenza.',
                'X S.R.L., Via San Giuseppe 95 - 21047 Saronno (VA), tratta dati societari e dei referenti aziendali per finalità contrattuali, amministrative, contabili e di tutela del credito, con basi giuridiche fondate sul contratto e sugli obblighi normativi.',
                'I dati potranno essere comunicati a vettori, installatori, istituti di credito, consulenti o autorità competenti; eventuali trasferimenti extra UE avverranno solo verso soggetti che garantiscano misure adeguate.',
                'Il cliente può esercitare i diritti previsti dagli artt. 15-22 GDPR (accesso, rettifica, limitazione, portabilità, opposizione e cancellazione) scrivendo a info@xinfissi.it; la conservazione dura il tempo necessario all\'esecuzione del contratto e degli obblighi di legge.'
            ]
        }
    }
];

export const SUPPLY_ONLY_PLAN = {
    label: 'Solo fornitura',
    tagline: 'Formula 40 · 60',
    summary: 'Formula 40 · 60 pensata per consegne senza installazione.',
    steps: [
        { label: '40% alla conferma', description: 'Acconto iniziale per avviare produzione e bloccare i materiali.' },
        { label: '60% all avviso di pronta merce', description: 'Saldo da corrispondere prima del ritiro o spedizione del materiale.' }
    ]
};

export const GLOBAL_PAYMENT_NOTES: string[] = [
    'Il cliente non potra ritrattare o ritardare i pagamenti dopo la sottoscrizione del contratto.',
    'In caso di mancato saldo del 60% all avviso di pronta merce, la consegna non verra effettuata, la merce restera in giacenza presso il nostro magazzino e saranno addebitate le relative spese.',
    'Eventuali contestazioni saranno prese in considerazione solo dopo l integrale pagamento e previo sopralluogo congiunto.'
];
