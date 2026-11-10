import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);
  return { user, ready };
}

export function useMyData() {
  const { user } = useUser();
  const uid = user?.id;
  const q = useQuery({
    queryKey: ["me", uid],
    enabled: !!uid,
    queryFn: async () => {
      const [p, e, l, c] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid!).single(),
        supabase.from("enrollments").select("*").eq("user_id", uid!).order("position"),
        supabase.from("lesson_completions").select("*").eq("user_id", uid!),
        supabase.from("checkins").select("*").eq("user_id", uid!).order("day", { ascending: false }).limit(60),
      ]);
      if (p.error) throw p.error;
      return { profile: p.data, enrollments: e.data ?? [], completions: l.data ?? [], checkins: c.data ?? [] };
    },
  });
  return { user, ...q };
}

export function useRefreshMe() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["me"] });
}

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
