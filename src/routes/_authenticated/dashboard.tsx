import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Flame, Star, ExternalLink, Check, Clock, Pencil, Sparkles, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { UserAvatar } from "@/components/UserAvatar";
import { useCatalog } from "@/lib/catalog-store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useMyData, useRefreshMe, todayISO } from "@/lib/data";
import { computePlan } from "@/lib/plan";
import { levelFor, unitsFor } from "@/lib/schedule";
import { COURSE_MAP } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { finishesCourse } from "@/lib/lesson-progress";
import { studyToday, DAY_START_HOUR } from "@/lib/day";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Today — Starpath" }, { name: "description", content: "Your daily study goals, streak and XP." }, { property: "og:title", content: "Today — Starpath" }, { property: "og:description", content: "Your daily study goals, streak and XP." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Dashboard,
});

const MOODS = ["🤩", "🙂", "😐", "😴", "🔥"];

function Dashboard() {
  const { data, user, isLoading } = useMyData();
  useCatalog();
  const refresh = useRefreshMe();
  const navigate = useNavigate();
  const [lessonBusy, setLessonBusy] = useState(false);
  const [mood, setMood] = useState("🙂");
  const cheers = useQuery({
    queryKey: ["cheers-in", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data: c } = await supabase.from("cheers").select("*").eq("to_user", user!.id).order("created_at", { ascending: false }).limit(30);
      const ids = [...new Set((c ?? []).map((x) => x.from_user))];
      const { data: ps } = ids.length ? await supabase.from("public_profiles").select("id, display_name, avatar_emoji").in("id", ids) : { data: [] };
      return (c ?? []).map((x) => ({ ...x, from: ps?.find((p) => p.id === x.from_user) }));
    },
  });

  const xpToday = useQuery({
    queryKey: ["xp-today", user?.id, data?.profile.xp], enabled: !!user,
    queryFn: async () => {
      const start = new Date(studyToday().getTime() + DAY_START_HOUR * 3600_000).toISOString();
      const { data: ev } = await supabase.from("xp_events").select("amount").eq("user_id", user!.id).gte("created_at", start);
      return (ev ?? []).reduce((t, e) => t + e.amount, 0);
    },
  });

  if (isLoading || !data) return <AppShell><p className="animate-pulse text-center text-muted-foreground">Loading your galaxy…</p></AppShell>;
  const { profile } = data;
  const plan = computePlan(data, 1);
  const todayUnits = plan.schedule[0]?.units ?? [];
  const extraIds = new Set(data.enrollments.filter((e) => e.extra).map((e) => e.course_id));
  const doneToday = data.completions.filter((c) => c.completed_on === todayISO()).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const doneTodayPlan = doneToday.filter((c) => !extraIds.has(c.course_id));
  const doneTodayExtra = doneToday.filter((c) => extraIds.has(c.course_id));
  const done = plan.done;
  const extraUnits = data.enrollments.filter((e) => e.extra && !e.prior && !e.completed_at)
    .flatMap((e) => unitsFor(e.course_id).filter((u) => !done.has(`${u.courseId}:${u.index}`)).slice(0, 1));
  const clearCheer = async (id?: string) => {
    const q = supabase.from("cheers").delete().eq("to_user", user!.id);
    const { error } = id ? await q.eq("id", id) : await q;
    if (error) { toast.error(error.message); return; }
    cheers.refetch();
  };
  const checkedIn = data.checkins.some((c) => c.day === todayISO());
  const lv = levelFor(profile.xp);

  const complete = async (courseId: string, index: number, minutes: number) => {
    if (lessonBusy) return;
    setLessonBusy(true);
    try {
      const { error } = await supabase.rpc("complete_unit", { _course: courseId, _unit: index, _minutes: minutes });
      if (error) { toast.error(error.message); return; }
      const finished = finishesCourse(courseId, index, COURSE_MAP[courseId]?.units.length ?? 0, data.completions);
      await refresh();
      toast.success(finished ? "All lessons done! Add your certificate 🎓" : `+${10 + Math.floor(Math.min(240, Math.max(5, minutes)) / 6)} XP! Lesson done ⭐`);
      if (finished) await navigate({ to: "/roadmap", search: { course: courseId } });
    } finally { setLessonBusy(false); }
  };
  const undo = async (courseId: string, index: number) => {
    if (lessonBusy) return;
    setLessonBusy(true);
    try {
      const { error } = await supabase.rpc("uncomplete_unit", { _course: courseId, _unit: index });
      if (error) { toast.error(error.message); return; }
      await refresh();
      toast.success("Lesson unchecked — XP updated");
    } finally { setLessonBusy(false); }
  };
  const checkin = async () => {
    const { error } = await supabase.rpc("daily_checkin", { _mood: mood, _note: "" });
    if (error) { toast.error(error.message); return; }
    toast.success("Checked in! +5 XP 🔥");
    refresh();
  };

  const DoneRow = ({ c }: { c: (typeof doneToday)[number] }) => (
    <div className="flex items-center gap-3 rounded-2xl bg-muted p-4 opacity-70">
      <Button size="icon" disabled={lessonBusy} aria-label={`Uncheck ${COURSE_MAP[c.course_id]?.units[c.unit_index] ?? "lesson"}`} aria-pressed={true} title="Uncheck lesson" onClick={() => undo(c.course_id, c.unit_index)} className="h-9 w-9 shrink-0 rounded-full"><Check className="h-5 w-5" /></Button>
      <div className="min-w-0 flex-1"><div className="line-through">{COURSE_MAP[c.course_id]?.units[c.unit_index]}</div><div className="text-xs text-muted-foreground">{COURSE_MAP[c.course_id]?.title}</div></div>
    </div>
  );

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserAvatar url={profile.avatar_url} emoji={profile.avatar_emoji} className="h-16 w-16 text-4xl" />
          <div>
            <h1 className="text-3xl font-bold">Hey {profile.display_name}!</h1>
            <Link to="/u/$username" params={{ username: profile.username }} className="text-sm font-semibold text-primary">View public profile @{profile.username}</Link>
          </div>
        </div>
        <Button asChild variant="outline" className="rounded-full"><Link to="/settings"><Pencil className="h-4 w-4" /> Edit profile</Link></Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-sun p-5 text-primary-foreground shadow-glow">
          <Flame className="h-8 w-8" />
          <div className="mt-2 font-display text-4xl font-bold">{profile.current_streak} day{profile.current_streak === 1 ? "" : "s"}</div>
          <div className="opacity-90">streak · best {profile.longest_streak}</div>
        </div>
        <div className="rounded-3xl bg-accent p-5 text-accent-foreground shadow-glow">
          <Star className="h-8 w-8 fill-star text-star animate-twinkle" />
          <div className="mt-2 font-display text-4xl font-bold">Level {lv.level}</div>
          <Progress value={(lv.into / lv.needed) * 100} className="mt-2 h-2.5 bg-background/25" />
          <div className="mt-1 text-sm opacity-90">{profile.xp} XP · {lv.needed - lv.into} to next level</div>
          <div className="mt-1 font-bold">+{xpToday.data ?? 0} XP earned today</div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5">
          <h3 className="font-semibold">Daily check-in</h3>
          {checkedIn ? <p className="mt-3 text-lg font-bold text-primary">You're checked in today ✅</p> : (
            <>
              <div className="mt-3 flex gap-2">{MOODS.map((m) => <button key={m} onClick={() => setMood(m)} className={`rounded-full p-2 text-2xl transition ${mood === m ? "bg-star shadow-star scale-110" : "bg-muted"}`}>{m}</button>)}</div>
              <Button className="mt-3 w-full rounded-full" onClick={checkin}><Sparkles className="h-4 w-4" /> Check in (+5 XP)</Button>
            </>
          )}
        </div>
      </div>

      <section className="mt-8">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Today's goals</h2>
          <span className="text-sm text-muted-foreground">Pace: ~{plan.perDay} min/day</span>
        </div>
        {data.enrollments.filter((e) => !e.extra && !e.prior).length === 0 ? (
          <div className="mt-4 rounded-3xl border-2 border-dashed border-border p-8 text-center">
            <p className="text-lg">Your Starpath is empty!</p>
            <Button asChild className="mt-3 rounded-full"><Link to="/roadmap">Pick a career track</Link></Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {todayUnits.map((u) => (
              <div key={`${u.courseId}-${u.index}`} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
                <Button size="icon" variant="outline" disabled={lessonBusy} aria-label="Mark done" onClick={() => complete(u.courseId, u.index, u.minutes)} className="h-9 w-9 shrink-0 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"><Check className="h-5 w-5" /></Button>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{u.title}</div>
                  <div className="text-xs text-muted-foreground">{COURSE_MAP[u.courseId]?.title} · {COURSE_MAP[u.courseId]?.provider}</div>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-bold"><Clock className="h-3.5 w-3.5" />{u.minutes} min</span>
                <Button asChild size="sm" variant="outline" className="rounded-full"><a href={u.url} target="_blank" rel="noreferrer">Open <ExternalLink className="h-3.5 w-3.5" /></a></Button>
              </div>
            ))}
            {doneTodayPlan.map((c) => <DoneRow key={c.id} c={c} />)}
            {todayUnits.length === 0 && <p className="text-center text-lg font-bold text-primary">Everything's done — you're a star! 🌟</p>}
          </div>
        )}
      </section>

      {(extraUnits.length > 0 || doneTodayExtra.length > 0) && (
        <section className="mt-8">
          <div className="flex items-end justify-between"><h2 className="text-2xl font-bold">✨ Extra Credit</h2><Link to="/roadmap" className="text-sm font-bold text-primary">Manage</Link></div>
          <p className="text-sm text-muted-foreground">Bonus lessons for extra XP — they never change your weekly plan.</p>
          <div className="mt-3 space-y-3">
            {extraUnits.map((u) => { const c = COURSE_MAP[u.courseId]; return (
              <div key={`${u.courseId}-${u.index}`} className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 ${c?.userAdded ? "border-star bg-star/15" : "border-border bg-card"}`}>
                <Button size="icon" variant="outline" disabled={lessonBusy} aria-label="Mark done" onClick={() => complete(u.courseId, u.index, u.minutes)} className="h-9 w-9 shrink-0 rounded-full border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"><Check className="h-5 w-5" /></Button>
                <div className="min-w-0 flex-1"><div className="font-semibold">{u.title}</div><div className="text-xs text-muted-foreground">{c?.title} · {c?.provider}</div></div>
                <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-bold"><Clock className="h-3.5 w-3.5" />{u.minutes} min</span>
                <Button asChild size="sm" variant="outline" className="rounded-full"><a href={u.url} target="_blank" rel="noreferrer">Open <ExternalLink className="h-3.5 w-3.5" /></a></Button>
              </div>); })}
            {doneTodayExtra.map((c) => <DoneRow key={c.id} c={c} />)}
          </div>
        </section>
      )}

      {cheers.data && cheers.data.length > 0 && (
        <section className="mt-8">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold">Cheers & nudges</h2>
            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => clearCheer()}>Clear all</Button>
          </div>
          <div className="mt-3 space-y-2">{cheers.data.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-star/30 px-4 py-3">
              <span className="text-xl">{c.emoji}</span>
              <div className="min-w-0 flex-1"><b>{c.from?.display_name ?? "A friend"}</b> {c.message}</div>
              <span className="text-xs font-bold text-muted-foreground">{new Date(c.created_at).toLocaleDateString(undefined, { weekday: "long" })}</span>
              <button aria-label="Clear" onClick={() => clearCheer(c.id)} className="rounded-full p-1 text-muted-foreground hover:bg-background/60 hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
