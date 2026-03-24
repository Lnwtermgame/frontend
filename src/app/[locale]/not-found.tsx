"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function NotFound() {
    const t = useTranslations("errors");
    const router = useRouter();

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
            <div className="text-center max-w-lg">
                {/* Big 404 badge */}
                <div className="inline-flex items-center justify-center mb-6">
                    <span className="text-[120px] sm:text-[160px] font-extrabold leading-none text-white select-none"
                        style={{ textShadow: "6px 6px 0 var(--pink-500)" }}>
                        404
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                    {t("notFound.title", { defaultMessage: "Page Not Found" })}
                </h1>

                {/* Description */}
                <p className="text-gray-600 text-base sm:text-lg mb-8 max-w-md mx-auto">
                    {t("notFound.description", {
                        defaultMessage: "The page you're looking for doesn't exist or has been moved.",
                    })}
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={() => router.push("/")}
                        className="btn-pink-500 w-full sm:w-auto"
                    >
                        {t("notFound.goHome", { defaultMessage: "← Go Home" })}
                    </button>
                    <button
                        onClick={() => router.back()}
                        className="btn-brutal w-full sm:w-auto"
                    >
                        {t("notFound.goBack", { defaultMessage: "Go Back" })}
                    </button>
                </div>
            </div>
        </div>
    );
}
