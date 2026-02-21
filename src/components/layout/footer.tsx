"use client";

import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import {
  Facebook,
  Instagram,
  Youtube,
  CreditCard,
  ShieldCheck,
  DollarSign,
  Headphones,
  Mail,
  Phone,
  MessageCircle,
  Gamepad2,
  CreditCard as CardIcon,
  Smartphone,
  HelpCircle,
  Zap,
} from "lucide-react";
import { usePublicSettings } from "@/lib/context/public-settings-context";

const quickLinks = [
  { label: "เกมทั้งหมด", href: "/games", icon: Gamepad2 },
  { label: "บัตรเกม", href: "/card", icon: CardIcon },
  { label: "เติมเงินมือถือ", href: "/mobile-recharge", icon: Smartphone },
  { label: "โปรโมชั่น", href: "/?promo=true", icon: Zap },
  { label: "คำถามที่พบบ่อย", href: "/support/faq", icon: HelpCircle },
];

const supportLinks = [
  { label: "ศูนย์ช่วยเหลือ", href: "/support" },
  { label: "ติดต่อเรา", href: "/support/contact" },
  { label: "สร้างตั๋ว", href: "/support/tickets" },
  { label: "นโยบายความเป็นส่วนตัว", href: "/privacy" },
  { label: "เงื่อนไขการใช้บริการ", href: "/terms" },
];

const paymentMethods = [
  { name: "Visa / Mastercard", icon: "/payment-icons/visa-mastercard.svg" },
  { name: "KBANK", icon: "/payment-icons/kbank.svg" },
  { name: "PromptPay", icon: "/payment-icons/promptpay.svg" },
  { name: "TrueMoney", icon: "/payment-icons/truemoney.svg" },
  { name: "ShopeePay", icon: "/payment-icons/shopeepay.svg" },
  { name: "Krungthai Bank", icon: "/payment-icons/krungthai.svg" },
];

const features = [
  {
    icon: CreditCard,
    title: "ชำระเงินหลากหลาย",
    desc: "รองรับทุกช่องทาง",
    color: "bg-brutal-yellow",
  },
  {
    icon: ShieldCheck,
    title: "ปลอดภัย 100%",
    desc: "ระบบความปลอดภัยสูง",
    color: "bg-brutal-green",
  },
  {
    icon: DollarSign,
    title: "ราคาคุ้มค่า",
    desc: "ส่วนลดและโปรพิเศษ",
    color: "bg-brutal-pink",
  },
  {
    icon: Headphones,
    title: "ดูแล 24 ชม.",
    desc: "ทีมงานพร้อมช่วย",
    color: "bg-brutal-blue",
  },
];

export function Footer() {
  const { settings } = usePublicSettings();
  const year = new Date().getFullYear();

  const siteName = settings?.general.siteName || "Lnwtermgame";
  const logoUrl = settings?.branding.logoUrl || "";
  const siteTagline =
    settings?.general.siteTagline ||
    "บริการเติมเกม ซื้อบัตรเติมเงิน และบริการดิจิทัลอื่นๆ ที่รวดเร็ว ปลอดภัย และราคาดีที่สุดในตลาด";
  const supportEmail =
    settings?.general.supportEmail || "support@lnwtermgame.com";
  const supportPhone = settings?.general.supportPhone || "";
  const promotionsEnabled = settings?.features.enablePromotions ?? true;
  const supportTicketsEnabled = settings?.features.enableSupportTickets ?? true;
  const visibleQuickLinks = quickLinks.filter((item) => {
    if (!promotionsEnabled && item.href.includes("promo")) return false;
    return true;
  });
  const visibleSupportLinks = supportLinks.filter((item) => {
    if (!supportTicketsEnabled && item.href === "/support/tickets")
      return false;
    return true;
  });

  const socialLinks = [
    {
      icon: Facebook,
      href: settings?.social.facebookUrl || "",
      label: "Facebook",
    },
    {
      icon: MessageCircle,
      href: settings?.social.lineUrl || "",
      label: "LINE",
    },
    {
      icon: Instagram,
      href: settings?.social.discordUrl || "",
      label: "Discord",
    },
    { icon: Youtube, href: "https://youtube.com", label: "Youtube" },
  ].filter((item) => Boolean(item.href));

  return (
    <footer className="bg-white border-t-[3px] border-black mt-auto">
      <div className="container mx-auto px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-4 space-y-4 flex flex-col items-center md:items-start text-center md:text-left">
            <Link href="/" className="inline-block">
              {logoUrl ? (
                <div className="flex items-center gap-2">
                  <img
                    src={logoUrl}
                    alt={siteName}
                    className="h-10 w-10 rounded border-[2px] border-black object-cover"
                  />
                  <span className="font-black text-2xl text-black">
                    {siteName}
                  </span>
                </div>
              ) : (
                <div className="font-black text-2xl flex items-center">
                  <span className="text-brutal-pink">
                    {siteName.slice(0, 4) || "Mali"}
                  </span>
                  <span className="text-black">
                    {siteName.slice(4) || "GamePass"}
                  </span>
                </div>
              )}
            </Link>

            <p className="text-gray-600 text-sm leading-relaxed max-w-sm">
              {siteTagline}
            </p>

            <div className="space-y-2">
              <p className="text-xs font-bold text-black flex items-center">
                <span className="w-1 h-3 bg-brutal-blue mr-2 rounded-sm"></span>
                ติดต่อเรา
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href={`mailto:${supportEmail}`}
                  className="flex items-center text-gray-600 hover:text-black transition-colors group"
                >
                  <div
                    className="w-8 h-8 bg-brutal-yellow border-[2px] border-black flex items-center justify-center mr-2 group-hover:bg-brutal-pink group-hover:text-white transition-colors"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    <Mail
                      size={14}
                      className="text-black group-hover:text-white"
                    />
                  </div>
                  <span className="text-sm font-medium">{supportEmail}</span>
                </a>

                {supportPhone && (
                  <a
                    href={`tel:${supportPhone}`}
                    className="flex items-center text-gray-600 hover:text-black transition-colors group"
                  >
                    <div
                      className="w-8 h-8 bg-brutal-blue border-[2px] border-black flex items-center justify-center mr-2 group-hover:bg-brutal-pink transition-colors"
                      style={{ boxShadow: "2px 2px 0 0 #000000" }}
                    >
                      <Phone size={14} className="text-black" />
                    </div>
                    <span className="text-sm font-medium">{supportPhone}</span>
                  </a>
                )}

                {supportTicketsEnabled && (
                  <Link
                    href="/support/tickets"
                    className="flex items-center text-gray-600 hover:text-black transition-colors group"
                  >
                    <div
                      className="w-8 h-8 bg-brutal-green border-[2px] border-black flex items-center justify-center mr-2 group-hover:bg-brutal-pink transition-colors"
                      style={{ boxShadow: "2px 2px 0 0 #000000" }}
                    >
                      <MessageCircle size={14} className="text-black" />
                    </div>
                    <span className="text-sm font-medium">
                      แชทสดตลอด 24 ชั่วโมง
                    </span>
                  </Link>
                )}
              </div>
            </div>

            {socialLinks.length > 0 && (
              <div className="flex gap-2 pt-2">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-10 h-10 bg-brutal-gray border-[2px] border-black flex items-center justify-center text-black hover:bg-brutal-yellow transition-colors"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                    whileHover={{ y: -3, boxShadow: "4px 4px 0 0 #000000" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <social.icon size={18} />
                  </motion.a>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 hidden md:block">
            <h3 className="text-black font-bold mb-4 text-sm flex items-center">
              <span className="w-1.5 h-4 bg-brutal-pink mr-2 rounded-sm"></span>
              ลิงก์ด่วน
            </h3>
            <ul className="space-y-2">
              {visibleQuickLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center text-gray-600 hover:text-black transition-colors group"
                  >
                    <item.icon
                      size={14}
                      className="mr-2 text-gray-400 group-hover:text-brutal-pink transition-colors"
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 hidden md:block">
            <h3 className="text-black font-bold mb-4 text-sm flex items-center">
              <span className="w-1.5 h-4 bg-brutal-blue mr-2 rounded-sm"></span>
              ช่วยเหลือ
            </h3>
            <ul className="space-y-2">
              {visibleSupportLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-gray-600 hover:text-black text-sm font-medium transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-black font-bold mb-4 text-sm flex items-center">
              <span className="w-1.5 h-4 bg-brutal-yellow mr-2 rounded-sm"></span>
              ช่องทางชำระเงิน
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.name}
                  className="bg-white border-[2px] border-black rounded-sm p-2 h-12 flex items-center justify-center relative hover:-translate-y-0.5 transition-transform"
                  style={{ boxShadow: "2px 2px 0 0 #000000" }}
                >
                  <img
                    src={method.icon}
                    alt={method.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              รองรับการชำระเงินผ่านบัตรเครดิต/เดบิต และ e-Wallet ทุกประเภท
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 py-6 mt-6 border-t-[2px] border-b-[2px] border-black">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-3 p-3 bg-brutal-gray border-[2px] border-black"
              style={{ boxShadow: "3px 3px 0 0 #000000" }}
              whileHover={{ y: -2, boxShadow: "4px 4px 0 0 #000000" }}
            >
              <div
                className={`w-10 h-10 ${feature.color} border-[2px] border-black flex items-center justify-center flex-shrink-0`}
                style={{ boxShadow: "2px 2px 0 0 #000000" }}
              >
                <feature.icon className="text-black" size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-black font-bold text-xs md:text-sm truncate">
                  {feature.title}
                </p>
                <p className="text-gray-500 text-[10px] md:text-xs hidden sm:block truncate">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-gray-500 font-medium text-center md:text-left">
            &copy; {year} {siteName} สงวนลิขสิทธิ์
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            <Link
              href="/privacy"
              className="hover:text-black font-medium transition-colors"
            >
              นโยบายความเป็นส่วนตัว
            </Link>
            <Link
              href="/terms"
              className="hover:text-black font-medium transition-colors"
            >
              เงื่อนไขการใช้บริการ
            </Link>
            <Link
              href="/refund"
              className="hover:text-black font-medium transition-colors"
            >
              นโยบายคืนเงิน
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
