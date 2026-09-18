import type { Region } from "@/lib/api/products";

interface RegionFlagProps {
  region: Region;
  className?: string;
}

const REGION_LABELS: Record<Region, string> = {
  THAILAND: "ประเทศไทย (TH)",
  MALAYSIA: "มาเลเซีย (MY)",
  GLOBAL: "ทั่วโลก (Global)",
};

/**
 * Optimized SVG flag icons for game product regions (Thailand, Malaysia, Global).
 * Designed on a crisp 32x20 grid with subtle border clipping.
 */
export function RegionFlag({ region, className }: RegionFlagProps) {
  const label = REGION_LABELS[region];

  return (
    <svg
      aria-label={label}
      className={className}
      role="img"
      viewBox="0 0 32 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <clipPath id={`flag-clip-${region}`}>
        <rect width="32" height="20" rx="2.5" />
      </clipPath>
      <g clipPath={`url(#flag-clip-${region})`}>
        {region === "THAILAND" && <ThailandFlag />}
        {region === "MALAYSIA" && <MalaysiaFlag />}
        {region === "GLOBAL" && <GlobalFlag />}
      </g>
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="19"
        rx="2"
        stroke="currentColor"
        strokeOpacity="0.18"
      />
    </svg>
  );
}

function ThailandFlag() {
  return (
    <>
      {/* 5 horizontal stripes with ratio 1:1:2:1:1 */}
      <rect width="32" height="20" fill="#F4F5F8" />
      <rect width="32" height="3.33" fill="#A51931" />
      <rect y="16.67" width="32" height="3.33" fill="#A51931" />
      <rect y="3.33" width="32" height="3.33" fill="#F4F5F8" />
      <rect y="13.33" width="32" height="3.33" fill="#F4F5F8" />
      <rect y="6.67" width="32" height="6.66" fill="#2D2A4A" />
    </>
  );
}

function MalaysiaFlag() {
  return (
    <>
      {/* 14 alternating red/white stripes */}
      <rect width="32" height="20" fill="#CC2035" />
      <path
        d="M0 1.43H32V2.86H0zm0 2.86H32V5.71H0zm0 2.86H32V8.57H0zm0 2.86H32V11.43H0zm0 2.86H32V14.29H0zm0 2.86H32V17.14H0zm0 2.86H32V20H0z"
        fill="#FFFFFF"
      />
      {/* Blue canton */}
      <rect width="16" height="11.43" fill="#0E2F68" />
      {/* Yellow crescent and 14-point star */}
      <path
        d="M6.6 2.5a3.6 3.6 0 1 0 0 6.4 2.9 2.9 0 1 1 0-6.4z"
        fill="#FFD100"
      />
      {/* 14-pointed star */}
      <circle cx="11.2" cy="5.7" r="2.2" fill="#FFD100" />
    </>
  );
}

function GlobalFlag() {
  return (
    <>
      {/* Elegant Navy Globe Banner */}
      <rect width="32" height="20" fill="#182338" />
      {/* Outer Globe Circle */}
      <circle cx="16" cy="10" r="7.5" fill="#233554" stroke="#60A5FA" strokeWidth="0.9" />
      {/* Equator & Latitudes */}
      <line x1="8.5" y1="10" x2="23.5" y2="10" stroke="#93C5FD" strokeWidth="0.8" />
      <ellipse cx="16" cy="10" rx="7.5" ry="3.8" stroke="#93C5FD" strokeWidth="0.8" fill="none" />
      {/* Central Meridian */}
      <ellipse cx="16" cy="10" rx="3.5" ry="7.5" stroke="#93C5FD" strokeWidth="0.8" fill="none" />
      <line x1="16" y1="2.5" x2="16" y2="17.5" stroke="#93C5FD" strokeWidth="0.8" />
    </>
  );
}
