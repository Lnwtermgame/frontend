"use client";

/**
 * WebSocket เรียลไทม์สำหรับ notifications
 * โปรโตคอลตาม notification service: เชื่อมที่ /ws/notifications พร้อม
 * subprotocol ["bearer", <jwt>] (service อ่านจาก header sec-websocket-protocol)
 * ผ่าน gateway ได้ (gateway proxy /ws → notification service)
 */

const WS_URL =
  process.env.NEXT_PUBLIC_NOTIFICATION_WS_URL ||
  "ws://localhost:3000/ws/notifications";

const MAX_RECONNECT_ATTEMPTS = 5;
const PING_INTERVAL_MS = 25_000;

export class NotificationSocket {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;
  private stopped = true;

  onMessage: ((data: unknown) => void) | null = null;
  onStatusChange: ((connected: boolean) => void) | null = null;

  connect(token: string): void {
    if (typeof window === "undefined") return;
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;

    this.stopped = false;
    this.token = token;
    this.reconnectAttempts = 0;
    this.open();
  }

  close(): void {
    this.stopped = true;
    this.token = null;
    this.clearTimers();
    this.ws?.close();
    this.ws = null;
  }

  private open(): void {
    if (!this.token || this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.ws = new WebSocket(WS_URL, ["bearer", this.token]);
    } catch {
      this.isConnecting = false;
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.onStatusChange?.(true);
      this.pingTimer = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) this.ws.send("ping");
      }, PING_INTERVAL_MS);
    };

    this.ws.onmessage = (event) => {
      try {
        this.onMessage?.(JSON.parse(event.data as string));
      } catch {
        // ข้อความที่ไม่ใช่ JSON (เช่น pong) — ไม่ต้องทำอะไร
      }
    };

    this.ws.onclose = () => {
      this.isConnecting = false;
      this.onStatusChange?.(false);
      this.clearPing();
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.isConnecting = false;
    };
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
    this.reconnectAttempts += 1;
    // backoff 1s, 2s, 3s, 4s, 5s
    this.reconnectTimer = setTimeout(
      () => this.open(),
      this.reconnectAttempts * 1_000,
    );
  }

  private clearPing(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
  }

  private clearTimers(): void {
    this.clearPing();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }
}
