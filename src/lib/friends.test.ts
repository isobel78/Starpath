import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ from: vi.fn(), del: vi.fn(), eq: vi.fn(), select: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));
import { removeFriend } from "./friends";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockReturnValue({ delete: mocks.del });
  mocks.del.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ eq: mocks.eq, select: mocks.select });
});
it("deletes only the selected accepted friendship", async () => {
  mocks.select.mockResolvedValue({ data: [{ id: "friendship-1" }], error: null });
  await removeFriend("friendship-1");
  expect(mocks.from).toHaveBeenCalledWith("friendships");
  expect(mocks.eq.mock.calls).toEqual([["id", "friendship-1"], ["status", "accepted"]]);
});
it("does not report success when deletion is denied", async () => {
  mocks.select.mockResolvedValue({ data: [], error: null });
  await expect(removeFriend("friendship-1")).rejects.toThrow("could not be removed");
});