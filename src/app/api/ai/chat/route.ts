import { NextRequest, NextResponse } from "next/server";

const LITELLM_API_BASE_URL =
  process.env.LITELLM_API_URL || "https://litellm.ddns.net";
const LITELLM_API_KEY = process.env.LITELLM_API_KEY || "";

export async function POST(request: NextRequest) {
  if (!LITELLM_API_KEY) {
    return NextResponse.json(
      { error: "LiteLLM API key not configured on server" },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(`${LITELLM_API_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LITELLM_API_KEY}`,
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
