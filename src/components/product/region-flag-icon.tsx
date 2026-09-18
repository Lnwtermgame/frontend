"use client";

import {
  IconAfghanistan, IconAlbania, IconAlgeria, IconAndorra, IconAngola,
  IconArgentina, IconArmenia, IconAustralia, IconAustria, IconAzerbaijan,
  IconBahamas, IconBahrain, IconBangladesh, IconBelarus, IconBelgium,
  IconBolivia, IconBosniaHerzegovina, IconBotswana, IconBrazil,
  IconBrunei, IconBulgaria, IconCambodia, IconCameroon, IconCanada,
  IconChile, IconChina, IconColombia, IconCostaRica, IconCroatia,
  IconCuba, IconCyprus, IconCzechia, IconDenmark, IconDjibouti,
  IconDominicanRepublic, IconEcuador, IconEgypt, IconElSalvador,
  IconEngland, IconEquatorialGuinea, IconEstonia, IconEswatini,
  IconEthiopia, IconFiji, IconFinland, IconFrance, IconGabon,
  IconGambia, IconGeorgia, IconGermany, IconGhana, IconGreece,
  IconGuatemala, IconGuinea, IconGuyana, IconHaiti, IconHonduras,
  IconHongKong, IconHungary, IconIceland, IconIndia, IconIndonesia,
  IconIran, IconIraq, IconIreland, IconIsrael, IconItaly, IconJamaica,
  IconJapan, IconJordan, IconKazakhstan, IconKenya, IconKuwait,
  IconKyrgyzstan, IconLaos, IconLatvia, IconLebanon, IconLiberia,
  IconLibya, IconLiechtenstein, IconLithuania, IconLuxembourg,
  IconMacau, IconMadagascar, IconMalawi, IconMalaysia, IconMaldives,
  IconMali, IconMalta, IconMauritania, IconMauritius, IconMexico,
  IconMoldova, IconMonaco, IconMongolia, IconMontenegro, IconMorocco,
  IconMozanbique, IconMyanmar, IconNamibia, IconNepal,
  IconNetherlands, IconNewZealand, IconNicaragua, IconNiger,
  IconNigeria, IconNorthKorea, IconNorthMacedonia, IconNorway,
  IconOman, IconPakistan, IconPalau, IconPalestine, IconPanama,
  IconPapuaNewGuinea, IconParaguay, IconPeru, IconPhilippines,
  IconPoland, IconPortugal, IconQatar, IconRomania, IconRussia,
  IconRwanda, IconSaudiArabia, IconScotland, IconSenegal, IconSerbia,
  IconSeychelles, IconSierraLeone, IconSingapore, IconSlovakia,
  IconSlovenia, IconSomalia, IconSouthAfrica, IconSouthKorea,
  IconSouthSudan, IconSpain, IconSriLanka, IconSudan, IconSuriname,
  IconSweden, IconSwitzerland, IconSyria, IconTaiwan, IconTajikistan,
  IconTanzania, IconThailand, IconEastTimor, IconTogo, IconTonga,
  IconTrinidadTobago, IconTunisia, IconTurkey, IconTurkmenistan,
  IconUganda, IconUkraine, IconUnitedArabEmirates, IconUnitedKingdom,
  IconUnitedStates, IconUruguay, IconUzbekistan, IconVanuatu,
  IconVaticanCity, IconVenezuela, IconVietnam, IconWales, IconYemen,
  IconZambia, IconZimbabwe,
} from "../../../vendor/nucleo-flags/dist/components/index";
import type { ComponentType, SVGProps } from "react";

/** Nucleo ใช้ FC<IconProps> ที่คืน ReactNode — เราใช้เป็น component ที่รับ className */
type FlagComponent = ComponentType<SVGProps<SVGSVGElement>>;

/** ISO 3166-1 alpha-2 (lowercase) → Nucleo flag component
 *  ครบทุกประเทศ — รายการเต็มดูใน flag-component-map.ts (สร้างโดย scripts/build-flag-map.mjs) */
const FLAGS: Record<string, FlagComponent> = {
  af: IconAfghanistan, al: IconAlbania, dz: IconAlgeria, ad: IconAndorra,
  ao: IconAngola, ar: IconArgentina, am: IconArmenia, au: IconAustralia,
  at: IconAustria, az: IconAzerbaijan, bs: IconBahamas, bh: IconBahrain,
  bd: IconBangladesh, by: IconBelarus, be: IconBelgium, bo: IconBolivia,
  ba: IconBosniaHerzegovina, bw: IconBotswana, br: IconBrazil,
  bn: IconBrunei, bg: IconBulgaria, kh: IconCambodia, cm: IconCameroon,
  ca: IconCanada, cl: IconChile, cn: IconChina, co: IconColombia,
  cr: IconCostaRica, hr: IconCroatia, cu: IconCuba, cy: IconCyprus,
  cz: IconCzechia, dk: IconDenmark, dj: IconDjibouti,
  do: IconDominicanRepublic, ec: IconEcuador, eg: IconEgypt,
  sv: IconElSalvador, "gb-eng": IconEngland, gq: IconEquatorialGuinea,
  ee: IconEstonia, sz: IconEswatini, et: IconEthiopia, fj: IconFiji,
  fi: IconFinland, fr: IconFrance, ga: IconGabon, gm: IconGambia,
  ge: IconGeorgia, de: IconGermany, gh: IconGhana, gr: IconGreece,
  gt: IconGuatemala, gn: IconGuinea, gy: IconGuyana, ht: IconHaiti,
  hn: IconHonduras, hk: IconHongKong, hu: IconHungary, is: IconIceland,
  in: IconIndia, id: IconIndonesia, ir: IconIran, iq: IconIraq,
  ie: IconIreland, il: IconIsrael, it: IconItaly, jm: IconJamaica,
  jp: IconJapan, jo: IconJordan, kz: IconKazakhstan, ke: IconKenya,
  kw: IconKuwait, kg: IconKyrgyzstan, la: IconLaos, lv: IconLatvia,
  lb: IconLebanon, lr: IconLiberia, ly: IconLibya, li: IconLiechtenstein,
  lt: IconLithuania, lu: IconLuxembourg, mo: IconMacau,
  mg: IconMadagascar, mw: IconMalawi, my: IconMalaysia, mv: IconMaldives,
  ml: IconMali, mt: IconMalta, mr: IconMauritania, mu: IconMauritius,
  mx: IconMexico, md: IconMoldova, mc: IconMonaco, mn: IconMongolia,
  me: IconMontenegro, ma: IconMorocco, mz: IconMozanbique,
  mm: IconMyanmar, na: IconNamibia, np: IconNepal, nl: IconNetherlands,
  nz: IconNewZealand, ni: IconNicaragua, ne: IconNiger,
  ng: IconNigeria, kp: IconNorthKorea, mk: IconNorthMacedonia,
  no: IconNorway, om: IconOman, pk: IconPakistan, pw: IconPalau,
  ps: IconPalestine, pa: IconPanama, pg: IconPapuaNewGuinea,
  py: IconParaguay, pe: IconPeru, ph: IconPhilippines, pl: IconPoland,
  pt: IconPortugal, qa: IconQatar, ro: IconRomania, ru: IconRussia,
  rw: IconRwanda, sa: IconSaudiArabia, "gb-sct": IconScotland,
  sn: IconSenegal, rs: IconSerbia, sc: IconSeychelles,
  sl: IconSierraLeone, sg: IconSingapore, sk: IconSlovakia,
  si: IconSlovenia, so: IconSomalia, za: IconSouthAfrica,
  kr: IconSouthKorea, ss: IconSouthSudan, es: IconSpain,
  lk: IconSriLanka, sd: IconSudan, sr: IconSuriname, se: IconSweden,
  ch: IconSwitzerland, sy: IconSyria, tw: IconTaiwan, tj: IconTajikistan,
  tz: IconTanzania, th: IconThailand, tl: IconEastTimor, tg: IconTogo,
  to: IconTonga, tt: IconTrinidadTobago, tn: IconTunisia, tr: IconTurkey,
  tm: IconTurkmenistan, ug: IconUganda, ua: IconUkraine,
  ae: IconUnitedArabEmirates, gb: IconUnitedKingdom, us: IconUnitedStates,
  uy: IconUruguay, uz: IconUzbekistan, vu: IconVanuatu,
  va: IconVaticanCity, ve: IconVenezuela, vn: IconVietnam,
  "gb-wls": IconWales, ye: IconYemen, zm: IconZambia, zw: IconZimbabwe,
};

/** กรอบศิลป์ (artboard) ของธงทั้งชุด nucleo-flags — วัดจากไอคอนจริงครบ 237 ตัวแล้วเท่ากันหมด:
 *  ตัวธงวาดที่ x=1, y=4 ขนาด 30×24 บนกริด 32×32 (สัดส่วน 5:4) เหลือขอบโปร่งรอบละ 1 หน่วยแนวนอน
 *  และ 4 หน่วยแนวตั้ง
 *  ค่า viewBox นี้ถูกส่งเข้า <Icon> เพื่อแทนค่าเริ่มต้น "0 0 32 32" — ในตัว <Icon> มีการ spread
 *  ...props ต่อท้าย viewBox จึง override ได้ (ดู vendor/nucleo-flags/dist/components/Icon.js)
 *  ผลคือ SVG แสดงเฉพาะตัวธง ไม่มีขอบโปร่งรอบ ๆ → ธงทุกประเทศยาวเท่ากันและเต็มกรอบ badge
 *  ถ้าอนาคตเจอธงที่วาดคนละกรอบ: เพิ่ม "รหัสประเทศ": "x y กว้าง สูง" ลงใน FLAG_VIEWBOX_OVERRIDES */
const FLAG_VIEWBOX = "1 4 30 24";

/** ขนาดธรรมชาติของ SVG ต้องเป็นสัดส่วนเดียวกับกรอบธง (30:24) ไม่ใช่จัตุรัส
 *  เพราะไอคอนจาก vendor ตั้ง width/height = 32px ไว้ ทำให้เบราว์เซอร์เข้าใจว่า intrinsic ratio เป็น 1:1
 *  แล้วบีบความสูงของธงให้เท่าความกว้าง (ธงดูสั้น) — ส่ง width/height ทับให้ตรงสัดส่วนจริง
 *  จะทำให้ CSS อย่าง `h-auto w-[18px]` คิดความสูงได้เองเป็น 14.4px โดยไม่ต้องฮาร์ดโค้ดความสูง */
const FLAG_NATURAL_WIDTH = 30;
const FLAG_NATURAL_HEIGHT = 24;

const FLAG_VIEWBOX_OVERRIDES: Record<string, string> = {};

interface RegionFlagIconProps {
  /** ISO 3166-1 alpha-2 lowercase ("th", "my", "us", ...) หรือ "global" */
  code: string;
  className?: string;
}

/**
 * ธงประเทศจากชุด nucleo-flags (https://nucleoapp.com/svg-flag-icons)
 * รองรับครบทุกประเทศ (~200 รหัส ISO)
 * รายการรหัสทั้งหมด: scripts/build-flag-map.mjs → flag-component-map.ts
 */
export function RegionFlagIcon({ code, className }: RegionFlagIconProps) {
  const FlagComponent = FLAGS[code];
  if (!FlagComponent) return null;

  return (
    <FlagComponent
      className={className}
      viewBox={FLAG_VIEWBOX_OVERRIDES[code] ?? FLAG_VIEWBOX}
      width={FLAG_NATURAL_WIDTH}
      height={FLAG_NATURAL_HEIGHT}
    />
  );
}
