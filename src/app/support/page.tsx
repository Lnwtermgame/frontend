"use client";

import { motion } from '@/lib/framer-exports';
import {
  FileText,
  PanelRight,
  Clock,
  AlertCircle,
  ChevronRight,
  Headphones
} from 'lucide-react';
import Link from 'next/link';

// Support category tiles - เก็บเฉพาะ Help Guides และ Ticket System
const supportCategories = [
  {
    icon: <FileText className="h-6 w-6 text-mali-blue-accent" />,
    title: "คู่มือการใช้งาน",
    description: "แนะนำการใช้งานเว็บไซต์และวิธีแก้ไขปัญหาเบื้องต้น",
    link: "/support/guides",
    isExternal: false
  },
  {
    icon: <PanelRight className="h-6 w-6 text-mali-blue-accent" />,
    title: "ตั๋วสนับสนุน",
    description: "ส่งคำขอความช่วยเหลือและติดตามสถานะการดำเนินการ",
    link: "/support/tickets",
    isExternal: false
  }
];

export default function SupportPage() {
  return (
    <div className="page-container">
      {/* Hero Section */}
      <motion.div
        className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-mali-blue/30 rounded-xl p-8 mb-8"
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
              <Headphones className="h-8 w-8 text-mali-blue-accent mr-3" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">ศูนย์ช่วยเหลือ</h1>
            </div>
            <p className="text-gray-300 mb-6">
              มีปัญหาในการใช้งานหรือต้องการสอบถามเพิ่มเติม? เราพร้อมช่วยเหลือคุณ
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Support Options */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">ช่องทางการติดต่อ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {supportCategories.map((category, index) => (
            <motion.div
              key={index}
              className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
            >
              <Link href={category.link} className="block p-6">
                <div className="flex items-start">
                  <div className="bg-mali-blue/10 p-3 rounded-lg">
                    {category.icon}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-white font-bold text-lg">{category.title}</h3>
                    <p className="text-mali-text-secondary mt-1">
                      {category.description}
                    </p>
                    <div className="flex items-center mt-3 text-mali-blue-accent group-hover:text-mali-blue-accent/80 transition-colors">
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
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-6 md:p-8">
            <div className="flex items-center mb-4">
              <Clock className="text-mali-blue-accent mr-3" />
              <h2 className="text-xl font-bold text-white">เวลาทำการ</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-mali-text-secondary font-medium mb-2">จันทร์ - ศุกร์</h3>
                <p className="text-white">
                  09:00 - 22:00 น.
                </p>
              </div>

              <div>
                <h3 className="text-mali-text-secondary font-medium mb-2">เสาร์ - อาทิตย์ และวันหยุดนักขัตฤกษ์</h3>
                <p className="text-white">10:00 - 20:00 น.</p>
              </div>

              <p className="text-mali-text-secondary text-sm">(เวลาประเทศไทย GMT+7)</p>
            </div>

            <div className="mt-6 border-t border-mali-blue/20 pt-6">
              <div className="flex items-center">
                <AlertCircle size={18} className="text-mali-blue-accent mr-2" />
                <span className="text-white font-medium">ต้องการความช่วยเหลือด่วน?</span>
              </div>
              <p className="mt-2 text-mali-text-secondary">
                หากพบปัญหาเร่งด่วนเกี่ยวกับคำสั่งซื้อหรือการชำระเงิน แนะนำให้ส่งตั๋วสนับสนุนในหน้าระบบตั๋ว ทีมงานจะรีบดำเนินการโดยเร็วที่สุด
              </p>
            </div>
          </div>
        </div>

        {/* Quick Help Topics - ปัญหาที่พบบ่อย */}
        <div className="lg:col-span-2">
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-white mb-6">ปัญหาที่พบบ่อย</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/support/guides/missing-credits"
                className="bg-mali-blue/10 hover:bg-mali-blue/20 border border-mali-blue/30 rounded-lg p-4 flex justify-between items-center transition-colors"
              >
                <span className="text-white">เติมเกมแล้วไม่ได้รับของ</span>
                <ChevronRight size={18} className="text-mali-text-secondary" />
              </Link>
              <Link
                href="/support/guides/refund-process"
                className="bg-mali-blue/10 hover:bg-mali-blue/20 border border-mali-blue/30 rounded-lg p-4 flex justify-between items-center transition-colors"
              >
                <span className="text-white">ขอคืนเงินได้อย่างไร</span>
                <ChevronRight size={18} className="text-mali-text-secondary" />
              </Link>
              <Link
                href="/support/guides/payment-issues"
                className="bg-mali-blue/10 hover:bg-mali-blue/20 border border-mali-blue/30 rounded-lg p-4 flex justify-between items-center transition-colors"
              >
                <span className="text-white">โดนหักเงินแต่สถานะคำสั่งซื้อไม่สำเร็จ</span>
                <ChevronRight size={18} className="text-mali-text-secondary" />
              </Link>
              <Link
                href="/support/guides/account-settings"
                className="bg-mali-blue/10 hover:bg-mali-blue/20 border border-mali-blue/30 rounded-lg p-4 flex justify-between items-center transition-colors"
              >
                <span className="text-white">แก้ไขข้อมูลบัญชี</span>
                <ChevronRight size={18} className="text-mali-text-secondary" />
              </Link>
              <Link
                href="/support/guides/redeem-code"
                className="bg-mali-blue/10 hover:bg-mali-blue/20 border border-mali-blue/30 rounded-lg p-4 flex justify-between items-center transition-colors"
              >
                <span className="text-white">วิธีใช้งานโค้ดส่วนลด</span>
                <ChevronRight size={18} className="text-mali-text-secondary" />
              </Link>
              <Link
                href="/support/guides/account-security"
                className="bg-mali-blue/10 hover:bg-mali-blue/20 border border-mali-blue/30 rounded-lg p-4 flex justify-between items-center transition-colors"
              >
                <span className="text-white">บัญชีถูกล็อกทำอย่างไร</span>
                <ChevronRight size={18} className="text-mali-text-secondary" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
