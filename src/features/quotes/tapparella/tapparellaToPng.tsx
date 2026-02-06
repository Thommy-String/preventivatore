import * as ReactDOMClient from "react-dom/client";
import TapparellaSvg, { type TapparellaConfig } from "./TapparellaSvg";

/**
 * Renderizza TapparellaSvg off-screen e restituisce un Blob PNG.
 */
export async function tapparellaToPngBlob(
  cfg: TapparellaConfig,
  widthPx = 640,
  heightPx = 640
): Promise<Blob> {
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
      <TapparellaSvg cfg={cfg} />
    </div>
  );

  await new Promise((r) => setTimeout(r, 50));

  const svgEl = container.querySelector("svg");
  if (!svgEl) {
    root.unmount();
    container.remove();
    throw new Error("Tapparella SVG non generato");
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
  img.crossOrigin = "anonymous";
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = widthPx;
      canvas.height = heightPx;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(svgUrl);
        reject(new Error("Canvas context null"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((blob) => {
        root.unmount();
        container.remove();
        if (blob) resolve(blob);
        else reject(new Error("Blob null"));
      }, "image/png");
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(svgUrl);
      root.unmount();
      container.remove();
      reject(e);
    };
    img.src = svgUrl;
  });
}
