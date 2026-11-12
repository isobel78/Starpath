import { describe, it, expect } from "vitest";
import { standardCourseId } from "./course-id";
describe("standardCourseId", () => {
  it("uses the provider prefix and a short name", () => {
    expect(standardCourseId("Learn Go", "boot.dev", () => false)).toBe("boot-go");
    expect(standardCourseId("Rust Track", "Exercism", () => false)).toBe("ex-rust");
    expect(standardCourseId("UX Design Roadmap", "Roadmap.sh", () => false)).toBe("rm-ux-design");
  });
  it("adds a number when the id is taken", () => {
    expect(standardCourseId("Learn Go", "boot.dev", (id) => id === "boot-go")).toBe("boot-go-2");
  });
});
