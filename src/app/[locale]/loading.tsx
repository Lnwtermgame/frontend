export default function Loading() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="flex flex-col items-center gap-6">
                {/* Spinner */}
                <div className="relative w-16 h-16">
                    {/* Outer ring */}
                    <div
                        className="absolute inset-0 border border-site-border rounded-8 bg-site-accent animate-spin"
                        style={{
                            animationDuration: "1s",
                            animationTimingFunction: "steps(8)",
                        }}
                    />
                    {/* Inner ring */}
                    <div
                        className="absolute inset-2 border border-site-border rounded-8 bg-site-raised animate-spin"
                        style={{
                            animationDuration: "1.5s",
                            animationTimingFunction: "steps(8)",
                            animationDirection: "reverse",
                        }}
                    />
                    {/* Center dot */}
                    <div className="absolute inset-[18px] border-[2px] border-site-border bg-site-surface" />
                </div>

                {/* Loading text with typing dots */}
                <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-site-text tracking-wide uppercase">
                        Loading
                    </span>
                    <span className="flex gap-0.5">
                        <span
                            className="w-1.5 h-1.5 bg-site-raised animate-bounce"
                            style={{ animationDelay: "0ms" }}
                        />
                        <span
                            className="w-1.5 h-1.5 bg-site-raised animate-bounce"
                            style={{ animationDelay: "150ms" }}
                        />
                        <span
                            className="w-1.5 h-1.5 bg-site-raised animate-bounce"
                            style={{ animationDelay: "300ms" }}
                        />
                    </span>
                </div>
            </div>
        </div>
    );
}
