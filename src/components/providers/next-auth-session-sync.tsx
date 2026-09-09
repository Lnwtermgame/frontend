"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/stores/auth";
import type { AuthUser } from "@/lib/api/auth";

/**
 * Syncs a NextAuth OAuth session into the app's auth store. A stale backend
 * token (expired at the provider exchange) is fine to set — the API client's
 * 401 path will attempt a cookie refresh and bounce to login if it fails,
 * matching the old app's observable behavior.
 */
export function NextAuthSessionSync() {
  const { data: session, status } = useSession();
  const applyOAuthSession = useAuthStore((s) => s.applyOAuthSession);

  useEffect(() => {
    if (status === "authenticated" && session) {
      applyOAuthSession({
        backendTokens: session.backendTokens ?? null,
        // The session d.ts widens `role` to string (transport type); the
        // gateway returns the same user shape as the login endpoint, which
        // the API layer already types as AuthUser.
        backendUser: (session.backendUser ?? null) as AuthUser | null,
      });
    }
  }, [session, status, applyOAuthSession]);

  return null;
}
