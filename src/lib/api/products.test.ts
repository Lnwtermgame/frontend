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

describe("listProducts", () => {
  it("builds query params and unwraps data", async () => {
    mockFetch(() => ({ status: 200, body: { success: true, data: [{ id: "p1" }] } }));
    const { listProducts } = await import("./products");
    const items = await listProducts({ search: "free fire", isBestseller: true, limit: 100 });
    expect(items).toEqual([{ id: "p1" }]);
    expect(calls[0].url).toBe(
      "http://localhost:3000/api/products?search=free+fire&isBestseller=true&limit=100",
    );
  });

  it("omits undefined params and sends no query when empty", async () => {
    mockFetch(() => ({ status: 200, body: { success: true, data: [] } }));
    const { listProducts } = await import("./products");
    await listProducts();
    expect(calls[0].url).toBe("http://localhost:3000/api/products");
  });
});

describe("slug routing", () => {
  it("getProductBySlug hits /api/products/slug/:slug", async () => {
    mockFetch(() => ({ status: 200, body: { success: true, data: { id: "p1", slug: "ff" } } }));
    const { getProductBySlug } = await import("./products");
    const p = await getProductBySlug("ff");
    expect(p.slug).toBe("ff");
    expect(calls[0].url).toBe("http://localhost:3000/api/products/slug/ff");
  });

  it("verifyPlayer POSTs playerInfo with productTypeId", async () => {
    mockFetch(() => ({
      status: 200,
      body: { success: true, data: { valid: true, supported: true, message: "ok" } },
    }));
    const { verifyPlayer } = await import("./products");
    const r = await verifyPlayer("pid", { playerid: "12345" }, "tid");
    expect(r.valid).toBe(true);
    const postCall = calls.find((c) => c.url.includes("/verify-player"));
    expect(postCall?.url).toBe("http://localhost:3000/api/products/pid/verify-player");
    expect(JSON.parse(String(postCall?.init?.body))).toEqual({
      playerInfo: { playerid: "12345" },
      productTypeId: "tid",
    });
  });
});
