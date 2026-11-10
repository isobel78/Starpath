ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS prior boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE OR REPLACE FUNCTION public.mark_prior_completion(_course text, _cert text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF _cert <> '' AND _cert !~ '^https://\S+$' THEN RAISE EXCEPTION 'certificate must be an https link'; END IF;
  INSERT INTO public.enrollments (user_id, course_id, position, completed_at, certificate_url, prior)
  VALUES (uid, left(_course, 80), 10000, now(), nullif(_cert,''), true)
  ON CONFLICT (user_id, course_id) DO UPDATE SET completed_at = coalesce(public.enrollments.completed_at, now()), certificate_url = nullif(_cert,''), prior = true;
  IF NOT EXISTS (SELECT 1 FROM public.xp_events WHERE user_id = uid AND reason = 'course:' || _course) THEN
    PERFORM public._award(uid, 100, 'course:' || _course);
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.mark_prior_completion(text,text) TO authenticated;

CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles own read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.grant_admin_for_owner() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF new.email_confirmed_at IS NOT NULL AND lower(new.email) = 'atlanta.daniel@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN new;
END $$;
CREATE TRIGGER on_auth_user_created_grant_admin AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.grant_admin_for_owner();
CREATE TRIGGER on_auth_user_confirmed_grant_admin AFTER UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW
  WHEN (old.email_confirmed_at IS NULL AND new.email_confirmed_at IS NOT NULL) EXECUTE FUNCTION public.grant_admin_for_owner();
INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'admin' FROM auth.users WHERE lower(email) = 'atlanta.daniel@gmail.com' AND email_confirmed_at IS NOT NULL
  ON CONFLICT DO NOTHING;

CREATE TABLE public.catalog_items (
  kind text NOT NULL CHECK (kind IN ('course','track')),
  id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  hidden boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, id)
);
GRANT SELECT ON public.catalog_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.catalog_items TO authenticated;
GRANT ALL ON public.catalog_items TO service_role;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalog public read" ON public.catalog_items FOR SELECT USING (true);
CREATE POLICY "catalog admin insert" ON public.catalog_items FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "catalog admin update" ON public.catalog_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "catalog admin delete" ON public.catalog_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "avatar public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatar own upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatar own update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatar own delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);