// src/features/quotes/registry.tsx
import type * as React from "react";
import type { QuoteKind, QuoteItem } from "./types";
import type {
  WindowItem,
  CassonettoItem,
  ZanzarieraItem,
  PersianaItem,
  TapparellaItem,
  CustomItem,
} from "./types";
import type { ItemFormProps } from "./types";

import finestraIcon from "../../assets/images/finestra.png";
import cassonettoIcon from "../../assets/images/cassonetto.png";
import zanzarieraIcon from "../../assets/images/zanzariera.png";
import persianaIcon from "../../assets/images/persiana.png";
import tapparellaIcon from "../../assets/images/tapparella.png";

import { WindowForm } from "./forms/WindowForm";
import { ZanzarieraForm } from "./forms/ZanzarieraForm";
import { CassonettoForm } from "./forms/CassonettoForm";
import { PersianaForm } from "./forms/PersianaForm";
import { TapparellaForm } from "./forms/Tapparella"; 

export type RegistryEntry<T extends QuoteItem = QuoteItem> = {
  label: string;
  icon: string;
  makeDefaults: () => T;
  Form: React.FC<ItemFormProps<T>>;
};

export const registry: Record<QuoteKind, RegistryEntry<any>> = {
  finestra: {
    label: "Finestra",
    icon: finestraIcon,
    makeDefaults: (): WindowItem => ({
      id: crypto.randomUUID(),
      kind: "finestra",
      width_mm: 1200,
      height_mm: 1500,
      qty: 1,
      price_mode: "per_mq",
      price_per_mq: 300,
      price_total: null,
      color: null,
      glass: null,
      hinges_color: null,
      uw: 1.3,
      profile_system: null,
      notes: null,
      reference: "",
      custom_fields: [],
      // modello a griglia base 2 ante (50/50) apre dx +  sx vasistas
      options: {
        gridWindow: {
          width_mm: 1200,
          height_mm: 1500,
          frame_mm: 60,
          mullion_mm: 40,
          glazing: "doppio",
          showDims: true,
          rows: [
            {
              height_ratio: 1,
              cols: [
                { width_ratio: 0.5, leaf: { state: "apre_dx" } },
                { width_ratio: 0.5, leaf: { state: "apre_sx+vasistas" } },
              ],
            },
          ],
        },
      },
    }),
    Form: WindowForm,
  },

  cassonetto: {
    label: "Cassonetto",
    icon: cassonettoIcon,
    makeDefaults: (): CassonettoItem => ({
      id: crypto.randomUUID(),
      kind: "cassonetto",
      width_mm: 900,
      height_mm: 400,
      qty: 1,
      price_mode: "total",
      price_total: 0,
      notes: null,
      reference: "",
      custom_fields: [],
      material: "PVC",
      depth_mm: 300,
      celino_mm: null,
    }),
    Form: CassonettoForm,
  },

  zanzariera: {
    label: "Zanzariera",
    icon: zanzarieraIcon,
    makeDefaults: (): ZanzarieraItem => ({
      id: crypto.randomUUID(),
      kind: "zanzariera",
      qty: 1,
      price_mode: "per_mq",
      price_per_mq: 120,
      price_per_piece: null,
      price_total: null,
      width_mm: 1000,
      height_mm: 1500,
      misura_tipo: "vano",
      modello: "Tondo 46",
      tipologia: "Tondo verticale molla",
      profilo_colore: "030 GRIGIO OPACO",
      accessori_colore: "Nero",
      mesh: "Antracite",
      deceleratore: true,
      notes: null,
      reference: "",
      custom_fields: [],
    }),
    Form: ZanzarieraForm,
  },

  persiana: {
    label: "Persiana",
    icon: persianaIcon,
    makeDefaults: (): PersianaItem => ({
      id: crypto.randomUUID(),
      kind: "persiana",
      width_mm: 1000,
      height_mm: 1400,
      qty: 1,
      price_mode: "total",
      price_total: 0,
      price_per_mq: null,
      notes: null,
      reference: "",
      custom_fields: [],
      material: "Alluminio",
      lamelle: "fisse",
      ante: 2,
      misura_tipo: "luce",
      color: "",
    }),
    Form: PersianaForm,
  },

  tapparella: {
    label: "Tapparella",
    icon: tapparellaIcon,
    makeDefaults: (): TapparellaItem => ({
      id: crypto.randomUUID(),
      kind: "tapparella",
      width_mm: 1000,
      height_mm: 1400,
      qty: 1,
      price_mode: "total",
      price_total: 0,
      price_per_mq: null,
      notes: null,
      reference: "",
      custom_fields: [],
      material: "PVC",
      color: "",
    }),
    Form: TapparellaForm,
  },

  custom: {
    label: "Voce personalizzata",
    icon: finestraIcon,
    makeDefaults: (): CustomItem => ({
      id: crypto.randomUUID(),
      kind: "custom",
      width_mm: 1000,
      height_mm: 1000,
      qty: 1,
      price_mode: "total",
      price_total: 0,
      price_per_mq: null,
      notes: null,
      reference: "",
      custom_fields: [],
      title: "Voce personalizzata",
    }),
    Form: WindowForm, // placeholder
  },
};
