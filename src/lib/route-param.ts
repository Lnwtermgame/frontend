/**
 * Decode a dynamic route param for use as a lookup key.
 *
 * Dynamic params arrive percent-encoded (a slug containing spaces comes
 * through as "…south%20east%20asia…"). Passing that value straight into
 * `encodeURIComponent` double-encodes it ("%2520") and the backend lookup
 * 404s. Decode first so the slug matches what the API expects.
 */
export function decodeRouteParam(value: string | string[] | undefined): string {
  if (!value) return "";
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return "";
  try {
    // Single decode: a legitimately-encoded "%20" becomes a space; a raw
    // space (already decoded by the router) passes through unchanged.
    return decodeURIComponent(raw);
  } catch {
    // Malformed sequence (e.g. a lone "%") — use the raw value as-is.
    return raw;
  }
}
