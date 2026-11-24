begin;

-- Publish answer changes so clients can subscribe to vote updates.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'survey_answer_options'
  ) then
    alter publication supabase_realtime
      add table public.survey_answer_options;
  end if;
end;
$$;

commit;
