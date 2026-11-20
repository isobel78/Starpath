DROP POLICY IF EXISTS "uc own insert" ON public.user_courses;
CREATE POLICY "uc own insert" ON public.user_courses FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND length(data::text) < 8000
  AND (
    (data ->> 'url') ~* '^https://([a-z0-9-]+\.)*(boot\.dev|freecodecamp\.org|cs50\.harvard\.edu|cs50\.dev|theodinproject\.com|exercism\.org|roadmap\.sh)(/|$)'
    OR (data ->> 'url') ~* '^https://([a-z0-9-]+\.)*edx\.org/[^?#]*cs50'
    OR (public.has_role(auth.uid(), 'admin'::app_role) AND (data ->> 'url') ~* '^https://[a-z0-9.-]+\.[a-z]{2,}(/|$)')
  )
);