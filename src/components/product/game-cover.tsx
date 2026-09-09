import Image from "next/image";

export type CoverDna = {
  c1: string;
  c2: string;
  ink: string;
  mono: string;
  sub: string;
};

/* สีประจำเกม/ผู้ให้บริการ (flat poster style) — ใช้เมื่อสินค้ายังไม่มีภาพจริง
   เมื่ออัปโหลด imageUrl แล้ว GameCover จะใช้ภาพจริงแทนทันที */
const DNA_RULES: Array<{ re: RegExp; dna: CoverDna }> = [
  { re: /free\s?fire/i, dna: { c1: "#d8401f", c2: "#8f1d0b", ink: "#ffffff", mono: "FF", sub: "FREE FIRE" } },
  { re: /pubg/i, dna: { c1: "#26262b", c2: "#e0a10e", ink: "#f0c14b", mono: "PUBG", sub: "MOBILE UC" } },
  { re: /mobile legends|mlbb/i, dna: { c1: "#16337e", c2: "#0d1f4d", ink: "#e9c987", mono: "MLBB", sub: "DIAMONDS" } },
  { re: /identity/i, dna: { c1: "#d8cfba", c2: "#41615a", ink: "#2d3a36", mono: "IdV", sub: "IDENTITY V" } },
  { re: /razer/i, dna: { c1: "#101210", c2: "#123312", ink: "#44d62c", mono: "RZ", sub: "RAZER GOLD" } },
  { re: /amazon/i, dna: { c1: "#edc766", c2: "#d9a53e", ink: "#39290f", mono: "a", sub: "AMAZON GIFT" } },
  { re: /roblox/i, dna: { c1: "#d92c20", c2: "#a31d13", ink: "#ffffff", mono: "RBX", sub: "ROBLOX" } },
  { re: /true|ทรู/i, dna: { c1: "#b91c2c", c2: "#7d1220", ink: "#ffffff", mono: "T", sub: "TRUE MOVE" } },
  { re: /ais|เอไอเอส/i, dna: { c1: "#8d1f74", c2: "#5c124c", ink: "#ffffff", mono: "AIS", sub: "1-2-CALL" } },
  { re: /dtac|ดีแทค/i, dna: { c1: "#0057b8", c2: "#003f85", ink: "#ffffff", mono: "dtac", sub: "GO INTER" } },
];

const NEUTRAL: CoverDna = { c1: "#2b272c", c2: "#3a343c", ink: "#eceae9", mono: "", sub: "" };

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}

export function coverDnaFor(name: string, fallbackSub: string): CoverDna {
  const hit = DNA_RULES.find((r) => r.re.test(name));
  if (hit) return hit.dna;
  return { ...NEUTRAL, mono: initials(name) || "G", sub: fallbackSub };
}

export function GameCover({
  name,
  imageUrl,
  fallbackSub,
  sizes,
}: {
  name: string;
  imageUrl?: string | null;
  fallbackSub: string;
  sizes: string;
}) {
  if (imageUrl) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-xl">
        <Image src={imageUrl} alt={name} fill sizes={sizes} className="object-cover" />
      </div>
    );
  }

  const dna = coverDnaFor(name, fallbackSub);
  return (
    <div
      className="relative flex aspect-square flex-col justify-end overflow-hidden rounded-xl"
      style={{ background: dna.c1, color: dna.ink }}
    >
      <span
        aria-hidden
        className="absolute -right-[28%] bottom-[18%] h-[64%] w-[78%] -rotate-[14deg]"
        style={{ background: dna.c2 }}
      />
      <span className="absolute left-3 top-2.5 text-[17px] font-extrabold leading-none" style={{ color: dna.ink }}>
        {dna.mono}
        <small className="mt-1.5 block text-[8.5px] font-bold tracking-[0.14em] opacity-70">{dna.sub}</small>
      </span>
      <span className="relative truncate bg-black/65 px-2.5 py-1.5 text-[11px] font-bold text-[#f3f1f0]">
        {name}
      </span>
    </div>
  );
}
