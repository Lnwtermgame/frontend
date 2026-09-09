import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let calls: Array<{ url: string; init?: RequestInit }> = [];

function mockFetch(handler?: (url: string) => { status: number; body: unknown }) {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });
      const res = handler ? handler(url) : { status: 200, body: { success: true, data: null } };
      return new Response(JSON.stringify(res.body), { status: res.status });
    }),
  );
}

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe("apiFetchWithMeta", () => {
  it("returns data AND envelope meta", async () => {
    mockFetch(() => ({
      status: 200,
      body: {
        success: true,
        data: [{ id: "o1" }],
        meta: { page: 1, limit: 20, total: 41, totalPages: 3 },
      },
    }));
    const { apiFetchWithMeta } = await import("./client");
    const result = await apiFetchWithMeta<{ id: string }[]>("/api/orders?page=1");
    expect(result.data).toEqual([{ id: "o1" }]);
    expect(result.meta?.total).toBe(41);
  });

  it("meta stays undefined when envelope has no meta", async () => {
    mockFetch(() => ({ status: 200, body: { success: true, data: { x: 1 } } }));
    const { apiFetchWithMeta } = await import("./client");
    const result = await apiFetchWithMeta<{ x: number }>("/api/credits/balance");
    expect(result.data).toEqual({ x: 1 });
    expect(result.meta).toBeUndefined();
  });
});

describe("dashboard endpoints", () => {
  it("listOrders builds status+page params", async () => {
    mockFetch(() => ({ status: 200, body: { success: true, data: [], meta: {} } }));
    const { listOrders } = await import("./dashboard");
    await listOrders({ status: "PENDING", page: 2, limit: 10 });
    expect(calls.find((c) => c.url.includes("/api/orders"))?.url).toContain(
      "status=PENDING&page=2&limit=10",
    );
  });

  it("claimCoupon POSTs to /api/coupons/:id/claim", async () => {
    mockFetch(() => ({ status: 200, body: { success: true, data: { id: "c1" } } }));
    const { claimCoupon } = await import("./dashboard");
    await claimCoupon("c1");
    const post = calls.find((c) => c.url.includes("/api/coupons/c1/claim"));
    expect(post?.init?.method).toBe("POST");
  });

  it("resendDelivery POSTs itemId body", async () => {
    mockFetch(() => ({ status: 200, body: { success: true, data: null } }));
    const { resendDelivery } = await import("./dashboard");
    await resendDelivery("ord1", "item9");
    const post = calls.find((c) => c.url.includes("/api/deliveries/ord1/resend"));
    expect(JSON.parse(String(post?.init?.body))).toEqual({ itemId: "item9" });
  });
});
