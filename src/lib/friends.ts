import { supabase } from "@/integrations/supabase/client";

export async function removeFriend(friendshipId: string) {
  const { data, error } = await supabase.from("friendships").delete().eq("id", friendshipId).eq("status", "accepted").select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("This friendship could not be removed. Please refresh and try again.");
}