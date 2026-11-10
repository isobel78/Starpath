import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { applyCatalogRows, type CatalogRow } from "./catalog";

/** Loads admin catalog edits and applies them to the shared course list. Call in any page that shows courses. */
export function useCatalog() {
  const q = useQuery({
    queryKey: ["catalog"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("catalog_items").select("kind, id, data, hidden");
      if (error) throw error;
      const rows = (data ?? []) as CatalogRow[];
      applyCatalogRows(rows);
      return rows;
    },
  });
  return q.dataUpdatedAt;
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
