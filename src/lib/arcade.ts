import { supabase } from "@/integrations/supabase/client";
export type ArcadeGame = { id: string; title: string; description: string; url: string; emoji: string; category: string; difficulty: string; platform: string; is_free: boolean; hidden: boolean; sort_order: number };
export const ARCADE_CATEGORIES = ["CSS & HTML", "JavaScript", "Coding & Algorithms", "Git & CLI", "SQL & DB", "Cloud & DevOps", "Logic"];
export const arcadeQuery = {
  queryKey: ["arcade"] as const,
  queryFn: async () => {
    const { data, error } = await supabase.from("arcade_games").select("*").order("sort_order").order("title");
    if (error) throw error;
    return (data ?? []) as ArcadeGame[];
  },
};
