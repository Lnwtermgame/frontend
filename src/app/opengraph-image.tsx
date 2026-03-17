import { ImageResponse } from "next/og";

export const alt = "Lnwtermgame — Game Top Up & Digital Cards";
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                    fontFamily: "sans-serif",
                }}
            >
                {/* Decorative accent circles */}
                <div
                    style={{
                        position: "absolute",
                        top: -60,
                        right: -60,
                        width: 300,
                        height: 300,
                        borderRadius: "50%",
                        background: "rgba(255,107,157,0.15)",
                        display: "flex",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: -80,
                        left: -80,
                        width: 400,
                        height: 400,
                        borderRadius: "50%",
                        background: "rgba(149,225,211,0.1)",
                        display: "flex",
                    }}
                />

                {/* Main content */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 16,
                    }}
                >
                    {/* Logo / icon area */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 80,
                            height: 80,
                            borderRadius: 16,
                            background: "#FF6B9D",
                            border: "4px solid #000",
                            boxShadow: "6px 6px 0 0 #000",
                            fontSize: 40,
                        }}
                    >
                        🎮
                    </div>

                    {/* Site name */}
                    <div
                        style={{
                            fontSize: 64,
                            fontWeight: 800,
                            color: "#ffffff",
                            letterSpacing: "-2px",
                            display: "flex",
                        }}
                    >
                        Lnwtermgame
                    </div>

                    {/* Tagline */}
                    <div
                        style={{
                            fontSize: 28,
                            color: "#95E1D3",
                            fontWeight: 600,
                            display: "flex",
                        }}
                    >
                        Game Top Up & Digital Cards
                    </div>

                    {/* Accent bar */}
                    <div
                        style={{
                            width: 120,
                            height: 6,
                            borderRadius: 3,
                            background: "linear-gradient(90deg, #FF6B9D, #FFD93D, #95E1D3)",
                            marginTop: 8,
                            display: "flex",
                        }}
                    />

                    {/* Features */}
                    <div
                        style={{
                            display: "flex",
                            gap: 32,
                            marginTop: 24,
                            fontSize: 18,
                            color: "rgba(255,255,255,0.7)",
                        }}
                    >
                        <span style={{ display: "flex" }}>Instant Delivery</span>
                        <span style={{ display: "flex" }}>Secure Payment</span>
                        <span style={{ display: "flex" }}>9 Languages</span>
                    </div>
                </div>
            </div>
        ),
        { ...size },
    );
}
