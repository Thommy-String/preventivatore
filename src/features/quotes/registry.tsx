import type { QuoteKind, QuoteItem } from "./types"
import type { WindowItem, ScorrevoleItem, CassonettoItem, ZanzarieraItem, PersianaItem, TapparellaItem } from "./types"
import type { ItemFormProps } from "./forms/types"
import finestraIcon from "../../assets/images/finestra.png"
import cassonettoIcon from "../../assets/images/cassonetto.png"
import zanzarieraIcon from "../../assets/images/zanzariera.png"
import portaFinestraIcon from "../../assets/images/portaFinestra.png"
import scorrevoleIcon from "../../assets/images/scorrevole.png"
import persianaIcon from "../../assets/images/persiana.png"
import tapparellaIcon from "../../assets/images/tapparella.png"
import { WindowForm } from "./forms/WindowForm"
import { ZanzarieraForm } from "./forms/ZanzarieraForm"
import { CassonettoForm } from "./forms/CassonettoForm"
import { PersianaForm } from "./forms/PersianaForm"
import { TapparellaForm } from "./forms/Tapparella"

export type RegistryEntry<T extends QuoteItem = QuoteItem> = {
    label: string
    icon: string
    makeDefaults: () => T
    Form: React.FC<ItemFormProps<T>>
}

export const registry: Record<QuoteKind, RegistryEntry<any>> = {
    finestra: {
        label: "Finestra",
        icon: finestraIcon,
        makeDefaults: (): WindowItem => ({
            id: crypto.randomUUID(),
            kind: 'finestra',
            width_mm: 1200,
            height_mm: 1500,
            qty: 1,
            price_mode: 'per_mq',
            price_per_mq: 300,
            price_total: null,
            color: null,
            glass: null,
            hinges_color: null,
            uw: null,
            profile_system: null,
            notes: null,
            custom_fields: []
        }),
        Form: WindowForm
    },
    portafinestra: {
        label: "Porta finestra",
        icon: portaFinestraIcon,
        makeDefaults: (): WindowItem => ({
            id: crypto.randomUUID(),
            kind: 'portafinestra',
            width_mm: 1200,
            height_mm: 2300,
            qty: 1,
            price_mode: 'per_mq',
            price_per_mq: 350,
            price_total: null,
            color: null,
            glass: null,
            hinges_color: null,
            uw: null,
            profile_system: null,
            notes: null,
            custom_fields: []
        }),
        Form: WindowForm
    },
    scorrevole: {
        label: "Scorrevole",
        icon: scorrevoleIcon,
        makeDefaults: (): ScorrevoleItem => ({
            id: crypto.randomUUID(),
            kind: 'scorrevole',
            width_mm: 1800,
            height_mm: 2100,
            qty: 1,
            price_mode: 'per_mq',
            price_per_mq: 350,
            price_total: null,
            color: null,
            glass: null,
            hinges_color: null,
            uw: null,
            profile_system: null,
            notes: null,
            custom_fields: []
        }),
        Form: WindowForm
    },
    cassonetto: {
        label: "Cassonetto",
        icon: cassonettoIcon,
        makeDefaults: (): CassonettoItem => ({
            id: crypto.randomUUID(),
            kind: 'cassonetto',
            width_mm: 1000,
            height_mm: 600,
            qty: 1,
            price_mode: 'total',
            price_total: 0,
            notes: null,
            custom_fields: [],
            material: 'PVC',
            depth_mm: null,
            extension_mm: null,
        }),
        Form: CassonettoForm // placeholder finché non creiamo CassonettoForm
    },
    zanzariera: {
        label: "Zanzariera",
        icon: zanzarieraIcon,
        makeDefaults: (): ZanzarieraItem => ({
            id: crypto.randomUUID(),
            kind: 'zanzariera',
            qty: 1,

            // prezzo: di default €/m²
            price_mode: 'per_mq',
            price_per_mq: 120,
            price_per_piece: null,
            price_total: null,

            width_mm: 1000,
            height_mm: 1500,
            misura_tipo: 'vano',

            modello: 'Tondo 46',
            tipologia: 'Tondo verticale molla',

            profilo_colore: '030 GRIGIO OPACO',
            accessori_colore: 'Nero',
            mesh: 'Antracite',

            deceleratore: true,

            notes: null,
            custom_fields: [],
        }),
        Form: ZanzarieraForm
    },
    persiana: {
        label: "Persiana",
        icon: persianaIcon,
        makeDefaults: (): PersianaItem => ({
            id: crypto.randomUUID(),
            kind: 'persiana',
            width_mm: 1000,
            height_mm: 1400,
            qty: 1,
            // i prezzi per riga non sono usati, ma teniamo i campi coerenti
            price_mode: 'total',
            price_total: 0,
            price_per_mq: null,
            notes: null,
            custom_fields: [],
            // campi specifici Persiana
            material: 'Alluminio',
            lamelle: 'fisse',
            con_telaio: true,
            misura_tipo: 'luce',
            color: ''
        }),
        Form: PersianaForm
    },
    tapparella: {
        label: "Tapparella",
        icon: tapparellaIcon,
        makeDefaults: (): TapparellaItem => ({
            id: crypto.randomUUID(),
            kind: 'tapparella',
            width_mm: 1000,
            height_mm: 1400,
            qty: 1,
            // i prezzi riga non si usano, ma manteniamo la struttura coerente
            price_mode: 'total',
            price_total: 0,
            price_per_mq: null,
            notes: null,
            custom_fields: [],
            // campi specifici Tapparella
            material: 'PVC',
            color: ''
        }),
        Form: TapparellaForm
    },
    custom: {
        label: "Voce personalizzata",
        icon: finestraIcon,
        makeDefaults: () => ({
            id: crypto.randomUUID(),
            kind: 'custom',
            width_mm: 1000,
            height_mm: 1000,
            qty: 1,
            price_mode: 'total',
            price_total: 0,
            price_per_mq: null,
            notes: null,
            custom_fields: [],
            title: 'Voce personalizzata'
        }),
        Form: WindowForm // placeholder
    }
}