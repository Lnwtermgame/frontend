export default function Loading() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="flex flex-col items-center gap-6">
                {/* Neo-brutalism spinner */}
                <div className="relative w-16 h-16">
                    {/* Outer ring */}
                    <div
                        className="absolute inset-0 border border-site-border/30 rounded-[12px] bg-yellow-500 animate-spin"
                        style={{
                            boxShadow: "3px 3px 0 0 #000",
                            animationDuration: "1s",
                            animationTimingFunction: "steps(8)",
                        }}
                    />
                    {/* Inner ring */}
                    <div
                        className="absolute inset-2 border border-site-border/30 rounded-[12px] bg-pink-500 animate-spin"
                        style={{
                            boxShadow: "2px 2px 0 0 #000",
                            animationDuration: "1.5s",
                            animationTimingFunction: "steps(8)",
                            animationDirection: "reverse",
                        }}
                    />
                    {/* Center dot */}
                    <div className="absolute inset-[18px] border-[2px] border-black bg-[#212328]" />
                </div>

                {/* Loading text with typing dots */}
                <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-white tracking-wide uppercase">
                        Loading
                    </span>
                    <span className="flex gap-0.5">
                        <span
                            className="w-1.5 h-1.5 bg-black animate-bounce"
                            style={{ animationDelay: "0ms" }}
                        />
                        <span
                            className="w-1.5 h-1.5 bg-black animate-bounce"
                            style={{ animationDelay: "150ms" }}
                        />
                        <span
                            className="w-1.5 h-1.5 bg-black animate-bounce"
                            style={{ animationDelay: "300ms" }}
                        />
                    </span>
                </div>
            </div>
        </div>
    );
}
