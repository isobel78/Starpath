CREATE OR REPLACE FUNCTION public.shares_squad(_a uuid, _b uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.squad_members x JOIN public.squad_members y ON x.squad_id = y.squad_id WHERE x.user_id = _a AND y.user_id = _b)
$$;
REVOKE EXECUTE ON FUNCTION public.shares_squad(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.shares_squad(uuid, uuid) TO authenticated;

DROP POLICY "xp read" ON public.xp_events;
CREATE POLICY "xp read own or squad" ON public.xp_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.shares_squad(auth.uid(), user_id));

DROP POLICY "catalog public read" ON public.catalog_items;
CREATE POLICY "catalog public read" ON public.catalog_items FOR SELECT USING (kind IN ('course','track'));

DROP POLICY "profiles public read" ON public.profiles;
CREATE POLICY "profiles own read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE VIEW public.public_profiles AS
  SELECT id, username, display_name, bio, avatar_emoji, avatar_url, xp, current_streak, longest_streak, track_id, created_at FROM public.profiles;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

DROP POLICY "enroll public read" ON public.enrollments;
CREATE POLICY "enroll own read" ON public.enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE VIEW public.public_enrollments AS
  SELECT user_id, course_id, position, completed_at, certificate_url FROM public.enrollments;
GRANT SELECT ON public.public_enrollments TO anon, authenticated;

DROP POLICY IF EXISTS "avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "avatar own upload" ON storage.objects;
DROP POLICY IF EXISTS "avatar own update" ON storage.objects;
DROP POLICY IF EXISTS "avatar own delete" ON storage.objects;