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

describe("support and CMS API", () => {
  it("getFaqCategories fetches /api/support/faq/categories", async () => {
    mockFetch(() => ({ status: 200, body: { success: true, data: [{ id: "cat1", name: "General" }] } }));
    const { getFaqCategories } = await import("./support");
    const result = await getFaqCategories();
    expect(result).toEqual([{ id: "cat1", name: "General" }]);
    expect(calls[0].url).toBe("http://localhost:3000/api/support/faq/categories");
  });

  it("getCmsPage fetches /api/cms/pages/:slug", async () => {
    mockFetch(() => ({ status: 200, body: { success: true, data: { slug: "terms", title: "Terms" } } }));
    const { getCmsPage } = await import("./support");
    const result = await getCmsPage("terms");
    expect(result.slug).toBe("terms");
    expect(calls[0].url).toBe("http://localhost:3000/api/cms/pages/terms");
  });

  it("createTicket POSTs to /api/support/tickets", async () => {
    mockFetch((url) => {
      if (url.includes("csrf-token")) {
        return { status: 200, body: { success: true, data: { csrfToken: "c1" } } };
      }
      return { status: 200, body: { success: true, data: { id: "t1", ticketNumber: "TKT-1" } } };
    });
    const { createTicket } = await import("./support");
    const ticket = await createTicket({
      category: "GENERAL_INQUIRY",
      subject: "Help needed",
      description: "My issue description",
    });
    expect(ticket.id).toBe("t1");
    const postCall = calls.find((c) => c.url.includes("/api/support/tickets") && !c.url.includes("csrf"));
    expect(postCall?.init?.method).toBe("POST");
    expect(JSON.parse(String(postCall?.init?.body))).toEqual({
      category: "GENERAL_INQUIRY",
      subject: "Help needed",
      description: "My issue description",
    });
  });

  it("replyTicket POSTs reply to /api/support/tickets/:id/reply", async () => {
    mockFetch((url) => {
      if (url.includes("csrf-token")) {
        return { status: 200, body: { success: true, data: { csrfToken: "c1" } } };
      }
      return { status: 200, body: { success: true, data: { id: "m1", content: "hello" } } };
    });
    const { replyTicket } = await import("./support");
    const reply = await replyTicket("t1", "hello");
    expect(reply.content).toBe("hello");
    const postCall = calls.find((c) => c.url.includes("/api/support/tickets/t1/reply"));
    expect(postCall?.init?.method).toBe("POST");
  });
});
