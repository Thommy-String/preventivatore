import type { BaseItem } from "../types"

export function surfaceMq(it: Pick<BaseItem,'width_mm'|'height_mm'>){
  const s = (it.width_mm * it.height_mm) / 1_000_000
  return Math.round(s * 100) / 100
}

export function rowTotal(it: BaseItem){
  const mode = it.price_mode ?? 'per_mq'
  if (mode === 'total') {
    return round2(it.price_total ?? 0)
  }
  if (mode === 'per_pezzo') {
    const unit = (it as any).price_per_piece ?? 0
    return round2(unit * (it.qty ?? 1))
  }
  const mq = surfaceMq(it)
  const unit = (it.price_per_mq ?? 0) * mq
  return round2(unit * (it.qty ?? 1))
}

export function euro(n: number){
  return new Intl.NumberFormat('it-IT', { style:'currency', currency:'EUR' }).format(n || 0)
}
function round2(n:number){ return Math.round(n*100)/100 }