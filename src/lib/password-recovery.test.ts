import { describe, expect, it } from "vitest";
import { isRecoveryLink } from "./password-recovery";

describe("password recovery", () => {
  it("recognizes recovery links but not ordinary sign-in links", () => {
    expect(isRecoveryLink("#access_token=example&type=recovery")).toBe(true);
    expect(isRecoveryLink("#access_token=example&type=signup")).toBe(false);
    expect(isRecoveryLink("")).toBe(false);
  });
});