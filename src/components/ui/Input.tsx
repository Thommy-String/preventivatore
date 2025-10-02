import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from './cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function InputComp(
  { className, ...props }, ref
){
  return <input ref={ref} className={cn('input', className)} {...props} />
})