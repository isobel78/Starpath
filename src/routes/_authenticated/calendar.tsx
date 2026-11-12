import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useMyData } from "@/lib/data";
import { useCatalog } from "@/lib/catalog-store";
import { computePlan } from "@/lib/plan";
import { COURSE_MAP } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/calendar")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { title: "This week — Starpath" }, { name: "description", content: "Your auto-balancing weekly study calendar." }, { property: "og:title", content: "This week — Starpath" }, { property: "og:description", content: "Your auto-balancing weekly study calendar." }] }),
  component: CalendarPage,
});

const COLORS = ["bg-primary", "bg-secondary", "bg-accent", "bg-chart-2", "bg-chart-3"];

function CalendarPage() {
  const { data } = useMyData();
  useCatalog();
  if (!data) return <AppShell><p className="animate-pulse text-center">Loading…</p></AppShell>;
  const plan = computePlan(data, 7);
  const courseColor = (id: string) => COLORS[data.enrollments.findIndex((e) => e.course_id === id) % COLORS.length];
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return (
    <AppShell>
      <h1 className="text-4xl font-bold">Your <span className="text-gradient">week</span></h1>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-muted px-4 py-2 font-bold">⏱ {plan.perDay} min/day</span>
        <span className="rounded-full bg-muted px-4 py-2 font-bold">📚 {Math.round(plan.remainingMinutes / 60)}h left</span>
        <span className="rounded-full bg-star px-4 py-2 font-bold text-star-foreground">🏁 Finish ~{plan.finish.toLocaleDateString()}</span>
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><RefreshCw className="h-4 w-4" /> Missed a day? Unfinished lessons automatically roll forward and the plan rebalances from today.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-7">
        {plan.schedule.map((d, i) => (
          <div key={i} className={`rounded-3xl border p-3 ${i === 0 ? "border-primary bg-card shadow-glow" : "border-border bg-card"}`}>
            <div className="text-sm font-bold">{i === 0 ? "Today" : fmt(d.date)}</div>
            <div className="mb-2 text-xs text-muted-foreground">{d.minutes} min</div>
            <div className="space-y-2">
              {d.units.map((u) => (
                <a key={`${u.courseId}-${u.index}`} href={u.url} target="_blank" rel="noreferrer" className={`block rounded-2xl p-2 text-xs font-semibold text-primary-foreground ${courseColor(u.courseId)}`}>
                  {u.title} <ExternalLink className="inline h-3 w-3" />
                  <div className="font-normal opacity-80">{COURSE_MAP[u.courseId]?.provider} · {u.minutes}m</div>
                </a>
              ))}
              {d.units.length === 0 && <div className="text-xs text-muted-foreground">Free day ✨</div>}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
