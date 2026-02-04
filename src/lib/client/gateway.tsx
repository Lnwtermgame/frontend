import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
// Queue of failed requests to retry after token refresh
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

// Process the queue of failed requests
const processQueue = (error: unknown | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Refresh token function
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = typeof window !== 'undefined'
    ? localStorage.getItem('auth_refresh_token')
    : null;

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post(`${GATEWAY_URL}/api/auth/refresh-token`, {
      refreshToken,
    });

    if (response.data?.success) {
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('auth_refresh_token', newRefreshToken);
      return accessToken;
    }
    return null;
  } catch {
    return null;
  }
};

const createServiceClient = (service: string): AxiosInstance => {
  const client = axios.create({
    baseURL: GATEWAY_URL,
    headers: {
      "Content-Type": "application/json",
      "X-Service": service,
    },
    withCredentials: false,
  });

  // Request interceptor to add JWT token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  // Response interceptor for error handling and token refresh
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // If not 401 or already retried, reject immediately
      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }

      // Don't try to refresh for login/register/refresh-token endpoints
      const isAuthEndpoint = originalRequest.url?.includes('/login') ||
                            originalRequest.url?.includes('/register') ||
                            originalRequest.url?.includes('/refresh-token');

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(client(originalRequest));
            },
            reject: (err: unknown) => {
              reject(err);
            },
          });
        });
      }

      // Start refreshing
      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();

        if (!newToken) {
          // Refresh failed, clear auth and redirect
          processQueue(new Error('Failed to refresh token'), null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_refresh_token');
            localStorage.removeItem('mali-gamepass-user');
            window.location.href = '/login?session_expired=true';
          }
          return Promise.reject(error);
        }

        // Refresh succeeded, retry original request and process queue
        processQueue(null, newToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );

  return client;
};

// Consolidated Service Clients (Backend microservices merged)
// Auth Service (3001): auth + security
export const authClient = createServiceClient('auth');
// Product Service (3002): product + favorite
export const productClient = createServiceClient('product');
// Order Service (3003): order + cart + coupon
export const orderClient = createServiceClient('order');
// Payment Service (3004): payment + credit
export const paymentClient = createServiceClient('payment');

// Support Service (3007): FAQ and Tickets
export const supportClient = createServiceClient('support');

// Legacy exports (kept for backward compatibility, map to same clients)
// Cart API now uses orderClient - cart merged into order service
export const cartClient = orderClient;
// Credit API now uses paymentClient - credit merged into payment service
export const creditClient = paymentClient;
