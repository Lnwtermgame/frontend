import { useTranslations } from "next-intl";
import { Headphones, Clock, MessageSquare, HelpCircle, Mail } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const t = useTranslations("support");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">{t("contactTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("contactSubtitle")}</p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col justify-between rounded-[14px] border bg-card p-6 shadow-(--shadow-tile)">
          <div>
            <div className="inline-flex size-10 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
              <MessageSquare className="size-5" />
            </div>
            <h2 className="mt-4 text-base font-bold">{t("ticketsTitle")}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              แจ้งปัญหาการสั่งซื้อ ไม่ได้รับสินค้า หรือปัญหาระบบ แอดมินดูแลโดยตรง
            </p>
          </div>
          <Button asChild className="mt-6 w-full">
            <Link href="/support/tickets">{t("newTicket")}</Link>
          </Button>
        </div>

        <div className="flex flex-col justify-between rounded-[14px] border bg-card p-6 shadow-(--shadow-tile)">
          <div>
            <div className="inline-flex size-10 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
              <HelpCircle className="size-5" />
            </div>
            <h2 className="mt-4 text-base font-bold">{t("faqTitle")}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              ค้นหาคำตอบด่วนเกี่ยวกับช่องทางชำระเงิน, วิธีเติมเกม, และสถานะออเดอร์
            </p>
          </div>
          <Button variant="outline" asChild className="mt-6 w-full">
            <Link href="/support/faq">{t("faqTitle")}</Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 rounded-[14px] border bg-card p-6 text-center">
        <div className="mx-auto inline-flex size-10 items-center justify-center rounded-full bg-secondary text-foreground">
          <Clock className="size-5" />
        </div>
        <p className="mt-2 text-sm font-semibold">{t("contactHours")}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          ทีมงานพร้อมตอบกลับข้อความและช่วยเหลือตลอด 24 ชั่วโมง ไม่มีวันหยุด
        </p>
      </div>
    </div>
  );
}
