import { createOrder } from "@/lib/api/orders";
import { createPaymentIntent } from "@/lib/api/payments";
import type { BuyPayload } from "@/components/product/order-summary";

export interface BuyFlowResult {
  outcome: "redirected" | "qr";
  orderId: string;
  referenceNo: string;
}

export async function startBuyFlow(
  payload: BuyPayload,
  target: { productId: string; productTypeId: string },
): Promise<BuyFlowResult> {
  const order = await createOrder({
    items: [
      {
        productId: target.productId,
        productTypeId: target.productTypeId,
        quantity: payload.quantity,
        playerInfo: payload.playerInfo,
      },
    ],
    paymentMethod: payload.paymentMethod,
    paymentOptionCode: payload.paymentOptionCode,
  });

  const intent = await createPaymentIntent(order.id, payload.paymentOptionCode);

  if (intent.paymentFormHtml) {
    const parsed = new DOMParser().parseFromString(intent.paymentFormHtml, "text/html");
    const source = parsed.querySelector("form");
    if (source) {
      const form = document.createElement("form");
      form.method = source.getAttribute("method") || "POST";
      form.action = source.getAttribute("action") || "";
      source.querySelectorAll('input[type="hidden"]').forEach((input) => {
        const safe = document.createElement("input");
        safe.type = "hidden";
        safe.name = input.getAttribute("name") || "";
        safe.value = input.getAttribute("value") || "";
        form.appendChild(safe);
      });
      document.body.appendChild(form);
      form.submit();
      return { outcome: "redirected", orderId: order.id, referenceNo: intent.referenceNo };
    }
  }

  if (intent.redirectUrl) {
    window.open(intent.redirectUrl, "_blank");
    return { outcome: "redirected", orderId: order.id, referenceNo: intent.referenceNo };
  }

  if (intent.qrCodeUrl) {
    sessionStorage.setItem(`qr_${order.id}`, intent.qrCodeUrl);
    return { outcome: "qr", orderId: order.id, referenceNo: intent.referenceNo };
  }

  throw new Error("NO_PAYMENT_LINK");
}
