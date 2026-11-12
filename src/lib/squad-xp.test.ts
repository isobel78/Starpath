import { describe, expect, it } from "vitest";
import { squadXp } from "./squad-xp";

const wk = "2026-11-09T00:00:00Z";
const ev = (created_at: string, amount: number, reason = "unit") => ({ user_id: "u", amount, created_at, reason });

describe("squadXp", () => {
  it("ignores XP earned before joining a new squad", () => {
    expect(squadXp([ev("2026-11-10T10:00:00Z", 200)], "u", "2026-11-12T16:00:00Z", wk)).toBe(0);
  });
  it("counts XP earned after joining, excluding squad awards", () => {
    expect(squadXp([ev("2026-11-12T17:00:00Z", 30), ev("2026-11-12T18:00:00Z", 50, "squad:x:2026-11-09")], "u", "2026-11-12T16:00:00Z", wk)).toBe(30);
  });
});
