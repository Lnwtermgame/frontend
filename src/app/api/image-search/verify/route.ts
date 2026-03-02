import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { lookup } from "dns/promises";
import net from "net";

const MAX_URLS_PER_REQUEST = 20;
const MAX_URL_LENGTH = 2048;
const allowedProtocols = new Set(["https:"]);
const blockedHostSuffixes = [".local", ".internal"];
const blockedHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((part) => parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part)))
    return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 0) return true;
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("fe80")) return true;
  if (normalized === "::") return true;
  if (normalized.startsWith("::ffff:")) {
    const v4 = normalized.replace("::ffff:", "");
    if (net.isIP(v4) === 4) return isPrivateIpv4(v4);
  }
  return false;
}

function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (blockedHosts.has(lower)) return true;
  if (blockedHostSuffixes.some((suffix) => lower.endsWith(suffix))) return true;
  const ipType = net.isIP(lower);
  if (ipType === 4) return isPrivateIpv4(lower);
  if (ipType === 6) return isPrivateIpv6(lower);
  return false;
}

async function isBlockedByDns(hostname: string): Promise<boolean> {
  try {
    const records = await lookup(hostname, { all: true });
    return records.some((record) => {
      if (record.family === 4) return isPrivateIpv4(record.address);
      if (record.family === 6) return isPrivateIpv6(record.address);
      return false;
    });
  } catch {
    return true;
  }
}

async function isSafeExternalUrl(rawUrl: string): Promise<boolean> {
  if (typeof rawUrl !== "string") return false;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) return false;
  try {
    const parsed = new URL(trimmed);
    if (!allowedProtocols.has(parsed.protocol)) return false;
    if (isBlockedHost(parsed.hostname)) return false;
    if (await isBlockedByDns(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * POST /api/image-search/verify
 * Verify that image URLs are still alive via HEAD requests.
 * Accepts { urls: string[] }, returns { alive: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const urls: string[] = Array.isArray(body.urls)
      ? body.urls.slice(0, MAX_URLS_PER_REQUEST)
      : [];

    if (urls.length === 0) {
      return NextResponse.json({ alive: [] });
    }

    const safetyChecks = await Promise.all(
      urls.map((url) => isSafeExternalUrl(url)),
    );
    const safeUrls = urls.filter((_, index) => safetyChecks[index]);

    if (safeUrls.length === 0) {
      return NextResponse.json({ alive: [] });
    }

    // Check all URLs in parallel with a short timeout
    const results = await Promise.allSettled(
      safeUrls.map((url) =>
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
      `[Image Verify] ${alive.length}/${safeUrls.length} images are alive`,
    );

    return NextResponse.json({ alive });
  } catch (error: any) {
    console.error("[Image Verify] Error:", error.message);
    return NextResponse.json({ alive: [] }, { status: 500 });
  }
}
