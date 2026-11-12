import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { deleteMyAccount } from "@/lib/account.functions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, ExternalLink, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { UserAvatar } from "@/components/UserAvatar";
import { AvatarCropDialog } from "@/components/AvatarCropDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMyData, useRefreshMe } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { title: "Profile & settings — Starpath" }, { name: "description", content: "Edit your Starpath profile, avatar and password." }, { property: "og:title", content: "Profile & settings — Starpath" }, { property: "og:description", content: "Edit your Starpath profile, avatar and password." }] }),
  component: SettingsPage,
});

const AVATARS = ["🚀", "🦄", "🐱", "🦊", "🐙", "🐼", "🐸", "🐧", "🦋", "🐝", "🐲", "👾", "🧙", "🌈", "🌸", "🍩", "🐻", "🐰", "🦖", "🐳"];

function SettingsPage() {
  const { data, user } = useMyData();
  const refresh = useRefreshMe();
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [origSrc, setOrigSrc] = useState<string | null>(null);
  const [f, setF] = useState({ username: "", display_name: "", bio: "", avatar_emoji: "🚀", avatar_url: null as string | null });
  const [pw, setPw] = useState({ a: "", b: "" });
  const [email, setEmail] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const del = useServerFn(deleteMyAccount);
  const navigate = useNavigate();
  useEffect(() => {
    if (data) setF({ username: data.profile.username, display_name: data.profile.display_name, bio: data.profile.bio, avatar_emoji: data.profile.avatar_emoji, avatar_url: data.profile.avatar_url });
  }, [data?.profile]);
  if (!data || !user) return <AppShell><p className="animate-pulse text-center">Loading…</p></AppShell>;
  const hasPassword = (user.identities ?? []).some((i) => i.provider === "email");

  const save = async () => {
    const username = f.username.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (username.length < 3 || username.length > 24) { toast.error("Username needs 3–24 letters, numbers or _"); return; }
    const { error } = await supabase.from("profiles").update({ username, display_name: f.display_name.trim().slice(0, 40) || "Learner", bio: f.bio.slice(0, 200), avatar_emoji: f.avatar_emoji, avatar_url: f.avatar_url }).eq("id", user.id);
    if (error) { toast.error(error.message.includes("unique") ? "That username is taken" : error.message); return; }
    setF({ ...f, username });
    toast.success("Profile saved ✨"); refresh();
  };
  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please pick an image file"); return; }
    const reader = new FileReader();
    reader.onload = () => { setOrigSrc(reader.result as string); setCropSrc(reader.result as string); };
    reader.onerror = () => toast.error("Couldn't read that image");
    reader.readAsDataURL(file);
  };
  const changePw = async () => {
    if (pw.a.length < 6) { toast.error("Password needs at least 6 characters"); return; }
    if (pw.a !== pw.b) { toast.error("Passwords don't match"); return; }
    const { error } = await supabase.auth.updateUser({ password: pw.a });
    if (error) { toast.error(error.message); return; }
    setPw({ a: "", b: "" }); toast.success("Password updated 🔒");
  };

  const changeEmail = async () => {
    const next = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) { toast.error("Please enter a valid email"); return; }
    if (next === user.email) { toast.error("That's already your email"); return; }
    const { error } = await supabase.auth.updateUser({ email: next }, { emailRedirectTo: `${window.location.origin}/settings` });
    if (error) { toast.error(error.message); return; }
    setEmail(""); toast.success("Check your inbox to confirm the new email 📬");
  };

  const removeAccount = async () => {
    setDeleting(true);
    try {
      await del();
      await supabase.auth.signOut();
      toast.success("Your account has been deleted. Safe travels! 🌠");
      navigate({ to: "/" });
    } catch (e) { toast.error((e as Error).message || "Couldn't delete your account"); setDeleting(false); }
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-bold">Profile & <span className="text-gradient">settings</span></h1>
        <Button asChild variant="outline" className="rounded-full"><Link to="/u/$username" params={{ username: data.profile.username }}><ExternalLink className="h-4 w-4" /> View public profile</Link></Button>
      </div>
      <section className="mt-6 rounded-3xl border border-border bg-card p-6">
        <h2 className="text-xl font-bold">Avatar</h2>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {f.avatar_url ? (
            <button type="button" aria-label="Edit photo crop" title="Click to adjust crop" onClick={() => setCropSrc(origSrc ?? f.avatar_url)} className="group relative rounded-full">
              <UserAvatar url={f.avatar_url} emoji={f.avatar_emoji} className="h-24 w-24 text-6xl shadow-glow" />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/50 text-xs font-bold text-background opacity-0 transition group-hover:opacity-100">Edit crop</span>
            </button>
          ) : <UserAvatar url={f.avatar_url} emoji={f.avatar_emoji} className="h-24 w-24 text-6xl shadow-glow" />}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Upload photo</Button>
            {f.avatar_url && <Button variant="ghost" className="rounded-full" onClick={() => { setOrigSrc(null); setF({ ...f, avatar_url: null }); }}>Use a character instead</Button>}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
            <AvatarCropDialog src={cropSrc} onCancel={() => setCropSrc(null)} onDone={(url) => { setCropSrc(null); setF((p) => ({ ...p, avatar_url: url })); toast("Looking good! Press Save to keep it."); }} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-3 sm:grid-cols-10">
          {AVATARS.map((e) => (
            <button key={e} aria-label={`Avatar ${e}`} onClick={() => setF({ ...f, avatar_emoji: e, avatar_url: null })}
              className={`rounded-full p-1 transition hover:scale-110 ${!f.avatar_url && f.avatar_emoji === e ? "ring-4 ring-star" : ""}`}>
              <UserAvatar emoji={e} className="h-12 w-12 text-3xl" />
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 space-y-4 rounded-3xl border border-border bg-card p-6">
        <h2 className="text-xl font-bold">Profile</h2>
        <div><Label htmlFor="dn">Display name</Label><Input id="dn" value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} /></div>
        <div><Label htmlFor="un">Username</Label><Input id="un" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
          <p className="mt-1 text-xs text-muted-foreground">Your public profile: /u/{f.username.toLowerCase().replace(/[^a-z0-9_]/g, "")}</p></div>
        <div><Label htmlFor="bio">Bio</Label><Textarea id="bio" maxLength={200} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></div>
        <Button onClick={save} className="rounded-full">Save profile</Button>
      </section>

      {hasPassword && (
        <section className="mt-6 space-y-4 rounded-3xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold">Change email</h2>
          <p className="text-sm text-muted-foreground">Current email: <b>{user.email}</b>{user.new_email && <> · waiting for confirmation of <b>{user.new_email}</b></>}</p>
          <div><Label htmlFor="em">New email</Label><Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <Button onClick={changeEmail} className="rounded-full">Update email</Button>
        </section>
      )}

      {hasPassword && (
        <section className="mt-6 space-y-4 rounded-3xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold">Change password</h2>
          <div><Label htmlFor="p1">New password</Label><Input id="p1" type="password" value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} /></div>
          <div><Label htmlFor="p2">Confirm new password</Label><Input id="p2" type="password" value={pw.b} onChange={(e) => setPw({ ...pw, b: e.target.value })} /></div>
          <Button onClick={changePw} className="rounded-full">Update password</Button>
        </section>
      )}

      <section className="mt-6 space-y-3 rounded-3xl border border-destructive/40 bg-card p-6">
        <h2 className="text-xl font-bold text-destructive">Delete account</h2>
        <p className="text-sm text-muted-foreground">Permanently removes your profile, progress, XP, certificates, friends and any squads you own. This can't be undone.</p>
        <AlertDialog onOpenChange={(o) => !o && setConfirmText("")}>
          <AlertDialogTrigger asChild><Button variant="destructive" className="rounded-full"><Trash2 className="h-4 w-4" /> Delete my account</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account forever?</AlertDialogTitle>
              <AlertDialogDescription>All your Starpath data will be erased. Type <b>DELETE</b> to confirm.</AlertDialogDescription>
            </AlertDialogHeader>
            <Input aria-label="Type DELETE to confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Keep my account</AlertDialogCancel>
              <AlertDialogAction disabled={confirmText !== "DELETE" || deleting} onClick={(e) => { e.preventDefault(); void removeAccount(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{deleting ? "Deleting…" : "Delete forever"}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </AppShell>
  );
}
