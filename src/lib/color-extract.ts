/* ดึงสีเด่น (dominant color) จากรูปสินค้าจริง — ใช้กับ ProductBand
   อ่าน pixel ผ่าน /_next/image (same-origin → canvas ไม่ถูก taint ด้วย CORS)
   คัดสีเทา/ด้าน/ขาวดำสุดขอบออก หา hue bucket ที่หนักที่สุด
   แล้วยกระดับ saturation/lightness ให้ใช้เป็นสีแถบได้ */

type Hsl = { h: number; s: number; l: number };

function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const v = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

const cache = new Map<string, string | null>();

export async function extractDominantColor(imageUrl: string): Promise<string | null> {
  if (cache.has(imageUrl)) return cache.get(imageUrl)!;
  const miss = (v: string | null) => {
    cache.set(imageUrl, v);
    return v;
  };

  try {
    // ผ่าน optimizer ของ next (same-origin) — w=64 เพียงพอสำหรับหาสี
    // (Next 16 จำกัด quality ที่ 75 เท่านั้น — q อื่นจะโดน 400)
    const src = `/_next/image?url=${encodeURIComponent(imageUrl)}&w=64&q=75`;
    const img = await loadImage(src);
    const size = 32;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return miss(null);
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);

    // bucket ตาม hue 24 ช่อง (15°) — น้ำหนัก = saturation ของ pixel ที่ "มีสี"
    const BUCKETS = 24;
    const weight = new Array<number>(BUCKETS).fill(0);
    const rs = new Array<number>(BUCKETS).fill(0);
    const gs = new Array<number>(BUCKETS).fill(0);
    const bs = new Array<number>(BUCKETS).fill(0);
    const ns = new Array<number>(BUCKETS).fill(0);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (data[i + 3] < 128) continue; // โปร่งใส
      const { h, s, l } = rgbToHsl(r, g, b);
      // ตัดสีจางเกิน / ด้าน / ขาวดำสุดขอบ
      if (s < 0.18 || l < 0.14 || l > 0.9) continue;
      const bucket = Math.min(BUCKETS - 1, Math.floor(h * BUCKETS));
      weight[bucket] += s;
      rs[bucket] += r;
      gs[bucket] += g;
      bs[bucket] += b;
      ns[bucket] += 1;
    }

    let best = -1;
    for (let i = 0; i < BUCKETS; i++) {
      if (ns[i] === 0) continue;
      if (best === -1 || weight[i] > weight[best]) best = i;
    }
    // ภาพขาวดำ/ไม่มีสีชัด → null (ให้ caller ใช้สี DNA เดิม)
    if (best === -1 || weight[best] < 2) return miss(null);

    const { h, s, l } = rgbToHsl(rs[best] / ns[best], gs[best] / ns[best], bs[best] / ns[best]);
    // ยกระดับให้เห็นเป็นแถบสี: s อย่างต่ำ .42, l อยู่ช่วงกลาง
    const tuned: Hsl = {
      h,
      s: Math.min(0.75, Math.max(0.42, s * 1.25)),
      l: Math.min(0.6, Math.max(0.4, l)),
    };
    return miss(hslToHex(tuned.h, tuned.s, tuned.l));
  } catch {
    return miss(null);
  }
}

/** เฉดเข้มลงของสีเด่น — ใช้เป็นสีรองของรูปทรงประดับบนแถบ */
export function shadeDarker(hex: string, amount = 0.7): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const { h, s, l } = rgbToHsl(r, g, b);
  return hslToHex(h, s, Math.max(0.12, l * amount));
}
