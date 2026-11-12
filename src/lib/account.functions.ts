import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Permanently deletes the signed-in learner's account and everything tied to it. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const byUser = ["checkins", "enrollments", "lesson_completions", "squad_members", "user_courses", "user_roles", "xp_events"] as const;
    for (const t of byUser) {
      const { error } = await db.from(t).delete().eq("user_id", uid);
      if (error) throw new Error(`Couldn't delete your data (${t})`);
    }
    await db.from("cheers").delete().or(`from_user.eq.${uid},to_user.eq.${uid}`);
    await db.from("friendships").delete().or(`requester.eq.${uid},addressee.eq.${uid}`);
    const { data: owned } = await db.from("squads").select("id").eq("owner_id", uid);
    const ids = (owned ?? []).map((s) => s.id);
    if (ids.length) {
      await db.from("squad_members").delete().in("squad_id", ids);
      await db.from("squads").delete().in("id", ids);
    }
    await db.from("profiles").delete().eq("id", uid);
    const { error } = await db.auth.admin.deleteUser(uid);
    if (error) throw new Error("Couldn't delete your account. Please try again.");
    return { ok: true };
  });
