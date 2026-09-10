"use client";

import { useQuery } from "@tanstack/react-query";
import { signIn } from "next-auth/react";
import { getOAuthProviders } from "@/lib/api/auth";

const ICONS: Record<string, React.ReactNode> = {
  google: (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.97 10.97 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  ),
  discord: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2" aria-hidden>
      <path d="M20.32 4.37a19.8 19.8 0 0 0-4.93-1.51 13.78 13.78 0 0 0-.64 1.28 18.27 18.27 0 0 0-5.5 0 13 13 0 0 0-.64-1.28c-1.71.29-3.37.8-4.93 1.51A20.26 20.26 0 0 0 .1 18.06a19.9 19.9 0 0 0 6.07 3.03c.49-.66.93-1.37 1.3-2.1a12.9 12.9 0 0 1-2.06-.98c.17-.12.34-.25.5-.38a14.2 14.2 0 0 0 12.18 0c.17.13.33.26.5.38-.65.39-1.35.72-2.06.98.38.74.81 1.44 1.3 2.1a19.84 19.84 0 0 0 6.07-3.03 20.2 20.2 0 0 0-3.58-13.69ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.95-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Zm7.96 0c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.95-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Z" />
    </svg>
  ),
};

/**
 * บล็อก OAuth = ปุ่ม providers + เส้นคั่น "หรือด้วยอีเมล" — เป็นหน่วยเดียวกัน
 * เพราะถ้าไม่มี OAuth เลย (providers ว่าง) เส้นคั่นก็ต้องหายไปด้วย
 * ระหว่างโหลดยังไม่วาดอะไรเลย กัน divider แวบขึ้นแล้วหาย
 */
export function OAuthSection({ dividerLabel }: { dividerLabel: string }) {
  const { data: providers } = useQuery({
    queryKey: ["oauth-providers"],
    queryFn: getOAuthProviders,
    staleTime: 5 * 60_000,
  });

  if (!providers?.length) return null;

  return (
    <>
      <div className="flex w-full flex-col gap-2.5">
        {providers.map((provider) => (
          <button
            key={provider.name}
            type="button"
            onClick={() => signIn(provider.name, { callbackUrl: "/th" })}
            className="flex h-11 w-full items-center justify-center gap-2.5 rounded-[10px] border border-border bg-secondary text-sm font-semibold transition-colors hover:border-muted-foreground/40 hover:bg-accent"
          >
            {ICONS[provider.name] ?? null}
            {provider.displayName}
          </button>
        ))}
      </div>
      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground/70">
        <span className="h-px flex-1 bg-border/60" />
        {dividerLabel}
        <span className="h-px flex-1 bg-border/60" />
      </div>
    </>
  );
}
