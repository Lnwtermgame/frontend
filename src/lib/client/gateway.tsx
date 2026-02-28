import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

export const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3000";

let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = (): string | null => inMemoryAccessToken;

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

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

export interface RefreshResult {
  accessToken: string;
  expiresIn: number;
}

export const refreshAccessToken = async (): Promise<RefreshResult | null> => {
  // Don't attempt refresh if user was never logged in (no stored user data)
  const hasStoredUser =
    typeof window !== "undefined" && localStorage.getItem("mali-gamepass-user");

  if (!hasStoredUser) {
    console.log("[RefreshToken] No stored user, skipping refresh attempt");
    return null;
  }

  // Get refresh token from localStorage (fallback to cookie)
  const refreshToken =
    typeof window !== "undefined"
      ? localStorage.getItem("auth_refresh_token")
      : null;

  if (!refreshToken) {
    console.log("[RefreshToken] No refresh token available");
    return null;
  }

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({
        resolve: (token: string) =>
          resolve({ accessToken: token, expiresIn: 900 }),
        reject,
      });
    });
  }

  isRefreshing = true;
  try {
    const csrf = csrfToken || (await fetchCsrfToken().catch(() => ""));
    const response = await axios.post(
      `${GATEWAY_URL}/api/auth/refresh-token`,
      { refreshToken },
      {
        withCredentials: true,
        headers: csrf ? { "X-CSRF-Token": csrf } : {},
      },
    );

    if (response.data?.success) {
      const {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn,
      } = response.data.data;
      setAccessToken(accessToken);
      // Update refresh token in localStorage if a new one is provided
      if (newRefreshToken && typeof window !== "undefined") {
        localStorage.setItem("auth_refresh_token", newRefreshToken);
      }
      processQueue(null, accessToken);
      return { accessToken, expiresIn: expiresIn || 900 };
    }
    processQueue(new Error("Refresh failed"), null);
    return null;
  } catch (error) {
    processQueue(error, null);
    return null;
  } finally {
    isRefreshing = false;
  }
};

type ExtendedAxiosRequestConfig = AxiosRequestConfig & {
  // Skip in-flight dedupe for this request
  skipDedupe?: boolean;
  // Skip short-lived response cache for this request
  skipResponseCache?: boolean;
  // Cache duration in milliseconds (GET only)
  dedupeTtlMs?: number;
};

const serializeParams = (params?: AxiosRequestConfig["params"]): string => {
  if (!params) return "";
  if (params instanceof URLSearchParams) return params.toString();
  if (typeof params === "string") return params;
  if (typeof params !== "object") return String(params);

  return Object.entries(params as Record<string, unknown>)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}=${value.join(",")}`;
      }
      return `${key}=${String(value)}`;
    })
    .join("&");
};

const buildGetRequestKey = (
  service: string,
  url: string,
  config?: ExtendedAxiosRequestConfig,
): string => {
  const token = getAccessToken() || "";
  const paramsKey = serializeParams(config?.params);
  return [service, url, paramsKey, token].join("::");
};

// ─── CSRF Token Management ───
let csrfToken: string | null = null;
let csrfFetchPromise: Promise<string> | null = null;

const fetchCsrfToken = async (): Promise<string> => {
  if (csrfFetchPromise) return csrfFetchPromise;
  csrfFetchPromise = axios
    .get(`${GATEWAY_URL}/api/csrf-token`, { withCredentials: true })
    .then((res) => {
      const token = res.data?.data?.csrfToken;
      csrfToken = token;
      return token;
    })
    .finally(() => {
      csrfFetchPromise = null;
    });
  return csrfFetchPromise;
};

const ensureCsrfToken = async (): Promise<string> => {
  if (csrfToken) return csrfToken;
  return fetchCsrfToken();
};

// Reset cached CSRF token (called on 403 CSRF_INVALID to force re-fetch)
const resetCsrfToken = () => {
  csrfToken = null;
};

const createServiceClient = (service: string): AxiosInstance => {
  const client = axios.create({
    baseURL: GATEWAY_URL,
    headers: {
      "Content-Type": "application/json",
      "X-Service": service,
    },
    withCredentials: true,
  });

  // Request coalescing and short-lived cache for GET requests
  const inFlightGetRequests = new Map<string, Promise<AxiosResponse>>();
  const getResponseCache = new Map<
    string,
    { expiresAt: number; response: AxiosResponse }
  >();

  // Request interceptor to add JWT token and CSRF token
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Any write operation invalidates cached GET responses for this service.
      if (config.method && config.method.toLowerCase() !== "get") {
        getResponseCache.clear();
        // Attach CSRF token for non-GET requests
        try {
          const token = await ensureCsrfToken();
          if (token && config.headers) {
            config.headers["X-CSRF-Token"] = token;
          }
        } catch {
          // If CSRF fetch fails, proceed without it (server may reject)
        }
      }

      const token = getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error),
  );

  // Response interceptor for error handling, token refresh, and rate limit retry
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
        _retryCount?: number;
        _csrfRetry?: boolean;
      };

      // Handle 403 CSRF_INVALID - reset token and retry once
      if (
        error.response?.status === 403 &&
        !originalRequest._csrfRetry &&
        (error.response?.data as any)?.error?.code === "CSRF_INVALID"
      ) {
        originalRequest._csrfRetry = true;
        resetCsrfToken();
        const newToken = await fetchCsrfToken();
        if (newToken && originalRequest.headers) {
          originalRequest.headers["X-CSRF-Token"] = newToken;
        }
        return client(originalRequest);
      }

      // Handle 429 (Rate Limit) with exponential backoff retry
      if (error.response?.status === 429) {
        const retryCount = originalRequest._retryCount || 0;
        const maxRetries = 3;

        if (retryCount < maxRetries) {
          originalRequest._retryCount = retryCount + 1;
          // Exponential backoff: 500ms, 1000ms, 2000ms
          const delay = Math.pow(2, retryCount) * 500;

          console.warn(
            `[Rate Limit] Retrying request in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`,
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          return client(originalRequest);
        }

        // Max retries reached, show user-friendly error
        console.error("[Rate Limit] Max retries exceeded");
        return Promise.reject(error);
      }

      // If not 401 or already retried, reject immediately
      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }

      // Don't try to refresh for login/register/refresh-token endpoints
      const isAuthEndpoint =
        originalRequest.url?.includes("/login") ||
        originalRequest.url?.includes("/register") ||
        originalRequest.url?.includes("/refresh-token");

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      // If this request was made without auth context, do not force session-expired redirect.
      // This prevents guest users from being bounced to login when a protected endpoint
      // is called incidentally while browsing public pages.
      const requestHeaders = originalRequest.headers as
        | Record<string, unknown>
        | undefined;
      const requestHadAuthHeader = Boolean(
        requestHeaders?.Authorization ?? requestHeaders?.authorization,
      );
      const hasStoredToken = Boolean(getAccessToken());

      if (!requestHadAuthHeader && !hasStoredToken) {
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
        const refreshResult = await refreshAccessToken();

        if (!refreshResult) {
          // Refresh failed, clear auth and redirect
          processQueue(new Error("Failed to refresh token"), null);
          if (typeof window !== "undefined") {
            setAccessToken(null);
            localStorage.removeItem("mali-gamepass-user");
            // Only redirect if not already on the login page to prevent redirect loops
            if (!window.location.pathname.startsWith("/login")) {
              sessionStorage.setItem("session_expired", "true");
              window.location.href = "/login?session_expired=true";
            }
          }
          return Promise.reject(error);
        }

        // Refresh succeeded, retry original request and process queue
        processQueue(null, refreshResult.accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${refreshResult.accessToken}`;
        }
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );

  // Override GET to dedupe identical in-flight requests and add short cache.
  const originalGet = client.get.bind(client);
  client.get = ((url: string, config?: ExtendedAxiosRequestConfig) => {
    const requestConfig = config || {};

    // Requests with AbortSignal are not deduped/cached to avoid cancellation coupling.
    const skipDedupe = Boolean(
      requestConfig.skipDedupe || requestConfig.signal,
    );
    const skipResponseCache = Boolean(
      requestConfig.skipResponseCache || requestConfig.signal,
    );
    const dedupeTtlMs =
      typeof requestConfig.dedupeTtlMs === "number"
        ? requestConfig.dedupeTtlMs
        : 1200;

    const requestKey = buildGetRequestKey(service, url, requestConfig);

    if (!skipResponseCache) {
      const cached = getResponseCache.get(requestKey);
      if (cached && cached.expiresAt > Date.now()) {
        return Promise.resolve(cached.response);
      }
      if (cached && cached.expiresAt <= Date.now()) {
        getResponseCache.delete(requestKey);
      }
    }

    if (!skipDedupe) {
      const inFlight = inFlightGetRequests.get(requestKey);
      if (inFlight) {
        return inFlight;
      }
    }

    const requestPromise = originalGet(url, requestConfig)
      .then((response) => {
        if (!skipResponseCache && dedupeTtlMs > 0) {
          getResponseCache.set(requestKey, {
            expiresAt: Date.now() + dedupeTtlMs,
            response,
          });
        }
        return response;
      })
      .finally(() => {
        inFlightGetRequests.delete(requestKey);
      });

    if (!skipDedupe) {
      inFlightGetRequests.set(requestKey, requestPromise);
    }

    return requestPromise;
  }) as AxiosInstance["get"];

  return client;
};

// Consolidated Service Clients (Backend microservices merged)
// Auth Service (3001): auth + security
export const authClient = createServiceClient("auth");
// Product Service (3002): product + favorite
export const productClient = createServiceClient("product");
// Order Service (3003): order + cart + coupon
export const orderClient = createServiceClient("order");
// Payment Service (3004): payment + credit
export const paymentClient = createServiceClient("payment");

// Support Service (3007): FAQ and Tickets
export const supportClient = createServiceClient("support");
// Public settings endpoint
export const publicClient = createServiceClient("public");

// Notification Service (3006): Notifications and Push
export const notificationClient = createServiceClient("notification");

// Legacy exports (kept for backward compatibility, map to same clients)
// Cart API now uses orderClient - cart merged into order service
export const cartClient = orderClient;
// Credit API now uses paymentClient - credit merged into payment service
export const creditClient = paymentClient;
