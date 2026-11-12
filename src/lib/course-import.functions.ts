import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { providerForUrl } from "./providers";
import { KNOWN_AREAS } from "./catalog";

export interface CourseDraft { title: string; blurb: string; provider: string; area: string; hours: number; units: string[]; tags: string[]; url: string }

const strip = (h: string) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

/** Reads an approved course page and drafts a catalog entry in the same shape as built-in courses. */
export const draftCourseFromUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { url: string }) => ({ url: String(d.url ?? "").trim().slice(0, 500) }))
  .handler(async ({ data }): Promise<{ draft: CourseDraft | null; error?: string }> => {
    const provider = providerForUrl(data.url);
    if (!provider) return { draft: null, error: "not-approved" };
    let pageTitle = "", desc = "", text = "";
    try {
      const res = await fetch(data.url, { headers: { "user-agent": "Mozilla/5.0 StarpathBot" }, redirect: "follow" });
      const html = (await res.text()).slice(0, 400_000);
      pageTitle = strip(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
      desc = html.match(/<meta[^>]+(?:name|property)=["'](?:og:)?description["'][^>]*content=["']([^"']*)/i)?.[1] ?? "";
      text = strip(html).slice(0, 6000);
    } catch (e) { console.error("course fetch failed", e); }
    const fallback: CourseDraft = { title: pageTitle.split(/[|–—-]/)[0]?.trim() || "My course", blurb: desc.slice(0, 160) || `A ${provider} course.`, provider, area: "Languages", hours: 20, units: Array.from({ length: 8 }, (_, i) => `Part ${i + 1}`), tags: [], url: data.url };
    try {
      const { generateResponse } = await import("@lovable.dev/ai-gateway");
      const r = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: `You turn an online coding course page into a catalog entry. Reply with ONLY a JSON object: {"title": string (official course name), "blurb": string (one upbeat sentence, max 110 chars), "area": one of ${JSON.stringify(KNOWN_AREAS)}, "hours": integer estimated total study hours, "units": array of 6-14 short lesson/module names in order, "tags": array of up to 4 lowercase keywords}. Use the real module names when the page lists them.`,
        input: `Provider: ${provider}\nURL: ${data.url}\nTitle: ${pageTitle}\nDescription: ${desc}\nPage text: ${text}`,
      });
      const out = r.output.flatMap((o) => (o.type === "message" ? o.content : [])).map((c) => (c.type === "output_text" ? c.text : "")).join("");
      const j = JSON.parse(out.match(/\{[\s\S]*\}/)?.[0] ?? "{}") as Partial<CourseDraft>;
      return { draft: {
        ...fallback,
        title: String(j.title || fallback.title).slice(0, 120),
        blurb: String(j.blurb || fallback.blurb).slice(0, 200),
        area: KNOWN_AREAS.includes(String(j.area)) ? String(j.area) : fallback.area,
        hours: Math.max(1, Math.min(1000, Math.round(Number(j.hours) || fallback.hours))),
        units: Array.isArray(j.units) && j.units.length ? j.units.slice(0, 40).map((u) => String(u).slice(0, 100)) : fallback.units,
        tags: Array.isArray(j.tags) ? j.tags.slice(0, 4).map((t) => String(t).toLowerCase().slice(0, 20)) : [],
      } };
    } catch (e) {
      console.error("course draft AI failed", e);
      return { draft: fallback };
    }
  });
