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
  Newspaper,
} from "lucide-react";
import { usePublicSettings } from "@/lib/context/public-settings-context";

import { useTranslations } from "next-intl";

// Thai bank logos from https://github.com/casperstack/thai-banks-logo
const paymentMethods = [
  {
    name: "Kasikorn",
    symbol: "KBANK",
    icon: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/KBANK.png",
  },
  {
    name: "Krungthai",
    symbol: "KTB",
    icon: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/KTB.png",
  },
  {
    name: "Bangkok Bank",
    symbol: "BBL",
    icon: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/BBL.png",
  },
  {
    name: "SCB",
    symbol: "SCB",
    icon: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/SCB.png",
  },
  {
    name: "PromptPay",
    symbol: "PromptPay",
    icon: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/PromptPay.png",
  },
  {
    name: "TrueMoney",
    symbol: "TrueMoney",
    icon: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/TrueMoney.png",
  },
];

export function Footer() {
  const { settings } = usePublicSettings();
  const tNav = useTranslations("Navigation");
  const tFooter = useTranslations("Footer");
  const year = new Date().getFullYear();

  const siteName = settings?.general.siteName || "Lnwtermgame";
  const logoUrl = settings?.branding.logoUrl || "";
  const quickLinks = [
    { label: tNav("home"), href: "/", icon: Zap },
    { label: tNav("games"), href: "/games", icon: Gamepad2 },
    { label: tNav("news"), href: "/news", icon: Newspaper },
    { label: tNav("card"), href: "/card", icon: CardIcon },
    {
      label: tNav("mobile_recharge"),
      href: "/mobile-recharge",
      icon: Smartphone,
    },
    { label: tFooter("faq"), href: "/support/faq", icon: HelpCircle },
  ];

  const supportLinks = [
    { label: tFooter("support_center"), href: "/support" },
    { label: tFooter("contact_us"), href: "/support/contact" },
    { label: tFooter("create_ticket"), href: "/support/tickets" },
    { label: tFooter("privacy_policy"), href: "/privacy" },
    { label: tFooter("terms_of_service"), href: "/terms" },
  ];

  const features = [
    {
      icon: CreditCard,
      title: tFooter("features.payment"),
      desc: tFooter("features.payment_desc"),
      color: "bg-blue-500/20",
      tint: "bg-blue-950/30",
    },
    {
      icon: ShieldCheck, // Kept ShieldCheck as Shield is not imported
      title: tFooter("features.security"),
      desc: tFooter("features.security_desc"),
      color: "bg-emerald-500/20",
      tint: "bg-emerald-950/30",
    },
    {
      icon: DollarSign,
      title: tFooter("features.price"),
      desc: tFooter("features.price_desc"),
      color: "bg-red-500/20",
      tint: "bg-red-950/30",
    },
    {
      icon: Headphones,
      title: tFooter("features.support"),
      desc: tFooter("features.support_desc"),
      color: "bg-cyan-500/20",
      tint: "bg-cyan-950/30",
    },
  ];

  const promotionsEnabled = settings?.features.enablePromotions ?? true;
  const supportTicketsEnabled = settings?.features.enableSupportTickets ?? true;
  const supportEmail =
    settings?.general.supportEmail || "support@lnwtermgame.com";
  const supportPhone = settings?.general.supportPhone || "";

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
    <footer className="bg-[#15171d] border-t border-zinc-800/50 mt-auto">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-4 space-y-3 flex flex-col items-center md:items-start text-center md:text-left">
            <Link href="/" className="inline-block">
              {logoUrl ? (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg border border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0"
                  >
                    <img
                      src={logoUrl}
                      alt={siteName}
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                  <span className="font-black text-xl text-white tracking-tight">
                    {siteName}
                  </span>
                </div>
              ) : (
                <div className="font-black text-xl flex items-center">
                  <span className="text-blue-400">
                    {siteName.slice(0, 4) || "Mali"}
                  </span>
                  <span className="text-white">
                    {siteName.slice(4) || "GamePass"}
                  </span>
                </div>
              )}
            </Link>

            <p className="text-zinc-500 text-xs leading-relaxed max-w-sm">
              {settings?.general.siteTagline || tFooter("tagline")}
            </p>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-300 flex items-center">
                <span className="w-1 h-3 bg-blue-500 mr-2 rounded-sm"></span>
                {tFooter("contact_us")}
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href={`mailto:${supportEmail}`}
                  className="flex items-center text-zinc-400 hover:text-white transition-colors group"
                >
                  <div
                    className="w-7 h-7 bg-blue-500/20 rounded-lg flex items-center justify-center mr-2 group-hover:bg-blue-500/40 transition-colors"
                  >
                    <Mail
                      size={12}
                      className="text-blue-400"
                    />
                  </div>
                  <span className="text-xs font-medium">{supportEmail}</span>
                </a>

                {supportPhone && (
                  <a
                    href={`tel:${supportPhone}`}
                    className="flex items-center text-zinc-400 hover:text-white transition-colors group"
                  >
                    <div
                      className="w-7 h-7 bg-cyan-500/20 rounded-lg flex items-center justify-center mr-2 group-hover:bg-cyan-500/40 transition-colors"
                    >
                      <Phone size={12} className="text-cyan-400" />
                    </div>
                    <span className="text-xs font-medium">{supportPhone}</span>
                  </a>
                )}

                {supportTicketsEnabled && (
                  <Link
                    href="/support/tickets"
                    className="flex items-center text-zinc-400 hover:text-white transition-colors group"
                  >
                    <div
                      className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-2 group-hover:bg-emerald-500/40 transition-colors"
                    >
                      <MessageCircle size={12} className="text-emerald-400" />
                    </div>
                    <span className="text-xs font-medium">
                      {tFooter("live_chat")}
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
                    className="w-8 h-8 bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-400 hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/50 transition-colors"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <social.icon size={16} />
                  </motion.a>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 hidden md:block">
            <h3 className="text-zinc-300 font-bold mb-3 text-xs flex items-center">
              <span className="w-1.5 h-3 bg-blue-500 mr-2 rounded-sm"></span>
              {tFooter("quick_links")}
            </h3>
            <ul className="space-y-1.5">
              {visibleQuickLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center text-zinc-500 hover:text-white transition-colors group"
                  >
                    <item.icon
                      size={12}
                      className="mr-2 text-zinc-600 group-hover:text-blue-400 transition-colors"
                    />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 hidden md:block">
            <h3 className="text-zinc-300 font-bold mb-3 text-xs flex items-center">
              <span className="w-1.5 h-3 bg-cyan-500 mr-2 rounded-sm"></span>
              {tFooter("support")}
            </h3>
            <ul className="space-y-1.5">
              {visibleSupportLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-zinc-500 hover:text-white text-xs font-medium transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-zinc-300 font-bold mb-3 text-xs flex items-center">
              <span className="w-1.5 h-3 bg-amber-500 mr-2 rounded-sm"></span>
              {tFooter("payment_channels")}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {paymentMethods.map((method) => (
                <div
                  key={method.name}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg p-1.5 h-10 flex items-center justify-center relative hover:-translate-y-0.5 transition-transform"
                >
                  <img
                    src={method.icon}
                    alt={method.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-zinc-600 mt-2">
              {tFooter("supported_payments")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 py-4 mt-6 border-t border-b border-zinc-800/50">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              className={`flex items-center gap-2.5 p-2.5 ${feature.tint} rounded-xl border border-zinc-800/50`}
              whileHover={{ y: -2 }}
            >
              <div
                className={`w-8 h-8 ${feature.color} rounded-lg flex items-center justify-center flex-shrink-0`}
              >
                <feature.icon className="text-white" size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-xs truncate">
                  {feature.title}
                </p>
                <p className="text-zinc-500 text-[10px] hidden sm:block truncate">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="text-[10px] text-zinc-600 font-medium text-center md:text-left">
            &copy; {year} {siteName} {tFooter("copyright")}
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-[10px] text-zinc-500">
            <Link
              href="/privacy"
              className="hover:text-blue-400 font-medium transition-colors"
            >
              {tFooter("privacy_policy")}
            </Link>
            <Link
              href="/terms"
              className="hover:text-blue-400 font-medium transition-colors"
            >
              {tFooter("terms_of_service")}
            </Link>
            <Link
              href="/refund"
              className="hover:text-blue-400 font-medium transition-colors"
            >
              {tFooter("refund_policy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
