"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth";
import { changePassword } from "@/lib/api/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DashboardAccountPage() {
  const t = useTranslations("dashboard");
  const user = useAuthStore((s) => s.user);

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPassMsg({ text: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร", ok: false });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ text: "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน", ok: false });
      return;
    }
    setIsChangingPass(true);
    setPassMsg(null);
    try {
      await changePassword({ currentPassword, newPassword });
      setPassMsg({ text: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว", ok: true });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPassMsg({ text: err?.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน", ok: false });
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">{t("account")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">จัดการข้อมูลบัญชีผู้ใช้และรหัสผ่านของคุณ</p>
      </div>

      {/* Profile Card — ข้อมูล identity อ่านอย่างเดียว ไม่ให้แก้ไข */}
      <div className="rounded-[14px] border bg-card p-6 shadow-(--shadow-tile)">
        <h2 className="text-base font-bold">ข้อมูลส่วนตัว</h2>
        <div className="mt-4 max-w-md space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">ชื่อผู้ใช้</Label>
            <Input id="username" value={user?.username ?? ""} readOnly disabled />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">อีเมล</Label>
            <Input id="email" type="email" value={user?.email ?? ""} readOnly disabled />
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            ชื่อผู้ใช้และอีเมลใช้สำหรับเข้าสู่ระบบ จึงไม่สามารถแก้ไขได้ด้วยตัวเอง —
            หากต้องการเปลี่ยน ติดต่อทีมงานผ่านหน้า{" "}
            <a
              href="/support/contact"
              className="font-semibold text-primary hover:underline"
            >
              ติดต่อเรา
            </a>
          </p>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="rounded-[14px] border bg-card p-6 shadow-(--shadow-tile)">
        <h2 className="text-base font-bold">เปลี่ยนรหัสผ่าน</h2>
        <form onSubmit={handleChangePassword} className="mt-4 space-y-4 max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">รหัสผ่านปัจจุบัน</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {passMsg ? (
            <p
              role="alert"
              className={`text-xs font-semibold ${
                passMsg.ok ? "text-status-success" : "text-destructive"
              }`}
            >
              {passMsg.text}
            </p>
          ) : null}

          <Button type="submit" disabled={isChangingPass} size="sm" variant="outline">
            {isChangingPass ? "กำลังเปลี่ยนรหัสผ่าน…" : "เปลี่ยนรหัสผ่าน"}
          </Button>
        </form>
      </div>
    </div>
  );
}
