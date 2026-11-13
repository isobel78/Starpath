CREATE TABLE public.user_game_wishlist (
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 game_id uuid NOT NULL REFERENCES public.arcade_games(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id, game_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_game_wishlist TO authenticated;
GRANT ALL ON public.user_game_wishlist TO service_role;
ALTER TABLE public.user_game_wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own wanted games" ON public.user_game_wishlist FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Save own wanted games" ON public.user_game_wishlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Remove own wanted games" ON public.user_game_wishlist FOR DELETE TO authenticated USING (auth.uid() = user_id);