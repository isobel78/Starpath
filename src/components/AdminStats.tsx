import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, BookOpen, GraduationCap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminStats } from "@/lib/admin-stats.functions";
import { COURSES } from "@/lib/catalog";

export function AdminStats() {
  const fetchStats = useServerFn(getAdminStats);
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: () => fetchStats(), staleTime: 30_000, refetchOnMount: "always" });
  if (stats.isPending) return <p className="mt-6 animate-pulse text-muted-foreground">Loading statistics…</p>;
  if (stats.isError) return <div className="mt-6 flex flex-wrap items-center gap-3"><p role="alert" className="text-destructive">Couldn't load statistics.</p><Button variant="outline" onClick={() => stats.refetch()}><RefreshCw className="h-4 w-4" /> Retry</Button></div>;
  const data = stats.data;
  const metrics = [
    { label: "Total users", value: data.totalUsers, icon: Users },
    { label: "Learners with courses", value: data.enrolledUsers, icon: Users },
    { label: "Course enrollments", value: data.enrollments, icon: BookOpen },
    { label: "Courses completed", value: data.completedCourses, icon: GraduationCap },
  ];
  return <section className="mt-6 space-y-6">
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{metrics.map(({ label, value, icon: Icon }) => <div key={label} className="border-b-2 border-primary/30 py-3"><Icon className="mb-2 h-5 w-5 text-primary" /><p className="text-3xl font-bold tabular-nums">{value.toLocaleString()}</p><p className="text-sm text-muted-foreground">{label}</p></div>)}</div>
    <div>
      <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Popular courses</h2><Button size="sm" variant="outline" disabled={stats.isFetching} onClick={() => stats.refetch()}><RefreshCw className={`h-4 w-4 ${stats.isFetching ? "animate-spin" : ""}`} /> Refresh</Button></div>
      {data.popularity.length === 0 ? <p className="text-muted-foreground">No course enrollments yet.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border text-muted-foreground"><th className="py-3 pr-4 font-semibold">Course</th><th className="px-3 py-3 text-right font-semibold">Learners</th><th className="px-3 py-3 text-right font-semibold">Completed</th><th className="py-3 pl-3 text-right font-semibold">Completion</th></tr></thead><tbody>{data.popularity.map((row) => {
        const course = COURSES.find((c) => c.id === row.courseId);
        return <tr key={row.courseId} className="border-b border-border"><td className="min-w-44 py-3 pr-4"><p className="font-semibold">{course?.title ?? row.courseId}</p>{course && <p className="text-xs text-muted-foreground">{course.provider}</p>}</td><td className="px-3 py-3 text-right tabular-nums">{row.learners}</td><td className="px-3 py-3 text-right tabular-nums">{row.completed}</td><td className="py-3 pl-3 text-right tabular-nums">{row.completionRate}%</td></tr>;
      })}</tbody></table></div>}
    </div>
  </section>;
}