import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, EyeOff, Eye, RotateCcw, Trash2, ArrowUpCircle, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUser } from "@/lib/data";
import { catalogQuery, useIsAdmin } from "@/lib/catalog-store";
import { BASE_COURSES, BASE_TRACKS, COURSES, TRACKS, COURSE_MAP, KNOWN_AREAS, KNOWN_PROVIDERS, type Course, type Track } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Curriculum admin — Starpath" }, { name: "description", content: "Manage Starpath courses and career tracks." }, { property: "og:title", content: "Curriculum admin — Starpath" }, { property: "og:description", content: "Manage Starpath courses and career tracks." }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

function AdminPage() {
  const { user, ready } = useUser();
  const isAdmin = useIsAdmin(user?.id);
  const qc = useQueryClient();
  const rowsQ = useQuery(catalogQuery);
  const rows = rowsQ.data ?? [];
  const [tab, setTab] = useState<"courses" | "tracks" | "learners">("courses");
  const learnerQ = useQuery({
    queryKey: ["admin-user-courses"], enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("user_courses").select("id, user_id, data, created_at").order("created_at", { ascending: false });
      const ids = [...new Set((data ?? []).map((r) => r.user_id))];
      const { data: ps } = ids.length ? await supabase.from("public_profiles").select("id, username").in("id", ids) : { data: [] };
      return (data ?? []).map((r) => ({ ...r, course: r.data as unknown as Course, username: ps?.find((p) => p.id === r.user_id)?.username ?? "?" }));
    },
  });
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [editTrack, setEditTrack] = useState<Track | null>(null);
  const [q, setQ] = useState("");

  const hidden = useMemo(() => rows.filter((r) => r.hidden), [rows]);
  if (!ready || (user && rowsQ.isLoading)) return <AppShell><p className="animate-pulse text-center">Loading…</p></AppShell>;
  if (!isAdmin) return <AppShell><p className="text-center text-xl">This area is for the Starpath admin only 🌙</p></AppShell>;

  const reload = () => qc.invalidateQueries({ queryKey: ["catalog"] });
  const upsert = async (kind: "course" | "track", id: string, data: object, isHidden = false) => {
    const { error } = await supabase.from("catalog_items").upsert({ kind, id, data: data as never, hidden: isHidden, updated_at: new Date().toISOString() });
    if (error) { toast.error(error.message); return false; }
    await reload(); return true;
  };
  const reset = async (kind: string, id: string) => {
    const { error } = await supabase.from("catalog_items").delete().eq("kind", kind).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Restored original"); reload(); }
  };
  const isBase = (kind: string, id: string) => (kind === "course" ? BASE_COURSES : BASE_TRACKS).some((x) => x.id === id);
  const isEdited = (kind: string, id: string) => rows.some((r) => r.kind === kind && r.id === id);

  const courses = COURSES.filter((c) => !c.userAdded).filter((c) => (c.title + c.provider + c.area).toLowerCase().includes(q.toLowerCase()));
  const blankCourse: Course = { id: "", title: "", provider: "freeCodeCamp", area: "Frontend", hours: 10, url: "https://", prereqs: [], units: [], blurb: "", tags: [] };

  return (
    <AppShell>
      <h1 className="text-4xl font-bold">Curriculum <span className="text-gradient">admin</span></h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(["courses", "tracks", "learners"] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 font-bold ${tab === t ? "bg-primary text-primary-foreground shadow-glow" : "bg-muted"}`}>{t === "courses" ? `Courses (${COURSES.filter((c) => !c.userAdded).length})` : t === "tracks" ? `Career tracks (${TRACKS.length})` : `Learner-added (${learnerQ.data?.length ?? 0})`}</button>)}
        <Button className="ml-auto rounded-full" onClick={() => tab === "courses" ? setEditCourse(blankCourse) : setEditTrack({ id: "", title: "", emoji: "✨", description: "", courses: [] })}><Plus className="h-4 w-4" /> New {tab === "courses" ? "course" : "track"}</Button>
      </div>

      {tab === "learners" ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">Courses learners added for themselves. Only the learner who added one sees it — promote it to make it part of everyone's catalog.</p>
          {(learnerQ.data ?? []).length === 0 && <p className="text-muted-foreground">No learner-added courses yet.</p>}
          {(learnerQ.data ?? []).map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-star bg-star/15 p-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{r.course.title}</div>
                <div className="truncate text-xs text-muted-foreground">@{r.username} · {r.course.provider} · {r.course.area} · ~{r.course.hours}h · {r.course.units?.length ?? 0} units · {new Date(r.created_at).toLocaleDateString()}</div>
              </div>
              <Button asChild size="sm" variant="ghost"><a href={r.course.url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
              <Button size="sm" variant="ghost" onClick={() => setEditCourse({ ...r.course, userAdded: undefined, id: slug(r.course.title), prereqs: [], tags: r.course.tags ?? [] })}><ArrowUpCircle className="h-4 w-4" /> Promote</Button>
              <Button size="sm" variant="ghost" onClick={async () => { const { error } = await supabase.from("user_courses").delete().eq("id", r.id); if (error) toast.error(error.message); else { toast.success("Deleted"); learnerQ.refetch(); } }}><Trash2 className="h-4 w-4" /> Delete</Button>
            </div>
          ))}
        </div>
      ) : tab === "courses" ? (
        <>
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="mt-4 rounded-full" />
          <div className="mt-4 space-y-2">
            {courses.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{c.title} {isEdited("course", c.id) && <span className="text-xs text-primary">· edited</span>}</div>
                  <div className="truncate text-xs text-muted-foreground">{c.id} · {c.provider} · {c.area} · ~{c.hours}h · {c.url}</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setEditCourse(c)}><Pencil className="h-4 w-4" /> Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => upsert("course", c.id, c, true).then((ok) => ok && toast.success("Hidden from catalog"))}><EyeOff className="h-4 w-4" /> Hide</Button>
                {isBase("course", c.id) && isEdited("course", c.id) && <Button size="sm" variant="ghost" onClick={() => reset("course", c.id)}><RotateCcw className="h-4 w-4" /> Reset</Button>}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-4 space-y-2">
          {TRACKS.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <span className="text-3xl">{t.emoji}</span>
              <div className="min-w-0 flex-1"><div className="font-semibold">{t.title}</div><div className="text-xs text-muted-foreground">{t.courses.map((c) => COURSE_MAP[c]?.title ?? c).join(" → ")}</div></div>
              <Button size="sm" variant="ghost" onClick={() => setEditTrack(t)}><Pencil className="h-4 w-4" /> Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => upsert("track", t.id, t, true)}><EyeOff className="h-4 w-4" /> Hide</Button>
              {isBase("track", t.id) && isEdited("track", t.id) && <Button size="sm" variant="ghost" onClick={() => reset("track", t.id)}><RotateCcw className="h-4 w-4" /> Reset</Button>}
            </div>
          ))}
        </div>
      )}

      {hidden.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold">Hidden</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {hidden.map((r) => <Button key={r.kind + r.id} size="sm" variant="outline" className="rounded-full" onClick={() => isBase(r.kind, r.id) ? reset(r.kind, r.id) : upsert(r.kind as "course", r.id, r.data as object, false)}><Eye className="h-4 w-4" /> Show {r.kind}: {(r.data as { title?: string })?.title ?? r.id}</Button>)}
          </div>
        </section>
      )}

      {editCourse && <CourseForm course={editCourse} onClose={() => setEditCourse(null)} onSave={async (c) => { if (await upsert("course", c.id, c)) { toast.success("Course saved"); setEditCourse(null); } }} />}
      {editTrack && <TrackForm track={editTrack} onClose={() => setEditTrack(null)} onSave={async (t) => { if (await upsert("track", t.id, t)) { toast.success("Track saved"); setEditTrack(null); } }} />}
    </AppShell>
  );
}

function CourseForm({ course, onClose, onSave }: { course: Course; onClose: () => void; onSave: (c: Course) => void }) {
  const isNew = !course.id;
  const [f, setF] = useState({ ...course, prereqsS: course.prereqs.join(", "), tagsS: (course.tags ?? []).join(", "), unitsS: course.units.join("\n"), hoursS: String(course.hours) });
  const submit = () => {
    const id = isNew ? slug(f.id || f.title) : course.id;
    if (!id || !f.title.trim()) { toast.error("Title is required"); return; }
    if (isNew && COURSE_MAP[id]) { toast.error("A course with that id already exists"); return; }
    if (!/^https:\/\/\S+\.\S+/.test(f.url)) { toast.error("Use a full https:// link"); return; }
    const units = f.unitsS.split("\n").map((x) => x.trim()).filter(Boolean);
    if (!units.length) { toast.error("Add at least one unit"); return; }
    const prereqs = list(f.prereqsS);
    const bad = prereqs.filter((p) => !COURSE_MAP[p] || p === id);
    if (bad.length) { toast.error(`Unknown prerequisite id: ${bad.join(", ")}`); return; }
    onSave({ id, title: f.title.trim(), provider: f.provider.trim(), area: f.area.trim(), hours: Math.max(1, Number(f.hoursS) || 1), url: f.url.trim(), prereqs, units, blurb: f.blurb.trim(), tags: list(f.tagsS) });
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isNew ? "New course" : `Edit ${course.title}`}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          {isNew && <div><Label>ID (optional, made from title)</Label><Input value={f.id} onChange={(e) => setF({ ...f, id: e.target.value })} placeholder={slug(f.title)} /></div>}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Platform</Label><Input list="providers" value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })} /></div>
            <div><Label>Area</Label><Input list="areas" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} /></div>
          </div>
          <datalist id="providers">{KNOWN_PROVIDERS.map((p) => <option key={p} value={p} />)}</datalist>
          <datalist id="areas">{KNOWN_AREAS.map((p) => <option key={p} value={p} />)}</datalist>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Hours</Label><Input type="number" min={1} value={f.hoursS} onChange={(e) => setF({ ...f, hoursS: e.target.value })} /></div>
            <div className="col-span-2"><Label>URL</Label><Input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></div>
          </div>
          <div><Label>Description</Label><Textarea value={f.blurb} onChange={(e) => setF({ ...f, blurb: e.target.value })} /></div>
          <div><Label>Prerequisites (course ids, comma separated)</Label><Input value={f.prereqsS} onChange={(e) => setF({ ...f, prereqsS: e.target.value })} placeholder="e.g. fcc-rwd, odin-js" /></div>
          <div><Label>Tags (comma separated)</Label><Input value={f.tagsS} onChange={(e) => setF({ ...f, tagsS: e.target.value })} placeholder="e.g. beginner, projects" /></div>
          <div><Label>Units (one per line)</Label><Textarea rows={6} value={f.unitsS} onChange={(e) => setF({ ...f, unitsS: e.target.value })} /></div>
          <Button onClick={submit} className="w-full rounded-full">Save course</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TrackForm({ track, onClose, onSave }: { track: Track; onClose: () => void; onSave: (t: Track) => void }) {
  const isNew = !track.id;
  const [f, setF] = useState({ ...track, coursesS: track.courses.join(", ") });
  const submit = () => {
    const id = isNew ? slug(f.title) : track.id;
    if (!id || !f.title.trim()) { toast.error("Title is required"); return; }
    if (isNew && TRACKS.some((t) => t.id === id)) { toast.error("A track with that name already exists"); return; }
    const courses = list(f.coursesS);
    const bad = courses.filter((c) => !COURSE_MAP[c]);
    if (bad.length) { toast.error(`Unknown course id: ${bad.join(", ")}`); return; }
    onSave({ id, title: f.title.trim(), emoji: f.emoji.trim() || "✨", description: f.description.trim(), courses });
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isNew ? "New career track" : `Edit ${track.title}`}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <div><Label>Emoji</Label><Input value={f.emoji} onChange={(e) => setF({ ...f, emoji: e.target.value })} /></div>
            <div className="col-span-3"><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          </div>
          <div><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div><Label>Courses in order (ids, comma separated)</Label><Textarea value={f.coursesS} onChange={(e) => setF({ ...f, coursesS: e.target.value })} /></div>
          <p className="text-xs text-muted-foreground">Available ids: {COURSES.map((c) => c.id).join(", ")}</p>
          <Button onClick={submit} className="w-full rounded-full">Save track</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
