import { toast } from "sonner";
import th from "../../messages/th.json";
import { createOrder } from "@/lib/api/orders";
import { createPaymentIntent } from "@/lib/api/payments";
import type { BuyPayload } from "@/components/product/order-summary";

export interface BuyFlowResult {
  outcome: "redirected" | "qr";
  orderId: string;
  referenceNo: string;
}

export interface PendingOrderContext {
  orderId: string;
  referenceNo: string;
  amount?: number;
}

/**
 * บริบทคำสั่งซื้อที่ฝากไว้ก่อนพาแท็บปัจจุบันออกไปหน้าชำระเงินของ gateway —
 * /payments/pending ใช้เรียกคืนตอนผู้ใช้ย้อนกลับมาโดย query ไม่ครบ
 * (ฝาก JSON เพราะมีหลายฟิลด์ ต่างจาก qr_<id> ที่เก็บ URL ตัวเดียว)
 */
export function readPendingContext(orderId: string): PendingOrderContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`pending_${orderId}`);
    return raw ? (JSON.parse(raw) as PendingOrderContext) : null;
  } catch {
    return null;
  }
}

function stashPendingContext(ctx: PendingOrderContext) {
  try {
    sessionStorage.setItem(`pending_${ctx.orderId}`, JSON.stringify(ctx));
  } catch {
    // sessionStorage ใช้ไม่ได้ (private mode ฯลฯ) — ไม่ควรบล็อกการชำระเงิน
  }
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
  const ctx: PendingOrderContext = {
    orderId: order.id,
    referenceNo: intent.referenceNo,
    amount: intent.amount,
  };

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
      // form.submit() พาแท็บปัจจุบันออกจากเว็บ — ฝากบริบทไว้ให้หน้า pending ตอนย้อนกลับ
      stashPendingContext(ctx);
      document.body.appendChild(form);
      form.submit();
      return { outcome: "redirected", orderId: order.id, referenceNo: intent.referenceNo };
    }
  }

  if (intent.redirectUrl) {
    // แท็บปัจจุบันคือแท็บชำระเงิน — window.open หลัง await (createOrder/intent ครั้งแรก)
    // ไม่ใช่ user gesture อีกแล้ว popup blocker ตัดเงียบ ๆ เลยนำทางแท็บนี้ตรง ๆ
    stashPendingContext(ctx);
    try {
      window.location.assign(intent.redirectUrl);
    } catch {
      // lib ธรรมดาใช้ next-intl hook ไม่ได้ — อ่านข้อความจาก messages/th.json ตรง ๆ
      toast.error(th.payments.openRedirectFailed);
      throw new Error("NO_PAYMENT_LINK");
    }
    return { outcome: "redirected", orderId: order.id, referenceNo: intent.referenceNo };
  }

  if (intent.qrCodeUrl) {
    try {
      sessionStorage.setItem(`qr_${order.id}`, intent.qrCodeUrl);
    } catch {
      // ฝาก QR ไม่ได้ — หน้า pending จะแสดงแผงรหัสอ้างอิงแทน ยังคงติดตามสถานะได้
    }
    return { outcome: "qr", orderId: order.id, referenceNo: intent.referenceNo };
  }

  throw new Error("NO_PAYMENT_LINK");
}
