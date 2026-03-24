import { NextRequest, NextResponse } from "next/server";

const THENEWSAPI_TOKEN = process.env.THENEWSAPI_TOKEN || "";
const THENEWSAPI_BASE = "https://api.thenewsapi.com/v1/news/all";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const limit = searchParams.get("limit") || "5";

    if (!query) {
        return NextResponse.json(
            { error: "Query parameter 'q' is required", articles: [] },
            { status: 400 },
        );
    }

    if (!THENEWSAPI_TOKEN) {
        return NextResponse.json(
            { error: "THENEWSAPI_TOKEN is not configured", articles: [] },
            { status: 500 },
        );
    }

    // Map internal categories to TheNewsAPI categories
    const categoryMap: Record<string, string> = {
        general: "general",
        promotion: "business",
        update: "tech",
        event: "entertainment",
    };

    // Calculate date 30 days ago for freshness filter
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const publishedAfter = thirtyDaysAgo.toISOString().split("T")[0]; // YYYY-MM-DD

    const params = new URLSearchParams({
        api_token: THENEWSAPI_TOKEN,
        search: query,
        language: "en",
        limit,
        sort: "published_at",
        published_after: publishedAfter,
    });

    if (category && categoryMap[category]) {
        params.set("categories", categoryMap[category]);
    }

    const url = `${THENEWSAPI_BASE}?${params.toString()}`;

    console.log("[TheNewsAPI] Fetching:", url.replace(THENEWSAPI_TOKEN, "***"));

    try {
        const response = await fetch(url, { next: { revalidate: 300 } }); // Cache 5 min
        if (!response.ok) {
            const errorText = await response.text();
            console.error("[TheNewsAPI] Error response:", response.status, errorText);
            return NextResponse.json(
                { error: `TheNewsAPI returned ${response.status}`, articles: [] },
                { status: response.status },
            );
        }

        const data = await response.json();
        const articles = (data.data || []).map((a: any) => ({
            uuid: a.uuid,
            title: a.title || "",
            description: a.description || "",
            snippet: a.snippet || "",
            url: a.url || "",
            image_url: a.image_url || "",
            source: a.source || "",
            published_at: a.published_at || "",
            keywords: a.keywords || "",
            categories: a.categories || [],
        }));

        console.log("[TheNewsAPI] Found", articles.length, "articles for:", query);

        return NextResponse.json({
            articles,
            meta: data.meta || {},
        });
    } catch (error: any) {
        console.error("[TheNewsAPI] Fetch error:", error.message);
        return NextResponse.json(
            { error: error.message || "Failed to fetch news", articles: [] },
            { status: 500 },
        );
    }
}
