import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Plus, Check, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COURSES, COURSE_MAP, PROVIDER_COLORS, type Area, type Provider } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Award } from "lucide-react";
import { useMyData, useRefreshMe } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Course catalog — Starpath" },
      { name: "description", content: "Curated courses from boot.dev, freeCodeCamp, Exercism, The Odin Project, CS50 and Roadmap.sh." },
      { property: "og:title", content: "Course catalog — Starpath" },
      { property: "og:description", content: "Curated free and paid coding courses in one place." },
    ],
  }),
  component: Catalog,
});


function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className={`rounded-full px-3 py-1.5 text-sm font-bold transition ${on ? "bg-primary text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{children}</button>;
}

function Catalog() {
  const [q, setQ] = useState("");
  const [prov, setProv] = useState<Provider | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const { user, data } = useMyData();
  const refresh = useRefreshMe();
  const version = useCatalog();
  const enrolled = new Set(data?.enrollments.map((e) => e.course_id));
  const doneSet = new Set(data?.enrollments.filter((e) => e.completed_at).map((e) => e.course_id));
  const PROVIDERS: Provider[] = [...new Set(COURSES.map((c) => c.provider))];
  const AREAS: Area[] = [...new Set(COURSES.map((c) => c.area))];

  const list = useMemo(() => COURSES.filter((c) => (!prov || c.provider === prov) && (!area || c.area === area) && (c.title + c.blurb + (c.tags ?? []).join(" ")).toLowerCase().includes(q.toLowerCase())), [q, prov, area, version]);

  const add = async (id: string) => {
    if (!user) { toast("Sign in to build your Starpath"); return; }
    const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: id, position: (data?.enrollments.length ?? 0) });
    if (error) { toast.error(error.message); return; }
    toast.success("Added to your Starpath 🚀");
    refresh();
  };

  return (
    <AppShell>
      <h1 className="text-4xl font-bold">Course <span className="text-gradient">catalog</span></h1>
      <p className="mt-2 text-muted-foreground">{COURSES.length} hand-picked courses from six top learning platforms.</p>
      <Input placeholder="Search courses…" value={q} onChange={(e) => setQ(e.target.value)} className="mt-6 h-12 rounded-full" />
      <div className="mt-4 flex flex-wrap gap-2"><Chip on={!prov} onClick={() => setProv(null)}>All sources</Chip>{PROVIDERS.map((p) => <Chip key={p} on={prov === p} onClick={() => setProv(p)}>{p}</Chip>)}</div>
      <div className="mt-2 flex flex-wrap gap-2"><Chip on={!area} onClick={() => setArea(null)}>All areas</Chip>{AREAS.map((a) => <Chip key={a} on={area === a} onClick={() => setArea(a)}>{a}</Chip>)}</div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <div key={c.id} className="flex flex-col rounded-3xl border border-border bg-card p-5 transition hover:shadow-glow">
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${PROVIDER_COLORS[c.provider] ?? "bg-accent"}`} />
              <span className="text-xs font-bold uppercase text-muted-foreground">{c.provider}</span>
              <Badge variant="secondary" className="ml-auto">{c.area}</Badge>
            </div>
            <h3 className="mt-3 text-lg font-semibold leading-snug">{c.title}</h3>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.blurb}</p>
            <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> ~{c.hours}h</span>
              <span>{c.units.length} units</span>
            </div>
            {(c.tags?.length ?? 0) > 0 && <div className="mt-2 flex flex-wrap gap-1">{c.tags!.map((t) => <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">#{t}</span>)}</div>}
            {c.prereqs.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Needs: {c.prereqs.map((p) => COURSE_MAP[p]?.title).join(", ")}</p>}
            <div className="mt-4 flex gap-2">
              {doneSet.has(c.id) ? (
                <span className="flex flex-1 items-center justify-center gap-1 rounded-full bg-star/40 px-3 text-sm font-bold">🎓 Completed</span>
              ) : (<>
                <Button size="sm" className="flex-1 rounded-full" disabled={enrolled.has(c.id)} onClick={() => add(c.id)}>
                  {enrolled.has(c.id) ? <><Check className="h-4 w-4" /> In Starpath</> : <><Plus className="h-4 w-4" /> Add</>}
                </Button>
                <PriorDialog courseId={c.id} signedIn={!!user} onSaved={refresh} />
              </>)}
              <Button asChild size="sm" variant="outline" className="rounded-full"><a href={c.url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function PriorDialog({ courseId, signedIn, onSaved }: { courseId: string; signedIn: boolean; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (url && !/^https:\/\/\S+$/.test(url)) { toast.error("Use a full https:// link"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("mark_prior_completion", { _course: courseId, _cert: url });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Marked as completed! +100 XP 🎓"); setOpen(false); onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={(o) => { if (o && !signedIn) { toast("Sign in to track your courses"); return; } setOpen(o); }}>
      <DialogTrigger asChild><Button size="sm" variant="outline" className="rounded-full" title="I already finished this"><Award className="h-4 w-4" /> Done it</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>🎓 Already finished {COURSE_MAP[courseId]?.title}?</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">We'll add it to your trophies and public profile without putting it in your daily schedule. Paste your certificate or badge link (optional).</p>
        <Input placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button onClick={save} disabled={busy} className="rounded-full">Mark as completed</Button>
      </DialogContent>
    </Dialog>
  );
}
