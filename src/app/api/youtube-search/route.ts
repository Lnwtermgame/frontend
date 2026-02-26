import { NextRequest, NextResponse } from "next/server";
import { searchVideos, SafeSearchType } from "duck-duck-scrape";
import axios from "axios";

interface YouTubeResult {
  videoId: string;
  title: string;
  url: string;
}

/**
 * Extract YouTube video ID from a URL
 */
function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/,
  );
  return match?.[1] || null;
}

/**
 * POST /api/youtube-search
 * Search for YouTube videos via duck-duck-scrape, then verify with oEmbed.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, maxResults = 3 } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required", videos: [] },
        { status: 400 },
      );
    }

    console.log("[YouTube Search] Searching:", query);

    const ddgResults = await searchVideos(query, {
      safeSearch: SafeSearchType.MODERATE,
    });

    // Filter only YouTube URLs and extract video IDs
    const seenIds = new Set<string>();
    const candidates: YouTubeResult[] = [];

    for (const video of ddgResults.results) {
      if (!video.url?.includes("youtube.com") && !video.url?.includes("youtu.be")) {
        continue;
      }
      const videoId = extractVideoId(video.url);
      if (videoId && !seenIds.has(videoId)) {
        seenIds.add(videoId);
        candidates.push({
          videoId,
          title: video.title || "",
          url: `https://www.youtube.com/watch?v=${videoId}`,
        });
      }
    }

    console.log(
      "[YouTube Search] Found",
      candidates.length,
      "YouTube candidates from",
      ddgResults.results.length,
      "total videos",
    );

    if (candidates.length === 0) {
      return NextResponse.json({ videos: [] });
    }

    // Verify availability with oEmbed (in parallel)
    const checks = await Promise.allSettled(
      candidates.slice(0, maxResults * 2).map(async (video) => {
        const oembedRes = await axios.get(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(video.url)}&format=json`,
          { timeout: 5000 },
        );
        return {
          ...video,
          title: oembedRes.data?.title || video.title,
        };
      }),
    );

    const verified = checks
      .filter(
        (r): r is PromiseFulfilledResult<YouTubeResult> =>
          r.status === "fulfilled",
      )
      .map((r) => r.value)
      .slice(0, maxResults);

    const rejected = checks.filter((r) => r.status === "rejected").length;
    console.log(
      `[YouTube Search] Verified: ${verified.length} OK, ${rejected} unavailable`,
    );

    return NextResponse.json({ videos: verified });
  } catch (error: any) {
    console.error("[YouTube Search] Error:", error.message);
    return NextResponse.json(
      { error: error.message || "YouTube search failed", videos: [] },
      { status: 500 },
    );
  }
}
