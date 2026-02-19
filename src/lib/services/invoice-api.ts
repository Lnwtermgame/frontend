import { orderClient } from "@/lib/client/gateway";

export interface InvoiceItem {
  id: string;
  productName: string;
  imageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  issuedAt: string;
  paidAt?: string;
  items: InvoiceItem[];
}

export interface InvoiceResponse {
  success: boolean;
  data: Invoice;
  message?: string;
}

export interface InvoicesListResponse {
  success: boolean;
  data: Invoice[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class InvoiceApiService {
  async getInvoices(
    page = 1,
    limit = 20,
    signal?: AbortSignal,
  ): Promise<InvoicesListResponse> {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("limit", String(limit));

    const response = await orderClient.get<InvoicesListResponse>(
      `/api/invoices?${params}`,
      { signal },
    );
    return response.data;
  }

  async getAdminInvoicesByUser(
    userId: string,
    page = 1,
    limit = 20,
    signal?: AbortSignal,
  ): Promise<InvoicesListResponse> {
    const params = new URLSearchParams();
    params.append("userId", userId);
    params.append("page", String(page));
    params.append("limit", String(limit));

    const response = await orderClient.get<InvoicesListResponse>(
      `/api/admin/invoices?${params}`,
      { signal },
    );
    return response.data;
  }

  async getInvoiceById(invoiceId: string): Promise<InvoiceResponse> {
    const response = await orderClient.get<InvoiceResponse>(
      `/api/invoices/${invoiceId}`,
    );
    return response.data;
  }

  getErrorMessage(error: unknown): string {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      return axiosError.response?.data?.error?.message || "An error occurred";
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "An unexpected error occurred";
  }
}

export const invoiceApi = new InvoiceApiService();
