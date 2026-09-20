import type { Product, ProductTypePublic } from "@/lib/api/products";
import { countryByCode, type CountryMeta } from "@/lib/mobile-countries";
import { isPhoneValid } from "@/lib/mobile-recharge";

/**
 * Pure state machine ของ wizard 4 ขั้น (spec §5.6) — แยกจาก component
 * เพื่อ unit-test พฤติกรรม unlock/reset/deep-link ได้โดยไม่ต้อง render DOM.
 */

export interface WizardState {
  countryCode: string | null;
  phone: string;
  operator: Product | null;
  selectedType: ProductTypePublic | null;
}

export const initialWizardState: WizardState = {
  countryCode: null,
  phone: "",
  operator: null,
  selectedType: null,
};

/** ขั้นเปิดเมื่อขั้นก่อนหน้า "เสร็จ" (มีค่าครบตามเกณฑ์) */
export function stepOpen(state: WizardState): { step2: boolean; step3: boolean; step4: boolean } {
  const country = countryByCode(state.countryCode) ?? null;
  const step2 = Boolean(country);
  const step3 = step2 && isPhoneValid(state.phone);
  const step4 = step3 && Boolean(state.operator);
  return { step2, step3, step4 };
}

/** ขั้นเสร็จ = มีค่า (ใช้ซ่อน/ย่อการ์ดขั้น) */
export function stepDone(state: WizardState): { 1: boolean; 2: boolean; 3: boolean; 4: boolean } {
  return {
    1: Boolean(state.countryCode),
    2: isPhoneValid(state.phone),
    3: Boolean(state.operator),
    4: Boolean(state.selectedType),
  };
}

/** ทุกขั้นเสร็จ = ปุ่ม PAY NOW ทำงานได้ */
export function allDone(state: WizardState): boolean {
  const d = stepDone(state);
  return d[1] && d[2] && d[3] && d[4];
}

/**
 * การเปลี่ยนค่าแต่ละขั้น — เปลี่ยนขั้นบนต้อง reset ขั้นล่างที่อ้างอิงค่านั้น
 * (เหมือน SEAGM: ประเทศใหม่ = ล้างเบอร์+ค่าย+นิยาม, ค่ายใหม่ = ล้างนิยาม)
 */
export function reduceWizard(
  state: WizardState,
  action:
    | { type: "pickCountry"; code: string }
    | { type: "setPhone"; phone: string }
    | { type: "pickOperator"; operator: Product }
    | { type: "pickType"; selectedType: ProductTypePublic }
    | { type: "applyDeepLink"; products: Product[]; params: { operator?: string | null; country?: string | null } }
    | { type: "reset" },
): WizardState {
  switch (action.type) {
    case "pickCountry":
      // เลือกประเทศเดิมซ้ำ = no-op (กัน reset พลาดจาก event ซ้ำ)
      if (state.countryCode === action.code) return state;
      return { countryCode: action.code, phone: "", operator: null, selectedType: null };
    case "setPhone": {
      // เบอร์เคย valid แล้วกลับเป็น invalid = ค่าที่ค่าย/นิยามอ้างอิงถึงเสีย → reset ขั้นล่าง
      const wasValid = isPhoneValid(state.phone);
      const next: WizardState = { ...state, phone: action.phone };
      if (wasValid && !isPhoneValid(action.phone)) {
        next.operator = null;
        next.selectedType = null;
      }
      return next;
    }
    case "pickOperator": {
      if (state.operator?.id === action.operator.id) return state;
      return { ...state, operator: action.operator, selectedType: null };
    }
    case "pickType":
      return { ...state, selectedType: action.selectedType };
    case "applyDeepLink":
      return applyDeepLink(state, action.products, action.params);
    case "reset":
      return initialWizardState;
  }
}

/** Deep link: หาสินค้าจาก ?operator=<slug> → preset ประเทศ+ค่าย */
export function applyDeepLink(
  state: WizardState,
  products: Product[],
  params: { operator?: string | null; country?: string | null },
): WizardState {
  if (params.operator) {
    const wanted = params.operator;
    const match = products.find(
      (p) =>
        p.productType === "MOBILE_RECHARGE" &&
        p.isActive &&
        (p.slug === wanted || p.slug === decodeURIComponent(wanted)),
    );
    if (match?.countryCode) {
      return { ...state, countryCode: match.countryCode, operator: match };
    }
  }
  if (params.country && countryByCode(params.country)) {
    return reduceWizard(state, { type: "pickCountry", code: params.country.toUpperCase() });
  }
  return state;
}
