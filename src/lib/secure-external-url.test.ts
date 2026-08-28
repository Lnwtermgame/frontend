import { describe, expect, it } from "vitest";
import { getSecureExternalUrl } from "./secure-external-url";

describe("getSecureExternalUrl", () => {
  it.each(["", "   ", null, undefined])(
    "returns null for empty input: %s",
    (value) => {
      expect(getSecureExternalUrl(value)).toBeNull();
    },
  );

  it.each(["not a URL", "http://line.me/support", "javascript:alert(1)", "mailto:support@example.com"])(
    "returns null for unsafe or invalid input: %s",
    (value) => {
      expect(getSecureExternalUrl(value)).toBeNull();
    },
  );

  it("returns a normalized HTTPS URL", () => {
    expect(getSecureExternalUrl("  HTTPS://Example.COM/support?source=line  ")).toBe(
      "https://example.com/support?source=line",
    );
  });
});
