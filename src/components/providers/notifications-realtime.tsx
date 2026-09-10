"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { getAccessToken } from "@/lib/api/client";
import { NotificationSocket } from "@/lib/notifications-ws";

/**
 * เปิด WebSocket notifications ตอน login อยู่ — ได้ข้อความใหม่เมื่อไหร่
 * invalidate ทุก query กลุ่ม ["notifications"] ให้ refetch ทันที
 * (รวมหน้า /dashboard/notifications ที่เปิดค้างไว้และ preferences)
 */
export function NotificationsRealtime() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    const token = getAccessToken();
    if (!token) return;

    const socket = new NotificationSocket();
    socket.onMessage = () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    };
    socket.connect(token);
    return () => socket.close();
  }, [qc, user, status]);

  return null;
}
