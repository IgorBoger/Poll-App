begin;

-- Erlaubt das Lesen der Fragen in der öffentlichen Survey-Ansicht.
create policy "Anyone can read survey questions"
on public.survey_questions
for select
to anon, authenticated
using (true);

-- Erlaubt das Lesen der zugehörigen Antwortoptionen.
create policy "Anyone can read survey answer options"
on public.survey_answer_options
for select
to anon, authenticated
using (true);

commit;
