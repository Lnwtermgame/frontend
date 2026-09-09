"use client";

import { useQuery } from "@tanstack/react-query";
import { signIn } from "next-auth/react";
import { getOAuthProviders } from "@/lib/api/auth";

export function OAuthButtons() {
  const { data: providers } = useQuery({
    queryKey: ["oauth-providers"],
    queryFn: getOAuthProviders,
    staleTime: 5 * 60_000,
  });

  if (!providers?.length) return null;

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <p className="text-center text-sm opacity-60">หรือเข้าสู่ระบบด้วย</p>
      {providers.map((provider) => (
        <button
          key={provider.name}
          type="button"
          onClick={() => signIn(provider.name, { callbackUrl: "/th" })}
          className="rounded-md border px-4 py-2"
        >
          {provider.displayName}
        </button>
      ))}
    </div>
  );
}
