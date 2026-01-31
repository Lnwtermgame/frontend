"use client";

import { useState } from 'react';
import { usePushNotifications } from '@/lib/hooks/use-push-notifications';
import { Bell, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from '@/lib/framer-exports';

interface PushNotificationManagerProps {
  className?: string;
}

export function PushNotificationManager({ className }: PushNotificationManagerProps) {
  const { 
    isSupported, 
    isSubscribed, 
    permissionState,
    isSubscribing, 
    isUnsubscribing,
    error,
    subscribe, 
    unsubscribe 
  } = usePushNotifications();
  
  const [showError, setShowError] = useState(false);
  
  // Show error message if any
  if (error && !showError) {
    setShowError(true);
    setTimeout(() => {
      setShowError(false);
    }, 5000);
  }
  
  // If push notifications are not supported
  if (!isSupported) {
    return (
      <div className={`glass-card p-4 ${className || ''}`}>
        <div className="flex items-center">
          <div className="mr-3 p-2 bg-amber-900/30 text-amber-400 rounded-full">
            <AlertCircle size={18} />
          </div>
          <div>
            <h3 className="text-white font-medium">การแจ้งเตือนผ่านบราวเซอร์</h3>
            <p className="text-mali-text-secondary text-sm">
              บราวเซอร์ของคุณไม่สนับสนุนการแจ้งเตือนแบบพุช โปรดใช้บราวเซอร์รุ่นใหม่หรือแอพพลิเคชั่น
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // If permission was denied
  if (permissionState === 'denied') {
    return (
      <div className={`glass-card p-4 ${className || ''}`}>
        <div className="flex items-center">
          <div className="mr-3 p-2 bg-mali-red/20 text-mali-red rounded-full">
            <AlertCircle size={18} />
          </div>
          <div>
            <h3 className="text-white font-medium">การแจ้งเตือนถูกบล็อก</h3>
            <p className="text-mali-text-secondary text-sm">
              คุณได้บล็อกการแจ้งเตือนจากเว็บไซต์นี้ โปรดเปิดการอนุญาตในการตั้งค่าบราวเซอร์ของคุณ
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {/* Error message */}
      {showError && (
        <motion.div 
          className="bg-mali-red/20 border border-mali-red/30 rounded-md p-3 mb-4 text-mali-red flex items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </motion.div>
      )}
    
      <div className={`glass-card p-4 ${className || ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3 p-2 bg-mali-blue/20 text-mali-blue-light rounded-full">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="text-white font-medium">การแจ้งเตือนผ่านบราวเซอร์</h3>
              <p className="text-mali-text-secondary text-sm">
                {isSubscribed 
                  ? 'คุณได้เปิดการรับการแจ้งเตือนผ่านบราวเซอร์' 
                  : 'รับการแจ้งเตือนเมื่อมีการอัปเดตสำคัญ แม้เมื่อคุณไม่ได้เปิดเว็บไซต์'}
              </p>
            </div>
          </div>
          
          <div>
            {isSubscribed ? (
              <button
                onClick={unsubscribe}
                disabled={isUnsubscribing}
                className={`bg-mali-navy hover:bg-mali-blue/20 border border-mali-blue/30 text-white px-4 py-2 rounded-lg flex items-center transition-colors ${isUnsubscribing ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isUnsubscribing ? (
                  <>
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                    กำลังยกเลิก...
                  </>
                ) : (
                  'ยกเลิกการแจ้งเตือน'
                )}
              </button>
            ) : (
              <button
                onClick={subscribe}
                disabled={isSubscribing}
                className={`bg-mali-blue-light hover:bg-mali-blue text-white px-4 py-2 rounded-lg flex items-center transition-colors ${isSubscribing ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubscribing ? (
                  <>
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                    กำลังเปิดใช้งาน...
                  </>
                ) : (
                  <>
                    <Bell size={16} className="mr-2" />
                    เปิดใช้งานการแจ้งเตือน
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 
