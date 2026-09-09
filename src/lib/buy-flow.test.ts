import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createOrderMock = vi.fn();
const createPaymentIntentMock = vi.fn();

vi.mock("@/lib/api/orders", () => ({ createOrder: (...a: unknown[]) => createOrderMock(...a) }));
vi.mock("@/lib/api/payments", () => ({
  createPaymentIntent: (...a: unknown[]) => createPaymentIntentMock(...a),
}));

function fakeForm() {
  const forms: Array<{ method: string | null; action: string | null; inputs: Record<string, string> }> = [];
  const realCreate = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation(((tag: string) => {
    if (tag === "form") {
      const form = realCreate("form");
      let captured: Record<string, string> = {};
      Object.defineProperty(form, "appendChild", {
        value(el: HTMLInputElement) {
          if (el instanceof HTMLInputElement) captured[el.name] = el.value;
        },
      });
      Object.defineProperty(form, "submit", {
        value: () => {
          forms.push({
            method: form.getAttribute("method"),
            action: form.getAttribute("action"),
            inputs: captured,
          });
        },
      });
      return form;
    }
    return realCreate(tag);
  }) as typeof document.createElement);
  return forms;
}

beforeEach(() => {
  createOrderMock.mockReset();
  createPaymentIntentMock.mockReset();
  sessionStorage.clear();
});
afterEach(() => vi.restoreAllMocks());

const payload = {
  playerInfo: { playerid: "123" },
  quantity: 1,
  paymentOptionCode: "PROMPTPAY_QR",
  paymentMethod: "PROMPTPAY" as const,
};

describe("startBuyFlow", () => {
  it("qr branch: stores QR in sessionStorage and returns 'qr' with order id", async () => {
    createOrderMock.mockResolvedValue({ id: "ord1", orderNumber: "T1" });
    createPaymentIntentMock.mockResolvedValue({
      qrCodeUrl: "data:image/png;base64,x",
      referenceNo: "REF1",
    });
    const { startBuyFlow } = await import("./buy-flow");
    const result = await startBuyFlow(payload, { productId: "p1", productTypeId: "t1" });
    expect(result.outcome).toBe("qr");
    expect(result.orderId).toBe("ord1");
    expect(result.referenceNo).toBe("REF1");
    expect(sessionStorage.getItem("qr_ord1")).toBe("data:image/png;base64,x");
    expect(createOrderMock).toHaveBeenCalledWith({
      items: [
        { productId: "p1", productTypeId: "t1", quantity: 1, playerInfo: { playerid: "123" } },
      ],
      paymentMethod: "PROMPTPAY",
      paymentOptionCode: "PROMPTPAY_QR",
    });
  });

  it("form branch: rebuilds hidden-input form and submits", async () => {
    createOrderMock.mockResolvedValue({ id: "ord2", orderNumber: "T2" });
    createPaymentIntentMock.mockResolvedValue({
      paymentFormHtml:
        '<form method="POST" action="https://pay.example/go"><input type="hidden" name="amt" value="100"><input type="hidden" name="ref" value="R2"></form>',
      referenceNo: "R2",
    });
    const forms = fakeForm();
    const { startBuyFlow } = await import("./buy-flow");
    const result = await startBuyFlow(payload, { productId: "p1", productTypeId: "t1" });
    expect(result.outcome).toBe("redirected");
    expect(result.orderId).toBe("ord2");
    expect(forms).toHaveLength(1);
    expect(forms[0].method).toBe("POST");
    expect(forms[0].action).toBe("https://pay.example/go");
    expect(forms[0].inputs).toEqual({ amt: "100", ref: "R2" });
  });

  it("propagates ApiError from createOrder", async () => {
    createOrderMock.mockRejectedValue(
      Object.assign(new Error("Player verification failed"), {
        status: 400,
        code: "VALIDATION_ERROR",
        infoCode: "20133",
      }),
    );
    const { startBuyFlow } = await import("./buy-flow");
    await expect(
      startBuyFlow(payload, { productId: "p1", productTypeId: "t1" }),
    ).rejects.toMatchObject({ infoCode: "20133" });
    expect(createPaymentIntentMock).not.toHaveBeenCalled();
  });
});
