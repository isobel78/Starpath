/** Sites learners may add their own courses from (must match the database rule). */
export const APPROVED_SITES = [
  { provider: "boot.dev", url: "https://www.boot.dev/courses", hosts: ["boot.dev"] },
  { provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn", hosts: ["freecodecamp.org"] },
  { provider: "CS50", url: "https://cs50.harvard.edu/", hosts: ["cs50.harvard.edu", "cs50.dev"] },
  { provider: "The Odin Project", url: "https://www.theodinproject.com/paths", hosts: ["theodinproject.com"] },
  { provider: "Exercism", url: "https://exercism.org/tracks", hosts: ["exercism.org"] },
  { provider: "Roadmap.sh", url: "https://roadmap.sh/", hosts: ["roadmap.sh"] },
] as const;

/** Returns the provider name for an approved https course link, or null. */
export function providerForUrl(raw: string): string | null {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase();
  for (const s of APPROVED_SITES) if (s.hosts.some((h) => host === h || host.endsWith("." + h))) return s.provider;
  return null;
}
