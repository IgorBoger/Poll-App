begin;

create function public.create_survey(
  p_title text,
  p_category text,
  p_description text,
  p_ends_at timestamptz,
  p_questions jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_survey_id uuid;
  v_question_id uuid;
  v_question jsonb;
  v_answer jsonb;
  v_question_position bigint := 0;
  v_answer_position bigint;
begin
  -- Survey-Daten prüfen.
  if coalesce(btrim(p_title), '') = '' then
    raise exception 'Enter a survey name.';
  end if;

  if p_category is null or p_category not in (
    'Gaming & entertainment',
    'Health & wellness',
    'Technology & innovation',
    'Lifestyle & preferences',
    'Team activities',
    'Education & learning'
  ) then
    raise exception 'Choose a valid category.';
  end if;

  if jsonb_typeof(p_questions) is distinct from 'array' then
    raise exception 'Questions must be an array.';
  end if;

  if jsonb_array_length(p_questions) = 0 then
    raise exception 'Add at least one question.';
  end if;

  -- Survey speichern und ihre automatisch erzeugte ID merken.
  insert into public.surveys (
    title, category, description, ends_at
  )
  values (
    btrim(p_title),
    p_category,
    nullif(btrim(p_description), ''),
    p_ends_at
  )
  returning id into v_survey_id;

  -- Fragen nacheinander verarbeiten.
  for v_question in
    select value from jsonb_array_elements(p_questions)
  loop
    if jsonb_typeof(v_question) is distinct from 'object' then
      raise exception 'Invalid question.';
    end if;

    if jsonb_typeof(v_question -> 'text') is distinct from 'string'
       or coalesce(btrim(v_question ->> 'text'), '') = '' then
      raise exception 'Enter a question.';
    end if;

    if jsonb_typeof(v_question -> 'allowMultipleAnswers')
       is distinct from 'boolean' then
      raise exception 'Multiple answers must be true or false.';
    end if;

    if jsonb_typeof(v_question -> 'answers') is distinct from 'array' then
      raise exception 'Answers must be an array.';
    end if;

    if jsonb_array_length(v_question -> 'answers') not between 2 and 6 then
      raise exception 'Each question needs 2 to 6 answers.';
    end if;

    v_question_position := v_question_position + 1;

    insert into public.survey_questions (
      survey_id, text, position, allow_multiple_answers
    )
    values (
      v_survey_id,
      btrim(v_question ->> 'text'),
      v_question_position,
      (v_question ->> 'allowMultipleAnswers')::boolean
    )
    returning id into v_question_id;

    -- Antworten der aktuellen Frage speichern.
    v_answer_position := 0;

    for v_answer in
      select value
      from jsonb_array_elements(v_question -> 'answers')
    loop
      if jsonb_typeof(v_answer) is distinct from 'string' then
        raise exception 'Each answer must be text.';
      end if;

      if coalesce(btrim(v_answer #>> '{}'), '') = '' then
        raise exception 'Enter an answer.';
      end if;

      v_answer_position := v_answer_position + 1;

      insert into public.survey_answer_options (
        question_id, text, position
      )
      values (
        v_question_id,
        btrim(v_answer #>> '{}'),
        v_answer_position
      );
    end loop;
  end loop;

  return v_survey_id;
end;
$$;

-- Ausführungsrechte gezielt für Besucher ohne Anmeldung setzen.
revoke execute on function public.create_survey(
  text, text, text, timestamptz, jsonb
) from public, anon, authenticated;

grant execute on function public.create_survey(
  text, text, text, timestamptz, jsonb
) to anon;

commit;
