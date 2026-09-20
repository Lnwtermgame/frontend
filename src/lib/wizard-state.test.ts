import { describe, expect, it } from "vitest";
import type { Product, ProductTypePublic } from "@/lib/api/products";
import {
  allDone,
  applyDeepLink,
  initialWizardState,
  reduceWizard,
  stepDone,
  stepOpen,
} from "./wizard-state";

const opTH = {
  id: "op1",
  name: "AIS Thailand",
  slug: "ais-thailand",
  productType: "MOBILE_RECHARGE",
  isActive: true,
  countryCode: "TH",
  types: [],
} as unknown as Product;

const type1 = { id: "t1", name: "10 THB", displayPrice: 12.56 } as ProductTypePublic;

describe("wizard unlock sequence", () => {
  it("starts fully locked", () => {
    const s = initialWizardState;
    expect(stepOpen(s)).toEqual({ step2: false, step3: false, step4: false });
    expect(allDone(s)).toBe(false);
  });

  it("step 2 opens after country, step 3 after valid phone, step 4 after operator", () => {
    let s = reduceWizard(initialWizardState, { type: "pickCountry", code: "TH" });
    expect(stepOpen(s).step2).toBe(true);
    expect(stepOpen(s).step3).toBe(false); // phone invalid (empty)

    s = reduceWizard(s, { type: "setPhone", phone: "0841234567" });
    expect(stepOpen(s).step3).toBe(true);
    expect(stepOpen(s).step4).toBe(false);

    s = reduceWizard(s, { type: "pickOperator", operator: opTH });
    expect(stepOpen(s).step4).toBe(true);
    expect(allDone(s)).toBe(false); // ยังไม่เลือกนิยาม

    s = reduceWizard(s, { type: "pickType", selectedType: type1 });
    expect(allDone(s)).toBe(true);
    expect(stepDone(s)).toEqual({ 1: true, 2: true, 3: true, 4: true });
  });
});

describe("wizard reset cascade", () => {
  it("changing country clears phone/operator/type", () => {
    let s = reduceWizard(initialWizardState, { type: "pickCountry", code: "TH" });
    s = reduceWizard(s, { type: "setPhone", phone: "0841234567" });
    s = reduceWizard(s, { type: "pickOperator", operator: opTH });
    s = reduceWizard(s, { type: "pickType", selectedType: type1 });
    expect(allDone(s)).toBe(true);

    s = reduceWizard(s, { type: "pickCountry", code: "MY" });
    expect(s).toEqual({ countryCode: "MY", phone: "", operator: null, selectedType: null });
  });

  it("picking the same country again is a no-op", () => {
    const s = reduceWizard(initialWizardState, { type: "pickCountry", code: "TH" });
    expect(reduceWizard(s, { type: "pickCountry", code: "TH" })).toBe(s);
  });

  it("phone going from valid to invalid clears operator/type", () => {
    let s = reduceWizard(initialWizardState, { type: "pickCountry", code: "TH" });
    s = reduceWizard(s, { type: "setPhone", phone: "0841234567" });
    s = reduceWizard(s, { type: "pickOperator", operator: opTH });
    s = reduceWizard(s, { type: "pickType", selectedType: type1 });

    s = reduceWizard(s, { type: "setPhone", phone: "084" });
    expect(s.operator).toBeNull();
    expect(s.selectedType).toBeNull();
    expect(s.phone).toBe("084");
  });

  it("editing phone while still invalid keeps operator untouched", () => {
    let s = reduceWizard(initialWizardState, { type: "pickCountry", code: "TH" });
    s = reduceWizard(s, { type: "setPhone", phone: "0841234567" });
    s = reduceWizard(s, { type: "pickOperator", operator: opTH });
    // valid → valid (แก้ตัวเลขคนละตัว) = ค่ายอ้างอิงเบอร์ยังเป็นไปได้ ไม่ reset
    s = reduceWizard(s, { type: "setPhone", phone: "0891234567" });
    expect(s.operator).toBe(opTH);
  });

  it("changing operator clears selected type", () => {
    let s = reduceWizard(initialWizardState, { type: "pickCountry", code: "TH" });
    s = reduceWizard(s, { type: "setPhone", phone: "0841234567" });
    s = reduceWizard(s, { type: "pickOperator", operator: opTH });
    s = reduceWizard(s, { type: "pickType", selectedType: type1 });

    const op2 = { ...opTH, id: "op2", name: "True Move H Thailand" } as Product;
    s = reduceWizard(s, { type: "pickOperator", operator: op2 });
    expect(s.operator?.id).toBe("op2");
    expect(s.selectedType).toBeNull();
  });
});

describe("applyDeepLink", () => {
  const products = [opTH];

  it("presets country + operator from ?operator=<slug>", () => {
    const s = applyDeepLink(initialWizardState, products, { operator: "ais-thailand" });
    expect(s.countryCode).toBe("TH");
    expect(s.operator?.id).toBe("op1");
  });

  it("also reachable via dispatch action", () => {
    const s = reduceWizard(initialWizardState, {
      type: "applyDeepLink",
      products,
      params: { operator: "ais-thailand" },
    });
    expect(s.countryCode).toBe("TH");
    expect(s.operator?.id).toBe("op1");
  });

  it("decodes percent-encoded slugs (system allows slugs with spaces)", () => {
    const spaced = { ...opTH, slug: "ais thailand" } as Product;
    const s = applyDeepLink(initialWizardState, [spaced], {
      operator: "ais%20thailand",
    });
    expect(s.operator?.id).toBe("op1");
  });

  it("falls back to ?country= when operator slug does not match", () => {
    const s = applyDeepLink(initialWizardState, products, { operator: "nope", country: "my" });
    expect(s.countryCode).toBe("MY");
    expect(s.operator).toBeNull();
  });

  it("unknown params leave state untouched", () => {
    const s = applyDeepLink(initialWizardState, products, {});
    expect(s).toBe(initialWizardState);
  });
});
