"use client";

import Link from "next/link";
import {
  ChevronRight,
  Star,
  Shield,
  History
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { motion } from "@/lib/framer-exports";

export default function AccountPage() {
  const { user } = useAuth();

  // Mock data for the account page
  const orderStats = {
    waitSend: 0,
    sending: 0,
    completed: 1,
    refunded: 0
  };

  const recentlyPurchased = [
    {
      id: 'marvel1',
      name: 'Marvel Rivals Top Up',
      amount: '100 Lattices',
      image: 'https://placehold.co/60x60/5C3FC9/white?text=Marvel'
    }
  ];

  const accountLinks = [
    { icon: <Shield size={18} />, label: 'ความปลอดภัย', href: '/dashboard/account/security' }
  ];

  return (
    <div className="bg-brutal-gray min-h-full">
      {/* Page Header */}
      <div className="relative mb-6">
        <motion.h2
          className="text-xl font-bold text-black mb-1 relative flex items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="w-1.5 h-5 bg-brutal-pink mr-2"></span>
          บัญชีของฉัน
        </motion.h2>
        <p className="text-gray-600 text-sm relative thai-font">จัดการการตั้งค่าและความชอบของบัญชีของคุณ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid gap-6">
            {/* User profile - Enhanced with gradient border */}
            <motion.div
              className="bg-white border-[3px] border-black overflow-hidden relative"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -2 }}
            >
              {/* Decorative gradient top border */}


              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full bg-brutal-yellow border-[3px] border-black flex items-center justify-center text-black text-xl font-bold overflow-hidden">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="absolute bottom-0 right-0 bg-brutal-pink text-xs text-black font-bold px-2 py-0.5 border-[2px] border-black thai-font">
                        VIP
                      </span>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-xl font-bold text-black">{user?.username || 'User'}</h2>
                      <div className="flex items-center mt-1">
                        <span className="text-gray-600 text-sm thai-font">อีเมล:</span>
                        <span className="text-gray-900 text-sm ml-2">{user?.email || 'user@example.com'}</span>
                        <span className="bg-brutal-green text-black text-xs font-bold px-2 py-0.5 border-[2px] border-black ml-2 thai-font">
                          ยืนยันแล้ว
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>

            {/* Order statistics - Enhanced with icons and better styling */}
            <motion.div
              className="bg-white border-[3px] border-black"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              whileHover={{ y: -2 }}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-black flex items-center thai-font">
                    <span className="w-1.5 h-5 bg-brutal-blue mr-2"></span>
                    คำสั่งซื้อของฉัน
                  </h2>
                  <Link
                    href="/dashboard/orders"
                    className="text-black text-sm flex items-center hover:underline font-medium thai-font"
                  >
                    คำสั่งซื้อทั้งหมด <ChevronRight size={16} />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-gray-50 border-[2px] border-black hover:bg-brutal-yellow/20 transition-colors">
                    <div className="bg-brutal-blue w-10 h-10 border-[2px] border-black flex items-center justify-center mx-auto mb-2">
                      <History size={18} className="text-black" />
                    </div>
                    <div className="text-2xl font-bold text-black">{orderStats.waitSend}</div>
                    <div className="text-gray-600 text-sm thai-font">รอส่ง</div>
                  </div>
                  <div className="p-4 bg-gray-50 border-[2px] border-black hover:bg-brutal-yellow/20 transition-colors">
                    <div className="bg-brutal-blue w-10 h-10 border-[2px] border-black flex items-center justify-center mx-auto mb-2">
                      <History size={18} className="text-black" />
                    </div>
                    <div className="text-2xl font-bold text-black">{orderStats.sending}</div>
                    <div className="text-gray-600 text-sm thai-font">กำลังส่ง</div>
                  </div>
                  <div className="p-4 bg-gray-50 border-[2px] border-black hover:bg-brutal-yellow/20 transition-colors">
                    <div className="bg-brutal-green w-10 h-10 border-[2px] border-black flex items-center justify-center mx-auto mb-2">
                      <History size={18} className="text-black" />
                    </div>
                    <div className="text-2xl font-bold text-black">{orderStats.completed}</div>
                    <div className="text-gray-600 text-sm thai-font">เสร็จสมบูรณ์</div>
                  </div>
                  <div className="p-4 bg-gray-50 border-[2px] border-black hover:bg-brutal-yellow/20 transition-colors">
                    <div className="bg-gray-200 w-10 h-10 border-[2px] border-black flex items-center justify-center mx-auto mb-2">
                      <History size={18} className="text-gray-600" />
                    </div>
                    <div className="text-2xl font-bold text-black">{orderStats.refunded}</div>
                    <div className="text-gray-600 text-sm thai-font">คืนเงิน</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recently Purchased - Enhanced with animation and styling */}
            <motion.div
              className="bg-white border-[3px] border-black"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              whileHover={{ y: -2 }}
            >
              <div className="p-6">
                <h2 className="text-lg font-bold text-black mb-4 flex items-center thai-font">
                  <span className="w-1.5 h-5 bg-brutal-green mr-2"></span>
                  ซื้อล่าสุด
                </h2>
                {recentlyPurchased.length > 0 ? (
                  <div className="space-y-3">
                    {recentlyPurchased.map(item => (
                      <motion.div
                        key={item.id}
                        className="flex items-center p-4 bg-gray-50 border-[2px] border-black hover:bg-brutal-yellow/10 transition-colors"
                        whileHover={{ x: 2 }}
                      >
                        <div className="w-14 h-14 border-[2px] border-black overflow-hidden mr-4 bg-white">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-bold text-black">{item.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{item.amount}</p>
                        </div>
                        <div className="flex gap-2 ml-auto">
                          <motion.button
                            className="bg-brutal-yellow border-[2px] border-black w-8 h-8 flex items-center justify-center text-black hover:bg-brutal-pink transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Star size={16} />
                          </motion.button>
                          <Link
                            href={`/dashboard/orders/${item.id}`}
                            className="bg-black border-[2px] border-black w-8 h-8 flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
                          >
                            <ChevronRight size={16} />
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-100 text-gray-600 text-center py-8 border-[2px] border-black">
                    <div className="w-16 h-16 mx-auto mb-3 bg-brutal-blue border-[2px] border-black flex items-center justify-center">
                      <History size={24} className="text-black" />
                    </div>
                    <p className="thai-font">ไม่พบรายการซื้อล่าสุด</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="grid gap-6">


            {/* Account Links - New section */}
            <motion.div
              className="bg-white border-[3px] border-black"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              whileHover={{ y: -2 }}
            >
              <div className="p-6">
                <h2 className="text-lg font-bold text-black mb-4 flex items-center thai-font">
                  <span className="w-1.5 h-5 bg-brutal-yellow mr-2"></span>
                  ตั้งค่าบัญชี
                </h2>
                <div className="divide-y divide-gray-200">
                  {accountLinks.map((link, index) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center py-3 text-gray-600 hover:text-black transition-colors thai-font"
                    >
                      <div className="w-8 h-8 bg-brutal-blue border-[2px] border-black flex items-center justify-center text-black mr-3">
                        {link.icon}
                      </div>
                      <span className="font-medium">{link.label}</span>
                      <ChevronRight size={16} className="ml-auto" />
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* VIP Status - New section */}
            <motion.div
              className="bg-white border-[3px] border-black overflow-hidden"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              whileHover={{ y: -2 }}
            >

              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-black flex items-center thai-font">
                    <span className="w-1.5 h-5 bg-brutal-pink mr-2"></span>
                    สถานะ VIP
                  </h2>
                  <Link
                    href="/star"
                    className="text-black text-sm flex items-center hover:underline font-medium thai-font"
                  >
                    รายละเอียด <ChevronRight size={16} />
                  </Link>
                </div>
                <div className="bg-brutal-yellow/20 p-4 border-[2px] border-black mb-2">
                  <div className="flex items-center">
                    <div className="flex mr-3">
                      <Star size={18} className="text-black" fill="currentColor" />
                      <Star size={18} className="text-black -ml-1" fill="currentColor" />
                      <Star size={18} className="text-black -ml-1" fill="currentColor" />
                    </div>
                    <span className="font-bold text-black thai-font">สมาชิกโกลด์</span>
                  </div>
                  <div className="mt-3">
                    <div className="h-3 w-full bg-white border-[2px] border-black overflow-hidden">
                      <div className="h-full bg-brutal-pink w-[65%] border-r-[2px] border-black"></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                      <span className="text-gray-600">5,200 คะแนน</span>
                      <span className="text-gray-600 thai-font">อีก 8,000 คะแนนเพื่อแพลทินัม</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 thai-font">
                  คุณมี <span className="text-brutal-pink font-bold">3</span> รางวัลพิเศษที่สามารถใช้ได้
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
