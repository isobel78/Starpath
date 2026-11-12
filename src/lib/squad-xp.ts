export type XpEv = { user_id: string; amount: number; created_at: string; reason: string };

/** XP a member earned toward a squad: this UTC week, only after they joined, excluding squad awards (matches the server). */
export function squadXp(events: XpEv[] | undefined | null, userId: string, joinedAt: string, weekStartIso: string) {
  const from = Math.max(Date.parse(weekStartIso), Date.parse(joinedAt));
  return (events ?? []).filter((e) => e.user_id === userId && !(e.reason ?? "").startsWith("squad:") && Date.parse(e.created_at) >= from).reduce((t, e) => t + e.amount, 0);
}
