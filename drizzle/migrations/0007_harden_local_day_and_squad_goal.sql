REVOKE EXECUTE ON FUNCTION public.local_day(uuid) FROM PUBLIC, anon, authenticated;

UPDATE public.squads SET weekly_xp_goal = greatest(100, least(weekly_xp_goal, 100000));
ALTER TABLE public.squads ADD CONSTRAINT squads_goal_range CHECK (weekly_xp_goal BETWEEN 100 AND 100000);

CREATE OR REPLACE FUNCTION public.guard_squad_goal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE total int;
BEGIN
  IF NEW.weekly_xp_goal < OLD.weekly_xp_goal THEN
    SELECT coalesce(sum(e.amount),0) INTO total FROM public.xp_events e
      JOIN public.squad_members m ON m.user_id = e.user_id AND m.squad_id = NEW.id
      WHERE e.created_at >= date_trunc('week', now()) AND e.reason NOT LIKE 'squad:%';
    IF NEW.weekly_xp_goal <= total THEN
      RAISE EXCEPTION 'Goal can''t be lowered below this week''s squad XP';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_squad_goal() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER squads_guard_goal BEFORE UPDATE OF weekly_xp_goal ON public.squads
FOR EACH ROW EXECUTE FUNCTION public.guard_squad_goal();