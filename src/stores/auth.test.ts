import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loginMock = vi.fn();
const logoutMock = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  login: (...args: unknown[]) => loginMock(...args),
  logout: (...args: unknown[]) => logoutMock(...args),
}));

const setAccessTokenMock = vi.fn();
const refreshMock = vi.fn();
const configureAuthSyncMock = vi.fn();
const clientTokenRef = { current: null as string | null };

vi.mock("@/lib/api/client", () => ({
  setAccessToken: (t: string | null) => {
    clientTokenRef.current = t;
    setAccessTokenMock(t);
  },
  getAccessToken: () => clientTokenRef.current,
  refreshAccessToken: () => refreshMock(),
  configureAuthSync: (hooks: unknown) => configureAuthSyncMock(hooks),
}));

const testUser = {
  id: "u1",
  username: "tester",
  email: "t@example.com",
  role: "USER" as const,
  isActive: true,
};

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  loginMock.mockReset();
  logoutMock.mockReset();
  setAccessTokenMock.mockReset();
  refreshMock.mockReset();
  configureAuthSyncMock.mockReset();
  clientTokenRef.current = null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useAuthStore", () => {
  it("bootstrap: no persisted user → guest", async () => {
    const { useAuthStore } = await import("./auth");
    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().status).toBe("guest");
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("bootstrap: persisted user + refresh ok → authenticated", async () => {
    refreshMock.mockResolvedValue("t2");
    localStorage.setItem(
      "gtp-new-user",
      JSON.stringify({ state: { user: testUser }, version: 0 }),
    );
    const { useAuthStore } = await import("./auth");
    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().user?.username).toBe("tester");
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("bootstrap: persisted user + refresh fail → cleared to guest", async () => {
    refreshMock.mockResolvedValue(null);
    localStorage.setItem(
      "gtp-new-user",
      JSON.stringify({ state: { user: testUser }, version: 0 }),
    );
    const { useAuthStore } = await import("./auth");
    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().status).toBe("guest");
    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorage.getItem("gtp-new-user")).toContain('"user":null');
  });

  it("loginWithPassword: success sets user + token", async () => {
    loginMock.mockResolvedValue({
      user: testUser,
      tokens: { accessToken: "tok-1", expiresIn: 900 },
    });
    const { useAuthStore } = await import("./auth");
    const res = await useAuthStore.getState().loginWithPassword("t@example.com", "password123");
    expect(res.ok).toBe(true);
    expect(useAuthStore.getState().user?.id).toBe("u1");
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(clientTokenRef.current).toBe("tok-1");
  });

  it("loginWithPassword: failure returns message, stays guest", async () => {
    loginMock.mockRejectedValue(new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง"));
    const { useAuthStore } = await import("./auth");
    const res = await useAuthStore.getState().loginWithPassword("t@example.com", "wrong-pass");
    expect(res.ok).toBe(false);
    expect(res.message).toBe("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    expect(useAuthStore.getState().status).toBe("guest");
  });

  it("applyOAuthSession sets user + token once", async () => {
    const { useAuthStore } = await import("./auth");
    const applied = useAuthStore.getState().applyOAuthSession({
      backendTokens: { accessToken: "oa-token", expiresIn: 900 },
      backendUser: testUser,
    });
    expect(applied).toBe(true);
    expect(clientTokenRef.current).toBe("oa-token");
    expect(useAuthStore.getState().status).toBe("authenticated");
  });

  it("logout clears store + token (api failure tolerated)", async () => {
    logoutMock.mockRejectedValue(new Error("network"));
    localStorage.setItem(
      "gtp-new-user",
      JSON.stringify({ state: { user: testUser }, version: 0 }),
    );
    const { useAuthStore } = await import("./auth");
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().status).toBe("guest");
    expect(clientTokenRef.current).toBeNull();
  });
});
