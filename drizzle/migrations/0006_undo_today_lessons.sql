CREATE OR REPLACE FUNCTION public.uncomplete_unit(_course text, _unit integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); lesson public.lesson_completions; deduction integer; bonus integer := 0;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  PERFORM 1 FROM public.profiles WHERE id = uid FOR UPDATE;
  SELECT * INTO lesson FROM public.lesson_completions WHERE user_id = uid AND course_id = _course AND unit_index = _unit AND completed_on = public.local_day(uid) FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  deduction := 10 + lesson.minutes / 6;
  DELETE FROM public.lesson_completions WHERE id = lesson.id AND user_id = uid;
  IF EXISTS (SELECT 1 FROM public.enrollments WHERE user_id = uid AND course_id = _course AND NOT prior AND completed_at IS NOT NULL) THEN
    DELETE FROM public.xp_events WHERE user_id = uid AND reason = 'course:' || _course RETURNING amount INTO bonus;
    UPDATE public.enrollments SET completed_at = NULL, certificate_url = NULL WHERE user_id = uid AND course_id = _course AND NOT prior;
  END IF;
  deduction := deduction + coalesce(bonus, 0);
  UPDATE public.profiles SET xp = greatest(0, xp - deduction) WHERE id = uid;
  INSERT INTO public.xp_events(user_id, amount, reason) VALUES (uid, -deduction, 'lesson-undo');
END;
$$;
REVOKE ALL ON FUNCTION public.uncomplete_unit(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.uncomplete_unit(text, integer) TO authenticated;
REVOKE DELETE ON public.lesson_completions FROM authenticated;

CREATE OR REPLACE FUNCTION public.complete_unit(_course text, _unit integer, _minutes integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); m int := greatest(5, least(coalesce(_minutes, 30), 240)); d date;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  PERFORM 1 FROM public.profiles WHERE id = uid FOR UPDATE;
  d := public.local_day(uid);
  IF _unit IS NULL OR _unit < 0 OR _unit > 200 THEN RAISE EXCEPTION 'invalid lesson'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.enrollments WHERE user_id = uid AND course_id = _course AND NOT prior AND completed_at IS NULL) THEN RAISE EXCEPTION 'course is not in your active Starpath'; END IF;
  IF (SELECT count(*) FROM public.lesson_completions WHERE user_id = uid AND completed_on = d) >= 20 THEN RAISE EXCEPTION 'daily lesson limit reached'; END IF;
  INSERT INTO public.lesson_completions(user_id, course_id, unit_index, minutes, completed_on)
  VALUES(uid, _course, _unit, m, d) ON CONFLICT DO NOTHING;
  IF FOUND THEN PERFORM public._award(uid, 10 + m / 6, 'lesson'); END IF;
END;
$$;