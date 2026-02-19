import { paymentClient } from "@/lib/client/gateway";

export interface PaymentMethodOption {
  id: string;
  code: string;
  label: string;
  method: "CREDIT_CARD" | "PROMPTPAY" | "TRUEMONEY" | "BANK_TRANSFER";
  gateway: {
    id: string;
    name: string;
    provider: string;
  };
  surchargePercent: number;
  flatFee: number;
  minAmount?: number | null;
  maxAmount?: number | null;
  baseFee: number;
  sampleTotal: number;
  metadata?: Record<string, any> | null;
}

export interface PaymentIntentResponse {
  redirectUrl: string;
  checkoutSessionId: string;
  paymentIntentId?: string;
}

export type PaymentMethodCode =
  | "CREDIT_CARD"
  | "PROMPTPAY"
  | "TRUEMONEY"
  | "BANK_TRANSFER";

export interface AdminPaymentGateway {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  feePercent: number;
  flatFee: number;
  metadata?: Record<string, unknown> | null;
  optionCount: number;
  paymentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPaymentOption {
  id: string;
  gatewayId: string;
  code: string;
  label: string;
  method: PaymentMethodCode;
  isActive: boolean;
  surchargePercent: number;
  flatFee: number;
  minAmount: number | null;
  maxAmount: number | null;
  metadata?: Record<string, unknown> | null;
  gateway: {
    id: string;
    name: string;
    provider: string;
    isActive: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GatewayUpsertPayload {
  name: string;
  provider: string;
  isActive?: boolean;
  feePercent?: number;
  flatFee?: number;
  metadata?: Record<string, unknown> | null;
}

export interface OptionUpsertPayload {
  gatewayId: string;
  code: string;
  label: string;
  method: PaymentMethodCode;
  isActive?: boolean;
  surchargePercent?: number;
  flatFee?: number;
  minAmount?: number | null;
  maxAmount?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface PaymentStatusResponse {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: "CREDIT_CARD" | "PROMPTPAY" | "TRUEMONEY" | "BANK_TRANSFER";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED";
  transactionId?: string | null;
  feeAmount?: number;
  netAmount?: number;
  nextAction?: any;
}

export interface PaymentAuditLogItem {
  id: string;
  orderId?: string | null;
  paymentId?: string | null;
  eventType: string;
  source: string;
  severity: "INFO" | "WARN" | "ALERT";
  previousStatus?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED" | null;
  newStatus?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED" | null;
  message: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  order?: { id: string; orderNumber: string } | null;
  payment?: { id: string; status: string; paymentMethod: string } | null;
}

export interface WebhookNonceItem {
  id: string;
  provider: string;
  nonceHash: string;
  signature: string;
  timestamp: string;
  expiresAt: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

class PaymentApiService {
  async getMethods(): Promise<{ success: boolean; data: PaymentMethodOption[] }> {
    const response = await paymentClient.get("/api/payments/methods");
    return response.data;
  }

  async createIntent(
    orderId: string,
    paymentOptionCode?: string,
  ): Promise<{ success: boolean; data: PaymentIntentResponse }> {
    const response = await paymentClient.post("/api/payments/create-intent", {
      orderId,
      paymentOptionCode,
    });
    return response.data;
  }

  async getStatus(orderId: string): Promise<{ success: boolean; data: PaymentStatusResponse }> {
    const response = await paymentClient.get(`/api/payments/${orderId}`);
    return response.data;
  }

  async getAdminGateways(): Promise<{ success: boolean; data: AdminPaymentGateway[] }> {
    const response = await paymentClient.get("/api/payments/admin/gateways");
    return response.data;
  }

  async createGateway(
    payload: GatewayUpsertPayload,
  ): Promise<{ success: boolean; data: AdminPaymentGateway }> {
    const response = await paymentClient.post("/api/payments/admin/gateways", payload);
    return response.data;
  }

  async updateGateway(
    gatewayId: string,
    payload: Partial<GatewayUpsertPayload>,
  ): Promise<{ success: boolean; data: AdminPaymentGateway }> {
    const response = await paymentClient.put(`/api/payments/admin/gateways/${gatewayId}`, payload);
    return response.data;
  }

  async getAdminOptions(): Promise<{ success: boolean; data: AdminPaymentOption[] }> {
    const response = await paymentClient.get("/api/payments/admin/options");
    return response.data;
  }

  async createOption(
    payload: OptionUpsertPayload,
  ): Promise<{ success: boolean; data: AdminPaymentOption }> {
    const response = await paymentClient.post("/api/payments/admin/options", payload);
    return response.data;
  }

  async updateOption(
    optionId: string,
    payload: Partial<OptionUpsertPayload>,
  ): Promise<{ success: boolean; data: AdminPaymentOption }> {
    const response = await paymentClient.put(`/api/payments/admin/options/${optionId}`, payload);
    return response.data;
  }

  async getAdminAuditLogs(params?: {
    orderId?: string;
    severity?: "INFO" | "WARN" | "ALERT";
    eventType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: { items: PaymentAuditLogItem[]; total: number; page: number; limit: number } }> {
    const response = await paymentClient.get("/api/payments/admin/audit-logs", { params });
    return response.data;
  }

  async getAdminWebhookNonces(params?: {
    provider?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: { items: WebhookNonceItem[]; total: number; page: number; limit: number } }> {
    const response = await paymentClient.get("/api/payments/admin/webhook-nonces", { params });
    return response.data;
  }
}

export const paymentApi = new PaymentApiService();
