
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL DEFAULT 'Learner',
  bio text NOT NULL DEFAULT '',
  avatar_emoji text NOT NULL DEFAULT '🚀',
  xp integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_active_date date,
  pace_mode text NOT NULL DEFAULT 'hours',
  hours_per_week numeric NOT NULL DEFAULT 7,
  target_date date,
  track_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT UPDATE (username, display_name, bio, avatar_emoji, pace_mode, hours_per_week, target_date, track_id) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles own update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE base text;
BEGIN
  base := lower(regexp_replace(coalesce(split_part(NEW.email,'@',1),'learner'), '[^a-zA-Z0-9]', '', 'g'));
  IF base = '' THEN base := 'learner'; END IF;
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, base || substr(md5(NEW.id::text),1,4),
    coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1), 'Learner'));
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  certificate_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
GRANT SELECT ON public.enrollments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enroll public read" ON public.enrollments FOR SELECT USING (true);
CREATE POLICY "enroll own insert" ON public.enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "enroll own update" ON public.enrollments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "enroll own delete" ON public.enrollments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.lesson_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id text NOT NULL,
  unit_index integer NOT NULL,
  minutes integer NOT NULL DEFAULT 30,
  completed_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id, unit_index)
);
GRANT SELECT ON public.lesson_completions TO authenticated;
GRANT DELETE ON public.lesson_completions TO authenticated;
GRANT ALL ON public.lesson_completions TO service_role;
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lc own read" ON public.lesson_completions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "lc own delete" ON public.lesson_completions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.xp_events TO authenticated;
GRANT ALL ON public.xp_events TO service_role;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "xp read" ON public.xp_events FOR SELECT TO authenticated USING (true);

CREATE TABLE public.checkins (
  user_id uuid NOT NULL,
  day date NOT NULL DEFAULT current_date,
  mood text NOT NULL DEFAULT '🙂',
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);
GRANT SELECT ON public.checkins TO authenticated;
GRANT ALL ON public.checkins TO service_role;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkins own read" ON public.checkins FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- activity helper: award xp + update streak
CREATE OR REPLACE FUNCTION public._award(_uid uuid, _xp int, _reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF p.last_active_date IS DISTINCT FROM current_date THEN
    IF p.last_active_date = current_date - 1 THEN p.current_streak := p.current_streak + 1;
    ELSE p.current_streak := 1; END IF;
  END IF;
  UPDATE public.profiles SET xp = xp + _xp, current_streak = p.current_streak,
    longest_streak = greatest(longest_streak, p.current_streak), last_active_date = current_date WHERE id = _uid;
  INSERT INTO public.xp_events (user_id, amount, reason) VALUES (_uid, _xp, _reason);
END $$;
REVOKE ALL ON FUNCTION public._award(uuid,int,text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.complete_unit(_course text, _unit int, _minutes int) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  INSERT INTO public.lesson_completions (user_id, course_id, unit_index, minutes)
  VALUES (uid, _course, _unit, greatest(1, least(_minutes, 600)))
  ON CONFLICT DO NOTHING;
  IF FOUND THEN PERFORM public._award(uid, 10 + least(_minutes, 600) / 6, 'lesson'); END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.complete_unit(text,int,int) TO authenticated;

CREATE OR REPLACE FUNCTION public.daily_checkin(_mood text, _note text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  INSERT INTO public.checkins (user_id, mood, note) VALUES (uid, left(_mood, 8), left(_note, 280)) ON CONFLICT DO NOTHING;
  IF FOUND THEN PERFORM public._award(uid, 5, 'checkin'); END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.daily_checkin(text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_course(_course text, _cert text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  UPDATE public.enrollments SET certificate_url = nullif(_cert,''), completed_at = coalesce(completed_at, now())
  WHERE user_id = uid AND course_id = _course;
  IF FOUND AND NOT EXISTS (SELECT 1 FROM public.xp_events WHERE user_id = uid AND reason = 'course:' || _course) THEN
    PERFORM public._award(uid, 100, 'course:' || _course);
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.complete_course(text,text) TO authenticated;

-- friends
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester uuid NOT NULL,
  addressee uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester, addressee)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fr read" ON public.friendships FOR SELECT TO authenticated USING (auth.uid() IN (requester, addressee));
CREATE POLICY "fr insert" ON public.friendships FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester AND status = 'pending' AND requester <> addressee);
CREATE POLICY "fr accept" ON public.friendships FOR UPDATE TO authenticated USING (auth.uid() = addressee) WITH CHECK (status IN ('pending','accepted'));
CREATE POLICY "fr delete" ON public.friendships FOR DELETE TO authenticated USING (auth.uid() IN (requester, addressee));

-- squads
CREATE TABLE public.squads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '⭐',
  owner_id uuid NOT NULL,
  weekly_xp_goal integer NOT NULL DEFAULT 500,
  invite_code text NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.squad_members (
  squad_id uuid NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (squad_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.squads TO authenticated;
GRANT SELECT, DELETE ON public.squad_members TO authenticated;
GRANT ALL ON public.squads, public.squad_members TO service_role;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_squad_member(_squad uuid, _uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.squad_members WHERE squad_id = _squad AND user_id = _uid)
$$;

CREATE POLICY "sq read" ON public.squads FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_squad_member(id, auth.uid()));
CREATE POLICY "sq insert" ON public.squads FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "sq update" ON public.squads FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "sq delete" ON public.squads FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "sm read" ON public.squad_members FOR SELECT TO authenticated USING (public.is_squad_member(squad_id, auth.uid()));
CREATE POLICY "sm leave" ON public.squad_members FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.add_owner_member() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN INSERT INTO public.squad_members (squad_id, user_id) VALUES (NEW.id, NEW.owner_id); RETURN NEW; END $$;
CREATE TRIGGER squad_owner_member AFTER INSERT ON public.squads FOR EACH ROW EXECUTE FUNCTION public.add_owner_member();

CREATE OR REPLACE FUNCTION public.join_squad(_code text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  SELECT id INTO sid FROM public.squads WHERE invite_code = lower(trim(_code));
  IF sid IS NULL THEN RAISE EXCEPTION 'Invite code not found'; END IF;
  INSERT INTO public.squad_members (squad_id, user_id) VALUES (sid, auth.uid()) ON CONFLICT DO NOTHING;
  RETURN sid;
END $$;
GRANT EXECUTE ON FUNCTION public.join_squad(text) TO authenticated;

-- cheers
CREATE TABLE public.cheers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL,
  to_user uuid NOT NULL,
  emoji text NOT NULL DEFAULT '🎉',
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.cheers TO authenticated;
GRANT ALL ON public.cheers TO service_role;
ALTER TABLE public.cheers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ch read" ON public.cheers FOR SELECT TO authenticated USING (auth.uid() IN (from_user, to_user));
CREATE POLICY "ch send" ON public.cheers FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user AND from_user <> to_user AND char_length(message) <= 200);
CREATE POLICY "ch del" ON public.cheers FOR DELETE TO authenticated USING (auth.uid() = to_user);
