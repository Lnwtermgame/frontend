"use client";

import { motion } from '@/lib/framer-exports';
import {
  FileText,
  PanelRight,
  Clock,
  AlertCircle,
  ChevronRight,
  Headphones,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { usePublicSettings } from '@/lib/context/public-settings-context';

// Support category tiles - เก็บเฉพาะ Help Guides และ Ticket System
const supportCategories = [
  {
    icon: <HelpCircle className="h-6 w-6 text-black" />,
    title: "คำถามที่พบบ่อย (FAQ)",
    description: "รวมคำถามยอดฮิต วิธีแก้ปัญหา และขั้นตอนต่าง ๆ",
    link: "/support/faq",
    isExternal: false
  },
  {
    icon: <PanelRight className="h-6 w-6 text-black" />,
    title: "ตั๋วสนับสนุน",
    description: "ส่งคำขอความช่วยเหลือและติดตามสถานะการดำเนินการ",
    link: "/support/tickets",
    isExternal: false
  }
];

export default function SupportPage() {
  const { settings } = usePublicSettings();
  const supportTicketsEnabled = settings?.features.enableSupportTickets ?? true;
  const visibleSupportCategories = supportCategories.filter((category) => {
    if (!supportTicketsEnabled && category.link === "/support/tickets") return false;
    return true;
  });

  return (
    <div className="page-container bg-brutal-gray">
      {/* Hero Section */}
      <motion.div
        className="bg-white border-[3px] border-black rounded-xl p-8 mb-8"
        style={{ boxShadow: '4px 4px 0 0 #000000' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="bg-brutal-blue p-3 border-[3px] border-black mr-3">
                <Headphones className="h-8 w-8 text-black" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-black">ศูนย์ช่วยเหลือ</h1>
            </div>
            <p className="text-gray-600 mb-6">
              มีปัญหาในการใช้งานหรือต้องการสอบถามเพิ่มเติม? เราพร้อมช่วยเหลือคุณ
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Support Options */}
      <section className="mb-12">
        <div className="flex items-center mb-6">
          <span className="w-1.5 h-5 bg-brutal-blue mr-2"></span>
          <h2 className="text-2xl font-bold text-black">ช่องทางการติดต่อ</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleSupportCategories.map((category, index) => (
            <motion.div
              key={index}
              className="bg-white border-[3px] border-black rounded-xl overflow-hidden group"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -5, boxShadow: "6px 6px 0 0 #000000" }}
            >
              <Link href={category.link} className="block p-6">
                <div className="flex items-start">
                  <div className="bg-brutal-yellow p-3 border-[3px] border-black">
                    {category.icon}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-black font-bold text-lg">{category.title}</h3>
                    <p className="text-gray-600 mt-1">
                      {category.description}
                    </p>
                    <div className="flex items-center mt-3 text-black group-hover:text-gray-700 transition-colors">
                      <span className="text-sm font-medium">เข้าชม</span>
                      <ChevronRight size={16} className="ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Support hours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white border-[3px] border-black rounded-xl p-6 md:p-8" style={{ boxShadow: '4px 4px 0 0 #000000' }}>
            <div className="flex items-center mb-4">
              <Clock className="text-black mr-3" />
              <h2 className="text-xl font-bold text-black">เวลาทำการ</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-gray-600 font-medium mb-2">จันทร์ - ศุกร์</h3>
                <p className="text-black">
                  09:00 - 22:00 น.
                </p>
              </div>

              <div>
                <h3 className="text-gray-600 font-medium mb-2">เสาร์ - อาทิตย์ และวันหยุดนักขัตฤกษ์</h3>
                <p className="text-black">10:00 - 20:00 น.</p>
              </div>

              <p className="text-gray-600 text-sm">(เวลาประเทศไทย GMT+7)</p>
            </div>

            <div className="mt-6 border-t-2 border-gray-200 pt-6">
              <div className="flex items-center">
                <AlertCircle size={18} className="text-black mr-2" />
                <span className="text-black font-medium">ต้องการความช่วยเหลือด่วน?</span>
              </div>
              <p className="mt-2 text-gray-600">
                หากพบปัญหาเร่งด่วนเกี่ยวกับคำสั่งซื้อหรือการชำระเงิน แนะนำให้ส่งตั๋วสนับสนุนในหน้าระบบตั๋ว ทีมงานจะรีบดำเนินการโดยเร็วที่สุด
              </p>
            </div>
          </div>
        </div>

        {/* Quick Help Topics - ปัญหาที่พบบ่อย */}
        <div className="lg:col-span-2">
          <div className="bg-white border-[3px] border-black rounded-xl p-6 md:p-8" style={{ boxShadow: '4px 4px 0 0 #000000' }}>
            <div className="flex items-center mb-6">
              <span className="w-1.5 h-5 bg-brutal-pink mr-2"></span>
              <h2 className="text-xl font-bold text-black">ปัญหาที่พบบ่อย</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/support/guides/missing-credits"
                className="bg-brutal-gray hover:bg-gray-200 border-[2px] border-black rounded-lg p-4 flex justify-between items-center transition-colors"
              >
                <span className="text-black">เติมเกมแล้วไม่ได้รับของ</span>
                <ChevronRight size={18} className="text-gray-600" />
              </Link>
              <Link
                href="/support/guides/refund-process"
                className="bg-brutal-gray hover:bg-gray-200 border-[2px] border-black rounded-lg p-4 flex justify-between items-center transition-colors"
              >
                <span className="text-black">ขอคืนเงินได้อย่างไร</span>
                <ChevronRight size={18} className="text-gray-600" />
              </Link>
              <Link
                href="/support/guides/payment-issues"
                className="bg-brutal-gray hover:bg-gray-200 border-[2px] border-black rounded-lg p-4 flex justify-between items-center transition-colors"
              >
                <span className="text-black">โดนหักเงินแต่สถานะคำสั่งซื้อไม่สำเร็จ</span>
                <ChevronRight size={18} className="text-gray-600" />
              </Link>
              <Link
                href="/support/guides/account-settings"
                className="bg-brutal-gray hover:bg-gray-200 border-[2px] border-black rounded-lg p-4 flex justify-between items-center transition-colors"
              >
                <span className="text-black">แก้ไขข้อมูลบัญชี</span>
                <ChevronRight size={18} className="text-gray-600" />
              </Link>
              <Link
                href="/support/guides/redeem-code"
                className="bg-brutal-gray hover:bg-gray-200 border-[2px] border-black rounded-lg p-4 flex justify-between items-center transition-colors"
              >
                <span className="text-black">วิธีใช้งานโค้ดส่วนลด</span>
                <ChevronRight size={18} className="text-gray-600" />
              </Link>
              <Link
                href="/support/guides/account-security"
                className="bg-brutal-gray hover:bg-gray-200 border-[2px] border-black rounded-lg p-4 flex justify-between items-center transition-colors"
              >
                <span className="text-black">บัญชีถูกล็อกทำอย่างไร</span>
                <ChevronRight size={18} className="text-gray-600" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
