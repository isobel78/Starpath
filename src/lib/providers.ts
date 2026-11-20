/** Sites learners may add their own courses from (must match the database rule). */
export const APPROVED_SITES = [
  { provider: "boot.dev", url: "https://www.boot.dev/courses", hosts: ["boot.dev"] },
  { provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn", hosts: ["freecodecamp.org"] },
  { provider: "CS50", url: "https://www.edx.org/cs50", hosts: ["cs50.harvard.edu", "cs50.dev"] },
  { provider: "The Odin Project", url: "https://www.theodinproject.com/paths", hosts: ["theodinproject.com"] },
  { provider: "Exercism", url: "https://exercism.org/tracks", hosts: ["exercism.org"] },
  { provider: "Roadmap.sh", url: "https://roadmap.sh/", hosts: ["roadmap.sh"] },
] as const;

/** Returns the provider name for an approved https course link, or null. CS50 courses hosted on edX count as CS50. */
export function providerForUrl(raw: string): string | null {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase();
  for (const s of APPROVED_SITES) if (s.hosts.some((h) => host === h || host.endsWith("." + h))) return s.provider;
  if ((host === "edx.org" || host.endsWith(".edx.org")) && /cs50/i.test(u.pathname)) return "CS50";
  return null;
}

/** Admin-only: any https link is allowed; provider is the site's name. */
export function providerForAdminUrl(raw: string): string | null {
  const known = providerForUrl(raw);
  if (known) return known;
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  if (u.protocol !== "https:" || !u.hostname.includes(".")) return null;
  return u.hostname.toLowerCase().replace(/^www\./, "");
}
