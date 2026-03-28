import { NextResponse } from "next/server";

const LITELLM_API_BASE_URL =
  process.env.LITELLM_API_URL || "https://litellm.ddns.net";
const LITELLM_API_KEY = process.env.LITELLM_API_KEY || "";

export async function GET() {
  if (!LITELLM_API_KEY) {
    return NextResponse.json(
      { error: "LiteLLM API key not configured on server", data: [] },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(`${LITELLM_API_BASE_URL}/v1/models`, {
      headers: {
        Authorization: `Bearer ${LITELLM_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI Proxy] Models fetch error:", response.status, errorText);
      return NextResponse.json(
        { error: `LiteLLM returned ${response.status}`, data: [] },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[AI Proxy] Models fetch error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to fetch models", data: [] },
      { status: 500 },
    );
  }
}
