"use client";

import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import {
  Facebook,
  Twitter,
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
  { name: "Visa", color: "bg-blue-600 text-white" },
  { name: "Mastercard", color: "bg-red-600 text-white" },
  { name: "JCB", color: "bg-green-600 text-white" },
  { name: "PromptPay", color: "bg-blue-500 text-white" },
  { name: "TrueMoney", color: "bg-red-500 text-white" },
  { name: "ShopeePay", color: "bg-orange-500 text-white" },
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
    desc: "ส่วนลดและโปรฯ พิเศษ",
    color: "bg-brutal-pink",
  },
  {
    icon: Headphones,
    title: "ดูแล 24 ชม.",
    desc: "ทีมงานพร้อมช่วย",
    color: "bg-brutal-blue",
  },
];

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Youtube, href: "https://youtube.com", label: "Youtube" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t-[3px] border-black mt-auto">
      <div className="container mx-auto px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="inline-block">
              <div className="font-black text-2xl flex items-center">
                <span className="text-brutal-pink">Mali</span>
                <span className="text-black">Game</span>
                <span
                  className="bg-brutal-yellow px-2 py-0.5 ml-1 border-[3px] border-black text-base"
                  style={{ boxShadow: "3px 3px 0 0 #000000" }}
                >
                  Pass
                </span>
              </div>
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed max-w-sm">
              บริการเติมเกม ซื้อบัตรเติมเงิน และบริการดิจิทัลอื่นๆ ที่รวดเร็ว
              ปลอดภัย และราคาดีที่สุดในตลาด
            </p>

            <div className="space-y-2">
              <p className="text-xs font-bold text-black flex items-center">
                <span className="w-1 h-3 bg-brutal-blue mr-2 rounded-sm"></span>
                ติดต่อเรา
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="mailto:support@maligamepass.com"
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
                  <span className="text-sm font-medium">
                    support@maligamepass.com
                  </span>
                </a>
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
              </div>
            </div>

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
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-black font-bold mb-4 text-sm flex items-center">
              <span className="w-1.5 h-4 bg-brutal-pink mr-2 rounded-sm"></span>
              ลิงก์ด่วน
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((item) => (
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

          <div className="lg:col-span-2">
            <h3 className="text-black font-bold mb-4 text-sm flex items-center">
              <span className="w-1.5 h-4 bg-brutal-blue mr-2 rounded-sm"></span>
              ช่วยเหลือ
            </h3>
            <ul className="space-y-2">
              {supportLinks.map((item) => (
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

          <div className="lg:col-span-4">
            <h3 className="text-black font-bold mb-4 text-sm flex items-center">
              <span className="w-1.5 h-4 bg-brutal-yellow mr-2 rounded-sm"></span>
              ช่องทางชำระเงิน
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => (
                <div
                  key={method.name}
                  className={`${method.color} px-3 py-2 text-xs font-bold border-[2px] border-black flex items-center justify-center`}
                  style={{ boxShadow: "2px 2px 0 0 #000000" }}
                >
                  {method.name}
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
            &copy; {year} MaliGamePass สงวนลิขสิทธิ์
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
