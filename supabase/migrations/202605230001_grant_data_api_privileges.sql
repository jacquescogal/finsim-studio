grant usage on schema public to anon, authenticated, service_role;

grant select on public.lessons, public.lesson_content to anon, authenticated;

grant all privileges on
  public.lessons,
  public.source_materials,
  public.lesson_content,
  public.review_checklists,
  public.learner_sessions
  to service_role;
