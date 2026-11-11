type Completion = { course_id: string; unit_index: number };

export function finishesCourse(courseId: string, unitIndex: number, unitCount: number, completions: Completion[]) {
  if (unitCount < 1 || unitIndex < 0 || unitIndex >= unitCount) return false;
  const done = new Set(completions.filter((c) => c.course_id === courseId).map((c) => c.unit_index));
  done.add(unitIndex);
  return Array.from({ length: unitCount }, (_, i) => i).every((i) => done.has(i));
}

export function withoutLesson<T extends Completion>(completions: T[], courseId: string, unitIndex: number): T[] {
  return completions.filter((c) => c.course_id !== courseId || c.unit_index !== unitIndex);
}