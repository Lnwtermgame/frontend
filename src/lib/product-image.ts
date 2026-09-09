// Product artwork fallback matching the mockup tiles: a dark square
// (placehold.co) carrying the first characters of the product name.
const gameImg = (label: string, bg = "211E22", fg = "6B6470") =>
  `https://placehold.co/500x500/${bg}/${fg}?text=${encodeURIComponent(label)}&font=montserrat`;

export function productImage(name: string, imageUrl?: string | null): string {
  if (imageUrl) return imageUrl;
  return gameImg((name || "?").substring(0, 6));
}
