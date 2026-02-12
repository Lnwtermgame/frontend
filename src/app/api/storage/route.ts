import { Client, Storage, ID, InputFile } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

// Get environment variables (server-side first, fallback to NEXT_PUBLIC)
const APPWRITE_ENDPOINT =
  process.env.APPWRITE_ENDPOINT ||
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
  "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID =
  process.env.APPWRITE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
  "";
const APPWRITE_BUCKET_ID =
  process.env.APPWRITE_BUCKET_ID ||
  process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID ||
  "";
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || "";

console.log("[Storage API] Environment check:", {
  endpoint: APPWRITE_ENDPOINT ? "✓" : "✗",
  projectId: APPWRITE_PROJECT_ID ? "✓" : "✗",
  bucketId: APPWRITE_BUCKET_ID ? "✓" : "✗",
  apiKey: APPWRITE_API_KEY ? "✓ (hidden)" : "✗",
});

// Initialize Appwrite client with API Key (server-side only)
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const storage = new Storage(client);

/**
 * Download image from URL (server-side to avoid CORS)
 */
async function downloadImage(
  url: string,
): Promise<{ buffer: Buffer; filename: string; type: string } | null> {
  try {
    console.log("[Storage API] Downloading image from:", url);
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to download: ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract filename from URL
    const urlObj = new URL(url);
    let filename = urlObj.pathname.split("/").pop() || "image";
    if (!filename.includes(".")) {
      const contentType = response.headers.get("content-type") || "image/jpeg";
      const ext = contentType.split("/")[1] || "jpg";
      filename = `${filename}.${ext}`;
    }

    const type = response.headers.get("content-type") || "image/jpeg";

    console.log("[Storage API] Downloaded:", filename, "Size:", buffer.length);
    return { buffer, filename, type };
  } catch (error) {
    console.error("[Storage API] Download error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if storage is configured
    if (!APPWRITE_BUCKET_ID) {
      console.error("[Storage API] Error: BUCKET_ID not configured");
      return NextResponse.json(
        {
          success: false,
          error: "Storage not configured",
          debug: {
            bucketId: !!APPWRITE_BUCKET_ID,
            projectId: !!APPWRITE_PROJECT_ID,
            apiKey: !!APPWRITE_API_KEY,
          },
        },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const imageUrl = formData.get("imageUrl") as string;
    const folder = (formData.get("folder") as string) || "products";

    let buffer: Buffer;
    let originalFilename: string;

    // If imageUrl is provided, download from URL (avoid CORS)
    if (imageUrl) {
      console.log("[Storage API] Processing image URL:", imageUrl);
      const downloaded = await downloadImage(imageUrl);
      if (!downloaded) {
        return NextResponse.json(
          { success: false, error: "Failed to download image from URL" },
          { status: 400 },
        );
      }
      buffer = downloaded.buffer;
      originalFilename = downloaded.filename;
    } else if (file) {
      // If file is provided, use it directly
      console.log("[Storage API] Processing uploaded file:", file.name);
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      originalFilename = file.name;
    } else {
      return NextResponse.json(
        { success: false, error: "No file or image URL provided" },
        { status: 400 },
      );
    }

    // Create unique filename
    const extension = originalFilename.split(".").pop();
    const uniqueId = ID.unique();
    const filename = `${folder}/${uniqueId}.${extension}`;

    // Create readable stream from buffer
    const stream = Readable.from(buffer);

    // Create InputFile for node-appwrite v13
    const inputFile = InputFile.fromStream(stream, filename, buffer.length);

    const result = await storage.createFile(
      APPWRITE_BUCKET_ID,
      ID.unique(),
      inputFile,
    );

    // Build file view URL
    const fileUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${result.$id}/view?project=${APPWRITE_PROJECT_ID}`;

    console.log("[Storage API] Upload successful:", result.$id);
    console.log("[Storage API] File URL:", fileUrl);

    return NextResponse.json({
      success: true,
      data: {
        fileId: result.$id,
        url: fileUrl,
        name: result.name,
      },
    });
  } catch (error) {
    console.error("[Storage API] Upload error:", error);

    // Check for specific Appwrite errors
    const errorMessage =
      error instanceof Error ? error.message : "Failed to upload file";

    if (errorMessage.includes("bucket") && errorMessage.includes("not found")) {
      return NextResponse.json(
        {
          success: false,
          error: `Bucket not found: ${APPWRITE_BUCKET_ID}. Please check:\n1. Bucket ID is correct in Appwrite console\n2. API key has 'storage.buckets.read' scope\n3. Bucket exists in project: ${APPWRITE_PROJECT_ID}`,
          debug: {
            bucketId: APPWRITE_BUCKET_ID,
            projectId: APPWRITE_PROJECT_ID,
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!APPWRITE_BUCKET_ID) {
      return NextResponse.json(
        { success: false, error: "Storage not configured" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: "No file ID provided" },
        { status: 400 },
      );
    }

    await storage.deleteFile(APPWRITE_BUCKET_ID, fileId);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("[Storage API] Delete error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete file",
      },
      { status: 500 },
    );
  }
}
