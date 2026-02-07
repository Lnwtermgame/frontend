"use client";

import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import { Facebook, Twitter, Instagram, Youtube, CreditCard, ShieldCheck, DollarSign, Phone, Mail } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t-[3px] border-black pt-8 pb-4 text-sm mt-auto"
      style={{ boxShadow: '0 -4px 0 0 rgba(0,0,0,0.05)' }}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-6">
          {/* Column 1: Logo and Social (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <Link href="/">
              <div className="font-black text-xl flex items-center">
                <span className="text-brutal-pink">Mali</span>
                <span className="text-black">Game</span>
                <span className="bg-brutal-yellow px-1.5 py-0.5 ml-1 border-[2px] border-black rounded text-sm"
                  style={{ boxShadow: '2px 2px 0 0 #000000' }}
                >Pass</span>
              </div>
            </Link>
            <p className="text-gray-600 text-xs leading-relaxed max-w-sm">
              บริการเติมเกม ซื้อบัตรเติมเงิน และบริการดิจิทัลอื่นๆ ที่รวดเร็ว ปลอดภัย และราคาดีที่สุดในตลาด
            </p>

            <div className="flex space-x-2 pt-1">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-gray-100 border-[2px] border-gray-300 flex items-center justify-center text-gray-600 hover:text-black hover:border-black hover:bg-white transition-all"
                  style={{ boxShadow: '2px 2px 0 0 transparent' }}
                  whileHover={{ scale: 1.1, boxShadow: '3px 3px 0 0 #000000' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon size={16} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links (2 cols) */}
          <div className="md:col-span-2">
            <h3 className="text-black font-bold mb-3 text-sm flex items-center">
              <span className="w-1.5 h-4 bg-brutal-pink mr-2 rounded-sm"></span>
              ลิงก์ด่วน
            </h3>
            <ul className="space-y-1.5 text-xs">
              {['เกมทั้งหมด', 'เติมเกมโดยตรง', 'บัตรเกม', 'โปรโมชั่น', 'ติดต่อเรา'].map((item, i) => (
                <li key={i}>
                  <Link href="#" className="text-gray-600 hover:text-black font-medium transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Us (3 cols) */}
          <div className="md:col-span-3">
            <h3 className="text-black font-bold mb-3 text-sm flex items-center">
              <span className="w-1.5 h-4 bg-brutal-blue mr-2 rounded-sm"></span>
              ติดต่อเรา
            </h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center text-gray-600">
                <div className="w-7 h-7 rounded-md bg-brutal-yellow border-[2px] border-black flex items-center justify-center mr-2"
                  style={{ boxShadow: '2px 2px 0 0 #000000' }}
                >
                  <Mail size={12} className="text-black" />
                </div>
                <span className="truncate font-medium">support@maligamepass.com</span>
              </li>
              <li className="flex items-center text-gray-600">
                <div className="w-7 h-7 rounded-md bg-brutal-green border-[2px] border-black flex items-center justify-center mr-2"
                  style={{ boxShadow: '2px 2px 0 0 #000000' }}
                >
                  <Phone size={12} className="text-black" />
                </div>
                <span className="font-medium">แชทสดตลอด 24 ชั่วโมง</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Payment Methods (3 cols) */}
          <div className="md:col-span-3">
            <h3 className="text-black font-bold mb-3 text-sm flex items-center">
              <span className="w-1.5 h-4 bg-brutal-yellow mr-2 rounded-sm"></span>
              ช่องทางชำระเงิน
            </h3>
            <div className="grid grid-cols-3 gap-1.5">
              {['Visa', 'Mastercard', 'JCB', 'PromptPay', 'TrueMoney', 'ShopeePay'].map((method) => (
                <span key={method} className="px-2 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-[10px] flex items-center justify-center border-[2px] border-gray-300 font-bold">
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Features bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t-[2px] border-b-[2px] border-gray-200 bg-gray-50 rounded-lg mb-4 px-4">
          {[
            { icon: CreditCard, title: "ชำระเงินหลากหลาย", desc: "บัตรเครดิต/เดบิต และอื่นๆ", color: "bg-brutal-yellow" },
            { icon: ShieldCheck, title: "ปลอดภัยสูงสุด", desc: "ระบบความปลอดภัยระดับสากล", color: "bg-brutal-green" },
            { icon: DollarSign, title: "ราคาคุ้มค่า", desc: "ส่วนลดและโปรโมชั่นพิเศษ", color: "bg-brutal-pink" },
            { icon: Phone, title: "ดูแลตลอด 24 ชม.", desc: "ทีมงานพร้อมช่วยเหลือเสมอ", color: "bg-brutal-blue" },
          ].map((feature, i) => (
            <div key={i} className="flex items-center text-gray-600">
              <div className={`w-9 h-9 rounded-lg ${feature.color} border-[2px] border-black flex items-center justify-center mr-2 flex-shrink-0`}
                style={{ boxShadow: '2px 2px 0 0 #000000' }}
              >
                <feature.icon className="text-black" size={16} />
              </div>
              <div className="text-xs">
                <p className="text-black font-bold">{feature.title}</p>
                <p className="text-gray-500 text-[10px] hidden sm:block">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="py-4 flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-500 border-t border-gray-200">
          <div className="font-medium">
            &copy; {year} MaliGamePass สงวนลิขสิทธิ์
          </div>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <Link href="/privacy" className="hover:text-black font-medium transition-colors">นโยบายความเป็นส่วนตัว</Link>
            <Link href="/terms" className="hover:text-black font-medium transition-colors">เงื่อนไขการใช้บริการ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
