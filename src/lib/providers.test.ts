import { describe, expect, it } from "vitest";
import { providerForUrl } from "./providers";

describe("providerForUrl", () => {
  it("accepts the six approved sites", () => {
    expect(providerForUrl("https://www.freecodecamp.org/learn/python-v9/")).toBe("freeCodeCamp");
    expect(providerForUrl("https://www.boot.dev/courses/learn-go")).toBe("boot.dev");
    expect(providerForUrl("https://cs50.harvard.edu/ai/")).toBe("CS50");
    expect(providerForUrl("https://www.theodinproject.com/paths/full-stack-javascript")).toBe("The Odin Project");
    expect(providerForUrl("https://exercism.org/tracks/rust")).toBe("Exercism");
    expect(providerForUrl("https://roadmap.sh/react")).toBe("Roadmap.sh");
  });
  it("rejects other sites and look-alikes", () => {
    expect(providerForUrl("https://www.udemy.com/course/x")).toBeNull();
    expect(providerForUrl("https://notboot.dev/x")).toBeNull();
    expect(providerForUrl("https://freecodecamp.org.evil.com/")).toBeNull();
    expect(providerForUrl("http://roadmap.sh/react")).toBeNull();
  });
});
