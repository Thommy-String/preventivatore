// src/components/editor/pricing/surface.ts
import type { QuoteItem } from '@/domain/items'

export const surfaceMq = (w?: number, h?: number) => {
  if (!w || !h || w <= 0 || h <= 0) return 0
  const s = (w * h) / 1_000_000
  return round2(s)
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export const rowTotal = (it: QuoteItem) => {
  const mode = it.price_mode ?? 'per_mq'

  if (mode === 'total') {
    return round2(it.price_total ?? 0)
  }

  if (mode === 'per_pezzo') {
    const unit = (it as any).price_per_piece ?? 0
    const qty = it.qty ?? 1
    return round2(unit * qty)
  }

  // default: per m²
  const mq = surfaceMq(it.width_mm, it.height_mm)
  const unit = (it.price_per_mq ?? 0) * mq
  const qty = it.qty ?? 1
  return round2(unit * qty)
}