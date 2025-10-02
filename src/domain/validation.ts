// src/domain/validation.ts
import { z } from 'zod'

export const BaseSchema = z.object({
  id: z.string(),
  kind: z.enum(['finestra','portafinestra','cassonetto','zanzariera','persiana','tapparella','custom']),
  width_mm: z.number().optional(),
  height_mm: z.number().optional(),
  qty: z.number().min(1).optional(),
  price_mode: z.enum(['per_mq','total']).optional(),
  price_per_mq: z.number().nullable().optional(),
  price_total: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  custom_fields: z.array(z.object({ key: z.string(), value: z.string() })).optional()
})

export const FinestraSchema = BaseSchema.extend({
  kind: z.enum(['finestra','portafinestra']),
  color: z.string().nullable().optional(),
  glass: z.string().nullable().optional(),
  hinges_color: z.string().nullable().optional(),
  uw: z.number().nullable().optional()
})

export const CassonettoSchema = BaseSchema.extend({
  kind: z.literal('cassonetto'),
  profondita_mm: z.number().nullable().optional(),
  ispezione: z.enum(['frontale','inferiore','superiore']).nullable().optional(),
  coibentazione: z.enum(['nessuna','standard','alta']).nullable().optional(),
  motore: z.enum(['manuale','elettrico']).nullable().optional(),
  colore: z.string().nullable().optional()
})

// …ecc. per zanzariera/persiana/tapparella