import type { Course } from "./catalog";

export type CompletedSort = "date" | "name" | "source";
type Enrollment = { course_id: string; completed_at: string | null; prior: boolean; extra: boolean };

export function groupCourses<T extends Enrollment>(enrollments: T[], catalog: Record<string, Pick<Course, "title" | "provider">>, sort: CompletedSort = "date") {
  const name = (e: T) => catalog[e.course_id]?.title ?? e.course_id;
  const byName = (a: T, b: T) => name(a).localeCompare(name(b));
  const completed = enrollments.filter((e) => e.completed_at !== null).sort((a, b) => {
    if (sort === "name") return byName(a, b);
    if (sort === "source") return (catalog[a.course_id]?.provider ?? "").localeCompare(catalog[b.course_id]?.provider ?? "") || byName(a, b);
    return Date.parse(b.completed_at ?? "") - Date.parse(a.completed_at ?? "") || byName(a, b);
  });
  return {
    active: enrollments.filter((e) => !e.completed_at && !e.prior && !e.extra),
    extra: enrollments.filter((e) => !e.completed_at && !e.prior && e.extra),
    completed,
  };
}