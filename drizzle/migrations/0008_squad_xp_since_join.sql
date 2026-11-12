CREATE OR REPLACE FUNCTION public.claim_squad_award(_squad uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); wk timestamptz := date_trunc('week', now()); goal int; total int; tag text;
BEGIN
  IF uid IS NULL OR NOT public.is_squad_member(_squad, uid) THEN RETURN false; END IF;
  SELECT weekly_xp_goal INTO goal FROM public.squads WHERE id = _squad;
  SELECT coalesce(sum(e.amount),0) INTO total FROM public.xp_events e
    JOIN public.squad_members m ON m.user_id = e.user_id AND m.squad_id = _squad
    WHERE e.created_at >= greatest(wk, m.joined_at) AND e.reason NOT LIKE 'squad:%';
  IF total < goal THEN RETURN false; END IF;
  tag := 'squad:' || _squad || ':' || to_char(wk, 'YYYY-MM-DD');
  IF EXISTS (SELECT 1 FROM public.xp_events WHERE user_id = uid AND reason = tag) THEN RETURN false; END IF;
  PERFORM public._award(uid, 50, tag);
  RETURN true;
END $$;
REVOKE EXECUTE ON FUNCTION public.claim_squad_award(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_squad_award(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_squad_goal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE total int;
BEGIN
  IF NEW.weekly_xp_goal < OLD.weekly_xp_goal THEN
    SELECT coalesce(sum(e.amount),0) INTO total FROM public.xp_events e
      JOIN public.squad_members m ON m.user_id = e.user_id AND m.squad_id = NEW.id
      WHERE e.created_at >= greatest(date_trunc('week', now()), m.joined_at) AND e.reason NOT LIKE 'squad:%';
    IF NEW.weekly_xp_goal <= total THEN
      RAISE EXCEPTION 'Goal can''t be lowered below this week''s squad XP';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_squad_goal() FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.squads TO authenticated;