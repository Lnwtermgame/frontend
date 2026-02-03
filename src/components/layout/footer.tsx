"use client";

import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import { Facebook, Twitter, Instagram, Youtube, CreditCard, ShieldCheck, DollarSign, Phone, Mail } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-mali-sidebar pt-8 border-t border-mali-blue/20 text-sm">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-6">
          {/* Column 1: Logo and Social (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <Link href="/">
              <div className="font-bold text-lg flex items-center">
                <span className="text-blue-500">Mali</span>
                <span className="text-white">GamePass</span>
              </div>
            </Link>
            <p className="text-mali-text-secondary text-xs leading-relaxed max-w-sm">
              บริการเติมเกม ซื้อบัตรเติมเงิน และบริการดิจิทัลอื่นๆ ที่รวดเร็ว ปลอดภัย และราคาดีที่สุดในตลาด
            </p>

            <div className="flex space-x-2 pt-1">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  className="w-7 h-7 rounded-full bg-mali-blue/10 flex items-center justify-center text-mali-text-secondary hover:text-white hover:bg-mali-blue/30 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon size={14} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links (2 cols) */}
          <div className="md:col-span-2">
            <h3 className="text-white font-medium mb-3 text-sm">ลิงก์ด่วน</h3>
            <ul className="space-y-1.5 text-xs">
              {['เกมทั้งหมด', 'เติมเกมโดยตรง', 'บัตรเกม', 'โปรโมชั่น', 'ติดต่อเรา'].map((item, i) => (
                <li key={i}>
                  <Link href="#" className="text-mali-text-secondary hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Us (3 cols) */}
          <div className="md:col-span-3">
            <h3 className="text-white font-medium mb-3 text-sm">ติดต่อเรา</h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center text-mali-text-secondary">
                <Mail size={14} className="mr-2 text-mali-blue-light flex-shrink-0" />
                <span className="truncate">support@maligamepass.com</span>
              </li>
              <li className="flex items-center text-mali-text-secondary">
                <Phone size={14} className="mr-2 text-mali-blue-light flex-shrink-0" />
                <span>แชทสดตลอด 24 ชั่วโมง</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Payment Methods (3 cols) */}
          <div className="md:col-span-3">
            <h3 className="text-white font-medium mb-3 text-sm">ช่องทางชำระเงิน</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {['Visa', 'Mastercard', 'JCB', 'PromptPay', 'TrueMoney', 'ShopeePay'].map((method) => (
                <span key={method} className="px-2 py-1 bg-mali-blue/10 text-mali-text-secondary rounded text-[10px] flex items-center justify-center border border-mali-blue/5">
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Features bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-mali-blue/10 bg-mali-blue/5 rounded-lg mb-4 px-4">
          {[
            { icon: CreditCard, title: "ชำระเงินหลากหลาย", desc: "บัตรเครดิต/เดบิต และอื่นๆ" },
            { icon: ShieldCheck, title: "ปลอดภัยสูงสุด", desc: "ระบบความปลอดภัยระดับสากล" },
            { icon: DollarSign, title: "ราคาคุ้มค่า", desc: "ส่วนลดและโปรโมชั่นพิเศษ" },
            { icon: Phone, title: "ดูแลตลอด 24 ชม.", desc: "ทีมงานพร้อมช่วยเหลือเสมอ" }
          ].map((feature, i) => (
            <div key={i} className="flex items-center text-mali-text-secondary">
              <feature.icon className="mr-2 text-mali-blue-accent flex-shrink-0" size={16} />
              <div className="text-xs">
                <p className="text-white font-medium">{feature.title}</p>
                <p className="opacity-70 text-[10px] hidden sm:block">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="py-4 flex flex-col md:flex-row justify-between items-center text-[10px] text-mali-text-secondary border-t border-mali-blue/10">
          <div>
            &copy; {year} MaliGamePass สงวนลิขสิทธิ์
          </div>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <Link href="/privacy" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</Link>
            <Link href="/terms" className="hover:text-white transition-colors">เงื่อนไขการใช้บริการ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 
