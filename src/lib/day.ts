/** A study day ends at 3:00 am local time: anything before 3 am still counts as the previous day. */
export const DAY_START_HOUR = 3;

export function studyToday(now = new Date()): Date {
  const shifted = new Date(now.getTime() - DAY_START_HOUR * 3600_000);
  return new Date(shifted.getFullYear(), shifted.getMonth(), shifted.getDate());
}

export function todayISO(now = new Date()) {
  const d = studyToday(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
