import { unitsFor, dailyMinutes, buildSchedule, projectedFinish, type Unit } from "./schedule";

type Data = {
  profile: { pace_mode: string; hours_per_week: number; target_date: string | null };
  enrollments: { course_id: string; completed_at: string | null }[];
  completions: { course_id: string; unit_index: number; completed_on: string }[];
};

export function computePlan(data: Data, days = 7) {
  const done = new Set(data.completions.map((c) => `${c.course_id}:${c.unit_index}`));
  const all: Unit[] = data.enrollments.flatMap((e) => unitsFor(e.course_id));
  const remaining = all.filter((u) => !done.has(`${u.courseId}:${u.index}`));
  const remainingMinutes = remaining.reduce((s, u) => s + u.minutes, 0);
  const today = new Date();
  const target = data.profile.target_date ? new Date(data.profile.target_date + "T00:00:00") : null;
  const perDay = dailyMinutes({ mode: data.profile.pace_mode === "date" ? "date" : "hours", hoursPerWeek: Number(data.profile.hours_per_week), targetDate: target, remainingMinutes, today });
  const schedule = buildSchedule(remaining, perDay, today, days);
  return { all, remaining, remainingMinutes, perDay, schedule, finish: projectedFinish(remainingMinutes, perDay, today), done };
}
