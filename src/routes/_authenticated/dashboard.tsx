import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Flame, Star, ExternalLink, Check, Clock, Pencil, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { UserAvatar } from "@/components/UserAvatar";
import { useCatalog } from "@/lib/catalog-store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMyData, useRefreshMe, todayISO } from "@/lib/data";
import { computePlan } from "@/lib/plan";
import { levelFor } from "@/lib/schedule";
import { COURSE_MAP } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Today — Starpath" }, { name: "description", content: "Your daily study goals, streak and XP." }, { property: "og:title", content: "Today — Starpath" }, { property: "og:description", content: "Your daily study goals, streak and XP." }] }),
  component: Dashboard,
});

const MOODS = ["🤩", "🙂", "😐", "😴", "🔥"];

function Dashboard() {
  const { data, user, isLoading } = useMyData();
  useCatalog();
  const refresh = useRefreshMe();
  const [mood, setMood] = useState("🙂");
  const cheers = useQuery({
    queryKey: ["cheers-in", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data: c } = await supabase.from("cheers").select("*").eq("to_user", user!.id).order("created_at", { ascending: false }).limit(5);
      const ids = [...new Set((c ?? []).map((x) => x.from_user))];
      const { data: ps } = ids.length ? await supabase.from("profiles").select("id, display_name, avatar_emoji").in("id", ids) : { data: [] };
      return (c ?? []).map((x) => ({ ...x, from: ps?.find((p) => p.id === x.from_user) }));
    },
  });

  if (isLoading || !data) return <AppShell><p className="animate-pulse text-center text-muted-foreground">Loading your galaxy…</p></AppShell>;
  const { profile } = data;
  const plan = computePlan(data, 1);
  const todayUnits = plan.schedule[0]?.units ?? [];
  const doneToday = data.completions.filter((c) => c.completed_on === todayISO());
  const checkedIn = data.checkins.some((c) => c.day === todayISO());
  const lv = levelFor(profile.xp);

  const complete = async (courseId: string, index: number, minutes: number) => {
    const { error } = await supabase.rpc("complete_unit", { _course: courseId, _unit: index, _minutes: minutes });
    if (error) { toast.error(error.message); return; }
    toast.success(`+${10 + Math.floor(minutes / 6)} XP! Lesson done ⭐`);
    refresh();
  };
  const checkin = async () => {
    const { error } = await supabase.rpc("daily_checkin", { _mood: mood, _note: "" });
    if (error) { toast.error(error.message); return; }
    toast.success("Checked in! +5 XP 🔥");
    refresh();
  };

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
        {data.enrollments.length === 0 ? (
          <div className="mt-4 rounded-3xl border-2 border-dashed border-border p-8 text-center">
            <p className="text-lg">Your roadmap is empty!</p>
            <Button asChild className="mt-3 rounded-full"><Link to="/roadmap">Pick a career track</Link></Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {doneToday.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-muted p-4 opacity-70">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-5 w-5" /></span>
                <div className="flex-1 line-through">{COURSE_MAP[c.course_id]?.units[c.unit_index]}</div>
              </div>
            ))}
            {todayUnits.map((u) => (
              <div key={`${u.courseId}-${u.index}`} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
                <button aria-label="Mark done" onClick={() => complete(u.courseId, u.index, u.minutes)} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary text-primary transition hover:bg-primary hover:text-primary-foreground"><Check className="h-5 w-5" /></button>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{u.title}</div>
                  <div className="text-xs text-muted-foreground">{COURSE_MAP[u.courseId]?.title} · {COURSE_MAP[u.courseId]?.provider}</div>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-bold"><Clock className="h-3.5 w-3.5" />{u.minutes} min</span>
                <Button asChild size="sm" variant="outline" className="rounded-full"><a href={u.url} target="_blank" rel="noreferrer">Open <ExternalLink className="h-3.5 w-3.5" /></a></Button>
              </div>
            ))}
            {todayUnits.length === 0 && <p className="text-center text-lg font-bold text-primary">Everything's done — you're a star! 🌟</p>}
          </div>
        )}
      </section>

      {cheers.data && cheers.data.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-bold">Cheers from friends</h2>
          <div className="mt-3 flex flex-wrap gap-3">{cheers.data.map((c) => <div key={c.id} className="rounded-2xl bg-star/30 px-4 py-3"><span className="text-xl">{c.emoji}</span> <b>{c.from?.display_name}</b> {c.message}</div>)}</div>
        </section>
      )}
    </AppShell>
  );
}
