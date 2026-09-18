import { Monitor, Smartphone, Globe, Gamepad2 } from "lucide-react";
import type { GameType } from "@/lib/api/products";

/* ไอคอนแพลตฟอร์มสำหรับ sidebar — Steam/PS/Nintendo ไม่มีใน lucide จึงวาด inline SVG ง่าย */

const SteamIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M11.98 2C6.5 2 2.01 6.2 1.6 11.55l5.33 2.2a3.01 3.01 0 0 1 1.7-.53h.15l2.37-3.42v-.05a4 4 0 1 1 4 4h-.09l-3.38 2.41v.12a3.02 3.02 0 1 1-6.02.18L2.06 14.7A10.2 10.2 0 0 0 2 12C2 6.48 6.48 2 12 2h-.02zM7.36 17.79l-1.23.51a5.6 5.6 0 0 0 9.88-.4l-1.37-.57a4.1 4.1 0 0 1-7.28.46zm9.9-3.62a5.6 5.6 0 0 0-3.34-4.36l-.02 1.47a4.2 4.2 0 0 1 1.93 2.94l1.43-.05zM12 20.8A8.8 8.8 0 0 0 20.8 12c0-1.5-.37-2.92-1.03-4.16l-1.06 1.02A7.5 7.5 0 0 1 12 20.8z" />
  </svg>
);

const PlayStationIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M9.4 3v14.5l3.3 1.05V6.4c0-.57.25-.95.65-.82.53.15.7.67.7 1.32v5.2c2.1 1.02 3.75-.02 3.75-3.94 0-4.03-1.42-5.82-5.6-7.24C10.2 1.06 9.4.82 9.4 3zM7.1 15.9l-3.4 1.28c-1.24.5-1.26 1.48-.28 1.88.98.4 2.72.4 4.36-.16L7.1 18.1V15.9zm12.2-.94c-.14-.06-.3-.1-.5-.12-.17-.02-.35-.02-.54-.02-.68.02-1.4.14-1.4.14l-1.4.5v1.85l2.7-.97c.82-.3 1.15-.68 1.14-1.06-.02-.3-.4-.2-1-.32zM5.9 20.6c-1.5.3-3.5.36-4.9-.12-1.4-.48-1.13-1.6.6-2.3l1.3-.53.28.1-.1.42 3.16 1.2c-.12.1-.24.17-.34.23z" transform="translate(1 0)" />
  </svg>
);

const NintendoIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M5.9 3h6.1v18H5.9c-1.6 0-2.9-1.3-2.9-2.9V5.9C3 4.3 4.3 3 5.9 3zm1.1 3.1a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zM18.1 3H13v18h5.1c1.6 0 2.9-1.3 2.9-2.9V5.9C21 4.3 19.7 3 18.1 3zm-1.6 11.5a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4zm0-7.6a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4z" />
  </svg>
);

const GAME_TYPE_ICONS: Record<GameType, React.ComponentType<{ className?: string }>> = {
  PC: Monitor,
  MOBILE: Smartphone,
  XBOX: Gamepad2,
  PLAYSTATION: PlayStationIcon,
  NINTENDO: NintendoIcon,
  STEAM: SteamIcon,
  WEBGAME: Globe,
};

export function PlatformIcon({ type, className }: { type: GameType; className?: string }) {
  const Icon = GAME_TYPE_ICONS[type];
  return <Icon className={className} />;
}
