import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, Flame, Trophy, Users, CalendarCheck, Map } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { TRACKS } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-store";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Starpath — Build Your Learning Roadmap" },
      { name: "description", content: "Mix courses from boot.dev, freeCodeCamp, Exercism, The Odin Project, CS50 and Roadmap.sh into one glowing, gamified study plan." },
      { property: "og:title", content: "Starpath — Build Your Learning Roadmap" },
      { property: "og:description", content: "Explore frontend, backend, full stack, game development, UI/UX & product design, databases and computer science with smart scheduling, streaks and study squads." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { icon: Map, title: "Tracks or playlists", text: "Pick a career track or hand-pick courses — we sort them by prerequisites." },
  { icon: CalendarCheck, title: "Smart schedule", text: "Set hours per week or a finish date. Missed a day? Your week rebalances." },
  { icon: Flame, title: "Streaks & XP", text: "Check in daily, earn XP, level up and keep your flame alive." },
  { icon: Trophy, title: "Certificates", text: "Link your verified certificates and show them off on your profile." },
  { icon: Users, title: "Study squads", text: "Team up with friends, set weekly goals, cheer each other on." },
  { icon: Star, title: "Six great sources", text: "boot.dev, freeCodeCamp, Exercism, The Odin Project, CS50, Roadmap.sh." },
];

function Index() {
  useCatalog();
  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-[2rem] bg-hero px-6 py-16 text-primary-foreground shadow-glow md:px-14 md:py-24">
        {[["top-3 right-3 md:top-6 md:right-10", "h-6 w-6 md:h-10 md:w-10"], ["hidden md:block bottom-10 right-1/3", "h-6 w-6"], ["hidden md:block top-1/3 right-1/4", "h-14 w-14"], ["bottom-3 right-4 md:bottom-6 md:left-8 md:right-auto", "h-5 w-5"]].map(([pos, size], i) => (
          <Star key={i} className={`pointer-events-none absolute -z-0 opacity-80 md:opacity-100 ${pos} ${size} animate-twinkle fill-star text-star drop-shadow-[0_0_12px_var(--star)]`} style={{ animationDelay: `${i * 0.5}s` }} />
        ))}
        <p className="relative z-10 mb-4 inline-block rounded-full bg-background/20 px-4 py-1 text-sm font-bold">✨ Learning, but make it sparkle ✨</p>
        <h1 className="relative z-10 max-w-3xl text-5xl font-bold leading-tight md:text-7xl">Chart your path to becoming a developer.</h1>
        <p className="relative z-10 mt-6 max-w-xl text-lg opacity-90">Create a personal Starpath for frontend, backend, full stack, game development, or UI/UX &amp; product design — with daily goals, streaks and friends to keep you going.</p>
        <div className="relative z-10 mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full bg-star text-star-foreground shadow-star hover:bg-star/90"><Link to="/roadmap">Start my Starpath</Link></Button>
          <Button asChild size="lg" variant="outline" className="rounded-full border-primary-foreground/50 bg-transparent text-primary-foreground hover:bg-background/20 hover:text-primary-foreground"><Link to="/catalog">Browse catalog</Link></Button>
        </div>
      </section>

      <section className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <div key={f.title} className="rounded-3xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-glow">
            <div className={`mb-4 inline-flex rounded-2xl p-3 text-primary-foreground ${["bg-primary", "bg-secondary", "bg-accent"][i % 3]}`}><f.icon className="h-6 w-6" /></div>
            <h3 className="text-xl font-semibold">{f.title}</h3>
            <p className="mt-2 text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <h2 className="text-3xl font-bold">Career tracks</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TRACKS.map((t) => (
            <div key={t.id} className="rounded-3xl bg-muted p-5">
              <div className="text-4xl">{t.emoji}</div>
              <h3 className="mt-2 text-lg font-semibold">{t.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.courses.length} courses</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
