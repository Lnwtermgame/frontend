import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const PERPLEXICA_BASE_URL = (
  process.env.NEXT_PUBLIC_PERPLEXICA_API_URL ||
  "http://y0gkc0kcc4ws8kc0oooc8g0c.89.38.101.12.sslip.io"
).replace(/\/+$/, "");

// Create axios instance with NO timeout for long-running AI operations
const perplexicaAxios = axios.create({
  timeout: 0, // No timeout - AI operations can take a long time
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// GET /api/perplexica - Fetch available providers
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log("[Perplexica Proxy] GET /api/providers - START");
  try {
    const url = `${PERPLEXICA_BASE_URL}/api/providers`;
    console.log("[Perplexica Proxy] Fetching providers from:", url);

    const response = await perplexicaAxios.get(url, { timeout: 30000 });
    console.log(`[Perplexica Proxy] GET /api/providers - SUCCESS (${Date.now() - startTime}ms)`);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`[Perplexica Proxy] GET /api/providers - FAILED (${Date.now() - startTime}ms):`, {
      message: error.message,
      code: error.code,
    });
    return NextResponse.json(
      { error: "Failed to fetch Perplexica providers", providers: [] },
      { status: 500 },
    );
  }
}

// POST /api/perplexica - Perform search
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("[Perplexica Proxy] POST /api/search - START");
  try {
    console.log("[Perplexica Proxy] Parsing request body...");
    const body = await request.json();
    console.log("[Perplexica Proxy] Request body parsed:", {
      hasQuery: !!body.query,
      queryLength: body.query?.length,
      hasChatModel: !!body.chatModel,
      hasEmbeddingModel: !!body.embeddingModel,
    });

    const {
      chatModel,
      embeddingModel,
      query,
      systemInstructions,
      sources = ["web"],
      optimizationMode = "balanced",
      history = [], // Default to empty history to avoid previous sessions
    } = body;

    if (!query) {
      console.log("[Perplexica Proxy] Missing query parameter");
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    if (!chatModel || !embeddingModel) {
      console.log("[Perplexica Proxy] Missing models:", { hasChatModel: !!chatModel, hasEmbeddingModel: !!embeddingModel });
      return NextResponse.json(
        { error: "chatModel and embeddingModel are required" },
        { status: 400 },
      );
    }

    const url = `${PERPLEXICA_BASE_URL}/api/search`;

    const requestBody = {
      chatModel,
      embeddingModel,
      optimizationMode,
      sources,
      query,
      history, // Pass history (empty array for fresh session)
      stream: false,
      ...(systemInstructions && { systemInstructions }),
    };

    console.log("[Perplexica Proxy] Sending search request:", {
      url,
      query: query.substring(0, 100) + (query.length > 100 ? "..." : ""),
      chatModel: chatModel.key,
      embeddingModel: embeddingModel.key,
      optimizationMode,
      sources,
      historyLength: history.length,
      hasSystemInstructions: !!systemInstructions,
    });

    console.log("[Perplexica Proxy] Waiting for Perplexica API response...");
    const response = await perplexicaAxios.post(url, requestBody, { timeout: 0 });

    const elapsed = Date.now() - startTime;
    console.log(`[Perplexica Proxy] Search response received in ${elapsed}ms:`, {
      hasMessage: !!response.data?.message,
      messageLength: response.data?.message?.length || 0,
      sourcesCount: response.data?.sources?.length || 0,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[Perplexica Proxy] POST /api/search - FAILED (${elapsed}ms):`, {
      message: error.message,
      code: error.code,
      isTimeout: error.code === "ECONNABORTED",
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
    });

    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to perform Perplexica search";

    return NextResponse.json(
      {
        error: errorMessage,
        message: "",
        sources: [],
      },
      { status: error.response?.status || 500 },
    );
  }
}
