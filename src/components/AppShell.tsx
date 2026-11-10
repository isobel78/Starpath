import { Link, useNavigate } from "@tanstack/react-router";
import { Home, Map, CalendarDays, Library, Users, Star, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/data";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Today", icon: Home },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/calendar", label: "Week", icon: CalendarDays },
  { to: "/catalog", label: "Catalog", icon: Library },
  { to: "/squads", label: "Squads", icon: Users },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold">
            <Star className="h-7 w-7 animate-twinkle fill-star text-star" />
            <span className="text-gradient">Starpath</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="rounded-full px-4 py-2 font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-glow" }}>
                {n.label}
              </Link>
            ))}
          </nav>
          {user ? (
            <Button variant="ghost" size="sm" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
            </Button>
          ) : (
            <Button asChild size="sm" className="rounded-full"><Link to="/auth">Sign in</Link></Button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="flex flex-col items-center gap-1 py-3 text-xs font-bold text-muted-foreground"
              activeProps={{ className: "text-primary" }}>
              <n.icon className="h-5 w-5" />
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
