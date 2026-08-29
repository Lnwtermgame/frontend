"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const t = useTranslations("errors");

    useEffect(() => {
        // Log to error reporting service (e.g., Sentry)
        console.error("[ErrorBoundary]", error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
            <div className="text-center max-w-lg">
                {/* Error icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 mb-6 border border-site-border rounded-8 bg-site-accent">
                    <svg
                        className="w-10 h-10 text-site-bg"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                    </svg>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-bold text-site-text mb-3">
                    {t("generic.title", { defaultMessage: "Something Went Wrong" })}
                </h1>

                {/* Description */}
                <p className="text-site-muted text-base sm:text-lg mb-2 max-w-md mx-auto">
                    {t("generic.description", {
                        defaultMessage: "An unexpected error occurred. Please try again.",
                    })}
                </p>

                {/* Error digest for support */}
                {error.digest && (
                    <p className="text-xs text-site-dim mb-6 font-mono">
                        Error ID: {error.digest}
                    </p>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                    <button onClick={reset} className="site-btn w-full sm:w-auto">
                        {t("generic.tryAgain", { defaultMessage: "Try Again" })}
                    </button>
                    <button
                        onClick={() => (window.location.href = "/")}
                        className="bg-site-surface border border-site-border-soft rounded-6 text-site-muted hover:text-site-text hover:border-site-border transition-colors px-6 py-3 font-bold w-full sm:w-auto"
                    >
                        {t("generic.goHome", { defaultMessage: "← Go Home" })}
                    </button>
                </div>
            </div>
        </div>
    );
}
