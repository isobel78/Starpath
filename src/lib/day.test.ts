import { describe, expect, it } from "vitest";
import { todayISO } from "./day";
import { computePlan } from "./plan";

describe("study day", () => {
  it("2:59 am still counts as the previous day", () => {
    expect(todayISO(new Date(2026, 0, 2, 2, 59))).toBe("2026-01-01");
  });
  it("3:00 am starts the new day", () => {
    expect(todayISO(new Date(2026, 0, 2, 3, 0))).toBe("2026-01-02");
  });
});

describe("extra credit", () => {
  it("extra credit courses are not scheduled", () => {
    const plan = computePlan({ profile: { pace_mode: "hours", hours_per_week: 7, target_date: null }, enrollments: [{ course_id: "cs50x", completed_at: null, extra: true }], completions: [] });
    expect(plan.remaining.length).toBe(0);
  });
});
