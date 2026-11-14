import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { summarizeEnrollments, type EnrollmentStat } from "./admin-stats";
import { z } from "zod";

export const getRegisteredUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ page: z.number().int().min(1).max(100000) }))
  .handler(async ({ context, data }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !isAdmin) throw new Error("Admin access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.auth.admin.listUsers({ page: data.page, perPage: 50 });
    if (error) throw new Error("Couldn't load registered users");
    const ids = result.users.map((user) => user.id);
    const { data: profiles, error: profilesError } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, display_name, username").in("id", ids)
      : { data: [], error: null };
    if (profilesError) throw new Error("Couldn't load registered users");
    return {
      total: result.total,
      users: result.users.map((user) => {
        const profile = profiles?.find((row) => row.id === user.id);
        return { id: user.id, email: user.email ?? null, displayName: profile?.display_name ?? "", username: profile?.username ?? "", registeredAt: user.created_at, lastSignInAt: user.last_sign_in_at ?? null, confirmed: Boolean(user.email_confirmed_at) };
      }),
    };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !isAdmin) throw new Error("Admin access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (usersError) throw new Error("Couldn't load user statistics");
    const rows: EnrollmentStat[] = [];
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabaseAdmin.from("enrollments").select("user_id, course_id, completed_at").order("id").range(offset, offset + pageSize - 1);
      if (error) throw new Error("Couldn't load course statistics");
      rows.push(...(data ?? []));
      if (!data || data.length < pageSize) break;
    }
    return { totalUsers: users.total, ...summarizeEnrollments(rows) };
  });