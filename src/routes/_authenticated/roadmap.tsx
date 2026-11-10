import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Trash2, Wand2, Award, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMyData, useRefreshMe } from "@/lib/data";
import { computePlan } from "@/lib/plan";
import { COURSE_MAP, TRACKS } from "@/lib/catalog";
import { orderByPrereqs, missingPrereqs } from "@/lib/schedule";
import { supabase } from "@/integrations/supabase/client";
import { useCatalog } from "@/lib/catalog-store";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({ meta: [{ title: "My roadmap — Starpath" }, { name: "description", content: "Pick a career track or build your own course playlist." }, { property: "og:title", content: "My roadmap — Starpath" }, { property: "og:description", content: "Pick a career track or build your own course playlist." }] }),
  component: Roadmap,
});

function Roadmap() {
  const { data, user } = useMyData();
  const refresh = useRefreshMe();
  const [mode, setMode] = useState<"hours" | "date">("hours");
  const [hours, setHours] = useState("7");
  const [date, setDate] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useCatalog();
  useEffect(() => {
    if (!data) return;
    setMode(data.profile.pace_mode === "date" ? "date" : "hours");
    setHours(String(data.profile.hours_per_week));
    setDate(data.profile.target_date ?? "");
  }, [data?.profile]);
  if (!data || !user) return <AppShell><p className="animate-pulse text-center">Loading…</p></AppShell>;
  const ids = data.enrollments.map((e) => e.course_id);
  const track = TRACKS.find((t) => t.id === preview) ?? null;
  const previewIds = track ? orderByPrereqs([...new Set([...ids, ...track.courses])]) : ids;
  const plan = computePlan({
    profile: { pace_mode: mode, hours_per_week: Number(hours) || 7, target_date: mode === "date" ? date || null : null },
    enrollments: previewIds.map((cid) => data.enrollments.find((e) => e.course_id === cid) ?? { course_id: cid, completed_at: null }),
    completions: data.completions,
  }, 1);
  const active = data.enrollments.filter((e) => !e.prior);
  const prior = data.enrollments.filter((e) => e.prior);
  const missing = missingPrereqs(ids);

  const savePositions = async (order: string[]) => {
    await Promise.all(order.map((cid, i) => supabase.from("enrollments").update({ position: i }).eq("user_id", user.id).eq("course_id", cid)));
    refresh();
  };
  const paceFields = () => ({ pace_mode: mode, hours_per_week: Math.max(1, Math.min(80, Number(hours) || 7)), target_date: mode === "date" ? date || null : null });
  const startLearning = async () => {
    if (!track) return;
    if (mode === "date" && !date) { toast.error("Pick a target date"); return; }
    setBusy(true);
    const merged = previewIds;
    const rows = merged.filter((c) => !ids.includes(c)).map((c) => ({ user_id: user.id, course_id: c, position: merged.indexOf(c) }));
    if (rows.length) { const { error } = await supabase.from("enrollments").insert(rows); if (error) { setBusy(false); toast.error(error.message); return; } }
    const { error } = await supabase.from("profiles").update({ track_id: track.id, ...paceFields() }).eq("id", user.id);
    if (error) { setBusy(false); toast.error(error.message); return; }
    await Promise.all(merged.map((cid, i) => supabase.from("enrollments").update({ position: i }).eq("user_id", user.id).eq("course_id", cid)));
    await refresh();
    setBusy(false);
    toast.success(`${track.emoji} ${track.title} — let's go!`);
    navigate({ to: "/calendar" });
  };
  const move = (i: number, d: number) => { const o = active.map((e) => e.course_id); const j = i + d; if (j < 0 || j >= o.length) return; [o[i], o[j]] = [o[j]!, o[i]!]; savePositions(o); };
  const remove = async (cid: string) => { await supabase.from("enrollments").delete().eq("user_id", user.id).eq("course_id", cid); refresh(); };
  const addMissing = async () => {
    const merged = orderByPrereqs([...missing, ...ids]);
    await supabase.from("enrollments").insert(missing.map((c) => ({ user_id: user.id, course_id: c, position: merged.indexOf(c) })));
    await savePositions(merged);
    toast.success("Prerequisites added in the right order");
  };
  const savePace = async () => {
    if (mode === "date" && !date) { toast.error("Pick a target date"); return; }
    const { error } = await supabase.from("profiles").update(paceFields()).eq("id", user.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Schedule updated"); refresh();
  };

  return (
    <AppShell>
      <h1 className="text-4xl font-bold">My <span className="text-gradient">roadmap</span></h1>

      <section className="mt-6">
        <h2 className="text-xl font-bold">Browse career tracks</h2>
        <p className="text-sm text-muted-foreground">Tap a track to peek at its courses. Nothing is added until you press Start learning.</p>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {TRACKS.map((t) => (
            <button key={t.id} onClick={() => setPreview(preview === t.id ? null : t.id)} aria-pressed={preview === t.id} className={`min-w-56 rounded-3xl border p-4 text-left transition hover:-translate-y-1 hover:shadow-glow ${preview === t.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
              <div className="text-3xl">{t.emoji}</div>
              <div className="mt-1 font-display text-lg font-semibold">{t.title} {data.profile.track_id === t.id && <span className="text-xs">· current</span>}</div>
              <div className="text-xs opacity-80">{t.description}</div>
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Or build your own playlist from the <Link to="/catalog" className="font-bold text-primary">catalog</Link>.</p>
        {track && (
          <div className="mt-4 rounded-3xl border-2 border-primary bg-card p-5">
            <h3 className="font-display text-2xl font-bold">{track.emoji} {track.title}</h3>
            <p className="text-sm text-muted-foreground">{track.description}</p>
            <ol className="mt-4 space-y-2">
              {track.courses.map((cid, i) => { const c = COURSE_MAP[cid]; if (!c) return null; return (
                <li key={cid} className="flex items-start gap-3 rounded-2xl bg-muted p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sun font-bold text-primary-foreground">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{c.title} {ids.includes(cid) && <span className="text-xs text-primary">· already in your roadmap</span>}</div>
                    <div className="text-xs text-muted-foreground">{c.provider} · ~{c.hours}h · {c.units.length} units</div>
                    <p className="text-sm">{c.blurb}</p>
                  </div>
                  <a href={c.url} target="_blank" rel="noreferrer" aria-label="Open course" className="text-primary"><ExternalLink className="h-4 w-4" /></a>
                </li>); })}
            </ol>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-3xl bg-muted p-5">
        <h2 className="text-xl font-bold">{track ? "Pick your pace" : "Pace"}</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex rounded-full bg-card p-1">
            {(["hours", "date"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`rounded-full px-4 py-2 text-sm font-bold ${mode === m ? "bg-primary text-primary-foreground" : ""}`}>{m === "hours" ? "Hours / week" : "Finish by date"}</button>)}
          </div>
          {mode === "hours" ? <Input type="number" min={1} max={80} className="w-28 bg-card" value={hours} onChange={(e) => setHours(e.target.value)} /> : <Input type="date" className="w-44 bg-card" value={date} onChange={(e) => setDate(e.target.value)} />}
          {track ? <Button onClick={startLearning} disabled={busy} size="lg" className="rounded-full shadow-glow">Start learning! ✨</Button> : <Button onClick={savePace} className="rounded-full">Save</Button>}
        </div>
        <p className="mt-3 text-sm">≈ <b>{plan.perDay} min/day</b> · {Math.round(plan.remainingMinutes / 60)}h remaining · estimated finish <b>{plan.finish.toLocaleDateString()}</b></p>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">Your courses ({active.length})</h2>
          {ids.length > 1 && <Button variant="outline" size="sm" className="rounded-full" onClick={() => savePositions(orderByPrereqs(ids)).then(() => toast.success("Sorted by prerequisites"))}><Wand2 className="h-4 w-4" /> Auto-order</Button>}
        </div>
        {missing.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-star/30 p-4 text-sm">
            <span>⚠️ Missing prerequisites: <b>{missing.map((m) => COURSE_MAP[m]?.title).join(", ")}</b></span>
            <Button size="sm" className="rounded-full" onClick={addMissing}>Add them</Button>
          </div>
        )}
        <div className="mt-4 space-y-3">
          {active.map((e, i) => {
            const c = COURSE_MAP[e.course_id]; if (!c) return null;
            const doneN = data.completions.filter((x) => x.course_id === c.id).length;
            const pct = Math.round((doneN / c.units.length) * 100);
            return (
              <div key={e.id} className="rounded-3xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sun font-display font-bold text-primary-foreground">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{c.title} {e.completed_at && "🎓"}</div>
                    <div className="text-xs text-muted-foreground">{c.provider} · {doneN}/{c.units.length} units · ~{c.hours}h</div>
                  </div>
                  <div className="flex">
                    <Button size="icon" variant="ghost" aria-label="Move up" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Move down" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <Progress value={pct} className="mt-3 h-2" />
                {(pct === 100 || e.completed_at) && <CertDialog courseId={c.id} current={e.certificate_url} done={!!e.completed_at} onSaved={refresh} />}
              </div>
            );
          })}
        </div>
        {prior.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold">Completed before Starpath 🎓</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {prior.map((e) => <span key={e.id} className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold border border-border">{COURSE_MAP[e.course_id]?.title ?? e.course_id}{e.certificate_url && <a href={e.certificate_url} target="_blank" rel="noreferrer" className="text-primary" aria-label="Certificate"><ExternalLink className="h-3.5 w-3.5" /></a>}</span>)}
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function CertDialog({ courseId, current, done, onSaved }: { courseId: string; current: string | null; done: boolean; onSaved: () => void }) {
  const [url, setUrl] = useState(current ?? "");
  const [open, setOpen] = useState(false);
  const save = async () => {
    if (url && !/^https:\/\/\S+$/.test(url)) { toast.error("Use a full https:// link"); return; }
    const { error } = await supabase.rpc("complete_course", { _course: courseId, _cert: url });
    if (error) { toast.error(error.message); return; }
    toast.success(done ? "Certificate saved" : "Course complete! +100 XP 🎓"); setOpen(false); onSaved();
  };
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {current && <a href={current} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-bold text-primary">Certificate <ExternalLink className="h-3.5 w-3.5" /></a>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button size="sm" className="rounded-full bg-star text-star-foreground hover:bg-star/90"><Award className="h-4 w-4" /> {done ? "Edit certificate" : "Complete course"}</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>🎓 {COURSE_MAP[courseId]?.title}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Paste a link to your verified certificate or badge (optional). It shows on your public profile.</p>
          <Input placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button onClick={save} className="rounded-full">Save</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
