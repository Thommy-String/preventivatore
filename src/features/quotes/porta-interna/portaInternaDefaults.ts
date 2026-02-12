import type { PortaInternaItem } from "../types";
import portaInternaIcon from "../../../assets/images/finestra.png"; // Placeholder, replace with correct icon if available

export const makePortaInternaDefaults = (): PortaInternaItem => ({
  id: crypto.randomUUID(),
  kind: "porta_interna",
  width_mm: 800,
  height_mm: 2100,
  qty: 1,
  price_mode: "total",
  price_total: 0,
  notes: null,
  reference: "",
  custom_fields: [],
  color: "Bianco", // bianca di base
  title: "Porta Interna",
  apertura: "battente",
  handle_position: "right",
  sliding_direction: undefined,
  options: {},
});

export const portaInternaIconPath: string = portaInternaIcon as string;
