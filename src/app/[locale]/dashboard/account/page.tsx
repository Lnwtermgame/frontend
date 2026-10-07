"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth";
import { changePassword } from "@/lib/api/account";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { localizeAuthError } from "@/components/auth/form-feedback";
import { DashPageHead } from "@/components/dashboard/shared";

export default function DashboardAccountPage() {
  const t = useTranslations("dashboard");
  const ta = useTranslations("auth");
  const tf = useTranslations("footer");
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
      setPassMsg({ text: t("passTooShort"), ok: false });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ text: t("newPassMismatch"), ok: false });
      return;
    }
    setIsChangingPass(true);
    setPassMsg(null);
    try {
      await changePassword({ currentPassword, newPassword });
      setPassMsg({ text: t("passwordChanged"), ok: true });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPassMsg({
        text: localizeAuthError(err instanceof Error ? err.message : undefined, t("changePasswordFailed"), ta),
        ok: false,
      });
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="space-y-6">
      <DashPageHead title={t("account")} description={t("accountDesc")} />

      {/* Profile Card — ข้อมูล identity อ่านอย่างเดียว ไม่ให้แก้ไข */}
      <div className="rounded-[14px] border bg-card p-6 shadow-(--shadow-tile)">
        <h2 className="text-base font-bold">{t("profileTitle")}</h2>
        <div className="mt-4 max-w-md space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">{ta("username")}</Label>
            <Input id="username" value={user?.username ?? ""} readOnly disabled />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">{ta("email")}</Label>
            <Input id="email" type="email" value={user?.email ?? ""} readOnly disabled />
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("profileNote")}{" "}
            <Link
              href="/support/contact"
              className="font-semibold text-primary hover:underline"
            >
              {tf("contact")}
            </Link>
          </p>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="rounded-[14px] border bg-card p-6 shadow-(--shadow-tile)">
        <h2 className="text-base font-bold">{t("changePassword")}</h2>
        <form onSubmit={handleChangePassword} className="mt-4 space-y-4 max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">{t("newPasswordLabel")}</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">{t("confirmNewPassword")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
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
            {isChangingPass ? t("changingPassword") : t("changePassword")}
          </Button>
        </form>
      </div>
    </div>
  );
}
