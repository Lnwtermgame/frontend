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

const json = (init?: RequestInit) =>
  init?.headers ? Object.fromEntries(Object.entries(init.headers as Record<string, string>)) : {};

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch envelope + errors", () => {
  it("returns data on success envelope", async () => {
    mockFetch(() => ({ status: 200, body: { success: true, data: { x: 1 } } }));
    const { apiFetch } = await import("./client");
    await expect(apiFetch<{ x: number }>("/api/ping")).resolves.toEqual({ x: 1 });
    expect(calls.map((c) => c.url)).toEqual(["http://localhost:3000/api/ping"]);
  });

  it("throws ApiError with backend code + infoCode", async () => {
    mockFetch(() => ({
      status: 400,
      body: {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "bad", details: { infoCode: "20114" } },
      },
    }));
    const { apiFetch, ApiError } = await import("./client");
    const err = (await apiFetch("/api/ping").catch((e) => e)) as InstanceType<typeof ApiError>;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.infoCode).toBe("20114");
    expect(err.message).toBe("bad");
  });

  it("GET sends credentials and no CSRF token", async () => {
    mockFetch(() => ({ status: 200, body: { success: true, data: null } }));
    const { apiFetch } = await import("./client");
    await apiFetch("/api/ping");
    expect(calls.length).toBe(1);
    expect(calls[0].init?.credentials).toBe("include");
    expect(json(calls[0].init)["X-CSRF-Token"]).toBeUndefined();
  });
});

describe("apiFetch CSRF on writes", () => {
  it("POST fetches csrf token once, attaches it, and caches it", async () => {
    mockFetch((url) => {
      if (url.endsWith("/api/csrf-token")) {
        return { status: 200, body: { success: true, data: { csrfToken: "csrf-1" } } };
      }
      return { status: 200, body: { success: true, data: "ok" } };
    });
    const { apiFetch } = await import("./client");
    await apiFetch("/api/thing", { method: "POST", body: { a: 1 } });
    await apiFetch("/api/thing2", { method: "POST", body: { a: 2 } });
    const csrfCalls = calls.filter((c) => c.url.endsWith("/api/csrf-token"));
    expect(csrfCalls.length).toBe(1);
    for (const c of calls.filter((x) => !x.url.endsWith("/api/csrf-token"))) {
      expect(json(c.init)["X-CSRF-Token"]).toBe("csrf-1");
      expect(c.init?.body).toBeTruthy();
    }
  });

  it("403 CSRF_INVALID re-mints token and retries once", async () => {
    let attempt = 0;
    mockFetch((url) => {
      if (url.endsWith("/api/csrf-token")) {
        return { status: 200, body: { success: true, data: { csrfToken: `csrf-${attempt}` } } };
      }
      attempt++;
      if (attempt === 1) {
        return { status: 403, body: { success: false, error: { code: "CSRF_INVALID", message: "stale" } } };
      }
      return { status: 200, body: { success: true, data: "ok" } };
    });
    const { apiFetch } = await import("./client");
    await expect(apiFetch("/api/thing", { method: "POST", body: {} })).resolves.toBe("ok");
    expect(calls.filter((c) => c.url.endsWith("/api/csrf-token")).length).toBe(2);
  });
});

describe("apiFetch 429 backoff", () => {
  it("retries with 500/1000/2000ms delays then succeeds", async () => {
    vi.useFakeTimers();
    let attempts = 0;
    mockFetch(() => {
      attempts++;
      if (attempts <= 3) return { status: 429, body: { success: false, error: { code: "RATE_LIMITED", message: "slow" } } };
      return { status: 200, body: { success: true, data: "ok" } };
    });
    const { apiFetch } = await import("./client");
    const promise = apiFetch("/api/ping");
    await vi.advanceTimersByTimeAsync(3500);
    await expect(promise).resolves.toBe("ok");
    expect(attempts).toBe(4);
    vi.useRealTimers();
  });

  it("gives up after 3 retries with ApiError 429", async () => {
    vi.useFakeTimers();
    mockFetch(() => ({ status: 429, body: { success: false, error: { code: "RATE_LIMITED", message: "slow" } } }));
    const { apiFetch } = await import("./client");
    const promise = apiFetch("/api/ping").catch((e) => e);
    await vi.advanceTimersByTimeAsync(4000);
    const err = (await promise) as { status: number };
    expect(err.status).toBe(429);
    expect(calls.length).toBe(4);
    vi.useRealTimers();
  });
});
