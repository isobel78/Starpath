CREATE OR REPLACE FUNCTION public.complete_unit(_course text, _unit integer, _minutes integer)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid(); m int := greatest(5, least(coalesce(_minutes, 30), 240)); d date; n int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  PERFORM 1 FROM public.profiles WHERE id = uid FOR UPDATE;
  d := public.local_day(uid);
  IF _unit IS NULL OR _unit < 0 OR _unit > 200 THEN RAISE EXCEPTION 'invalid lesson'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.enrollments WHERE user_id = uid AND course_id = _course AND NOT prior AND completed_at IS NULL) THEN RAISE EXCEPTION 'course is not in your active Starpath'; END IF;
  SELECT count(*) INTO n FROM public.lesson_completions WHERE user_id = uid AND completed_on = d;
  INSERT INTO public.lesson_completions(user_id, course_id, unit_index, minutes, completed_on)
  VALUES(uid, _course, _unit, m, d) ON CONFLICT DO NOTHING;
  IF FOUND AND n < 20 THEN PERFORM public._award(uid, 10 + m / 6, 'lesson'); END IF;
END;
$function$;