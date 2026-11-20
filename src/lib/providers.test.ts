import { describe, expect, it } from "vitest";
import { providerForUrl, providerForAdminUrl } from "./providers";

describe("providerForUrl", () => {
  it("accepts the six approved sites", () => {
    expect(providerForUrl("https://www.freecodecamp.org/learn/python-v9/")).toBe("freeCodeCamp");
    expect(providerForUrl("https://www.boot.dev/courses/learn-go")).toBe("boot.dev");
    expect(providerForUrl("https://cs50.harvard.edu/ai/")).toBe("CS50");
    expect(providerForUrl("https://www.theodinproject.com/paths/full-stack-javascript")).toBe("The Odin Project");
    expect(providerForUrl("https://exercism.org/tracks/rust")).toBe("Exercism");
    expect(providerForUrl("https://roadmap.sh/react")).toBe("Roadmap.sh");
  });
  it("accepts CS50 courses on edX but not other edX courses", () => {
    expect(providerForUrl("https://www.edx.org/cs50")).toBe("CS50");
    expect(providerForUrl("https://www.edx.org/learn/python/harvard-university-cs50-s-introduction-to-programming-with-python")).toBe("CS50");
    expect(providerForUrl("https://www.edx.org/learn/python/mit-intro-python")).toBeNull();
  });
  it("lets the admin use any https site", () => {
    expect(providerForAdminUrl("https://www.udemy.com/course/x")).toBe("udemy.com");
    expect(providerForAdminUrl("http://udemy.com/x")).toBeNull();
  });
  it("rejects other sites and look-alikes", () => {
    expect(providerForUrl("https://www.udemy.com/course/x")).toBeNull();
    expect(providerForUrl("https://notboot.dev/x")).toBeNull();
    expect(providerForUrl("https://freecodecamp.org.evil.com/")).toBeNull();
    expect(providerForUrl("http://roadmap.sh/react")).toBeNull();
  });
});
