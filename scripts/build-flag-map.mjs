// scripts/build-flag-map.mjs — one-off generator
// Maps Nucleo flag component names (IconThailand -> "Thailand") to ISO 3166-1
// alpha-2 codes and writes region-flag-icon-map.ts
import fs from "node:fs";

const ISO = {
  AalandIslands: "ax", Afghanistan: "af", Albania: "al", Algeria: "dz",
  AmericanSamoa: "as", Andorra: "ad", Angola: "ao", Anguilla: "ai",
  Antarctica: "aq", AntiguaBarbuda: "ag", Argentina: "ar", Armenia: "am",
  Aruba: "aw", Australia: "au", Austria: "at", Azerbaijan: "az",
  Bahamas: "bs", Bahrain: "bh", Bangladesh: "bd", Barbados: "bb",
  Basque: "", Belarus: "by", Belgium: "be", Belize: "bz", Benin: "bj",
  Bermuda: "bm", Bhutan: "bt", Bolivia: "bo",
  BosniaHerzegovina: "ba", Botswana: "bw", BritishVirginIslands: "vg",
  Brazil: "br", Brunei: "bn", Bulgaria: "bg", BurkinaFaso: "bf",
  Burundi: "bi", Cambodia: "kh", Cameroon: "cm", Canada: "ca",
  CanaryIslands: "ic", CapeVerde: "cv", CaymanIslands: "ky",
  CentralAfricanRepublic: "cf", Chad: "td", Chile: "cl", China: "cn",
  Colombia: "co", Comoros: "km", Congo: "cg", CookIslands: "ck",
  CostaRica: "cr", Croatia: "hr", Cuba: "cu", Curacao: "cw",
  Cyprus: "cy", Czechia: "cz", DemocraticRepublicCongo: "cd",
  Denmark: "dk", Djibouti: "dj", Dominica: "dm", DominicanRepublic: "do",
  EastTimor: "tl", Ecuador: "ec", Egypt: "eg", ElSalvador: "sv",
  England: "gb-eng", EquatorialGuinea: "gq", Eritrea: "er",
  Estonia: "ee", Eswatini: "sz", Ethiopia: "et", Europe: "",
  FalklandIslands: "fk", FaroeIslands: "fo", Fiji: "fj", Finland: "fi",
  France: "fr", FrenchGuiana: "", FrenchPolynesia: "pf", Gabon: "ga",
  Gambia: "gm", Georgia: "ge", Germany: "de", Ghana: "gh",
  Gibraltar: "gi", Greece: "gr", Greenland: "gl", Grenada: "gd",
  Guadeloupe: "", Guam: "gu", Guatemala: "gt", Guernsey: "gg",
  Guinea: "gn", GuineaBissau: "gw", Guyana: "gy", Haiti: "ht",
  Honduras: "hn", HongKong: "hk", Hungary: "hu", Hawaii: "",
  Iceland: "is", India: "in", Indonesia: "id", Iran: "ir", Iraq: "iq",
  Ireland: "ie", IsleOfMan: "im", Israel: "il", Italy: "it",
  IvoryCoast: "ci", Jamaica: "jm", Japan: "jp", Jersey: "je",
  Jordan: "jo", Kazakhstan: "kz", Kenya: "ke", Kiribati: "ki",
  Kurdistan: "", Kosovo: "xk", Kuwait: "kw", Kyrgyzstan: "kg",
  Laos: "la", Latvia: "lv", Lebanon: "lb", Lesotho: "ls", Liberia: "lr",
  Libya: "ly", Liechtenstein: "li", Lithuania: "lt", Luxembourg: "lu",
  Macao: "mo", Macau: "mo", Madagascar: "mg", Malawi: "mw",
  Malaysia: "my", Maldives: "mv", Mali: "ml", Malta: "mt",
  MarshallIslands: "mh", Martinique: "", Mauritania: "mr",
  Mauritius: "mu", Mexico: "mx", Micronesia: "fm", Moldova: "md",
  Monaco: "mc", Mongolia: "mn", Montenegro: "me", Montserrat: "ms",
  Morocco: "ma", Mozambique: "mz", Mozanbique: "mz", Myanmar: "mm",
  Namibia: "na", Nauru: "nr", Nepal: "np", Netherlands: "nl",
  NetherlandsAntilles: "", NewCaledonia: "nc", NewZealand: "nz",
  Nicaragua: "ni", Niger: "ne", Nigeria: "ng", Niue: "nu",
  NorthKorea: "kp", NorthMacedonia: "mk", NorthenIreland: "gb-nir",
  Norway: "no", Oman: "om", Pakistan: "pk", Palau: "pw",
  Palestine: "ps", Panama: "pa", PapuaNewGuinea: "pg", Paraguay: "py",
  Peru: "pe", Philippines: "ph", PitcairnIslands: "pn", Poland: "pl",
  Portugal: "pt", PuertoRico: "pr", Qatar: "qa", RepublicCongo: "cg",
  Romania: "ro", Russia: "ru", Rwanda: "rw",
  RepublicOfChina: "tw", SaintKittsNevis: "kn", SaintLucia: "lc",
  SaintVincentGrenadines: "vc", Samoa: "ws", SanMarino: "sm",
  SaoTomeAndPrincipe: "st", SaoTomePrincipe: "st", SaudiArabia: "sa",
  Scotland: "gb-sct", Senegal: "sn", Serbia: "rs", Seychelles: "sc",
  SierraLeone: "sl", Singapore: "sg", SintMaarten: "sx", Slovakia: "sk",
  Slovenia: "si", SolomonIslands: "sb", Somalia: "so", Somaliland: "",
  SouthAfrica: "za", SouthGeorgiaSandwichIslands: "gs",
  SouthKorea: "kr", SouthSudan: "ss", Spain: "es", SriLanka: "lk",
  Sudan: "sd", Suriname: "sr", Sweden: "se", Switzerland: "ch",
  Syria: "sy", Taiwan: "tw", Tajikistan: "tj", Tanzania: "tz",
  Thailand: "th", TimorLeste: "tl", Togo: "tg", Tonga: "to",
  TrinidadAndTobago: "tt", TrinidadTobago: "tt", Tunisia: "tn",
  Turkey: "tr", Turkmenistan: "tm", TurksAndCaicosIslands: "tc",
  Tuvalu: "tv", Uganda: "ug", Ukraine: "ua", UnitedArabEmirates: "ae",
  UnitedKingdom: "gb", UnitedStates: "us",
  UnitedStatesVirginIslands: "vi", Uruguay: "uy", Uzbekistan: "uz",
  Vanuatu: "vu", VaticanCity: "va", Venezuela: "ve", Vietnam: "vn",
  Wales: "gb-wls", WesternSahara: "eh", Yemen: "ye", Zambia: "zm",
  Zimbabwe: "zw",
};

const dir = "vendor/nucleo-flags/dist/components";
const files = fs.readdirSync(dir).filter(
  (f) => f.endsWith(".js") && f.startsWith("Icon") && f !== "Icon.js",
);
const names = files.map((f) => f.replace(/^Icon/, "").replace(/\.js$/, ""));

const byIso = {};
const unmapped = [];
for (const name of names) {
  const iso = ISO[name];
  if (iso === undefined) {
    unmapped.push(name);
    continue;
  }
  if (!iso) continue; // regional/none-country flags — no ISO code
  // first writer wins for dup aliases (e.g. Macao/Macau, Mozambique/Mozanbique)
  if (!byIso[iso]) byIso[iso] = name;
}

console.log(`flags: ${names.length}, mapped: ${Object.keys(byIso).length}, unmapped: ${unmapped.length}`);
console.log("unmapped names:", unmapped.join(", "));

let out = `// AUTO-GENERATED by scripts/build-flag-map.mjs — do not edit by hand.
// Source: vendored nucleo-flags@1.1.4 (https://nucleoapp.com/svg-flag-icons)
// Key: ISO 3166-1 alpha-2 (lowercase) / value: component export name.

export const FLAG_COMPONENTS = {
`;
for (const iso of Object.keys(byIso).sort()) {
  out += `  "${iso}": "${byIso[iso]}",\n`;
}
out += "} as const;\n";
fs.writeFileSync("src/components/product/flag-component-map.ts", out);
console.log("written: src/components/product/flag-component-map.ts");
