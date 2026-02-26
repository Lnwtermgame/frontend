import { NextRequest, NextResponse } from "next/server";
import { imageSearch } from "@mudbill/duckduckgo-images-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, iterations = 1 } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required", images: [] },
        { status: 400 },
      );
    }

    console.log("[Image Search] Searching for:", query);

    const results = await imageSearch({
      query,
      safe: true,
      iterations,
      retries: 2,
    });

    console.log("[Image Search] Found", results.length, "images for:", query);

    return NextResponse.json({ images: results });
  } catch (error: any) {
    console.error("[Image Search] Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Image search failed", images: [] },
      { status: 500 },
    );
  }
}
