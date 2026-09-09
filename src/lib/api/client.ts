export const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3000";

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: { infoCode?: string } & Record<string, unknown>;
  };
}

export type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** auth endpoints: skip token bootstrap + refresh retry */
  skipAuth?: boolean;
  headers?: Record<string, string>;
};

export class ApiError extends Error {
  status: number;
  code: string;
  infoCode?: string;
  details?: unknown;

  constructor(
    message: string,
    opts: { status: number; code: string; infoCode?: string; details?: unknown },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.infoCode = opts.infoCode;
    this.details = opts.details;
  }
}

// ── access token (module memory — mirrors the old app's gateway.tsx) ──
let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken(): string | null {
  return accessToken;
}

// ── auth seam injected by the auth store (avoids circular imports) ──
export interface AuthSyncHooks {
  hasStoredUser(): boolean;
  onSessionExpired(): void;
}
let authHooks: AuthSyncHooks | null = null;
export function configureAuthSync(hooks: AuthSyncHooks) {
  authHooks = hooks;
}

// ── CSRF (gateway double-submit cookie pattern) ──
let csrfToken: string | null = null;
let csrfFetch: Promise<string> | null = null;

export async function ensureCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  if (!csrfFetch) {
    csrfFetch = fetch(`${GATEWAY_URL}/api/csrf-token`, { credentials: "include" })
      .then((r) => r.json())
      .then((env: ApiEnvelope<{ csrfToken: string }>) => {
        csrfToken = env.data?.csrfToken ?? "";
        return csrfToken;
      })
      .finally(() => {
        csrfFetch = null;
      });
  }
  return csrfFetch;
}

// ── refresh (single-flight; httpOnly cookie carries the token) ──
let refreshInFlight: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (!authHooks?.hasStoredUser()) return null;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const csrf = await ensureCsrfToken().catch(() => "");
        const res = await fetch(`${GATEWAY_URL}/api/auth/refresh-token`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(csrf ? { "X-CSRF-Token": csrf } : {}),
          },
          body: "{}",
        });
        const env = (await res.json()) as ApiEnvelope<{ accessToken: string }>;
        if (res.ok && env.success && env.data?.accessToken) {
          accessToken = env.data.accessToken;
          return env.data.accessToken;
        }
        accessToken = null;
        return null;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

function isAuthEndpoint(path: string): boolean {
  return (
    path.includes("/api/auth/login") ||
    path.includes("/api/auth/register") ||
    path.includes("/api/auth/refresh-token")
  );
}

async function rawFetch(
  path: string,
  opts: ApiOptions,
  token: string | null,
  csrf: string | null,
): Promise<Response> {
  const headers: Record<string, string> = { ...opts.headers };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  if (csrf) headers["X-CSRF-Token"] = csrf;
  return fetch(`${GATEWAY_URL}${path}`, {
    method: opts.method ?? "GET",
    credentials: "include",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

async function parseEnvelope<T>(res: Response): Promise<ApiEnvelope<T>> {
  try {
    return (await res.json()) as ApiEnvelope<T>;
  } catch {
    return { success: false, error: { code: "BAD_JSON", message: res.statusText } };
  }
}

function toApiError<T>(env: ApiEnvelope<T>, status: number): ApiError {
  return new ApiError(
    env.error?.message ?? env.message ?? `Request failed (${status})`,
    {
      status,
      code: env.error?.code ?? "UNKNOWN",
      infoCode:
        typeof env.error?.details?.infoCode === "string"
          ? env.error.details.infoCode
          : undefined,
      details: env.error?.details,
    },
  );
}

const CSRF_RETRY_MAX = 1;
const RATE_LIMIT_MAX_RETRIES = 3;

export async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const needsCsrf = method !== "GET";

  let csrfRetries = 0;
  let rateRetries = 0;

  const attempt = async (): Promise<T> => {
    const csrf = needsCsrf ? await ensureCsrfToken().catch(() => "") : null;
    let res = await rawFetch(path, opts, accessToken, csrf);

    if (res.status === 403 && csrfRetries < CSRF_RETRY_MAX) {
      const env = await parseEnvelope(res);
      if (env.error?.code === "CSRF_INVALID") {
        csrfRetries++;
        csrfToken = null;
        const fresh = await ensureCsrfToken().catch(() => "");
        res = await rawFetch(path, opts, accessToken, fresh);
      } else {
        throw toApiError(env, res.status);
      }
    }

    while (res.status === 429 && rateRetries < RATE_LIMIT_MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 2 ** rateRetries * 500));
      rateRetries++;
      const freshCsrf = needsCsrf ? await ensureCsrfToken().catch(() => "") : null;
      res = await rawFetch(path, opts, accessToken, freshCsrf);
    }

    const env = await parseEnvelope<T>(res);
    if (!res.ok || !env.success) throw toApiError(env, res.status);
    return env.data as T;
  };

  return attempt();
}
