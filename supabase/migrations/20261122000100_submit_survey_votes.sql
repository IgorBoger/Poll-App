begin;

-- Die manuell angelegte Spalte auch für neue Datenbanken festhalten.
alter table public.survey_answer_options
  add column if not exists vote_count bigint not null default 0
  check (vote_count >= 0);

create or replace function public.submit_survey_votes(
  p_survey_id uuid,
  p_answer_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ends_at timestamptz;
  v_matching_answers bigint;
  v_updated_answers bigint;
begin
  -- Dieselbe Survey wird während dieser Abgabe gegen Änderungen gesperrt.
  select ends_at into v_ends_at
  from public.surveys
  where id = p_survey_id
  for update;

  if not found then
    raise exception 'Survey not found.';
  end if;

  if v_ends_at is not null and v_ends_at <= clock_timestamp() then
    raise exception 'This survey has ended.';
  end if;

  if p_answer_ids is null or cardinality(p_answer_ids) = 0 then
    raise exception 'Please answer all questions.';
  end if;

  if cardinality(p_answer_ids) <> (
    select count(distinct answer_id)
    from unnest(p_answer_ids) as selected(answer_id)
  ) then
    raise exception 'Answer IDs must be unique and must not be empty.';
  end if;

  -- Jede übergebene Antwort muss zu einer Frage dieser Survey gehören.
  select count(*) into v_matching_answers
  from public.survey_answer_options a
  join public.survey_questions q on q.id = a.question_id
  where q.survey_id = p_survey_id and a.id = any(p_answer_ids);

  if v_matching_answers <> cardinality(p_answer_ids) then
    raise exception 'An answer does not belong to this survey.';
  end if;

  if not exists (
    select 1 from public.survey_questions where survey_id = p_survey_id
  ) then
    raise exception 'This survey has no questions.';
  end if;

  -- Jede Frage braucht eine Antwort; Einzelwahl erlaubt genau eine.
  if exists (
    select q.id
    from public.survey_questions q
    left join public.survey_answer_options a
      on a.question_id = q.id and a.id = any(p_answer_ids)
    where q.survey_id = p_survey_id
    group by q.id, q.allow_multiple_answers
    having count(a.id) = 0
      or (not coalesce(q.allow_multiple_answers, false) and count(a.id) > 1)
  ) then
    raise exception 'Please answer every question and respect the selection limits.';
  end if;

  -- Alle ausgewählten Zähler gemeinsam direkt in der Datenbank erhöhen.
  update public.survey_answer_options
  set vote_count = vote_count + 1
  where id = any(p_answer_ids);

  get diagnostics v_updated_answers = row_count;
  if v_updated_answers <> cardinality(p_answer_ids) then
    raise exception 'The answers changed. Please reload the survey and try again.';
  end if;
end;
$$;

revoke execute on function public.submit_survey_votes(uuid, uuid[])
  from public, anon, authenticated;

grant execute on function public.submit_survey_votes(uuid, uuid[])
  to anon;

commit;
