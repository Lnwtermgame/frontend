import toast from "react-hot-toast";
import { getAccessToken, GATEWAY_URL, ensureCsrfToken } from "@/lib/client/gateway";

async function getStorageHeaders(includeContentType?: boolean): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const csrf = await ensureCsrfToken();
    if (csrf) headers["X-CSRF-Token"] = csrf;
  } catch { /* proceed without CSRF */ }
  if (includeContentType) headers["Content-Type"] = "application/json";
  return headers;
}

/** File metadata returned from storage API */
export interface StorageFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  url: string;
}

/** List files response */
export interface ListFilesResponse {
  files: StorageFile[];
  total: number;
  limit: number;
  offset: number;
}

/** List all files in storage with pagination and optional search */
export async function listFiles(
  limit = 25,
  offset = 0,
  search?: string,
): Promise<ListFilesResponse> {
  const headers = await getStorageHeaders();
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (search?.trim()) params.set("search", search.trim());

  const response = await fetch(`${GATEWAY_URL}/api/storage?${params}`, {
    headers,
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to list files`);
  }
  const result = await response.json();
  if (!result.success) {
    const msg = typeof result.error === "string" ? result.error : JSON.stringify(result.error) || "Failed to list files";
    throw new Error(msg);
  }
  return result.data;
}

/** Get single file info */
export async function getFileInfo(fileId: string): Promise<StorageFile> {
  const headers = await getStorageHeaders();
  const response = await fetch(`${GATEWAY_URL}/api/storage/${fileId}`, {
    headers,
    credentials: "include",
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error || "Failed to get file info");
  return result.data;
}

/** Upload file directly (no toast, for programmatic use) */
export async function uploadFileRaw(
  file: File,
  folder = "products",
): Promise<StorageFile> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const headers = await getStorageHeaders();

  const response = await fetch(`${GATEWAY_URL}/api/storage`, {
    method: "POST",
    body: formData,
    headers,
    credentials: "include",
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error || "Upload failed");
  return result.data;
}

/**
 * Check if URL is from Appwrite Storage
 */
export function isAppwriteUrl(url: string): boolean {
  // Check for Appwrite patterns: /storage/buckets/ and /files/
  return url.includes("/storage/buckets/") && url.includes("/files/");
}

/**
 * Extract file ID from Appwrite URL
 */
export function extractFileIdFromUrl(url: string): string | null {
  try {
    console.log("[Storage] Extracting fileId from URL:", url);
    // Match file ID from Appwrite URL pattern: .../files/{fileId}/view
    const match = url.match(/\/files\/([^\/]+)\/view/);
    console.log("[Storage] Regex match result:", match);
    return match ? match[1] : null;
  } catch (error) {
    console.error("[Storage] Error extracting fileId:", error);
    return null;
  }
}

/**
 * Delete file from Appwrite Storage via API
 */
export async function deleteImageFromStorage(fileId: string): Promise<boolean> {
  try {
    console.log("[Storage] Deleting old file:", fileId);
    const headers = await getStorageHeaders();
    const response = await fetch(`${GATEWAY_URL}/api/storage/${fileId}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Delete failed");
    }

    console.log("[Storage] Deleted successfully:", fileId);
    return true;
  } catch (error) {
    console.error("[Storage] Delete error:", error);
    return false;
  }
}

/**
 * Upload image from URL to Appwrite Storage via API
 * Server will download the image to avoid CORS issues
 * If oldImageUrl is provided, it will be deleted after successful upload
 */
export async function processImageUrl(
  imageUrl: string,
  folder: string = "products",
  oldImageUrl?: string,
): Promise<string | null> {
  if (!imageUrl.trim()) {
    toast.error("กรุณาใส่ URL รูปภาพ");
    return null;
  }

  // Check if already an Appwrite URL
  if (imageUrl.includes("appwrite")) {
    toast("รูปภาพนี้อยู่ใน Appwrite Storage แล้ว", { icon: "ℹ️" });
    return imageUrl;
  }

  const loadingToast = toast.loading("กำลังดาวน์โหลดและอัปโหลดรูปภาพ...");

  try {
    // Send imageUrl to server - server will download and upload to avoid CORS
    const formData = new FormData();
    formData.append("imageUrl", imageUrl);
    formData.append("folder", folder);
    const headers = await getStorageHeaders();

    const response = await fetch(`${GATEWAY_URL}/api/storage`, {
      method: "POST",
      body: formData,
      headers,
      credentials: "include",
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Upload failed");
    }

    const newUrl = result.data.url;
    console.log("[Storage] New image uploaded:", newUrl);

    // Delete old image if provided
    if (oldImageUrl && isAppwriteUrl(oldImageUrl)) {
      const oldFileId = extractFileIdFromUrl(oldImageUrl);
      if (oldFileId) {
        console.log("[Storage] Deleting old image:", oldFileId);
        await deleteImageFromStorage(oldFileId);
      }
    }

    toast.dismiss(loadingToast);
    toast.success("อัปโหลดรูปภาพสำเร็จ!");
    return newUrl;
  } catch (error) {
    toast.dismiss(loadingToast);
    console.error("Error processing image:", error);
    toast.error("เกิดข้อผิดพลาดในการประมวลผลรูปภาพ");
    return null;
  }
}

/**
 * Upload file directly to Appwrite Storage via API
 * If oldImageUrl is provided, it will be deleted after successful upload
 */
export async function uploadImageToStorage(
  file: File,
  folder: string = "products",
  oldImageUrl?: string,
): Promise<string | null> {
  const loadingToast = toast.loading("กำลังอัปโหลดรูปภาพ...");

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    const headers = await getStorageHeaders();

    const response = await fetch(`${GATEWAY_URL}/api/storage`, {
      method: "POST",
      body: formData,
      headers,
      credentials: "include",
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Upload failed");
    }

    const newUrl = result.data.url;
    console.log("[Storage] New image uploaded:", newUrl);

    // Delete old image if provided
    if (oldImageUrl && isAppwriteUrl(oldImageUrl)) {
      const oldFileId = extractFileIdFromUrl(oldImageUrl);
      if (oldFileId) {
        console.log("[Storage] Deleting old image:", oldFileId);
        await deleteImageFromStorage(oldFileId);
      }
    }

    toast.dismiss(loadingToast);
    toast.success("อัปโหลดรูปภาพสำเร็จ!");
    return newUrl;
  } catch (error) {
    toast.dismiss(loadingToast);
    console.error("Error uploading image:", error);
    toast.error("ไม่สามารถอัปโหลดรูปภาพไปยัง Storage ได้");
    return null;
  }
}
