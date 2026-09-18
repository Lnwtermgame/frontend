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

interface RegionFlagIconProps {
  /** ISO 3166-1 alpha-2 lowercase ("th", "my", "us", ...) หรือ "global" */
  code: string;
  className?: string;
}

/**
 * ธงประเทศจากชุด nucleo-flags (https://nucleoapp.com/svg-flag-icons)
 * รองรับครบทุกประเทศ (~200 รหัส ISO) — code = "global" แสดงลูกโลก
 * รายการรหัสทั้งหมด: scripts/build-flag-map.mjs → flag-component-map.ts
 */
export function RegionFlagIcon({ code, className }: RegionFlagIconProps) {
  if (code === "global") {
    return <GlobalFlagIcon className={className} />;
  }

  const FlagComponent = FLAGS[code];
  if (!FlagComponent) return null;

  return <FlagComponent className={className} />;
}

/** ลูกโลกสำหรับ GLOBAL — วาดเอง (ชุด nucleo-flags เป็นธงประเทศ ไม่มี global) */
function GlobalFlagIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-label="ทั่วโลก (Global)"
      role="img"
      viewBox="0 0 32 20"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="20" fill="#182338" />
      <circle cx="16" cy="10" r="7.5" fill="#233554" stroke="#60A5FA" strokeWidth="0.9" />
      <line x1="8.5" y1="10" x2="23.5" y2="10" stroke="#93C5FD" strokeWidth="0.8" />
      <ellipse cx="16" cy="10" rx="7.5" ry="3.8" stroke="#93C5FD" strokeWidth="0.8" fill="none" />
      <ellipse cx="16" cy="10" rx="3.5" ry="7.5" stroke="#93C5FD" strokeWidth="0.8" fill="none" />
      <line x1="16" y1="2.5" x2="16" y2="17.5" stroke="#93C5FD" strokeWidth="0.8" />
    </svg>
  );
}
