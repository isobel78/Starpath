import { describe, it, expect, afterEach } from "vitest";
import { applyCatalogRows, COURSE_MAP, COURSES } from "./catalog";
import { computePlan } from "./plan";

afterEach(() => applyCatalogRows([]));

describe("catalog rules", () => {
  it("freeCodeCamp Responsive Web Design points at the current v9 course", () => {
    expect(COURSE_MAP["fcc-rwd"]!.url).toBe("https://www.freecodecamp.org/learn/responsive-web-design-v9/");
  });
  it("admin edits override built-in courses, and hidden courses leave the catalog", () => {
    applyCatalogRows([{ kind: "course", id: "cs50x", data: { hours: 5 }, hidden: false }, { kind: "course", id: "cs50p", data: {}, hidden: true }]);
    expect(COURSE_MAP["cs50x"]!.hours).toBe(5);
    expect(COURSES.some((c) => c.id === "cs50p")).toBe(false);
  });
  it("courses already completed are never scheduled", () => {
    const plan = computePlan({ profile: { pace_mode: "hours", hours_per_week: 7, target_date: null }, enrollments: [{ course_id: "cs50x", completed_at: "2025-01-01" }], completions: [] });
    expect(plan.remaining.length).toBe(0);
  });
});
