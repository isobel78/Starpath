import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { summarizeEnrollments, type EnrollmentStat } from "./admin-stats";

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