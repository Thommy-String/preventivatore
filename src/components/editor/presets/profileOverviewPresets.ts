// src/components/editor/presets/profileOverviewPresets.ts
import type { ProfileOverview, ProfileOverviewFeature } from "../../../stores/useQuoteStore";

// ⬇️ importa le immagini (mettile in: src/assets/images/profiles/)
import alumilS77Img from "../../../assets/images/profiles/alumil-s77.png";
import wds76mdImg from "../../../assets/images/profiles/wds-76-md.jpg";
import wds76adImg from "../../../assets/images/profiles/wds-76-ad.jpg";
import wds70DoubleImg from "../../../assets/images/profiles/WDS 70 doppio vetro.jpg";
import wds76adDoubleImg from "../../../assets/images/profiles/WDS 76 AD doppio vetro.jpeg";
import wds76mdDoubleImg from "../../../assets/images/profiles/wds 76 md doppio vetro sfondo bianco.jpg";
import xPrem76PorteImg from "../../../assets/images/profiles/x-premium-76-porte.jpg";
import xPrem76ScorrImg from "../../../assets/images/profiles/x-premium-76-scorrevole.jpg";
import xUltra70Img from "../../../assets/images/profiles/x-ultra-70.jpg";
import xUltra60Img from "../../../assets/images/profiles/x-ultra-60.jpg";

const f = (eyebrow: string, title: string, description: string): ProfileOverviewFeature => ({
  id: crypto.randomUUID(),
  eyebrow, title, description,
});

export type PO_Preset = ProfileOverview & {
  key: string;
  label: string;
  imageUrlDouble?: string | null;
  imageUrlTriple?: string | null;
};

export const PROFILE_OVERVIEW_PRESETS: PO_Preset[] = [
  {
    key: "alumil-s77",
    label: "Alumil S77",
    imageUrl: alumilS77Img,
    features: [
      f("Modello", "Alumil S77", "Sistema in alluminio per la massima performance."),
      f("Profondità telaio", "77 mm", "Garantisce alta stabilità e isolamento."),
      f("Guarnizioni", "3", "Tripla guarnizione per elevata tenuta all’aria, acqua e rumore."),
      f("Taglio termico", "Caldo", "Riduce la dispersione termica e acustica."),
    ],
  },

  // ——— PVC: WDS 76 MD
  {
    key: "wds-76-md",
    label: "WDS 76 MD",
    imageUrl: wds76mdImg,
    imageUrlDouble: wds76mdDoubleImg,
    features: [
      f("Modello", "WDS 76 MD", "Profilo in PVC Premium"),
      f("Larghezza profilo", "76 mm", "Struttura robusta per serramenti moderni."),
      f("Numero camere", "6", "Ottimo isolamento termico e acustico."),
      f("Numero guarnizioni", "3", "Tenuta efficace ad aria e acqua."),
    ],
  },

  // ——— PVC: WDS 76 AD
  {
    key: "wds-76-ad",
    label: "WDS 76 AD",
    imageUrl: wds76adImg,
    imageUrlDouble: wds76adDoubleImg,
    features: [
      f("Modello", "WDS 76 AD", "Profilo in PVC Premium"),
      f("Larghezza profilo", "76 mm", "Soluzione versatile e conveniente."),
      f("Numero camere", "5", "Buon isolamento termico."),
      f("Numero guarnizioni", "2", "Protezione dagli agenti atmosferici."),
    ],
  },

  // ——— PVC: 76 Porte
  {
    key: "x-premium-76-porte",
    label: "X Premium 76 Porte",
    imageUrl: xPrem76PorteImg,
    features: [
      f("Modello", "X Premium 76 Porte", "Profilo per porte in PVC."),
      f("Larghezza profilo", "76 mm", "Rigidità adeguata per portoncini."),
      f("Numero camere", "4", "Equilibrio tra peso e isolamento."),
      f("Numero guarnizioni", "2", "Chiusura affidabile."),
    ],
  },

  // ——— PVC: 76 Scorrevole
  {
    key: "x-premium-76-scorrevole",
    label: "X Premium 76 Scorrevole",
    imageUrl: xPrem76ScorrImg,
    features: [
      f("Modello", "X Premium 76 Scorrevole", "Profilo per sistemi scorrevoli."),
      f("Larghezza profilo", "146 mm", "Struttura maggiorata per scorrevoli."),
      f("Larghezza anta", "76 mm", "Modulo anta standard."),
      f("Camere nell’anta", "5", "Rigidezza e isolamento."),
    ],
  },

  // ——— X Ultra 70
  {
    key: "x-ultra-70",
    label: "X Ultra 70",
    imageUrl: xUltra70Img,
    imageUrlDouble: wds70DoubleImg,
    features: [
      f("Modello", "X Ultra 70", "Finestra in PVC ad alte prestazioni."),
      f("Larghezza profilo", "70 mm", "Compatta e isolante."),
      f("Numero camere", "5", "Buon isolamento termico."),
      f("Numero guarnizioni", "2", "Tenuta efficace."),
    ],
  },

  // ——— X Ultra 60
  {
    key: "x-ultra-60",
    label: "X Ultra 60",
    imageUrl: xUltra60Img,
    features: [
      f("Modello", "X Ultra 60", "Soluzione entry con ottimo rapporto qualità/prezzo."),
      f("Larghezza profilo", "60 mm", "Profilo snello."),
      f("Numero camere", "3", "Isolamento essenziale."),
      f("Numero guarnizioni", "2", "Protezione dagli agenti atmosferici."),
    ],
  },
];