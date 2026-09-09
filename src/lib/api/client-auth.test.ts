import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockResponse = { status: number; body: unknown };
type Handler = (url: string, init?: RequestInit) => MockResponse | Promise<MockResponse>;

let calls: Array<{ url: string; init?: RequestInit }> = [];

function mockFetch(handler: Handler) {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });
      const res = await handler(url, init);
      return new Response(JSON.stringify(res.body), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
}

const auth = (init?: RequestInit) => (init?.headers as Record<string, string>)?.Authorization;

function stub(url: string, init: RequestInit | undefined, status: number, body: unknown) {
  return { url, init, status, body };
}

const OK = { success: true, data: "ok" };

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("token bootstrap on hard load", () => {
  it("warms token via refresh when a stored user exists", async () => {
    const seq: string[] = [];
    mockFetch((url) => {
      seq.push(url);
      if (url.endsWith("/api/csrf-token")) return { status: 200, body: { success: true, data: { csrfToken: "c" } } };
      if (url.endsWith("/api/auth/refresh-token")) return { status: 200, body: { success: true, data: { accessToken: "t2", expiresIn: 900 } } };
      return { status: 200, body: OK };
    });
    const { apiFetch, configureAuthSync, getAccessToken } = await import("./client");
    configureAuthSync({ hasStoredUser: () => true, onSessionExpired: () => {} });
    await apiFetch("/api/orders");
    const refreshAt = seq.findIndex((u) => u.endsWith("/api/auth/refresh-token"));
    const ordersAt = seq.findIndex((u) => u.endsWith("/api/orders"));
    expect(refreshAt).toBeGreaterThanOrEqual(0);
    expect(refreshAt).toBeLessThan(ordersAt);
    expect(getAccessToken()).toBe("t2");
    const orderCall = calls.find((c) => c.url.endsWith("/api/orders"));
    expect(auth(orderCall?.init)).toBe("Bearer t2");
  });

  it("does not refresh when no stored user (guest)", async () => {
    mockFetch(() => ({ status: 200, body: OK }));
    const { apiFetch, configureAuthSync } = await import("./client");
    configureAuthSync({ hasStoredUser: () => false, onSessionExpired: () => {} });
    await apiFetch("/api/orders");
    expect(calls.some((c) => c.url.includes("refresh-token"))).toBe(false);
    const orderCall = calls.find((c) => c.url.endsWith("/api/orders"));
    expect(auth(orderCall?.init)).toBeUndefined();
  });

  it("skips bootstrap for auth endpoints", async () => {
    mockFetch(() => ({ status: 200, body: { success: true, data: { user: {}, tokens: {} } } }));
    const { apiFetch, configureAuthSync } = await import("./client");
    configureAuthSync({ hasStoredUser: () => true, onSessionExpired: () => {} });
    await apiFetch("/api/auth/login", { method: "POST", body: {}, skipAuth: true });
    expect(calls.some((c) => c.url.includes("refresh-token"))).toBe(false);
  });
});

describe("401 refresh + retry", () => {
  it("refreshes once and retries the original request", async () => {
    let attempt = 0;
    mockFetch((url) => {
      if (url.endsWith("/api/csrf-token")) return { status: 200, body: { success: true, data: { csrfToken: "c" } } };
      if (url.endsWith("/api/auth/refresh-token")) return { status: 200, body: { success: true, data: { accessToken: "t2", expiresIn: 900 } } };
      attempt++;
      if (attempt === 1) return { status: 401, body: { success: false, error: { code: "TOKEN_EXPIRED", message: "expired" } } };
      return { status: 200, body: OK };
    });
    const { apiFetch, configureAuthSync, setAccessToken } = await import("./client");
    configureAuthSync({ hasStoredUser: () => true, onSessionExpired: () => {} });
    setAccessToken("t1-stale");
    await expect(apiFetch("/api/orders")).resolves.toBe("ok");
    expect(calls.filter((c) => c.url.endsWith("/api/auth/refresh-token")).length).toBe(1);
    const retryCall = calls.filter((c) => c.url.endsWith("/api/orders"))[1];
    expect(auth(retryCall?.init)).toBe("Bearer t2");
  });

  it("concurrent 401s share a single refresh", async () => {
    let orderAttempts = 0;
    mockFetch((url) => {
      if (url.endsWith("/api/csrf-token")) return { status: 200, body: { success: true, data: { csrfToken: "c" } } };
      if (url.endsWith("/api/auth/refresh-token")) return { status: 200, body: { success: true, data: { accessToken: "t2", expiresIn: 900 } } };
      orderAttempts++;
      if (orderAttempts <= 2) return { status: 401, body: { success: false, error: { code: "TOKEN_EXPIRED", message: "expired" } } };
      return { status: 200, body: OK };
    });
    const { apiFetch, configureAuthSync, setAccessToken } = await import("./client");
    configureAuthSync({ hasStoredUser: () => true, onSessionExpired: () => {} });
    setAccessToken("t1-stale");
    await Promise.all([apiFetch("/api/orders"), apiFetch("/api/favorites")]);
    expect(calls.filter((c) => c.url.endsWith("/api/auth/refresh-token")).length).toBe(1);
  });

  it("failed refresh triggers onSessionExpired and throws ApiError", async () => {
    mockFetch((url) => {
      if (url.endsWith("/api/csrf-token")) return { status: 200, body: { success: true, data: { csrfToken: "c" } } };
      if (url.endsWith("/api/auth/refresh-token")) return { status: 401, body: { success: false, error: { code: "TOKEN_EXPIRED", message: "expired" } } };
      return { status: 401, body: { success: false, error: { code: "TOKEN_EXPIRED", message: "expired" } } };
    });
    const { apiFetch, configureAuthSync, setAccessToken, ApiError } = await import("./client");
    const expired = vi.fn();
    configureAuthSync({ hasStoredUser: () => true, onSessionExpired: expired });
    setAccessToken("t1-stale");
    const err = await apiFetch("/api/orders").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it("401 without any auth context rejects without redirect", async () => {
    mockFetch(() => ({ status: 401, body: { success: false, error: { code: "UNAUTHORIZED", message: "no" } } }));
    const { apiFetch, configureAuthSync, ApiError } = await import("./client");
    const expired = vi.fn();
    configureAuthSync({ hasStoredUser: () => false, onSessionExpired: expired });
    const err = await apiFetch("/api/coupons").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(expired).not.toHaveBeenCalled();
  });
});
