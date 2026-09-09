import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("drops falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
  it("tailwind-merge resolves conflicting utilities (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
