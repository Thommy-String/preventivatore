-- Add missing shipping_included flag to quotes.
alter table public.quotes
  add column if not exists shipping_included boolean not null default true;

comment on column public.quotes.shipping_included is
  'If true the PDF shows "Trasporto incluso" in totals; default true for backward compatibility.';
