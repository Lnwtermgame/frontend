import { NextRequest, NextResponse } from "next/server";
import { litellmBaseUrl, litellmApiKey } from "@/lib/litellm";

// Lightweight per-IP rate limit: this endpoint proxies a paid AI provider
// without authentication, so it must not be freely drainable.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) return false;
  entry.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  if (!litellmApiKey()) {
    return NextResponse.json(
      { error: "LiteLLM API key not configured on server" },
      { status: 500 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(`${litellmBaseUrl()}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${litellmApiKey()}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI Proxy] LiteLLM error:", response.status, errorText);
      return NextResponse.json(
        { error: `LiteLLM returned ${response.status}`, details: errorText },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[AI Proxy] Error:", error.message);
    return NextResponse.json(
      { error: error.message || "AI proxy request failed" },
      { status: 500 },
    );
  }
}
