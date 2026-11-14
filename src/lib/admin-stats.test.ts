import { expect, it, vi } from "vitest";
import { summarizeEnrollments } from "./admin-stats";

vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({ middleware: () => ({ handler: (handler: unknown) => handler }) }) }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
const admin = vi.hoisted(() => ({ listUsers: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { auth: { admin } } }));
import { getAdminStats } from "./admin-stats.functions";

it("ranks courses by distinct learners and includes all completion types", () => {
  const summary = summarizeEnrollments([
    { user_id: "a", course_id: "linux", completed_at: null },
    { user_id: "b", course_id: "linux", completed_at: "2026-11-14" },
    { user_id: "b", course_id: "linux", completed_at: "2026-11-14" },
    { user_id: "a", course_id: "figma", completed_at: "2026-11-14" },
  ]);
  expect(summary).toEqual({ enrolledUsers: 2, enrollments: 3, completedCourses: 2, popularity: [
    { courseId: "linux", learners: 2, completed: 1, completionRate: 50 },
    { courseId: "figma", learners: 1, completed: 1, completionRate: 100 },
  ] });
});

it("denies non-admins before reading privileged user data", async () => {
  const rpc = vi.fn().mockResolvedValue({ data: false, error: null });
  const handler = getAdminStats as unknown as (args: { context: { userId: string; supabase: { rpc: typeof rpc } } }) => Promise<unknown>;
  await expect(handler({ context: { userId: "learner", supabase: { rpc } } })).rejects.toThrow("Admin access required");
  expect(rpc).toHaveBeenCalledWith("has_role", { _user_id: "learner", _role: "admin" });
  expect(admin.listUsers).not.toHaveBeenCalled();
});