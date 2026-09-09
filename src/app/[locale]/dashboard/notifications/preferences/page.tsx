"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationPreferences } from "@/lib/query/hooks";
import { updateNotificationPreferences, type NotificationPreferences } from "@/lib/api/account";
import { DashErrorState } from "@/components/dashboard/shared";

export default function NotificationPreferencesPage() {
  const t = useTranslations("dashboard");
  const prefs = useNotificationPreferences();

  const [form, setForm] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    orderUpdates: true,
    promotions: true,
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (prefs.data) {
      setForm(prefs.data);
    }
  }, [prefs.data]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
    setSavedMsg(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNotificationPreferences(form);
      setSavedMsg(true);
      prefs.refetch();
    } finally {
      setSaving(false);
    }
  };

  const ITEMS: Array<{ key: keyof NotificationPreferences; title: string; desc: string }> = [
    {
      key: "emailNotifications",
      title: "การแจ้งเตือนทางอีเมล",
      desc: "รับอีเมลแจ้งสถานะคำสั่งซื้อและการแจ้งเตือนสำคัญของบัญชี",
    },
    {
      key: "pushNotifications",
      title: "การแจ้งเตือนบนเบราว์เซอร์ (Push)",
      desc: "รับการแจ้งเตือนทันทีเมื่อคำสั่งซื้อสำเร็จหรือมีการตอบกลับ",
    },
    {
      key: "orderUpdates",
      title: "อัปเดตสถานะคำสั่งซื้อ",
      desc: "แจ้งเตือนทุกขั้นตอนตั้งแต่ชำระเงินจนถึงส่งมอบสินค้า",
    },
    {
      key: "promotions",
      title: "โปรโมชั่นและส่วนลดพิเศษ",
      desc: "รับข่าวสารคูปองส่วนลดและโปรโมชั่นเติมเกมรายสัปดาห์",
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/dashboard/notifications"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-3.5" />
          {t("notifications")}
        </Link>
        <h1 className="text-xl font-bold">{t("notificationPreferences")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">เลือกช่องทางและประเภทข้อความที่คุณต้องการรับ</p>
      </div>

      {savedMsg ? (
        <div className="flex items-center gap-2 rounded-[10px] border border-status-success/40 bg-status-success/10 p-3 text-xs font-semibold text-status-success">
          <CheckCircle2 className="size-4" />
          <span>บันทึกการตั้งค่าเรียบร้อยแล้ว</span>
        </div>
      ) : null}

      <div className="rounded-[14px] border bg-card p-6 shadow-(--shadow-tile)">
        {prefs.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-[10px]" />
            ))}
          </div>
        ) : prefs.isError ? (
          <DashErrorState onRetry={() => prefs.refetch()} />
        ) : (
          <div className="space-y-4">
            {ITEMS.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                <Button
                  type="button"
                  variant={form[item.key] ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToggle(item.key)}
                >
                  {form[item.key] ? "เปิด" : "ปิด"}
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 border-t pt-4">
          <Button disabled={saving || prefs.isLoading} onClick={handleSave}>
            {saving ? "กำลังบันทึก…" : "บันทึกการตั้งค่า"}
          </Button>
        </div>
      </div>
    </div>
  );
}
