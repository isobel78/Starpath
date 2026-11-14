export type EnrollmentStat = { user_id: string; course_id: string; completed_at: string | null };

export function summarizeEnrollments(rows: EnrollmentStat[]) {
  const learners = new Set<string>();
  const courses = new Map<string, { courseId: string; learners: Set<string>; completed: Set<string> }>();
  for (const row of rows) {
    learners.add(row.user_id);
    const course = courses.get(row.course_id) ?? { courseId: row.course_id, learners: new Set<string>(), completed: new Set<string>() };
    course.learners.add(row.user_id);
    if (row.completed_at) course.completed.add(row.user_id);
    courses.set(row.course_id, course);
  }
  const popularity = [...courses.values()].map((course) => ({
    courseId: course.courseId,
    learners: course.learners.size,
    completed: course.completed.size,
    completionRate: Math.round(course.completed.size / course.learners.size * 100),
  })).sort((a, b) => b.learners - a.learners || b.completed - a.completed || a.courseId.localeCompare(b.courseId));
  return { enrolledUsers: learners.size, enrollments: popularity.reduce((sum, c) => sum + c.learners, 0), completedCourses: popularity.reduce((sum, c) => sum + c.completed, 0), popularity };
}