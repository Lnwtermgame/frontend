// Appwrite storage URLs expose the raw /storage/buckets/<bucket>/files/<id>/view
// path (and our project/bucket IDs). next.config.ts rewrites the same-origin
// /assets/:fileId to the storage backend, so rendering swaps the URL here and
// the browser only ever sees /assets/<fileId>.
// Render-only: values saved to the API/DB must stay the original URL.
const STORAGE_RE = /\/storage\/buckets\/[^/]+\/files\/([a-zA-Z0-9]+)\/(?:view|preview)/;

export function assetUrl(url: string | null | undefined): string {
  if (!url) return "";
  const m = url.match(STORAGE_RE);
  return m ? `/assets/${m[1]}` : url;
}
