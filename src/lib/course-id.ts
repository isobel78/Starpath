/** Provider prefixes used by every built-in course id (e.g. "fcc-rwd", "boot-go"). */
export const PROVIDER_PREFIX: Record<string, string> = {
  "freeCodeCamp": "fcc", "boot.dev": "boot", "CS50": "cs50", "The Odin Project": "odin", "Exercism": "ex", "Roadmap.sh": "rm",
};
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const FILLER = new Set(["learn", "to", "code", "in", "the", "a", "an", "and", "with", "for", "of", "course", "track", "roadmap", "developer", "introduction", "intro", "cs50", "cs50s", "freecodecamp", "odin", "project", "exercism", "boot", "dev"]);

/** Builds a standard "<prefix>-<short-name>" id that doesn't collide with `taken`. */
export function standardCourseId(title: string, provider: string, taken: (id: string) => boolean): string {
  const prefix = PROVIDER_PREFIX[provider] ?? (slug(provider).split("-")[0] || "course");
  const words = slug(title).split("-").filter((w) => w && !FILLER.has(w));
  const base = `${prefix}-${(words.length ? words : ["course"]).slice(0, 3).join("-")}`.slice(0, 40).replace(/-$/, "");
  let id = base, n = 2;
  while (taken(id)) id = `${base}-${n++}`;
  return id;
}
