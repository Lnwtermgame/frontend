import { NextRequest, NextResponse } from "next/server";

const NEWSAPI_KEY = process.env.NEWSAPI_KEY || "";
const NEWSAPI_BASE = "https://newsapi.org/v2/everything";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = searchParams.get("limit") || "5";

    if (!query) {
        return NextResponse.json(
            { error: "Query parameter 'q' is required", articles: [] },
            { status: 400 },
        );
    }

    if (!NEWSAPI_KEY) {
        return NextResponse.json(
            { error: "NEWSAPI_KEY is not configured", articles: [] },
            { status: 500 },
        );
    }

    // Calculate date 28 days ago (NewsAPI.org free plan uses exclusive boundary)
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - 28);
    const fromDate = daysAgo.toISOString().split("T")[0]; // YYYY-MM-DD

    const params = new URLSearchParams({
        apiKey: NEWSAPI_KEY,
        q: query,
        language: "en",
        pageSize: limit,
        sortBy: "publishedAt",
        from: fromDate,
    });

    const url = `${NEWSAPI_BASE}?${params.toString()}`;

    console.log("[NewsAPI.org] Fetching:", url.replace(NEWSAPI_KEY, "***"));

    try {
        const response = await fetch(url, { next: { revalidate: 300 } });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("[NewsAPI.org] Error:", response.status, errorData);
            return NextResponse.json(
                { error: `NewsAPI.org returned ${response.status}: ${errorData.message || ""}`, articles: [] },
                { status: response.status },
            );
        }

        const data = await response.json();
        // Map NewsAPI.org response to our standard article format
        const articles = (data.articles || []).map((a: any) => ({
            uuid: a.url || "",
            title: a.title || "",
            description: a.description || "",
            snippet: a.content || "",
            url: a.url || "",
            image_url: a.urlToImage || "",
            source: a.source?.name || "",
            published_at: a.publishedAt || "",
            keywords: "",
            categories: [],
        }));

        console.log("[NewsAPI.org] Found", articles.length, "articles for:", query);

        return NextResponse.json({
            articles,
            meta: { totalResults: data.totalResults || 0 },
        });
    } catch (error: any) {
        console.error("[NewsAPI.org] Fetch error:", error.message);
        return NextResponse.json(
            { error: error.message || "Failed to fetch news", articles: [] },
            { status: 500 },
        );
    }
}
