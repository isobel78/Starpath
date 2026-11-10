-- Enrollments: clients may only add courses and reorder; completion fields go through RPCs
REVOKE INSERT, UPDATE ON public.enrollments FROM authenticated;
GRANT INSERT (user_id, course_id, position) ON public.enrollments TO authenticated;
GRANT UPDATE (position) ON public.enrollments TO authenticated;

-- Lessons: must be an active enrollment, bounded unit/minutes, daily lesson cap
CREATE OR REPLACE FUNCTION public.complete_unit(_course text, _unit int, _minutes int) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); m int := greatest(5, least(coalesce(_minutes, 30), 240));
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF _unit IS NULL OR _unit < 0 OR _unit > 200 THEN RAISE EXCEPTION 'invalid lesson'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.enrollments WHERE user_id = uid AND course_id = _course AND NOT prior AND completed_at IS NULL) THEN
    RAISE EXCEPTION 'course is not in your active Starpath';
  END IF;
  IF (SELECT count(*) FROM public.lesson_completions WHERE user_id = uid AND completed_on = CURRENT_DATE) >= 20 THEN
    RAISE EXCEPTION 'daily lesson limit reached';
  END IF;
  INSERT INTO public.lesson_completions (user_id, course_id, unit_index, minutes)
  VALUES (uid, _course, _unit, m) ON CONFLICT DO NOTHING;
  IF FOUND THEN PERFORM public._award(uid, 10 + m / 6, 'lesson'); END IF;
END $$;

-- Course completion: requires active enrollment with logged lessons and a valid link format
CREATE OR REPLACE FUNCTION public.complete_course(_course text, _cert text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF coalesce(_cert,'') <> '' AND (_cert !~ '^https://\S+$' OR length(_cert) > 500) THEN RAISE EXCEPTION 'certificate must be an https link'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.lesson_completions WHERE user_id = uid AND course_id = _course) THEN
    RAISE EXCEPTION 'complete some lessons first';
  END IF;
  UPDATE public.enrollments SET certificate_url = nullif(_cert,''), completed_at = coalesce(completed_at, now())
  WHERE user_id = uid AND course_id = _course AND NOT prior;
  IF FOUND AND NOT EXISTS (SELECT 1 FROM public.xp_events WHERE user_id = uid AND reason = 'course:' || _course) THEN
    PERFORM public._award(uid, 100, 'course:' || _course);
  END IF;
END $$;

-- Prior completions: XP only with a certificate link, limited per day
CREATE OR REPLACE FUNCTION public.mark_prior_completion(_course text, _cert text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF coalesce(_cert,'') <> '' AND (_cert !~ '^https://\S+$' OR length(_cert) > 500) THEN RAISE EXCEPTION 'certificate must be an https link'; END IF;
  IF _course IS NULL OR _course !~ '^[a-z0-9-]{1,80}$' THEN RAISE EXCEPTION 'invalid course'; END IF;
  IF (SELECT count(*) FROM public.enrollments WHERE user_id = uid AND prior AND completed_at > now() - interval '1 day') >= 10 THEN
    RAISE EXCEPTION 'too many prior completions today';
  END IF;
  INSERT INTO public.enrollments (user_id, course_id, position, completed_at, certificate_url, prior)
  VALUES (uid, _course, 10000, now(), nullif(_cert,''), true)
  ON CONFLICT (user_id, course_id) DO UPDATE SET completed_at = coalesce(public.enrollments.completed_at, now()), certificate_url = nullif(_cert,''), prior = true;
  IF nullif(_cert,'') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.xp_events WHERE user_id = uid AND reason = 'course:' || _course) THEN
    PERFORM public._award(uid, 100, 'course:' || _course);
  END IF;
END $$;

-- Squad invite codes: strong random codes
ALTER TABLE public.squads ALTER COLUMN invite_code SET DEFAULT encode(extensions.gen_random_bytes(12), 'hex');
UPDATE public.squads SET invite_code = encode(extensions.gen_random_bytes(12), 'hex') WHERE length(invite_code) < 24;

-- shares_squad: only answer about the caller
CREATE OR REPLACE FUNCTION public.shares_squad(_a uuid, _b uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _a = auth.uid() AND EXISTS (SELECT 1 FROM public.squad_members x JOIN public.squad_members y ON x.squad_id = y.squad_id WHERE x.user_id = _a AND y.user_id = _b)
$$;