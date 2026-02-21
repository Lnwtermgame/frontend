import { NextRequest, NextResponse } from "next/server";

const SEARXNG_BASE_URL =
  "http://searxng-rkg44wkww4sgo8wcwwos8c44.89.38.101.12.sslip.io";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 },
      );
    }

    // Build SEARXNG URL
    const searxngParams = new URLSearchParams({
      q: query,
      format: "json",
      language: searchParams.get("language") || "th",
      safesearch: "0",
    });

    const category = searchParams.get("category");
    if (category) {
      searxngParams.append("categories", category);
    }

    const timeRange = searchParams.get("time_range");
    if (timeRange) {
      searxngParams.append("time_range", timeRange);
    }

    const url = `${SEARXNG_BASE_URL}/search?${searxngParams.toString()}`;

    console.log("[SEARXNG Proxy] Fetching:", url);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      // @ts-ignore - Next.js specific
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`SEARXNG responded with ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("[SEARXNG Proxy] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch from SEARXNG",
        results: [],
        images: [],
      },
      { status: 500 },
    );
  }
}
