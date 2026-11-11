-- Time zone per learner, day boundary at 03:00 local
ALTER TABLE public.profiles ADD COLUMN tz text NOT NULL DEFAULT 'UTC';

CREATE OR REPLACE FUNCTION public.local_day(_uid uuid) RETURNS date LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ((now() AT TIME ZONE coalesce(
    (SELECT p.tz FROM public.profiles p WHERE p.id = _uid AND EXISTS (SELECT 1 FROM pg_timezone_names n WHERE n.name = p.tz)),
    'UTC')) - interval '3 hours')::date
$$;
REVOKE EXECUTE ON FUNCTION public.local_day(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.local_day(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public._award(_uid uuid, _xp int, _reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles; d date := public.local_day(_uid);
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF p.last_active_date IS DISTINCT FROM d THEN
    IF p.last_active_date = d - 1 THEN p.current_streak := p.current_streak + 1;
    ELSE p.current_streak := 1; END IF;
  END IF;
  UPDATE public.profiles SET xp = xp + _xp, current_streak = p.current_streak,
    longest_streak = greatest(longest_streak, p.current_streak), last_active_date = greatest(coalesce(last_active_date, d), d) WHERE id = _uid;
  INSERT INTO public.xp_events (user_id, amount, reason) VALUES (_uid, _xp, _reason);
END $$;
REVOKE ALL ON FUNCTION public._award(uuid,int,text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.complete_unit(_course text, _unit int, _minutes int) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); m int := greatest(5, least(coalesce(_minutes, 30), 240)); d date;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  d := public.local_day(uid);
  IF _unit IS NULL OR _unit < 0 OR _unit > 200 THEN RAISE EXCEPTION 'invalid lesson'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.enrollments WHERE user_id = uid AND course_id = _course AND NOT prior AND completed_at IS NULL) THEN
    RAISE EXCEPTION 'course is not in your active Starpath';
  END IF;
  IF (SELECT count(*) FROM public.lesson_completions WHERE user_id = uid AND completed_on = d) >= 20 THEN
    RAISE EXCEPTION 'daily lesson limit reached';
  END IF;
  INSERT INTO public.lesson_completions (user_id, course_id, unit_index, minutes, completed_on)
  VALUES (uid, _course, _unit, m, d) ON CONFLICT DO NOTHING;
  IF FOUND THEN PERFORM public._award(uid, 10 + m / 6, 'lesson'); END IF;
END $$;

CREATE OR REPLACE FUNCTION public.daily_checkin(_mood text, _note text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  INSERT INTO public.checkins (user_id, mood, note, day) VALUES (uid, left(_mood, 8), left(_note, 280), public.local_day(uid)) ON CONFLICT DO NOTHING;
  IF FOUND THEN PERFORM public._award(uid, 5, 'checkin'); END IF;
END $$;

-- Display name from sign-up form
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE base text;
BEGIN
  base := lower(regexp_replace(coalesce(split_part(NEW.email,'@',1),'learner'), '[^a-zA-Z0-9]', '', 'g'));
  IF base = '' THEN base := 'learner'; END IF;
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, base || substr(md5(NEW.id::text),1,4),
    left(coalesce(nullif(trim(NEW.raw_user_meta_data->>'display_name'),''), NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1), 'Learner'), 40));
  RETURN NEW;
END $$;

-- Extra credit enrollments
ALTER TABLE public.enrollments ADD COLUMN extra boolean NOT NULL DEFAULT false;
GRANT INSERT (extra) ON public.enrollments TO authenticated;
GRANT UPDATE (extra) ON public.enrollments TO authenticated;

-- Learner-added courses
CREATE TABLE public.user_courses (
  id text PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_courses_id_format CHECK (id ~ '^u-[a-z0-9-]{4,60}$')
);
GRANT SELECT, INSERT, DELETE ON public.user_courses TO authenticated;
GRANT ALL ON public.user_courses TO service_role;
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uc own read" ON public.user_courses FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "uc own insert" ON public.user_courses FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id
  AND (data->>'url') ~* '^https://([a-z0-9-]+\.)*(boot\.dev|freecodecamp\.org|cs50\.harvard\.edu|cs50\.dev|theodinproject\.com|exercism\.org|roadmap\.sh)(/|$)'
  AND length(data::text) < 8000);
CREATE POLICY "uc own delete" ON public.user_courses FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE VIEW public.public_user_courses AS SELECT id, data->>'title' AS title, data->>'provider' AS provider FROM public.user_courses;
GRANT SELECT ON public.public_user_courses TO anon, authenticated;

-- Squad weekly goal award
CREATE OR REPLACE FUNCTION public.claim_squad_award(_squad uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); wk timestamptz := date_trunc('week', now()); goal int; total int; tag text;
BEGIN
  IF uid IS NULL OR NOT public.is_squad_member(_squad, uid) THEN RETURN false; END IF;
  SELECT weekly_xp_goal INTO goal FROM public.squads WHERE id = _squad;
  SELECT coalesce(sum(e.amount),0) INTO total FROM public.xp_events e
    JOIN public.squad_members m ON m.user_id = e.user_id AND m.squad_id = _squad
    WHERE e.created_at >= wk AND e.reason NOT LIKE 'squad:%';
  IF total < goal THEN RETURN false; END IF;
  tag := 'squad:' || _squad || ':' || to_char(wk, 'YYYY-MM-DD');
  IF EXISTS (SELECT 1 FROM public.xp_events WHERE user_id = uid AND reason = tag) THEN RETURN false; END IF;
  PERFORM public._award(uid, 50, tag);
  RETURN true;
END $$;
REVOKE EXECUTE ON FUNCTION public.claim_squad_award(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_squad_award(uuid) TO authenticated;