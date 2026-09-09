import { describe, expect, it } from "vitest";
import { formatTHB, lineTotal } from "./pricing";

describe("lineTotal", () => {
  it("multiplies price by quantity", () => {
    expect(lineTotal(19.4, 3)).toBeCloseTo(58.2);
  });
  it("handles zero quantity", () => {
    expect(lineTotal(19.4, 0)).toBe(0);
  });
});

describe("formatTHB", () => {
  it("formats with ฿ and two decimals when fractional", () => {
    expect(formatTHB(58.2)).toMatch(/฿58\.20/);
  });
  it("formats integers without decimals", () => {
    expect(formatTHB(125)).toMatch(/฿125(?!\.)/);
  });
});
