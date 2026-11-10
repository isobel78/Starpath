import { COURSE_MAP } from "./catalog";

/** Order courses so every prerequisite that is also selected comes first (stable). */
export function orderByPrereqs(ids: string[]): string[] {
  const set = new Set(ids);
  const out: string[] = [];
  const seen = new Set<string>();
  const visit = (id: string, stack: Set<string>) => {
    if (seen.has(id) || stack.has(id)) return;
    stack.add(id);
    for (const p of COURSE_MAP[id]?.prereqs ?? []) if (set.has(p)) visit(p, stack);
    stack.delete(id);
    seen.add(id);
    out.push(id);
  };
  ids.forEach((id) => visit(id, new Set()));
  return out;
}

/** Prerequisites of the selection that are not yet selected. */
export function missingPrereqs(ids: string[]): string[] {
  const set = new Set(ids);
  const missing = new Set<string>();
  for (const id of ids) for (const p of COURSE_MAP[id]?.prereqs ?? []) if (!set.has(p)) missing.add(p);
  return [...missing];
}

export interface Unit { courseId: string; index: number; title: string; minutes: number; url: string }

export function unitsFor(courseId: string): Unit[] {
  const c = COURSE_MAP[courseId];
  if (!c) return [];
  const minutes = Math.max(15, Math.round((c.hours * 60) / c.units.length));
  return c.units.map((title, index) => ({ courseId, index, title, minutes, url: c.url }));
}

export const LEVEL_XP = 250;
export function levelFor(xp: number) {
  const level = Math.floor(xp / LEVEL_XP) + 1;
  return { level, into: xp % LEVEL_XP, needed: LEVEL_XP };
}

export function daysBetween(a: Date, b: Date) {
  const ms = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  return Math.round(ms / 86400000);
}

/**
 * Minutes per day. Hours mode: hours/week ÷ 7. Date mode: remaining minutes spread over the
 * days left until the target (inclusive), so missed days automatically raise the pace.
 */
export function dailyMinutes(opts: { mode: "hours" | "date"; hoursPerWeek: number; targetDate: Date | null; remainingMinutes: number; today: Date }) {
  if (opts.mode === "date" && opts.targetDate) {
    const days = Math.max(1, daysBetween(opts.today, opts.targetDate) + 1);
    return Math.ceil(opts.remainingMinutes / days);
  }
  return Math.max(10, Math.round((opts.hoursPerWeek * 60) / 7));
}

export interface DayPlan { date: Date; units: Unit[]; minutes: number }

/**
 * Greedy schedule starting today using only unfinished units; a unit always fits on an empty day.
 * Because it always starts from today, missed days roll forward (rebalance) automatically.
 */
export function buildSchedule(remaining: Unit[], perDay: number, today: Date, days: number): DayPlan[] {
  const plan: DayPlan[] = [];
  let i = 0;
  for (let d = 0; d < days; d++) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + d);
    const day: DayPlan = { date, units: [], minutes: 0 };
    while (i < remaining.length && (day.units.length === 0 || day.minutes + remaining[i].minutes <= perDay)) {
      day.units.push(remaining[i]);
      day.minutes += remaining[i].minutes;
      i++;
      if (day.minutes >= perDay) break;
    }
    plan.push(day);
  }
  return plan;
}

/** Projected finish date given a daily pace. */
export function projectedFinish(remainingMinutes: number, perDay: number, today: Date) {
  const days = Math.ceil(remainingMinutes / Math.max(1, perDay));
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + Math.max(0, days - 1));
}
