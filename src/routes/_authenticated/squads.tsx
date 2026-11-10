import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, Check, X, Copy, Megaphone, Crown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/squads")({
  head: () => ({ meta: [{ title: "Friends & squads — Starpath" }, { name: "description", content: "Study with friends, squad goals and XP leaderboards." }, { property: "og:title", content: "Friends & squads — Starpath" }, { property: "og:description", content: "Study with friends, squad goals and XP leaderboards." }] }),
  component: Squads,
});

type P = { id: string; username: string; display_name: string; avatar_emoji: string; current_streak: number };

function weekStart() { const d = new Date(); const day = (d.getDay() + 6) % 7; d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - day); return d.toISOString(); }

async function weeklyXp(ids: string[]) {
  if (!ids.length) return {} as Record<string, number>;
  const { data } = await supabase.from("xp_events").select("user_id, amount").in("user_id", ids).gte("created_at", weekStart());
  const out: Record<string, number> = {};
  (data ?? []).forEach((r) => (out[r.user_id] = (out[r.user_id] ?? 0) + r.amount));
  return out;
}

function Squads() {
  const { user } = useUser();
  const uid = user?.id;
  const social = useQuery({
    queryKey: ["social", uid], enabled: !!uid,
    queryFn: async () => {
      const { data: fr } = await supabase.from("friendships").select("*");
      const { data: sq } = await supabase.from("squads").select("*");
      const { data: sm } = await supabase.from("squad_members").select("*");
      const ids = new Set<string>([uid!]);
      (fr ?? []).forEach((f) => { ids.add(f.requester); ids.add(f.addressee); });
      (sm ?? []).forEach((m) => ids.add(m.user_id));
      const { data: ps } = await supabase.from("profiles").select("id, username, display_name, avatar_emoji, current_streak").in("id", [...ids]);
      const xp = await weeklyXp([...ids]);
      return { friendships: fr ?? [], squads: sq ?? [], members: sm ?? [], profiles: Object.fromEntries((ps ?? []).map((p) => [p.id, p])) as Record<string, P>, xp };
    },
  });
  const [search, setSearch] = useState("");
  const [squadName, setSquadName] = useState("");
  const [code, setCode] = useState("");
  const reload = () => social.refetch();
  if (!social.data || !uid) return <AppShell><p className="animate-pulse text-center">Loading…</p></AppShell>;
  const { friendships, squads, members, profiles, xp } = social.data;
  const friends = friendships.filter((f) => f.status === "accepted").map((f) => (f.requester === uid ? f.addressee : f.requester));
  const incoming = friendships.filter((f) => f.status === "pending" && f.addressee === uid);
  const outgoing = friendships.filter((f) => f.status === "pending" && f.requester === uid);
  const board = [uid, ...friends].map((id) => ({ p: profiles[id], xp: xp[id] ?? 0 })).filter((x) => x.p).sort((a, b) => b.xp - a.xp);

  const addFriend = async () => {
    const { data: p } = await supabase.from("profiles").select("id").eq("username", search.trim().toLowerCase().replace(/^@/, "")).maybeSingle();
    if (!p) return toast.error("No learner with that username");
    if (p.id === uid) return toast.error("That's you! 😄");
    const { error } = await supabase.from("friendships").insert({ requester: uid, addressee: p.id });
    if (error) return toast.error(error.message.includes("duplicate") ? "Request already sent" : error.message);
    toast.success("Friend request sent"); setSearch(""); reload();
  };
  const respond = async (id: string, accept: boolean) => {
    if (accept) await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    else await supabase.from("friendships").delete().eq("id", id);
    reload();
  };
  const cheer = async (to: string, emoji: string, message: string) => {
    const { error } = await supabase.from("cheers").insert({ from_user: uid, to_user: to, emoji, message });
    if (error) return toast.error(error.message);
    toast.success(`${emoji} Cheer sent!`);
  };
  const createSquad = async () => {
    if (!squadName.trim()) return;
    const { error } = await supabase.from("squads").insert({ name: squadName.trim().slice(0, 40), owner_id: uid });
    if (error) return toast.error(error.message);
    setSquadName(""); toast.success("Squad created!"); reload();
  };
  const join = async () => {
    const { error } = await supabase.rpc("join_squad", { _code: code });
    if (error) return toast.error(error.message);
    setCode(""); toast.success("Joined squad!"); reload();
  };
  const setGoal = async (id: string, goal: number) => { await supabase.from("squads").update({ weekly_xp_goal: Math.max(50, goal) }).eq("id", id); reload(); };

  const Row = ({ p, right, rank }: { p: P; right: React.ReactNode; rank?: number }) => (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      {rank !== undefined && <span className={`flex h-8 w-8 items-center justify-center rounded-full font-display font-bold ${rank === 0 ? "bg-star text-star-foreground shadow-star" : "bg-muted"}`}>{rank === 0 ? <Crown className="h-4 w-4" /> : rank + 1}</span>}
      <span className="text-3xl">{p.avatar_emoji}</span>
      <Link to="/u/$username" params={{ username: p.username }} className="min-w-0 flex-1"><div className="font-semibold">{p.display_name}{p.id === uid && " (you)"}</div><div className="text-xs text-muted-foreground">@{p.username} · 🔥{p.current_streak}</div></Link>
      {right}
    </div>
  );
  const CheerBtns = ({ to }: { to: string }) => to === uid ? null : (
    <div className="flex gap-1">
      <Button size="icon" variant="ghost" aria-label="Cheer" onClick={() => cheer(to, "🎉", "is cheering you on!")}>🎉</Button>
      <Button size="icon" variant="ghost" aria-label="Nudge" onClick={() => cheer(to, "👉", "nudged you to study today!")}><Megaphone className="h-4 w-4" /></Button>
    </div>
  );

  return (
    <AppShell>
      <h1 className="text-4xl font-bold">Friends & <span className="text-gradient">squads</span></h1>
      <Tabs defaultValue="board" className="mt-6">
        <TabsList className="rounded-full"><TabsTrigger value="board" className="rounded-full">Leaderboard</TabsTrigger><TabsTrigger value="friends" className="rounded-full">Friends</TabsTrigger><TabsTrigger value="squads" className="rounded-full">Squads</TabsTrigger></TabsList>

        <TabsContent value="board" className="mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">This week's XP among you and your friends.</p>
          {board.map((b, i) => <Row key={b.p.id} p={b.p} rank={i} right={<><span className="font-display text-lg font-bold text-primary">{b.xp} XP</span><CheerBtns to={b.p.id} /></>} />)}
        </TabsContent>

        <TabsContent value="friends" className="mt-4 space-y-4">
          <div className="flex gap-2"><Input placeholder="Add by username" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-full" /><Button onClick={addFriend} className="rounded-full"><UserPlus className="h-4 w-4" /> Add</Button></div>
          {incoming.length > 0 && <div className="space-y-2"><h3 className="font-bold">Requests</h3>{incoming.map((f) => profiles[f.requester] && <Row key={f.id} p={profiles[f.requester]} right={<><Button size="icon" aria-label="Accept" onClick={() => respond(f.id, true)}><Check className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Decline" onClick={() => respond(f.id, false)}><X className="h-4 w-4" /></Button></>} />)}</div>}
          {outgoing.length > 0 && <p className="text-sm text-muted-foreground">Pending: {outgoing.map((f) => "@" + (profiles[f.addressee]?.username ?? "?")).join(", ")}</p>}
          <div className="space-y-2">{friends.length === 0 ? <p className="text-muted-foreground">No friends yet — share your username!</p> : friends.map((id) => profiles[id] && <Row key={id} p={profiles[id]} right={<CheerBtns to={id} />} />)}</div>
        </TabsContent>

        <TabsContent value="squads" className="mt-4 space-y-4">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="flex gap-2"><Input placeholder="New squad name" value={squadName} onChange={(e) => setSquadName(e.target.value)} className="rounded-full" /><Button onClick={createSquad} className="rounded-full">Create</Button></div>
            <div className="flex gap-2"><Input placeholder="Invite code" value={code} onChange={(e) => setCode(e.target.value)} className="rounded-full" /><Button variant="secondary" onClick={join} className="rounded-full">Join</Button></div>
          </div>
          {squads.length === 0 && <p className="text-muted-foreground">Create a squad and share the invite code with friends.</p>}
          {squads.map((s) => {
            const ms = members.filter((m) => m.squad_id === s.id).map((m) => m.user_id).filter((id) => profiles[id]).sort((a, b) => (xp[b] ?? 0) - (xp[a] ?? 0));
            const total = ms.reduce((t, id) => t + (xp[id] ?? 0), 0);
            return (
              <div key={s.id} className="rounded-3xl bg-muted p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-2xl font-bold">{s.emoji} {s.name}</h3>
                  <button onClick={() => { navigator.clipboard.writeText(s.invite_code); toast.success("Invite code copied"); }} className="flex items-center gap-1 rounded-full bg-card px-3 py-1 text-sm font-bold"><Copy className="h-3.5 w-3.5" /> {s.invite_code}</button>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm font-semibold"><span>Weekly goal: {total} / {s.weekly_xp_goal} XP</span>{s.owner_id === uid && <Input type="number" defaultValue={s.weekly_xp_goal} onBlur={(e) => setGoal(s.id, Number(e.target.value))} className="h-8 w-24 bg-card" aria-label="Weekly goal" />}</div>
                <Progress value={Math.min(100, (total / s.weekly_xp_goal) * 100)} className="mt-2 h-3" />
                {total >= s.weekly_xp_goal && <p className="mt-2 font-bold text-primary">🌟 Goal smashed this week!</p>}
                <div className="mt-4 space-y-2">{ms.map((id, i) => <Row key={id} p={profiles[id]} rank={i} right={<><span className="font-bold text-primary">{xp[id] ?? 0} XP</span><CheerBtns to={id} /></>} />)}</div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
