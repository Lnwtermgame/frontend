import { orderClient } from '@/lib/client/gateway';

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountPercentage: number;
  discountAmount?: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isClaimed?: boolean;
  claimedAt?: string;
}

export interface UserCoupon extends Coupon {
  userCouponId: string;
  isUsed: boolean;
  usedAt?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discount?: number;
  message?: string;
}

export interface CouponsListResponse {
  success: boolean;
  data: Coupon[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserCouponsListResponse {
  success: boolean;
  data: UserCoupon[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CouponResponse {
  success: boolean;
  data: UserCoupon;
  message?: string;
}

export interface ValidateCouponResponse {
  success: boolean;
  data: CouponValidationResult;
  message?: string;
}

// Merged: Coupon service now part of Order service (port 3003)
class CouponApiService {
  async getAvailableCoupons(page = 1, limit = 20): Promise<CouponsListResponse> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));

    const response = await orderClient.get<CouponsListResponse>(`/api/coupons?${params}`);
    return response.data;
  }

  async getMyCoupons(page = 1, limit = 20): Promise<UserCouponsListResponse> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));

    const response = await orderClient.get<UserCouponsListResponse>(`/api/coupons/my?${params}`);
    return response.data;
  }

  async claimCoupon(couponId: string): Promise<CouponResponse> {
    const response = await orderClient.post<CouponResponse>(`/api/coupons/${couponId}/claim`);
    return response.data;
  }

  async validateCoupon(code: string, orderAmount?: number): Promise<ValidateCouponResponse> {
    const response = await orderClient.post<ValidateCouponResponse>('/api/coupons/validate', {
      code,
      orderAmount,
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

export const couponApi = new CouponApiService();
