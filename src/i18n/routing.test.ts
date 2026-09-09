import { describe, expect, it } from "vitest";
import { routing } from "./routing";

describe("routing", () => {
  it("supports only Thai", () => {
    expect(routing.locales).toEqual(["th"]);
  });
  it("defaults to Thai without detection", () => {
    expect(routing.defaultLocale).toBe("th");
    expect(routing.localeDetection).toBe(false);
  });
});
