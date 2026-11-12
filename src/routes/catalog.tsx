import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Plus, Check, Clock, Trash2, Link2, Sparkles, Map as MapIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APPROVED_SITES, providerForUrl } from "@/lib/providers";
import { draftCourseFromUrl, type CourseDraft } from "@/lib/course-import.functions";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COURSES, COURSE_MAP, PROVIDER_COLORS, KNOWN_AREAS, type Area, type Provider } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Award } from "lucide-react";
import { useMyData, useRefreshMe } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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

  const list = useMemo(() => COURSES.filter((c) => (!prov || c.provider === prov) && (!area || c.area === area) && (c.title + c.blurb + (c.tags ?? []).join(" ")).toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.title.localeCompare(b.title)), [q, prov, area, version]);

  const qc = useQueryClient();
  const add = async (id: string, extra = false) => {
    if (!user) { toast("Sign in to build your Starpath"); return; }
    const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: id, position: (data?.enrollments.length ?? 0), extra });
    if (error) { toast.error(error.message); return; }
    toast.success(extra ? "Added to Extra Credit ✨" : "Added to your Starpath 🚀");
    refresh();
  };
  const removeMine = async (id: string) => {
    if (enrolled.has(id)) { toast.error("Remove it from your Starpath or Extra Credit first"); return; }
    const { error } = await supabase.from("user_courses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Course removed"); qc.invalidateQueries({ queryKey: ["my-courses"] });
  };

  return (
    <AppShell>
      <h1 className="text-4xl font-bold">Course <span className="text-gradient">catalog</span></h1>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground">{COURSES.length} hand-picked courses from six top learning platforms.</p>
        <AddOwnCourse signedIn={!!user} onAdded={(id, extra) => { qc.invalidateQueries({ queryKey: ["my-courses"] }); void add(id, extra); }} />
      </div>
      <Input placeholder="Search courses…" value={q} onChange={(e) => setQ(e.target.value)} className="mt-6 h-12 rounded-full" />
      <div className="mt-4 flex flex-wrap gap-2"><Chip on={!prov} onClick={() => setProv(null)}>All sources</Chip>{PROVIDERS.map((p) => <Chip key={p} on={prov === p} onClick={() => setProv(p)}>{p}</Chip>)}</div>
      <div className="mt-2 flex flex-wrap gap-2"><Chip on={!area} onClick={() => setArea(null)}>All areas</Chip>{AREAS.map((a) => <Chip key={a} on={area === a} onClick={() => setArea(a)}>{a}</Chip>)}</div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <div key={c.id} className={`flex flex-col rounded-3xl border p-5 transition hover:shadow-glow ${c.userAdded ? "border-star bg-star/15" : "border-border bg-card"}`}>
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${PROVIDER_COLORS[c.provider] ?? "bg-accent"}`} />
              <span className="text-xs font-bold uppercase text-muted-foreground">{c.provider}</span>
              {c.userAdded && <Badge className="ml-auto bg-star text-star-foreground hover:bg-star">Added by you</Badge>}
              <Badge variant="secondary" className={c.userAdded ? "" : "ml-auto"}>{c.area}</Badge>
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
                {enrolled.has(c.id) ? (
                  <Button size="sm" className="flex-1 rounded-full" disabled><Check className="h-4 w-4" /> {data?.enrollments.find((e) => e.course_id === c.id)?.extra ? "In Extra Credit" : "In Starpath"}</Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button size="sm" className="flex-1 rounded-full"><Plus className="h-4 w-4" /> Add</Button></DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => add(c.id)}><MapIcon className="h-4 w-4" /> To my Starpath</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => add(c.id, true)}><Sparkles className="h-4 w-4" /> To Extra Credit</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <PriorDialog courseId={c.id} signedIn={!!user} onSaved={refresh} />
              </>)}
              {c.userAdded && <Button size="sm" variant="ghost" className="rounded-full" aria-label="Delete my course" onClick={() => removeMine(c.id)}><Trash2 className="h-4 w-4" /></Button>}
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

const NOT_APPROVED = "Oops! 🌟 Starpath can only add courses from boot.dev, freeCodeCamp, CS50, The Odin Project, Exercism or Roadmap.sh for now. Try a link from one of those sites!";

function AddOwnCourse({ signedIn, onAdded }: { signedIn: boolean; onAdded: (id: string, extra: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState<CourseDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const draftFn = useServerFn(draftCourseFromUrl);
  const reset = () => { setUrl(""); setDraft(null); setErr(""); };
  const read = async () => {
    setErr("");
    if (!providerForUrl(url)) { setErr(NOT_APPROVED); return; }
    setBusy(true);
    try {
      const r = await draftFn({ data: { url } });
      if (!r.draft) setErr(NOT_APPROVED); else setDraft(r.draft);
    } catch { setErr("We couldn't read that page right now. Please try again."); }
    setBusy(false);
  };
  const save = async (extra: boolean) => {
    if (!draft) return;
    const units = draft.units.map((u) => u.trim()).filter(Boolean);
    if (!draft.title.trim() || units.length === 0) { toast.error("Add a title and at least one lesson"); return; }
    setBusy(true);
    const id = "u-" + crypto.randomUUID().slice(0, 13);
    const { error } = await supabase.from("user_courses").insert({ id, data: { ...draft, title: draft.title.trim(), units, prereqs: [] } });
    setBusy(false);
    if (error) { toast.error(error.message.includes("policy") ? NOT_APPROVED : error.message); return; }
    setOpen(false); reset(); onAdded(id, extra);
  };
  return (
    <Dialog open={open} onOpenChange={(o) => { if (o && !signedIn) { toast("Sign in to add your own courses"); return; } setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild><Button variant="outline" className="rounded-full"><Link2 className="h-4 w-4" /> Add your own course</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>✨ Add your own course</DialogTitle></DialogHeader>
        {!draft ? (<>
          <p className="text-sm text-muted-foreground">Paste a link to a course page. For now, courses can only come from these sites:</p>
          <div className="flex flex-wrap gap-2">{APPROVED_SITES.map((s) => <a key={s.provider} href={s.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm font-bold hover:bg-primary hover:text-primary-foreground">{s.provider} <ExternalLink className="h-3 w-3" /></a>)}</div>
          <Input placeholder="https://www.freecodecamp.org/learn/…" value={url} onChange={(e) => { setUrl(e.target.value); setErr(""); }} />
          {err && <p role="alert" className="rounded-2xl bg-star/30 p-3 text-sm font-semibold">{err}</p>}
          <Button onClick={read} disabled={busy || !url.trim()} className="rounded-full">{busy ? "Reading the course…" : "Get course details"}</Button>
        </>) : (<>
          <p className="text-sm text-muted-foreground">Here's what we found on {draft.provider}. Tweak anything, then pick where it goes. Only you will see this course for now, but an admin may add it to the official Starpath catalog later!</p>
          <div><Label htmlFor="uc-t">Title</Label><Input id="uc-t" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
          <div><Label htmlFor="uc-b">Description</Label><Input id="uc-b" value={draft.blurb} onChange={(e) => setDraft({ ...draft, blurb: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="uc-a">Area</Label><select id="uc-a" value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{KNOWN_AREAS.map((a) => <option key={a}>{a}</option>)}</select></div>
            <div><Label htmlFor="uc-h">Hours</Label><Input id="uc-h" type="number" min={1} max={1000} value={draft.hours} onChange={(e) => setDraft({ ...draft, hours: Math.max(1, Number(e.target.value) || 1) })} /></div>
          </div>
          <div><Label htmlFor="uc-u">Lessons (one per line)</Label><Textarea id="uc-u" rows={6} value={draft.units.join("\n")} onChange={(e) => setDraft({ ...draft, units: e.target.value.split("\n") })} /></div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => save(false)} disabled={busy} className="flex-1 rounded-full"><MapIcon className="h-4 w-4" /> Add to my Starpath</Button>
            <Button onClick={() => save(true)} disabled={busy} variant="secondary" className="flex-1 rounded-full"><Sparkles className="h-4 w-4" /> Add to Extra Credit</Button>
          </div>
          <button className="text-sm font-semibold text-primary" onClick={() => setDraft(null)}>← Use a different link</button>
        </>)}
      </DialogContent>
    </Dialog>
  );
}
