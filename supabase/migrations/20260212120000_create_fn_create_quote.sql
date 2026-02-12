create or replace function public.fn_create_quote(
  p_customer_email text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_type text,
  p_job_address text,
  p_notes text,
  p_price_list_id uuid,
  p_terms text,
  p_validity_days integer,
  p_vat text
)
returns table (
  quote_id uuid,
  version_id uuid,
  quote_number text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year int := extract(year from current_date)::int;
  v_counter int;
begin
  lock table public.quotes in share row exclusive mode;

  select coalesce(max(counter), 0) + 1
    into v_counter
  from public.quotes
  where year = v_year;

  insert into public.quotes (
    year,
    counter,
    status,
    customer_type,
    customer_name,
    customer_email,
    customer_phone,
    job_address,
    validity_days,
    vat,
    terms,
    notes,
    issue_date
  )
  values (
    v_year,
    v_counter,
    'bozza',
    coalesce(nullif(trim(p_customer_type), ''), 'privato'),
    nullif(trim(p_customer_name), ''),
    nullif(trim(p_customer_email), ''),
    nullif(trim(p_customer_phone), ''),
    nullif(trim(p_job_address), ''),
    coalesce(p_validity_days, 15),
    coalesce(nullif(trim(p_vat), ''), '22'),
    nullif(trim(p_terms), ''),
    nullif(trim(p_notes), ''),
    current_date
  )
  returning id, number into quote_id, quote_number;

  begin
    insert into public.quote_versions (quote_id, version_no)
    values (quote_id, 1)
    returning id into version_id;
  exception
    when undefined_table then
      version_id := null;
    when undefined_column then
      version_id := null;
  end;

  return next;
end;
$$;

grant execute on function public.fn_create_quote(
  text, text, text, text, text, text, uuid, text, integer, text
) to anon, authenticated, service_role;
