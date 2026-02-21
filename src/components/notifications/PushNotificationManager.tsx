"use client";

import { useState } from "react";
import { usePushNotifications } from "@/lib/hooks/use-push-notifications";
import { Bell, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "@/lib/framer-exports";

interface PushNotificationManagerProps {
  className?: string;
}

export function PushNotificationManager({
  className,
}: PushNotificationManagerProps) {
  const {
    isSupported,
    isSubscribed,
    permissionState,
    isSubscribing,
    isUnsubscribing,
    error,
    subscribe,
    unsubscribe,
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
      <div
        className={`bg-white border-[3px] border-black p-4 ${className || ""}`}
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
      >
        <div className="flex items-center">
          <div className="mr-3 p-2 bg-brutal-yellow text-black border-[2px] border-black">
            <AlertCircle size={18} />
          </div>
          <div>
            <h3 className="text-black font-bold">การแจ้งเตือนผ่านบราวเซอร์</h3>
            <p className="text-gray-600 text-sm">
              บราวเซอร์ของคุณไม่สนับสนุนการแจ้งเตือนแบบพุช
              โปรดใช้บราวเซอร์รุ่นใหม่หรือแอพพลิเคชั่น
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If permission was denied
  if (permissionState === "denied") {
    return (
      <div
        className={`bg-white border-[3px] border-black p-4 ${className || ""}`}
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
      >
        <div className="flex items-center">
          <div className="mr-3 p-2 bg-brutal-pink text-white border-[2px] border-black">
            <AlertCircle size={18} />
          </div>
          <div>
            <h3 className="text-black font-bold">การแจ้งเตือนถูกบล็อก</h3>
            <p className="text-gray-600 text-sm">
              คุณได้บล็อกการแจ้งเตือนจากเว็บไซต์นี้
              โปรดเปิดการอนุญาตในการตั้งค่าบราวเซอร์ของคุณ
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
          className="bg-red-100 border-[3px] border-red-500 p-3 mb-4 text-red-600 flex items-center"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </motion.div>
      )}

      <div
        className={`bg-white border-[3px] border-black p-4 ${className || ""}`}
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3 p-2 bg-brutal-blue text-black border-[2px] border-black">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="text-black font-bold">
                การแจ้งเตือนผ่านบราวเซอร์
              </h3>
              <p className="text-gray-600 text-sm">
                {isSubscribed
                  ? "คุณได้เปิดการรับการแจ้งเตือนผ่านบราวเซอร์"
                  : "รับการแจ้งเตือนเมื่อมีการอัปเดตสำคัญ แม้เมื่อคุณไม่ได้เปิดเว็บไซต์"}
              </p>
            </div>
          </div>

          <div>
            {isSubscribed ? (
              <button
                onClick={unsubscribe}
                disabled={isUnsubscribing}
                className={`bg-gray-200 hover:bg-gray-300 border-[3px] border-black text-black px-4 py-2 font-bold transition-all ${isUnsubscribing ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-0.5"}`}
                style={{
                  boxShadow: isUnsubscribing ? "none" : "3px 3px 0 0 #000000",
                }}
              >
                {isUnsubscribing ? (
                  <>
                    <RefreshCw size={16} className="mr-2 animate-spin inline" />
                    กำลังยกเลิก...
                  </>
                ) : (
                  "ยกเลิกการแจ้งเตือน"
                )}
              </button>
            ) : (
              <button
                onClick={subscribe}
                disabled={isSubscribing}
                className={`bg-brutal-pink hover:bg-brutal-pink/90 text-white border-[3px] border-black px-4 py-2 font-bold transition-all ${isSubscribing ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-0.5"}`}
                style={{
                  boxShadow: isSubscribing ? "none" : "3px 3px 0 0 #000000",
                }}
              >
                {isSubscribing ? (
                  <>
                    <RefreshCw size={16} className="mr-2 animate-spin inline" />
                    กำลังเปิดใช้งาน...
                  </>
                ) : (
                  <>
                    <Bell size={16} className="mr-2 inline" />
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
