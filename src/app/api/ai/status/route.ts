import { NextResponse } from "next/server";

const LITELLM_API_KEY = process.env.LITELLM_API_KEY || "";
const LITELLM_API_URL = process.env.LITELLM_API_URL || "";

export async function GET() {
  return NextResponse.json({
    configured: !!LITELLM_API_KEY && LITELLM_API_KEY.length > 0 && LITELLM_API_KEY !== "your_api_key_here",
    hasUrl: !!LITELLM_API_URL,
  });
}
