import { apiFetch } from "./client";

export interface PaymentMethodOption {
  id: string;
  code: string;
  label: string;
  method: "PROMPTPAY" | "TRUEMONEY" | "LINEPAY" | "CREDIT_CARD" | "BANK_TRANSFER";
  gateway: { id: string; name: string; provider: string };
  surchargePercent: number | string;
  flatFee: number | string;
  minAmount?: number | null;
  maxAmount?: number | null;
  baseFee: number;
  sampleTotal: number;
}

export interface PaymentIntentResponse {
  qrCodeUrl?: string;
  paymentFormHtml?: string;
  redirectUrl?: string;
  referenceNo: string;
  amount?: number;
}

export interface PaymentStatusResult {
  id: string;
  orderId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED";
  paymentMethod: string;
}

export function getPaymentMethods(): Promise<PaymentMethodOption[]> {
  return apiFetch<PaymentMethodOption[]>("/api/payments/methods");
}

export function createPaymentIntent(
  orderId: string,
  paymentOptionCode?: string,
): Promise<PaymentIntentResponse> {
  return apiFetch<PaymentIntentResponse>("/api/payments/create-intent", {
    method: "POST",
    body: { orderId, paymentOptionCode },
  });
}

export function getPaymentStatus(orderId: string): Promise<PaymentStatusResult> {
  return apiFetch<PaymentStatusResult>(`/api/payments/${orderId}`);
}

// Public (no auth) — backend returns only {orderId, status} by design.
export function verifyPaymentPublic(
  orderId: string,
  referenceNo: string,
): Promise<{ orderId: string; status: string }> {
  return apiFetch(
    `/api/payments/${orderId}/verify?referenceNo=${encodeURIComponent(referenceNo)}`,
  );
}
