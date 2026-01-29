"use client";

import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import { Facebook, Twitter, Instagram, Youtube, CreditCard, ShieldCheck, DollarSign, Phone, Mail } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-mali-sidebar pt-10 border-t border-mali-blue/20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8">
          {/* Column 1: Logo and Social */}
          <div className="space-y-4">
            <Link href="/">
              <div className="font-bold text-xl flex items-center">
                <span className="text-blue-500">Mali</span>
                <span className="text-white">GamePass</span>
              </div>
            </Link>
            <p className="text-mali-text-secondary text-sm">
              บริการเติมเกม ซื้อบัตรเติมเงิน และบริการดิจิทัลอื่นๆ ที่รวดเร็ว ปลอดภัย และราคาดี
            </p>
            
            <div className="flex space-x-3">
              <motion.a 
                href="https://facebook.com" 
                target="_blank"
                className="w-8 h-8 rounded-full bg-mali-blue/20 flex items-center justify-center text-mali-text-secondary hover:text-white hover:bg-mali-blue/30"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Facebook size={16} />
              </motion.a>
              <motion.a 
                href="https://twitter.com" 
                target="_blank"
                className="w-8 h-8 rounded-full bg-mali-blue/20 flex items-center justify-center text-mali-text-secondary hover:text-white hover:bg-mali-blue/30"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Twitter size={16} />
              </motion.a>
              <motion.a 
                href="https://instagram.com" 
                target="_blank"
                className="w-8 h-8 rounded-full bg-mali-blue/20 flex items-center justify-center text-mali-text-secondary hover:text-white hover:bg-mali-blue/30"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Instagram size={16} />
              </motion.a>
              <motion.a 
                href="https://youtube.com" 
                target="_blank"
                className="w-8 h-8 rounded-full bg-mali-blue/20 flex items-center justify-center text-mali-text-secondary hover:text-white hover:bg-mali-blue/30"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Youtube size={16} />
              </motion.a>
            </div>
          </div>
          
          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-white font-medium mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/games" className="text-mali-text-secondary hover:text-white">
                  เกมทั้งหมด
                </Link>
              </li>
              <li>
                <Link href="/direct-topup" className="text-mali-text-secondary hover:text-white">
                  เติมเกมโดยตรง
                </Link>
              </li>
              <li>
                <Link href="/card" className="text-mali-text-secondary hover:text-white">
                  บัตรเกม
                </Link>
              </li>
              <li>
                <Link href="/promotions" className="text-mali-text-secondary hover:text-white">
                  โปรโมชั่น
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-mali-text-secondary hover:text-white">
                  ติดต่อเรา
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Contact Us */}
          <div>
            <h3 className="text-white font-medium mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center text-mali-text-secondary">
                <Mail size={16} className="mr-2 text-mali-blue-light" />
                <span>support@maligamepass.com</span>
              </li>
              <li className="flex items-center text-mali-text-secondary">
                <Phone size={16} className="mr-2 text-mali-blue-light" />
                <span>Live Chat Support 24/7</span>
              </li>
            </ul>
          </div>
          
          {/* Column 4: Payment Methods */}
          <div>
            <h3 className="text-white font-medium mb-4">Payment Methods</h3>
            <div className="grid grid-cols-3 gap-2">
              <span className="px-2 py-1 bg-mali-blue/20 text-mali-text-secondary rounded text-xs flex items-center justify-center">Visa</span>
              <span className="px-2 py-1 bg-mali-blue/20 text-mali-text-secondary rounded text-xs flex items-center justify-center">Mastercard</span>
              <span className="px-2 py-1 bg-mali-blue/20 text-mali-text-secondary rounded text-xs flex items-center justify-center">JCB</span>
              <span className="px-2 py-1 bg-mali-blue/20 text-mali-text-secondary rounded text-xs flex items-center justify-center">PromptPay</span>
              <span className="px-2 py-1 bg-mali-blue/20 text-mali-text-secondary rounded text-xs flex items-center justify-center">TrueMoney</span>
              <span className="px-2 py-1 bg-mali-blue/20 text-mali-text-secondary rounded text-xs flex items-center justify-center">ShopeePay</span>
            </div>
          </div>
        </div>
        
        {/* Features bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-6 border-t border-mali-blue/10">
          <div className="flex items-center text-mali-text-secondary">
            <CreditCard className="mr-3 text-mali-blue-accent" size={20} />
            <div className="text-sm">
              <p className="text-white">หลากหลายช่องทางชำระเงิน</p>
              <p>บัตรเครดิต บัตรเดบิต และอื่นๆ</p>
            </div>
          </div>
          
          <div className="flex items-center text-mali-text-secondary">
            <ShieldCheck className="mr-3 text-mali-blue-accent" size={20} />
            <div className="text-sm">
              <p className="text-white">การชำระเงินที่ปลอดภัย</p>
              <p>ระบบความปลอดภัยระดับสูง</p>
            </div>
          </div>
          
          <div className="flex items-center text-mali-text-secondary">
            <DollarSign className="mr-3 text-mali-blue-accent" size={20} />
            <div className="text-sm">
              <p className="text-white">ราคาที่แข่งขันได้</p>
              <p>ส่วนลดและโปรโมชั่นพิเศษ</p>
            </div>
          </div>
          
          <div className="flex items-center text-mali-text-secondary">
            <Phone className="mr-3 text-mali-blue-accent" size={20} />
            <div className="text-sm">
              <p className="text-white">ฝ่ายสนับสนุนตลอด 24/7</p>
              <p>พร้อมช่วยเหลือทุกปัญหา</p>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="py-4 text-center border-t border-mali-blue/10 text-mali-text-secondary text-xs">
          <div className="flex justify-center space-x-4">
            <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-white">Terms of Service</Link>
          </div>
          <div className="mt-2">
            &copy; {year} MaliGamePass. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
} 
