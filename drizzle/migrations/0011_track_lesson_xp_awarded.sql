ALTER TABLE public.lesson_completions ADD COLUMN IF NOT EXISTS xp_awarded integer;

CREATE OR REPLACE FUNCTION public.complete_unit(_course text, _unit integer, _minutes integer)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid(); m int := greatest(5, least(coalesce(_minutes, 30), 240)); d date; n int; amt int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  PERFORM 1 FROM public.profiles WHERE id = uid FOR UPDATE;
  d := public.local_day(uid);
  IF _unit IS NULL OR _unit < 0 OR _unit > 200 THEN RAISE EXCEPTION 'invalid lesson'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.enrollments WHERE user_id = uid AND course_id = _course AND NOT prior AND completed_at IS NULL) THEN RAISE EXCEPTION 'course is not in your active Starpath'; END IF;
  SELECT count(*) INTO n FROM public.lesson_completions WHERE user_id = uid AND completed_on = d AND coalesce(xp_awarded, 1) > 0;
  amt := CASE WHEN n < 20 THEN 10 + m / 6 ELSE 0 END;
  INSERT INTO public.lesson_completions(user_id, course_id, unit_index, minutes, completed_on, xp_awarded)
  VALUES(uid, _course, _unit, m, d, amt) ON CONFLICT DO NOTHING;
  IF FOUND AND amt > 0 THEN PERFORM public._award(uid, amt, 'lesson'); END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.uncomplete_unit(_course text, _unit integer)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid(); lesson public.lesson_completions; deduction integer; bonus integer := 0;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  PERFORM 1 FROM public.profiles WHERE id = uid FOR UPDATE;
  SELECT * INTO lesson FROM public.lesson_completions WHERE user_id = uid AND course_id = _course AND unit_index = _unit AND completed_on = public.local_day(uid) FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  deduction := coalesce(lesson.xp_awarded, 10 + lesson.minutes / 6);
  DELETE FROM public.lesson_completions WHERE id = lesson.id AND user_id = uid;
  IF EXISTS (SELECT 1 FROM public.enrollments WHERE user_id = uid AND course_id = _course AND NOT prior AND completed_at IS NOT NULL) THEN
    DELETE FROM public.xp_events WHERE user_id = uid AND reason = 'course:' || _course RETURNING amount INTO bonus;
    UPDATE public.enrollments SET completed_at = NULL, certificate_url = NULL WHERE user_id = uid AND course_id = _course AND NOT prior;
  END IF;
  deduction := deduction + coalesce(bonus, 0);
  IF deduction > 0 THEN
    UPDATE public.profiles SET xp = greatest(0, xp - deduction) WHERE id = uid;
    INSERT INTO public.xp_events(user_id, amount, reason) VALUES (uid, -deduction, 'lesson-undo');
  END IF;
END;
$function$;