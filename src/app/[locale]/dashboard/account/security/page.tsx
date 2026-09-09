"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Laptop, Smartphone, ShieldCheck, LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserDevices, useSecuritySettings, useSecurityActivities } from "@/lib/query/hooks";
import { removeDevice, logoutAllDevices, updateSecuritySettings } from "@/lib/api/account";
import { DashErrorState, formatDateTime } from "@/components/dashboard/shared";

export default function DashboardSecurityPage() {
  const t = useTranslations("dashboard");
  const devices = useUserDevices();
  const settings = useSecuritySettings();
  const activities = useSecurityActivities();

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [updatingSetting, setUpdatingSetting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleRevokeDevice = async (id: string) => {
    setRevokingId(id);
    try {
      await removeDevice(id);
      devices.refetch();
      setStatusMsg("ออกจากระบบบนอุปกรณ์ดังกล่าวแล้ว");
    } finally {
      setRevokingId(null);
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      await logoutAllDevices();
      devices.refetch();
      setStatusMsg("ออกจากระบบบนทุกอุปกรณ์เรียบร้อยแล้ว");
    } finally {
      setLoggingOutAll(false);
    }
  };

  const handleToggleLoginNotification = async () => {
    if (!settings.data) return;
    setUpdatingSetting(true);
    try {
      await updateSecuritySettings({
        loginNotifications: !settings.data.loginNotifications,
      });
      settings.refetch();
    } finally {
      setUpdatingSetting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">{t("security")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ตรวจสอบอุปกรณ์ที่เข้าสู่ระบบและประวัติกิจกรรมความปลอดภัย
        </p>
      </div>

      {statusMsg ? (
        <div className="flex items-center gap-2 rounded-[10px] border border-status-success/40 bg-status-success/10 p-3 text-xs font-semibold text-status-success">
          <CheckCircle2 className="size-4" />
          <span>{statusMsg}</span>
        </div>
      ) : null}

      {/* Security Settings Card */}
      <div className="rounded-[14px] border bg-card p-6 shadow-(--shadow-tile)">
        <h2 className="text-base font-bold">การตั้งค่าความปลอดภัย</h2>
        {settings.isLoading ? (
          <Skeleton className="mt-4 h-16 rounded-[10px]" />
        ) : settings.isError ? (
          <p className="mt-2 text-xs text-destructive">โหลดการตั้งค่าไม่สำเร็จ</p>
        ) : settings.data ? (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <div>
              <p className="text-sm font-semibold">การแจ้งเตือนเมื่อเข้าสู่ระบบ</p>
              <p className="text-xs text-muted-foreground">
                รับการแจ้งเตือนทางอีเมลเมื่อมีการเข้าสู่ระบบจากอุปกรณ์ใหม่
              </p>
            </div>
            <Button
              variant={settings.data.loginNotifications ? "default" : "outline"}
              size="sm"
              disabled={updatingSetting}
              onClick={handleToggleLoginNotification}
            >
              {settings.data.loginNotifications ? "เปิดใช้งาน" : "ปิดใช้งาน"}
            </Button>
          </div>
        ) : null}
      </div>

      {/* Devices Card */}
      <div className="rounded-[14px] border bg-card p-6 shadow-(--shadow-tile)">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">อุปกรณ์ที่เข้าสู่ระบบอยู่</h2>
            <p className="text-xs text-muted-foreground">อุปกรณ์ที่ยังคงมีเซสชันเข้าสู่ระบบบัญชีนี้</p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            disabled={loggingOutAll || !devices.data?.length}
            onClick={handleLogoutAll}
            className="gap-1.5"
          >
            <LogOut className="size-3.5" />
            {loggingOutAll ? "กำลังดำเนินการ…" : "ออกจากระบบทุกอุปกรณ์"}
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {devices.isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-[10px]" />
            ))
          ) : devices.isError ? (
            <DashErrorState onRetry={() => devices.refetch()} />
          ) : !devices.data?.length ? (
            <p className="py-6 text-center text-xs text-muted-foreground">ไม่มีอุปกรณ์อื่น</p>
          ) : (
            devices.data.map((dev) => (
              <div
                key={dev.id}
                className="flex items-center justify-between rounded-[10px] border p-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="inline-flex size-9 items-center justify-center rounded-[8px] bg-secondary text-foreground">
                    {dev.os.toLowerCase().includes("android") ||
                    dev.os.toLowerCase().includes("ios") ? (
                      <Smartphone className="size-4" />
                    ) : (
                      <Laptop className="size-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {dev.browser} บน {dev.os} ({dev.name})
                    </p>
                    <p className="num text-xs text-muted-foreground">
                      IP: {dev.ip} · ใช้งานล่าสุด: {formatDateTime(dev.lastActive)}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={revokingId === dev.id}
                  onClick={() => handleRevokeDevice(dev.id)}
                  className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  {revokingId === dev.id ? "กำลังออก…" : "ออกจากระบบ"}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Security Activities */}
      {activities.data?.length ? (
        <div className="rounded-[14px] border bg-card p-6 shadow-(--shadow-tile)">
          <h2 className="text-base font-bold">กิจกรรมความปลอดภัยล่าสุด</h2>
          <div className="mt-4 space-y-2">
            {activities.data.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between rounded-[8px] border p-2.5 text-xs"
              >
                <div>
                  <p className="font-semibold">{act.description}</p>
                  <p className="num text-muted-foreground">
                    IP: {act.ip} · {formatDateTime(act.timestamp)}
                  </p>
                </div>
                {act.suspicious ? (
                  <span className="flex items-center gap-1 text-destructive font-semibold">
                    <AlertCircle className="size-3.5" />
                    น่าสงสัย
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
