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
    <div>
      {/* Page Header */}
      <div className="relative mb-6">
        <motion.h2
          className="text-xl font-bold text-white mb-1 relative"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          บัญชีของฉัน
        </motion.h2>
        <p className="text-mali-text-secondary text-sm relative thai-font">จัดการการตั้งค่าและความชอบของบัญชีของคุณ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid gap-6">
            {/* User profile - Enhanced with gradient border */}
            <motion.div
              className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Decorative gradient top border */}


              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full bg-mali-blue/20 border border-mali-blue/30 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="absolute bottom-0 right-0 bg-mali-accent text-xs text-white font-medium px-1.5 py-0.5 rounded-full border-2 border-mali-card thai-font">
                        VIP
                      </span>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-xl font-semibold text-white">{user?.username || 'User'}</h2>
                      <div className="flex items-center mt-1">
                        <span className="text-mali-text-secondary text-sm thai-font">อีเมล:</span>
                        <span className="text-mali-text-secondary text-sm ml-2">{user?.email || 'user@example.com'}</span>
                        <span className="bg-mali-blue-accent/20 text-mali-blue-accent text-xs font-medium px-2 py-0.5 rounded-full ml-2 thai-font">
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
              className="bg-mali-card rounded-xl border border-mali-blue/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white thai-font">คำสั่งซื้อของฉัน</h2>
                  <Link
                    href="/dashboard/orders"
                    className="text-mali-blue-accent text-sm flex items-center hover:text-mali-blue-light transition-colors thai-font"
                  >
                    คำสั่งซื้อทั้งหมด <ChevronRight size={16} />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-mali-blue/5 border border-mali-blue/20 hover:border-mali-blue/40 transition-colors">
                    <div className="bg-mali-blue/10 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <History size={18} className="text-mali-blue-light" />
                    </div>
                    <div className="text-2xl font-bold text-white">{orderStats.waitSend}</div>
                    <div className="text-mali-text-secondary text-sm thai-font">รอส่ง</div>
                  </div>
                  <div className="p-4 rounded-lg bg-mali-blue/5 border border-mali-blue/20 hover:border-mali-blue/40 transition-colors">
                    <div className="bg-mali-blue/10 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <History size={18} className="text-mali-blue-light" />
                    </div>
                    <div className="text-2xl font-bold text-white">{orderStats.sending}</div>
                    <div className="text-mali-text-secondary text-sm thai-font">กำลังส่ง</div>
                  </div>
                  <div className="p-4 rounded-lg bg-mali-blue/5 border border-mali-blue/20 hover:border-mali-blue/40 transition-colors">
                    <div className="bg-mali-blue/10 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <History size={18} className="text-mali-blue-light" />
                    </div>
                    <div className="text-2xl font-bold text-white">{orderStats.completed}</div>
                    <div className="text-mali-text-secondary text-sm thai-font">เสร็จสมบูรณ์</div>
                  </div>
                  <div className="p-4 rounded-lg bg-mali-blue/5 border border-mali-blue/20 hover:border-mali-blue/40 transition-colors">
                    <div className="bg-mali-blue/10 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <History size={18} className="text-mali-blue-light" />
                    </div>
                    <div className="text-2xl font-bold text-white">{orderStats.refunded}</div>
                    <div className="text-mali-text-secondary text-sm thai-font">คืนเงิน</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recently Purchased - Enhanced with animation and styling */}
            <motion.div
              className="bg-mali-card rounded-xl border border-mali-blue/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4 thai-font">ซื้อล่าสุด</h2>
                {recentlyPurchased.length > 0 ? (
                  <div className="space-y-3">
                    {recentlyPurchased.map(item => (
                      <motion.div
                        key={item.id}
                        className="flex items-center p-4 rounded-lg bg-mali-blue/5 border border-mali-blue/20 hover:border-mali-blue/40 transition-colors"
                        whileHover={{ scale: 1.01, boxShadow: "0 0 15px rgba(78, 137, 232, 0.2)" }}
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden mr-4 border border-mali-blue/30">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{item.name}</h3>
                          <p className="text-sm text-mali-blue-light mt-1">{item.amount}</p>
                        </div>
                        <div className="flex gap-2 ml-auto">
                          <motion.button
                            className="bg-mali-blue/20 hover:bg-mali-blue/30 w-8 h-8 rounded-full flex items-center justify-center text-mali-blue-accent hover:text-mali-blue-light transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Star size={16} />
                          </motion.button>
                          <Link
                            href={`/dashboard/orders/${item.id}`}
                            className="bg-mali-blue/20 hover:bg-mali-blue/30 w-8 h-8 rounded-full flex items-center justify-center text-mali-blue-accent hover:text-mali-blue-light transition-colors"
                          >
                            <ChevronRight size={16} />
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-mali-blue/10 text-mali-text-secondary text-center py-8 rounded-lg border border-mali-blue/20">
                    <div className="w-16 h-16 mx-auto mb-3 bg-mali-blue/20 rounded-full flex items-center justify-center">
                      <History size={24} className="text-mali-blue-light" />
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
              className="bg-mali-card rounded-xl border border-mali-blue/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4 thai-font">ตั้งค่าบัญชี</h2>
                <div className="divide-y divide-mali-blue/20">
                  {accountLinks.map((link, index) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center py-3 text-mali-text-secondary hover:text-white transition-colors thai-font"
                    >
                      <div className="w-8 h-8 rounded-full bg-mali-blue/20 flex items-center justify-center text-mali-blue-accent mr-3">
                        {link.icon}
                      </div>
                      <span>{link.label}</span>
                      <ChevronRight size={16} className="ml-auto" />
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* VIP Status - New section */}
            <motion.div
              className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >

              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white thai-font">สถานะ VIP</h2>
                  <Link
                    href="/star"
                    className="text-mali-blue-accent text-sm flex items-center hover:text-mali-blue-light transition-colors thai-font"
                  >
                    รายละเอียด <ChevronRight size={16} />
                  </Link>
                </div>
                <div className="bg-mali-blue/5 p-4 rounded-lg border border-mali-blue/20 mb-2">
                  <div className="flex items-center">
                    <div className="flex mr-3">
                      <Star size={18} className="text-mali-accent" fill="currentColor" />
                      <Star size={18} className="text-mali-accent -ml-1" fill="currentColor" />
                      <Star size={18} className="text-mali-accent -ml-1" fill="currentColor" />
                    </div>
                    <span className="font-semibold text-white thai-font">สมาชิกโกลด์</span>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 w-full bg-mali-blue/20 rounded-full overflow-hidden">
                      <div className="h-full bg-mali-blue-accent w-[65%]"></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                      <span className="text-mali-text-secondary">5,200 คะแนน</span>
                      <span className="text-mali-text-secondary thai-font">อีก 8,000 คะแนนเพื่อแพลทินัม</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-mali-text-secondary thai-font">
                  คุณมี <span className="text-mali-accent">3</span> รางวัลพิเศษที่สามารถใช้ได้
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
