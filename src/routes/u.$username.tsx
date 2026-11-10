import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { Flame, Trophy, Star, Award, ExternalLink } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { AppShell } from "@/components/AppShell";
import { UserAvatar } from "@/components/UserAvatar";
import { useCatalog } from "@/lib/catalog-store";
import { COURSE_MAP, TRACKS } from "@/lib/catalog";
import { levelFor } from "@/lib/schedule";
import { Progress } from "@/components/ui/progress";

const getProfile = createServerFn({ method: "GET" })
  .inputValidator((u: string) => u)
  .handler(async ({ data: username }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization"); h.set("apikey", key); return fetch(input, { ...init, headers: h }); } },
    });
    const { data: p } = await sb.from("profiles").select("id, username, display_name, bio, avatar_emoji, avatar_url, xp, current_streak, longest_streak, track_id").eq("username", username).maybeSingle();
    if (!p) return null;
    const { data: e } = await sb.from("enrollments").select("course_id, completed_at, certificate_url").eq("user_id", p.id).order("position");
    return { profile: p, enrollments: e ?? [] };
  });

export const Route = createFileRoute("/u/$username")({
  loader: async ({ params }) => {
    const r = await getProfile({ data: params.username });
    if (!r) throw notFound();
    return r;
  },
  head: ({ loaderData }) => {
    const n = loaderData ? `${loaderData.profile.display_name} (@${loaderData.profile.username})` : "Learner";
    const d = loaderData ? `Level ${levelFor(loaderData.profile.xp).level} · ${loaderData.profile.current_streak}-day streak on Starpath` : "Learner profile on Starpath";
    return { meta: [{ title: `${n} — Starpath` }, { name: "description", content: d }, { property: "og:title", content: `${n} — Starpath` }, { property: "og:description", content: d }, { property: "og:type", content: "profile" }] };
  },
  notFoundComponent: () => <AppShell><p className="text-center text-xl">No learner with that username 🌙 <Link to="/" className="text-primary">Go home</Link></p></AppShell>,
  component: ProfilePage,
});

function ProfilePage() {
  useCatalog();
  const { profile: p, enrollments } = Route.useLoaderData();
  const lv = levelFor(p.xp);
  const done = enrollments.filter((e) => e.completed_at);
  const current = enrollments.filter((e) => !e.completed_at);
  const track = TRACKS.find((t) => t.id === p.track_id);
  const trophies = [
    { ok: p.longest_streak >= 3, label: "3-day streak", emoji: "🔥" },
    { ok: p.longest_streak >= 7, label: "Week warrior", emoji: "⚡" },
    { ok: p.longest_streak >= 30, label: "Monthly legend", emoji: "🌋" },
    { ok: done.length >= 1, label: "First course", emoji: "🎓" },
    { ok: done.length >= 5, label: "Course collector", emoji: "📚" },
    { ok: lv.level >= 5, label: "Level 5", emoji: "⭐" },
    { ok: lv.level >= 10, label: "Level 10", emoji: "🌟" },
    { ok: p.xp >= 5000, label: "XP superstar", emoji: "💫" },
  ];
  return (
    <AppShell>
      <section className="rounded-[2rem] bg-hero p-8 text-primary-foreground shadow-glow">
        <div className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
          <UserAvatar url={p.avatar_url} emoji={p.avatar_emoji} className="h-24 w-24 bg-background/20 bg-none text-6xl" />
          <div className="flex-1">
            <h1 className="text-4xl font-bold">{p.display_name}</h1>
            <p className="opacity-80">@{p.username}{track ? ` · ${track.emoji} ${track.title}` : ""}</p>
            {p.bio && <p className="mt-2 max-w-xl">{p.bio}</p>}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[[Star, `Level ${lv.level}`, `${p.xp} XP`], [Flame, `${p.current_streak} days`, "current streak"], [Trophy, `${p.longest_streak} days`, "best streak"], [Award, `${done.length}`, "courses done"]].map(([I, a, b], i) => {
            const Icon = I as typeof Star;
            return <div key={i} className="rounded-2xl bg-background/15 p-4"><Icon className="h-5 w-5 fill-star text-star" /><div className="mt-1 text-2xl font-bold font-display">{a as string}</div><div className="text-sm opacity-80">{b as string}</div></div>;
          })}
        </div>
        <Progress value={(lv.into / lv.needed) * 100} className="mt-5 h-3 bg-background/20" />
      </section>

      <h2 className="mt-10 text-2xl font-bold">Trophies</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {trophies.map((t) => <div key={t.label} className={`rounded-3xl border border-border p-4 text-center ${t.ok ? "bg-card shadow-star" : "bg-muted opacity-50 grayscale"}`}><div className="text-4xl">{t.emoji}</div><div className="mt-1 text-sm font-bold">{t.label}</div></div>)}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">Certificates</h2>
          <div className="mt-4 space-y-2">
            {done.length === 0 && <p className="text-muted-foreground">No completed courses yet.</p>}
            {done.map((e) => <div key={e.course_id} className="flex items-center gap-3 rounded-2xl bg-card p-4 border border-border"><span className="text-2xl">🎓</span><div className="flex-1"><div className="font-semibold">{COURSE_MAP[e.course_id]?.title}</div><div className="text-xs text-muted-foreground">{COURSE_MAP[e.course_id]?.provider}</div></div>{e.certificate_url && <a href={e.certificate_url} target="_blank" rel="noreferrer nofollow" className="flex items-center gap-1 text-sm font-bold text-primary">View <ExternalLink className="h-3.5 w-3.5" /></a>}</div>)}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Currently learning</h2>
          <div className="mt-4 space-y-2">
            {current.length === 0 && <p className="text-muted-foreground">Nothing in progress.</p>}
            {current.map((e) => <div key={e.course_id} className="rounded-2xl bg-muted p-4 font-semibold">{COURSE_MAP[e.course_id]?.title}</div>)}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
