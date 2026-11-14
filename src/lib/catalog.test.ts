import { describe, it, expect, afterEach } from "vitest";
import { applyCatalogRows, COURSE_MAP, COURSES, TRACKS } from "./catalog";
import { computePlan } from "./plan";

afterEach(() => applyCatalogRows([]));

describe("catalog rules", () => {
  it("combines the UX roadmap and two Figma courses in prerequisite order", () => {
    expect(TRACKS.find((track) => track.id === "ui-ux")?.courses).toEqual(["rm-ux-design", "fcc-figma-ux", "fcc-figma-ui"]);
    expect(COURSE_MAP["rm-ux-design"]?.url).toBe("https://roadmap.sh/ux-design");
    expect(COURSE_MAP["fcc-figma-ux"]?.url).toBe("https://www.freecodecamp.org/news/learn-figma-for-ui-ux-design/");
    expect(COURSE_MAP["fcc-figma-ui"]?.url).toBe("https://www.freecodecamp.org/news/ui-design-with-figma-tutorial/");
    expect(COURSE_MAP["fcc-figma-ux"]?.prereqs).toEqual(["rm-ux-design"]);
    expect(COURSE_MAP["fcc-figma-ui"]?.prereqs).toEqual(["fcc-figma-ux"]);
  });
  it("keeps the requested career track order when catalog overrides load", () => {
    applyCatalogRows([{ kind: "track", id: "frontend", data: { description: "Updated" }, hidden: false }]);
    expect(TRACKS.map((track) => track.id)).toEqual(["frontend", "backend", "fullstack", "game-development", "ui-ux", "cloud", "networking", "data", "cs"]);
  });
  it("includes a Game Development track with foundations before game projects", () => {
    expect(TRACKS.find((track) => track.id === "game-development")?.courses).toEqual(["cs50x", "cs50-games", "rm-game-dev"]);
    expect(COURSE_MAP["cs50-games"]?.url).toBe("https://cs50.harvard.edu/games/");
    expect(COURSE_MAP["cs50-games"]?.units).toHaveLength(9);
    expect(COURSE_MAP["rm-game-dev"]?.url).toBe("https://roadmap.sh/game-developer");
  });
  it("freeCodeCamp Responsive Web Design points at the current v9 course", () => {
    expect(COURSE_MAP["fcc-rwd"]?.url).toBe("https://www.freecodecamp.org/learn/responsive-web-design-v9/");
  });
  it("admin edits override built-in courses, and hidden courses leave the catalog", () => {
    applyCatalogRows([{ kind: "course", id: "cs50x", data: { hours: 5 }, hidden: false }, { kind: "course", id: "cs50p", data: {}, hidden: true }]);
    expect(COURSE_MAP["cs50x"]?.hours).toBe(5);
    expect(COURSES.some((c) => c.id === "cs50p")).toBe(false);
  });
  it("courses already completed are never scheduled", () => {
    const plan = computePlan({ profile: { pace_mode: "hours", hours_per_week: 7, target_date: null }, enrollments: [{ course_id: "cs50x", completed_at: "2025-01-01" }], completions: [] });
    expect(plan.remaining.length).toBe(0);
  });
});
