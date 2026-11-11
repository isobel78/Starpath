import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import "@lovable.dev/cloud-auth-js/styles.css";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { setRemember } from "@/lib/remember";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Starpath" },
      { name: "description", content: "Sign in or create your Starpath account." },
      { property: "og:title", content: "Sign in — Starpath" },
      { property: "og:description", content: "Sign in or create your Starpath account." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ mode: s.mode === "up" ? ("up" as const) : undefined }),
  component: AuthPage,
});

const G = <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>;

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"in" | "up">(search.mode ?? "in");
  const [name, setName] = useState("");
  const [keep, setKeep] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && navigate({ to: "/dashboard" }));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => s && navigate({ to: "/dashboard" }));
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "up" && !name.trim()) { toast.error("Pick a display name"); return; }
    setBusy(true);
    setRemember(keep);
    const res = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/auth", data: { display_name: name.trim().slice(0, 40) } } });
    setBusy(false);
    if (res.error) { toast.error(res.error.message); return; }
    if (mode === "up" && !res.data.session) toast.success("Check your email to confirm your account ✨");
  };

  const oauth = async (p: "google" | "lovable") => {
    setRemember(keep);
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(String(r.error.message ?? r.error));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-card p-8 text-card-foreground shadow-glow">
        <div className="mb-6 text-center">
          <Star className="mx-auto h-12 w-12 animate-twinkle fill-star text-star" />
          <h1 className="mt-2 text-3xl font-bold">{mode === "in" ? "Welcome back!" : "Join Starpath"}</h1>
        </div>
        <div className="space-y-3">
          <button type="button" onClick={() => oauth("google")} className="flex h-11 w-full items-center justify-center gap-[10px] rounded-full border px-3 text-sm font-medium" style={{ background: "#FFFFFF", borderColor: "#747775", color: "#1F1F1F" }}>
            {G} Continue with Google
          </button>
          <button type="button" className="lovable-auth-button w-full" onClick={() => oauth("lovable")}>Continue with Lovable</button>
        </div>
        <div className="my-5 text-center text-xs font-bold uppercase text-muted-foreground">or with email</div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "up" && <div><Label htmlFor="name">Display name</Label><Input id="name" required maxLength={40} placeholder="What should we call you?" value={name} onChange={(e) => setName(e.target.value)} /></div>}
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label htmlFor="pw">Password</Label><Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm font-semibold"><Checkbox checked={keep} onCheckedChange={(v) => setKeep(v === true)} /> Keep me signed in</label>
          <Button type="submit" disabled={busy} className="w-full rounded-full" size="lg">{mode === "in" ? "Sign in" : "Create account"}</Button>
        </form>
        <button className="mt-4 w-full text-sm font-semibold text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
