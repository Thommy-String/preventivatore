import type { HTMLAttributes } from 'react'
import { cn } from './cn'

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('badge', className)} {...props} />
}