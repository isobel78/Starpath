import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { arcadeQuery } from "@/lib/arcade";

export const Route = createFileRoute("/arcade")({
  staticData: { sitemap: true },
  head: () => ({ meta: [
    { title: "Arcade — learn to code with games | Starpath" },
    { name: "description", content: "Play learning games for CSS, Git, SQL, Linux, Kubernetes, AWS and more." },
    { property: "og:title", content: "Starpath Arcade 🕹️" },
    { property: "og:description", content: "Level up your coding skills with fun learning games." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Arcade,
});

function Arcade() {
  const { user } = useUser();
  const qc = useQueryClient();
  const games = useQuery(arcadeQuery).data ?? [];
  const plays = useQuery({ queryKey: ["plays", user?.id], enabled: !!user, queryFn: async () => {
    const { data } = await supabase.from("user_game_plays").select("game_id");
    return new Set((data ?? []).map((r) => r.game_id));
  } }).data ?? new Set<string>();
  const [cat, setCat] = useState("All");
  const [show, setShow] = useState<"all" | "played" | "unplayed">("all");
  const visible = games.filter((g) => !g.hidden);
  const cats = ["All", ...new Set(visible.map((g) => g.category))];
  const list = visible.filter((g) => (cat === "All" || g.category === cat) && (show === "all" || (show === "played") === plays.has(g.id)));
  const toggle = async (id: string) => {
    if (!user) { toast("Sign in to track games you've played"); return; }
    const { error } = plays.has(id)
      ? await supabase.from("user_game_plays").delete().eq("game_id", id).eq("user_id", user.id)
      : await supabase.from("user_game_plays").insert({ game_id: id, user_id: user.id });
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["plays"] });
  };
  return (
    <AppShell>
      <h1 className="text-4xl font-bold">Starpath <span className="text-gradient">Arcade</span> 🕹️</h1>
      <p className="mt-2 text-muted-foreground">Learn languages, tools and concepts by playing. Just for fun — no homework!</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {cats.map((c) => <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-sm font-bold ${cat === c ? "bg-primary text-primary-foreground shadow-glow" : "bg-muted"}`}>{c}</button>)}
      </div>
      {user && <div className="mt-3 flex gap-2 text-sm">{(["all", "unplayed", "played"] as const).map((s) => <button key={s} onClick={() => setShow(s)} className={`rounded-full border px-3 py-1 font-semibold ${show === s ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>{s === "all" ? "All games" : s === "played" ? "Played" : "Want to play"}</button>)}</div>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((g) => { const done = plays.has(g.id); return (
          <div key={g.id} className={`flex flex-col rounded-3xl border-2 bg-card p-5 transition ${done ? "border-star shadow-glow" : "border-primary/40 hover:border-primary"}`}>
            <div className="flex items-start gap-3">
              <span className="text-4xl">{g.emoji}</span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl font-bold">{g.title}</h2>
                <p className="text-xs text-muted-foreground">{g.platform} · {g.difficulty} · {g.is_free ? "Free" : "Free trial / paid"}</p>
              </div>
            </div>
            <p className="mt-3 flex-1 text-sm">{g.description}</p>
            <span className="mt-3 w-fit rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold">{g.category}</span>
            <div className="mt-4 flex gap-2">
              <Button asChild className="flex-1 rounded-full"><a href={g.url} target="_blank" rel="noreferrer">Play <ExternalLink className="h-4 w-4" /></a></Button>
              <Button variant={done ? "default" : "outline"} className={`rounded-full ${done ? "bg-star text-foreground hover:bg-star" : ""}`} onClick={() => toggle(g.id)}><Check className="h-4 w-4" /> {done ? "Played!" : "Played it"}</Button>
            </div>
          </div>
        ); })}
        {list.length === 0 && <p className="text-muted-foreground">No games here yet.</p>}
      </div>
    </AppShell>
  );
}
