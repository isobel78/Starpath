import { describe, expect, it } from "vitest";
import { groupCourses } from "./completed-courses";

const catalog = {
  older: { title: "Zebra", provider: "CS50" },
  newer: { title: "Alpha", provider: "freeCodeCamp" },
  extra: { title: "Beta", provider: "Exercism" },
};
const enrollments = [
  { course_id: "older", completed_at: "2026-11-01T12:00:00Z", prior: true, extra: false },
  { course_id: "newer", completed_at: "2026-11-12T03:00:00Z", prior: false, extra: false },
  { course_id: "extra", completed_at: "2026-11-10T12:00:00Z", prior: false, extra: true },
  { course_id: "active", completed_at: null, prior: false, extra: false },
  { course_id: "bonus", completed_at: null, prior: false, extra: true },
];

describe("completed courses", () => {
  it("combines prior, Starpath and Extra Credit completions, newest first by default", () => {
    const groups = groupCourses(enrollments, catalog);
    expect(groups.completed.map((e) => e.course_id)).toEqual(["newer", "extra", "older"]);
    expect(groups.active.map((e) => e.course_id)).toEqual(["active"]);
    expect(groups.extra.map((e) => e.course_id)).toEqual(["bonus"]);
  });
  it("moves a course out of the active section after it is marked complete", () => {
    const groups = groupCourses(enrollments.map((e) => e.course_id === "active" ? { ...e, completed_at: "2026-11-12T04:00:00Z" } : e), catalog);
    expect(groups.active).toEqual([]);
    expect(groups.completed[0]?.course_id).toBe("active");
  });
  it("sorts completed courses by name alphabetically", () => {
    expect(groupCourses(enrollments, catalog, "name").completed.map((e) => e.course_id)).toEqual(["newer", "extra", "older"]);
  });
  it("sorts completed courses by source alphabetically", () => {
    expect(groupCourses(enrollments, catalog, "source").completed.map((e) => e.course_id)).toEqual(["older", "extra", "newer"]);
  });
});