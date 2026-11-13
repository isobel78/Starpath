export type ArcadeFilter = "all" | "played" | "wanted";

export function matchesArcadeFilter(id: string, filter: ArcadeFilter, played: ReadonlySet<string>, wanted: ReadonlySet<string>) {
  if (filter === "played") return played.has(id);
  if (filter === "wanted") return wanted.has(id);
  return true;
}