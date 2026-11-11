import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { applyCatalogRows, applyUserCourses, type CatalogRow } from "./catalog";
import { useUser } from "./data";

/** Loads admin catalog edits and applies them to the shared course list. Call in any page that shows courses. */
export const catalogQuery = {
    queryKey: ["catalog"] as const,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("catalog_items").select("kind, id, data, hidden");
      if (error) throw error;
      const rows = (data ?? []) as CatalogRow[];
      applyCatalogRows(rows);
      return rows;
    },
};
export function useCatalog() {
  const { user } = useUser();
  const base = useQuery(catalogQuery);
  const mine = useQuery({
    queryKey: ["my-courses", user?.id ?? null, base.dataUpdatedAt],
    queryFn: async () => {
      if (!user) { applyUserCourses([]); return 0; }
      const { data } = await supabase.from("user_courses").select("id, data").eq("user_id", user.id).order("created_at");
      applyUserCourses(data ?? []);
      return Date.now();
    },
  });
  return base.dataUpdatedAt + (mine.data ?? 0);
}

export function useIsAdmin(uid: string | undefined) {
  const q = useQuery({
    queryKey: ["is-admin", uid], enabled: !!uid,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: uid!, _role: "admin" });
      return !!data;
    },
  });
  return !!q.data;
}
