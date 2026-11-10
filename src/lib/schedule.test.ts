import { describe, it, expect } from "vitest";
import { orderByPrereqs, missingPrereqs, dailyMinutes, buildSchedule, levelFor } from "./schedule";

describe("schedule rules", () => {
  it("orders prerequisites first", () => {
    expect(orderByPrereqs(["odin-react", "odin-js", "odin-foundations"])).toEqual(["odin-foundations", "odin-js", "odin-react"]);
  });
  it("finds missing prerequisites", () => {
    expect(missingPrereqs(["boot-http"]).sort()).toEqual(["boot-go", "boot-sql"]);
  });
  it("hours per week sets daily pace", () => {
    expect(dailyMinutes({ mode: "hours", hoursPerWeek: 7, targetDate: null, remainingMinutes: 999, today: new Date(2026, 0, 1) })).toBe(60);
  });
  it("target date spreads remaining time over days left, rising after missed days", () => {
    const t = new Date(2026, 0, 10);
    expect(dailyMinutes({ mode: "date", hoursPerWeek: 0, targetDate: t, remainingMinutes: 600, today: new Date(2026, 0, 1) })).toBe(60);
    expect(dailyMinutes({ mode: "date", hoursPerWeek: 0, targetDate: t, remainingMinutes: 600, today: new Date(2026, 0, 6) })).toBe(120);
  });
  it("rebalances by scheduling unfinished work from today", () => {
    const u = (i: number) => ({ courseId: "x", index: i, title: "", minutes: 30, url: "" });
    const plan = buildSchedule([u(0), u(1), u(2)], 60, new Date(2026, 0, 1), 3);
    expect(plan.map((d) => d.units.length)).toEqual([2, 1, 0]);
  });
  it("levels every 250 XP", () => {
    expect(levelFor(510).level).toBe(3);
  });
});
