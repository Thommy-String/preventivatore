import * as ReactDOMClient from 'react-dom/client'
import { PortaBlindataSvg } from './PortaBlindataSvg'
import type { PortaBlindataItem } from '../types'

export async function portaBlindataToPngBlob(
  item: PortaBlindataItem,
  widthPx = 900,
  heightPx = 900
): Promise<Blob> {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-99999px'
  container.style.top = '-99999px'
  container.style.width = `${widthPx}px`
  container.style.height = `${heightPx}px`
  container.style.pointerEvents = 'none'
  document.body.appendChild(container)

  const root = ReactDOMClient.createRoot(container)
  // Use previewColor if available
  const displayColor = item.options?.previewColor || item.color

  root.render(
    <div style={{ width: widthPx, height: heightPx }}>
      <PortaBlindataSvg 
          width_mm={item.width_mm} 
          height_mm={item.height_mm} 
          color={displayColor} 
          serratura={item.serratura}
          spioncino={item.spioncino}
          handle_position={item.handle_position}
          handle_color={item.options?.handleColor}
      />
    </div>
  )

  await new Promise((r) => setTimeout(r, 50))

  const svgEl = container.querySelector('svg')
  if (!svgEl) {
    root.unmount()
    container.remove()
    throw new Error('PortaBlindata SVG non generato')
  }

  svgEl.setAttribute('width', String(widthPx))
  svgEl.setAttribute('height', String(heightPx))
  if (!svgEl.getAttribute('xmlns')) {
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  }

  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svgEl)
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  const img = new Image()
  img.decoding = 'async'
  img.src = svgUrl

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Image onload fail'))
  })

  // Canvas draw
  const canvas = document.createElement('canvas')
  canvas.width = widthPx
  canvas.height = heightPx
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    URL.revokeObjectURL(svgUrl)
    root.unmount()
    container.remove()
    throw new Error('Canvas 2D context null')
  }

  // ctx.fillStyle = '#ffffff'
  // ctx.fillRect(0, 0, widthPx, heightPx)
  ctx.drawImage(img, 0, 0, widthPx, heightPx)

  URL.revokeObjectURL(svgUrl)
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      root.unmount()
      container.remove()
      if (blob) resolve(blob)
      else resolve(new Blob([])) // fallback
    }, 'image/png')
  })
}
