import { describe, expect, it } from "vitest";
import { routing } from "./routing";

describe("routing", () => {
  it("supports Thai and English", () => {
    expect(routing.locales).toEqual(["th", "en"]);
  });
  it("defaults to Thai without detection", () => {
    expect(routing.defaultLocale).toBe("th");
    expect(routing.localeDetection).toBe(false);
  });
});
