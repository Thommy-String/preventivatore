// src/features/quotes/svg/windowToPng.tsx
import * as ReactDOMClient from "react-dom/client";
import WindowSvg from "../window/WindowSvg";

type GridWindowConfig = any;

/**
 * Renderizza WindowSvg off-screen e restituisce un Blob PNG.
 * @param grid dati di options.gridWindow
 * @param widthPx larghezza PNG in px (es. 640)
 * @param heightPx altezza PNG in px (es. 640)
 */
export async function gridWindowToPngBlob(
  grid: GridWindowConfig,
  widthPx = 640,
  heightPx = 640
): Promise<Blob> {
  // 1) mount off-screen
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-99999px";
  container.style.top = "-99999px";
  container.style.width = `${widthPx}px`;
  container.style.height = `${heightPx}px`;
  container.style.pointerEvents = "none";
  document.body.appendChild(container);

  // 2) render SVG (prop corretta: cfg)
  const root = ReactDOMClient.createRoot(container);
  root.render(
    <div style={{ width: widthPx, height: heightPx }}>
      <WindowSvg cfg={grid} />
    </div>
  );

  // 3) attendi commit + paint
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => requestAnimationFrame(() => r(null as any)));

  // 4) recupera lo <svg>
  const svgEl = container.querySelector("svg");
  if (!svgEl) {
    console.error("windowToPng: nessun <svg> trovato nel container", {
      html: container.innerHTML.slice(0, 200),
    });
    root.unmount();
    container.remove();
    throw new Error("SVG non generato");
  }

  // assicura width/height e namespace
  svgEl.setAttribute("width", String(widthPx));
  svgEl.setAttribute("height", String(heightPx));
  if (!svgEl.getAttribute("xmlns")) {
    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  // 5) serializza in stringa
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgEl);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  // 6) carica in <img>, disegna su <canvas>, estrai PNG
  const img = new Image();
  img.decoding = "async";
  img.src = svgUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Caricamento SVG→IMG fallito"));
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

  // 7) cleanup DOM & URL
  root.unmount();
  container.remove();
  URL.revokeObjectURL(svgUrl);

  // 8) toBlob PNG
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob fallito"))),
      "image/png",
      0.92
    )
  );

  return blob;
}