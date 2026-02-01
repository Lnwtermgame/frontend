import { paymentClient } from '@/lib/client/gateway';

export interface CreditBalance {
  balance: number;
  currency: string;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  type: 'TOPUP' | 'PURCHASE' | 'REFUND' | 'BONUS';
  description?: string;
  createdAt: string;
}

export interface CreditBalanceResponse {
  success: boolean;
  data: CreditBalance;
  message?: string;
}

export interface CreditTransactionsResponse {
  success: boolean;
  data: CreditTransaction[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreditTopUpResponse {
  success: boolean;
  data: CreditBalance;
  message?: string;
}

// Merged: Credit service now part of Payment service (port 3004)
class CreditApiService {
  async getBalance(): Promise<CreditBalanceResponse> {
    const response = await paymentClient.get<CreditBalanceResponse>('/api/credits/balance');
    return response.data;
  }

  async getTransactions(page = 1, limit = 20): Promise<CreditTransactionsResponse> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));

    const response = await paymentClient.get<CreditTransactionsResponse>(`/api/credits/transactions?${params}`);
    return response.data;
  }

  async topUp(amount: number, paymentMethod: string): Promise<CreditTopUpResponse> {
    const response = await paymentClient.post<CreditTopUpResponse>('/api/credits/topup', {
      amount,
      paymentMethod,
    });
    return response.data;
  }

  getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
      return axiosError.response?.data?.error?.message || 'An error occurred';
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}

export const creditApi = new CreditApiService();
