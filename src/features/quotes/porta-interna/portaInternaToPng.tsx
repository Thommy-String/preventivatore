// Genera un PNG Blob dalla PortaInternaSvg (browser-friendly, usa rendering DOM)
import * as ReactDOMClient from "react-dom/client";
import { PortaInternaSvg } from "./PortaInternaSvg";
import type { PortaInternaItem } from "../types";

/**
 * Renderizza PortaInternaSvg off-screen e restituisce un Blob PNG.
 */
export async function portaInternaToPngBlob(
  item: PortaInternaItem,
  widthPx = 640,
  heightPx = 640
): Promise<Blob> {
  // Safety check: ensure item exists
  if (!item) {
    throw new Error("Item is null or undefined");
  }

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-99999px";
  container.style.top = "-99999px";
  container.style.width = `${widthPx}px`;
  container.style.height = `${heightPx}px`;
  container.style.pointerEvents = "none";
  document.body.appendChild(container);

  const root = ReactDOMClient.createRoot(container);
  root.render(
    <div style={{ width: widthPx, height: heightPx }}>
      <PortaInternaSvg item={item} handle_color={item.options?.handleColor} />
    </div>
  );

  await new Promise((r) => setTimeout(r, 50)); // Timeout per permettere il rendering

  const svgEl = container.querySelector("svg");
  if (!svgEl) {
    root.unmount();
    container.remove();
    throw new Error("Porta Interna SVG non generato");
  }

  svgEl.setAttribute("width", String(widthPx));
  svgEl.setAttribute("height", String(heightPx));
  if (!svgEl.getAttribute("xmlns")) {
    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgEl);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.decoding = "async";
  img.src = svgUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (err) => reject(new Error(`Caricamento SVG in IMG fallito: ${err}`));
  });

  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    root.unmount();
    container.remove();
    URL.revokeObjectURL(svgUrl);
    throw new Error("Canvas non disponibile");
  }
  ctx.drawImage(img, 0, 0, widthPx, heightPx);

  root.unmount();
  container.remove();
  URL.revokeObjectURL(svgUrl);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob fallito"))), "image/png", 0.92)
  );

  return blob;
}
