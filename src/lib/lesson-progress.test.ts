import { describe, expect, it } from "vitest";
import { finishesCourse, withoutLesson } from "./lesson-progress";
import { computePlan } from "./plan";
import { COURSE_MAP } from "./catalog";

describe("lesson completion", () => {
  it("directs to course completion only once every lesson is checked", () => {
    const done = [{ course_id: "course", unit_index: 0 }];
    expect(finishesCourse("course", 1, 2, done)).toBe(true);
    expect(finishesCourse("course", 2, 3, done)).toBe(false);
    expect(finishesCourse("empty", 0, 0, [])).toBe(false);
  });
  it("unchecking a lesson makes it unfinished and schedules it again", () => {
    const course = COURSE_MAP["odin-foundations"];
    const completions = course.units.map((_, unit_index) => ({ course_id: course.id, unit_index, completed_on: "2026-11-11" }));
    const undone = withoutLesson(completions, course.id, 0);
    const plan = computePlan({ profile: { pace_mode: "hours", hours_per_week: 7, target_date: null }, enrollments: [{ course_id: course.id, completed_at: null }], completions: undone }, 1);
    expect(undone).toHaveLength(completions.length - 1);
    expect(plan.schedule[0]?.units.map((u) => u.index)).toEqual([0]);
    expect(finishesCourse(course.id, 0, course.units.length, undone)).toBe(true);
  });
});