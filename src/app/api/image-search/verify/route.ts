import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * POST /api/image-search/verify
 * Verify that image URLs are still alive via HEAD requests.
 * Accepts { urls: string[] }, returns { alive: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const urls: string[] = body.urls || [];

    if (urls.length === 0) {
      return NextResponse.json({ alive: [] });
    }

    // Check all URLs in parallel with a short timeout
    const results = await Promise.allSettled(
      urls.map((url) =>
        axios
          .head(url, {
            timeout: 5000,
            maxRedirects: 3,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            validateStatus: (status) => status >= 200 && status < 400,
          })
          .then(() => url),
      ),
    );

    const alive = results
      .filter(
        (r): r is PromiseFulfilledResult<string> => r.status === "fulfilled",
      )
      .map((r) => r.value);

    console.log(
      `[Image Verify] ${alive.length}/${urls.length} images are alive`,
    );

    return NextResponse.json({ alive });
  } catch (error: any) {
    console.error("[Image Verify] Error:", error.message);
    return NextResponse.json({ alive: [] }, { status: 500 });
  }
}
