"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { motion } from "@/lib/framer-exports";
import { Bell, Mail, Globe, Smartphone, Tag, Gift, ChevronLeft, Save, AlertCircle, CheckCircle, Facebook, Twitter, Instagram } from "lucide-react";
import Link from "next/link";
import { PushNotificationManager } from "@/components/notifications/PushNotificationManager";
import { SocialMediaIntegration, SocialPlatform } from '@/components/SocialMediaIntegration';

// Define the preference type
type Channel = "email" | "push" | "sms";

type Preferences = {
  [key in Channel]: {
    promotions: boolean;
    orderUpdates: boolean;
    accountSecurity: boolean;
    newsletter: boolean;
    priceDrop: boolean;
  }
};

// Mock data for notification preferences
const defaultPreferences: Preferences = {
  email: {
    promotions: true,
    orderUpdates: true,
    accountSecurity: true,
    newsletter: false,
    priceDrop: true,
  },
  push: {
    promotions: true,
    orderUpdates: true,
    accountSecurity: true,
    newsletter: false,
    priceDrop: false,
  },
  sms: {
    promotions: false,
    orderUpdates: false,
    accountSecurity: true,
    newsletter: false,
    priceDrop: false,
  },
};

// Category type
type CategoryId = "promotions" | "orderUpdates" | "accountSecurity" | "newsletter" | "priceDrop";

// Categories with icons
const categories = [
  { id: "promotions" as CategoryId, name: "โปรโมชั่นและส่วนลด", icon: <Tag className="h-5 w-5" /> },
  { id: "orderUpdates" as CategoryId, name: "อัพเดทคำสั่งซื้อ", icon: <Globe className="h-5 w-5" /> },
  { id: "accountSecurity" as CategoryId, name: "ความปลอดภัย", icon: <Bell className="h-5 w-5" /> },
  { id: "newsletter" as CategoryId, name: "จดหมายข่าวรายสัปดาห์", icon: <Mail className="h-5 w-5" /> },
  { id: "priceDrop" as CategoryId, name: "แจ้งเตือนราคาลด", icon: <Gift className="h-5 w-5" /> },
];

// Mock data
const MOCK_SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <Facebook />,
    connected: true,
    username: 'user.example',
    profileUrl: 'https://facebook.com',
    color: '#1877F2',
    followers: 342
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: <Twitter />,
    connected: false,
    color: '#1DA1F2'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: <Instagram />,
    connected: true,
    username: 'user.gaming',
    profileUrl: 'https://instagram.com',
    color: '#E4405F',
    followers: 1240
  }
];

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [contactInfo, setContactInfo] = useState({
    email: "user@example.com",
    phone: "+6612345678",
  });
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(MOCK_SOCIAL_PLATFORMS);
  const [showSuccess, setShowSuccess] = useState(false);

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Check for changes
  useEffect(() => {
    setHasPendingChanges(true);
  }, [preferences]);

  // Toggle a specific notification preference
  const togglePreference = (channel: Channel, category: CategoryId) => {
    setPreferences((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [category]: !prev[channel][category],
      },
    }));
  };

  // Handle saving preferences
  const savePreferences = () => {
    setIsSaving(true);
    setSaveStatus("idle");

    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveStatus("success");
      setHasPendingChanges(false);

      // Reset status after a few seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    }, 1500);
  };

  // Update contact info
  const updateContactInfo = (field: keyof typeof contactInfo, value: string) => {
    setContactInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasPendingChanges(true);
  };

  // Social media handlers
  const handleConnectSocial = async (platformId: string) => {
    // In a real app, this would open OAuth flow
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setPlatforms(prev => prev.map(p =>
          p.id === platformId
            ? {
              ...p,
              connected: true,
              username: 'new.user',
              followers: 125,
              profileUrl: `https://${platformId}.com/new.user`
            }
            : p
        ));
        resolve();
      }, 1500);
    });
  };

  const handleDisconnectSocial = async (platformId: string) => {
    // In a real app, this would revoke OAuth access
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setPlatforms(prev => prev.map(p =>
          p.id === platformId
            ? {
              ...p,
              connected: false,
              username: undefined,
              followers: undefined,
              profileUrl: undefined
            }
            : p
        ));
        resolve();
      }, 1500);
    });
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-lg text-mali-text-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page header with back navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/notifications" className="mr-4 text-mali-text-secondary hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">การแจ้งเตือน</h1>
            <p className="text-mali-text-secondary">จัดการการตั้งค่าการแจ้งเตือนของคุณ</p>
          </div>
        </div>

        <button
          onClick={savePreferences}
          disabled={isSaving || !hasPendingChanges}
          className={`btn-primary flex items-center ${(!hasPendingChanges || isSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSaving ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              บันทึก...
            </span>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              บันทึกการตั้งค่า
            </>
          )}
        </button>
      </div>

      {/* Save status notification */}
      {saveStatus === "success" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-mali-green/20 border border-mali-green/30 text-mali-green rounded-md p-3 mb-6 flex items-center"
        >
          <AlertCircle className="h-5 w-5 mr-2" />
          บันทึกการตั้งค่าเรียบร้อยแล้ว
        </motion.div>
      )}
      {saveStatus === "error" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-mali-red/20 border border-mali-red/30 text-mali-red rounded-md p-3 mb-6 flex items-center"
        >
          <AlertCircle className="h-5 w-5 mr-2" />
          เกิดข้อผิดพลาดในการบันทึกการตั้งค่า โปรดลองอีกครั้ง
        </motion.div>
      )}

      {/* Push Notification Manager */}
      <div className="mb-8">
        <PushNotificationManager />
      </div>

      {/* Contact information section */}
      <div className="glass-card mb-8">
        <div className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">ข้อมูลการติดต่อ</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-mali-text-secondary mb-1">อีเมล</label>
              <div className="flex">
                <div className="bg-mali-blue/20 flex items-center justify-center px-3 rounded-l-md border border-mali-blue/30">
                  <Mail className="h-5 w-5 text-mali-blue-light" />
                </div>
                <input
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => updateContactInfo("email", e.target.value)}
                  className="flex-1 bg-mali-navy border border-mali-blue/30 border-l-0 rounded-r-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-mali-blue-accent"
                />
              </div>
              <p className="text-mali-text-secondary text-xs mt-1">ใช้สำหรับการแจ้งเตือนทางอีเมล</p>
            </div>
            <div>
              <label className="block text-mali-text-secondary mb-1">เบอร์โทรศัพท์</label>
              <div className="flex">
                <div className="bg-mali-blue/20 flex items-center justify-center px-3 rounded-l-md border border-mali-blue/30">
                  <Smartphone className="h-5 w-5 text-mali-blue-light" />
                </div>
                <input
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) => updateContactInfo("phone", e.target.value)}
                  className="flex-1 bg-mali-navy border border-mali-blue/30 border-l-0 rounded-r-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-mali-blue-accent"
                />
              </div>
              <p className="text-mali-text-secondary text-xs mt-1">ใช้สำหรับการแจ้งเตือนทาง SMS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification preferences table */}
      <div className="glass-card">
        <div className="p-6">
          <h2 className="text-lg font-bold text-white mb-6">การตั้งค่าการแจ้งเตือน</h2>

          <div className="hidden md:block"> {/* Desktop view */}
            <table className="w-full">
              <thead>
                <tr className="text-left text-mali-text-secondary border-b border-mali-blue/20">
                  <th className="pb-3">ประเภทการแจ้งเตือน</th>
                  <th className="pb-3 text-center">
                    <div className="flex items-center justify-center">
                      <Mail className="h-4 w-4 mr-1" />
                      <span>อีเมล</span>
                    </div>
                  </th>
                  <th className="pb-3 text-center">
                    <div className="flex items-center justify-center">
                      <Bell className="h-4 w-4 mr-1" />
                      <span>Push</span>
                    </div>
                  </th>
                  <th className="pb-3 text-center">
                    <div className="flex items-center justify-center">
                      <Smartphone className="h-4 w-4 mr-1" />
                      <span>SMS</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b border-mali-blue/10 hover:bg-mali-blue/5">
                    <td className="py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-md bg-mali-blue/20 flex items-center justify-center mr-3">
                          {category.icon}
                        </div>
                        <span className="text-white">{category.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.email[category.id]}
                          onChange={() => togglePreference("email", category.id)}
                          className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-mali-navy rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mali-blue-light"></div>
                      </label>
                    </td>
                    <td className="py-4 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.push[category.id]}
                          onChange={() => togglePreference("push", category.id)}
                          className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-mali-navy rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mali-blue-light"></div>
                      </label>
                    </td>
                    <td className="py-4 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.sms[category.id]}
                          onChange={() => togglePreference("sms", category.id)}
                          className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-mali-navy rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mali-blue-light"></div>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden"> {/* Mobile view */}
            {categories.map((category) => (
              <div key={category.id} className="mb-6 border-b border-mali-blue/10 pb-4">
                <div className="flex items-center mb-3">
                  <div className="h-8 w-8 rounded-md bg-mali-blue/20 flex items-center justify-center mr-3">
                    {category.icon}
                  </div>
                  <span className="text-white">{category.name}</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-mali-navy/50 p-3 rounded-md flex flex-col items-center">
                    <Mail className="h-4 w-4 text-mali-blue-light mb-2" />
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.email[category.id]}
                        onChange={() => togglePreference("email", category.id)}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-mali-navy rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mali-blue-light"></div>
                    </label>
                  </div>

                  <div className="bg-mali-navy/50 p-3 rounded-md flex flex-col items-center">
                    <Bell className="h-4 w-4 text-mali-blue-light mb-2" />
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.push[category.id]}
                        onChange={() => togglePreference("push", category.id)}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-mali-navy rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mali-blue-light"></div>
                    </label>
                  </div>

                  <div className="bg-mali-navy/50 p-3 rounded-md flex flex-col items-center">
                    <Smartphone className="h-4 w-4 text-mali-blue-light mb-2" />
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.sms[category.id]}
                        onChange={() => togglePreference("sms", category.id)}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-mali-navy rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mali-blue-light"></div>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-sm text-mali-text-secondary mt-4">
            <p>* Push notifications ใช้งานได้เมื่อเปิดใช้งานใน browser หรือติดตั้งแอพพลิเคชั่น</p>
            <p>* SMS notifications อาจมีค่าใช้จ่ายเพิ่มเติมจากผู้ให้บริการ</p>
          </div>
        </div>
      </div>

      {/* Social Media Integration */}
      <div className="glass-card mt-8">
        <div className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">การเชื่อมต่อสื่อสังคม</h2>
          <SocialMediaIntegration
            platforms={platforms}
            onConnect={handleConnectSocial}
            onDisconnect={handleDisconnectSocial}
          />
        </div>
      </div>
    </div>
  );
} 
