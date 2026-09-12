import { describe, expect, it } from "vitest";
import { decodeRouteParam } from "./route-param";

describe("decodeRouteParam", () => {
  it("decodes a percent-encoded slug with spaces", () => {
    expect(decodeRouteParam("lineage2m-top-up-direct-south%20east%20asia-2997")).toBe(
      "lineage2m-top-up-direct-south east asia-2997",
    );
  });

  it("passes an already-decoded slug through unchanged", () => {
    expect(decodeRouteParam("free-fire-123")).toBe("free-fire-123");
    expect(decodeRouteParam("lineage2m-top-up-direct-south east asia-2997")).toBe(
      "lineage2m-top-up-direct-south east asia-2997",
    );
  });

  it("handles catch-all arrays by taking the first segment", () => {
    expect(decodeRouteParam(["a%20b", "c"])).toBe("a b");
  });

  it("returns empty string for missing values", () => {
    expect(decodeRouteParam(undefined)).toBe("");
    expect(decodeRouteParam("")).toBe("");
    expect(decodeRouteParam([])).toBe("");
  });

  it("falls back to the raw value on malformed sequences", () => {
    // A lone "%" is not a valid escape — must not throw.
    expect(decodeRouteParam("100%-off")).toBe("100%-off");
  });

  it("does not double-decode fully-escaped sequences", () => {
    // "%2520" decodes once to "%20" — the literal "%20" the user actually has.
    expect(decodeRouteParam("a%2520b")).toBe("a%20b");
  });
});
