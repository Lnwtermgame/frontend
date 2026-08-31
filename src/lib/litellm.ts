// LiteLLM/OmniRoute gateway access for server-side API routes.
// Accepts LITELLM_API_URL with or without a trailing slash and/or a /v1
// suffix — callers always append the full "/v1/..." path themselves.
export function litellmBaseUrl(): string {
  const raw = process.env.LITELLM_API_URL || "https://litellm.ddns.net";
  return raw.replace(/\/+$/, "").replace(/\/v1$/, "");
}

export function litellmApiKey(): string {
  return process.env.LITELLM_API_KEY || "";
}
