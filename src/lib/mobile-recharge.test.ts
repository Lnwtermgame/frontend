import { describe, expect, it } from "vitest";
import type { Product, ProductTypePublic } from "@/lib/api/products";
import {
  buildPlayerInfo,
  groupOperatorsByCountry,
  isPhoneValid,
  minActivePrice,
  normalizePhone,
} from "./mobile-recharge";

function makeType(over: Partial<ProductTypePublic> = {}): ProductTypePublic {
  return {
    id: "t1",
    productId: "p1",
    name: "10 THB Credits",
    displayPrice: 12.56,
    currency: "THB",
    hasStock: true,
    minAmount: 1,
    maxAmount: 1,
    isActive: true,
    ...over,
  };
}

function makeProduct(over: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "AIS Thailand",
    slug: "ais-thailand",
    categoryId: "c1",
    productType: "MOBILE_RECHARGE",
    isActive: true,
    types: [],
    ...over,
  } as Product;
}

describe("groupOperatorsByCountry", () => {
  it("groups only active MOBILE_RECHARGE products with known country codes", () => {
    const groups = groupOperatorsByCountry([
      makeProduct({ id: "a", countryCode: "TH" }),
      makeProduct({ id: "b", productType: "DIRECT_TOPUP", countryCode: "TH" }),
      makeProduct({ id: "c", isActive: false, countryCode: "TH" }),
      makeProduct({ id: "d", countryCode: null }),
      makeProduct({ id: "e", countryCode: "ZZ" }), // not in MOBILE_COUNTRIES
      makeProduct({ id: "f", countryCode: "MY" }),
    ]);
    expect(groups.get("TH")?.map((p) => p.id)).toEqual(["a"]);
    expect(groups.get("MY")?.map((p) => p.id)).toEqual(["f"]);
    expect(groups.size).toBe(2);
  });

  it("sorts each bucket by salesCount descending", () => {
    const groups = groupOperatorsByCountry([
      makeProduct({ id: "low", countryCode: "TH", salesCount: 1 }),
      makeProduct({ id: "high", countryCode: "TH", salesCount: 99 }),
      makeProduct({ id: "mid", countryCode: "TH", salesCount: 10 }),
    ]);
    expect(groups.get("TH")?.map((p) => p.id)).toEqual(["high", "mid", "low"]);
  });
});

describe("minActivePrice", () => {
  it("returns the cheapest active+in-stock type", () => {
    const p = makeProduct({
      types: [
        makeType({ id: "t1", displayPrice: 50, isActive: false }),
        makeType({ id: "t2", displayPrice: 20, hasStock: false }),
        makeType({ id: "t3", displayPrice: 30 }),
        makeType({ id: "t4", displayPrice: 12.56 }),
      ],
    });
    expect(minActivePrice(p)).toBe(12.56);
  });

  it("returns null when nothing is sellable", () => {
    expect(minActivePrice(makeProduct({ types: [] }))).toBeNull();
    expect(
      minActivePrice(makeProduct({ types: [makeType({ hasStock: false })] })),
    ).toBeNull();
  });
});

describe("normalizePhone", () => {
  it("strips non-digits", () => {
    expect(normalizePhone("084-123-4567", "66")).toBe("0841234567");
  });

  it("keeps leading zero national format untouched", () => {
    expect(normalizePhone("0841234567", "66")).toBe("0841234567");
  });

  it("strips a duplicated calling code only when remaining digits stay long", () => {
    // "66" + 9 digits -> strip
    expect(normalizePhone("66841234567", "66")).toBe("841234567");
    // short remainder -> keep (avoid mangling valid long national numbers)
    expect(normalizePhone("6684123", "66")).toBe("6684123");
  });
});

describe("isPhoneValid", () => {
  it("accepts 8–12 digits", () => {
    expect(isPhoneValid("84123456")).toBe(true);
    expect(isPhoneValid("084123456789")).toBe(true);
  });
  it("rejects 7 and 13 digits and non-digits", () => {
    expect(isPhoneValid("8412345")).toBe(false);
    expect(isPhoneValid("0841234567890")).toBe(false);
    expect(isPhoneValid("084-12345")).toBe(false);
  });
});

describe("buildPlayerInfo", () => {
  it("matches the backend fulfillment contract", () => {
    expect(buildPlayerInfo("0841234567", "66")).toEqual({
      phone: "0841234567",
      "User ID": "0841234567",
      calling_code: "66",
    });
  });
});
