import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isRecoveryLink } from "@/lib/password-recovery";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Reset your password — Starpath" },
    { name: "description", content: "Set a new password for your Starpath account." },
    { property: "og:title", content: "Reset your password — Starpath" },
    { property: "og:description", content: "Set a new password for your Starpath account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const [state, setState] = useState<"checking" | "ready" | "invalid" | "done">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    let recovery = isRecoveryLink(window.location.hash);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        recovery = true;
        if (mounted) setState("ready");
      }
    });
    void supabase.auth.getUser().then(({ data, error }) => {
      if (mounted) setState(recovery && data.user && !error ? "ready" : "invalid");
    }).catch(() => { if (mounted) setState("invalid"); });
    return () => { mounted = false; data.subscription.unsubscribe(); };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (state !== "ready" || busy) return;
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setError(error.message); return; }
      setState("done");
      await supabase.auth.signOut();
    } catch {
      setError("Couldn't update your password. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return <div className="flex min-h-screen items-center justify-center bg-hero p-4">
    <div className="w-full max-w-md rounded-[2rem] bg-card p-8 text-card-foreground shadow-glow">
      <Star aria-hidden="true" className="mx-auto h-12 w-12 fill-star text-star" />
      <h1 className="my-6 text-center text-3xl font-bold">{state === "done" ? "Password updated ✨" : "Set a new password"}</h1>
      {state === "checking" && <p role="status" className="text-center text-muted-foreground">Checking your reset link…</p>}
      {state === "invalid" && <p role="alert" className="text-center text-muted-foreground">This reset link is missing or has expired. Request a new one using “Forgot password?” on the sign-in page.</p>}
      {state === "ready" && <form onSubmit={submit} className="space-y-4">
        <div><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
        <div><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={6} required value={confirm} onChange={(event) => setConfirm(event.target.value)} /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} size="lg" className="w-full rounded-full">{busy ? "Saving…" : "Save new password"}</Button>
      </form>}
      {state === "done" && <p role="status" className="text-center text-muted-foreground">Your new password is saved. Sign in to continue your Starpath.</p>}
      {(state === "invalid" || state === "done") && <Button asChild variant="link" className="mt-4 w-full"><Link to="/auth">Back to sign in</Link></Button>}
    </div>
  </div>;
}