import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'ghost' | 'outline'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant='primary', className, ...props }, ref
){
  const base = 'btn'
  const v =
    variant === 'primary' ? 'btn-primary' :
    variant === 'ghost' ? 'btn-ghost' :
    'btn-outline'
  return <button ref={ref} className={cn(base, v, className)} {...props} />
})