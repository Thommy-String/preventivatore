-- Bucket per immagini voci preventivo
insert into storage.buckets (id, name, public)
values ('quote-item-images', 'quote-item-images', true)
on conflict (id) do nothing;

-- Lettura pubblica immagini del bucket
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'quote_item_images_public_read'
  ) then
    create policy quote_item_images_public_read
      on storage.objects
      for select
      to public
      using (bucket_id = 'quote-item-images');
  end if;
end
$$;

-- Upload dal frontend (anon key)
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'quote_item_images_anon_insert'
  ) then
    create policy quote_item_images_anon_insert
      on storage.objects
      for insert
      to anon
      with check (bucket_id = 'quote-item-images');
  end if;
end
$$;

-- Upload anche per eventuali utenti autenticati
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'quote_item_images_auth_insert'
  ) then
    create policy quote_item_images_auth_insert
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'quote-item-images');
  end if;
end
$$;