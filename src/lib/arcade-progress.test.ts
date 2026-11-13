import { expect, it } from "vitest";
import { matchesArcadeFilter } from "./arcade-progress";

it("Want to play includes only explicitly marked games, not all unplayed games", () => {
  expect(matchesArcadeFilter("saved", "wanted", new Set(), new Set(["saved"]))).toBe(true);
  expect(matchesArcadeFilter("unmarked", "wanted", new Set(), new Set(["saved"]))).toBe(false);
});

it("want-to-play and played markers are independent", () => {
  const played = new Set(["game"]);
  const wanted = new Set(["game"]);
  expect(matchesArcadeFilter("game", "wanted", played, wanted)).toBe(true);
  expect(matchesArcadeFilter("game", "played", played, new Set())).toBe(true);
});