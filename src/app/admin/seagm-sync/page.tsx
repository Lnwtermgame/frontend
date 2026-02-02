"use client";

import { useState, useEffect } from "react";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  RefreshCw,
  CreditCard,
  Zap,
  Database,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  Tag,
  Box,
  Trash2,
  BarChart3,
} from "lucide-react";
import { productApi, SyncResult } from "@/lib/services/product-api";

export default function SeagmSyncPage() {
  const [isLoading, setIsLoading] = useState<{
    all: boolean;
    cards: boolean;
    directTopUp: boolean;
  }>({
    all: false,
    cards: false,
    directTopUp: false,
  });

  const [lastSync, setLastSync] = useState<{
    all: Date | null;
    cards: Date | null;
    directTopUp: Date | null;
  }>({
    all: null,
    cards: null,
    directTopUp: null,
  });

  const [results, setResults] = useState<{
    all: SyncResult | null;
    cards: SyncResult | null;
    directTopUp: SyncResult | null;
  }>({
    all: null,
    cards: null,
    directTopUp: null,
  });

  const [cacheStats, setCacheStats] = useState<{ size: number } | null>(null);

  // Load cache stats on mount
  useEffect(() => {
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    try {
      const response = await productApi.getCacheStats();
      if (response.success) {
        setCacheStats(response.data);
      }
    } catch (error) {
      console.error("Failed to load cache stats:", error);
    }
  };

  const handleSyncAll = async () => {
    setIsLoading((prev) => ({ ...prev, all: true }));
    try {
      const response = await productApi.syncAll();
      if (response.success) {
        setResults((prev) => ({ ...prev, all: response.data }));
        setLastSync((prev) => ({ ...prev, all: new Date() }));
      }
    } catch (error) {
      console.error("Sync all failed:", error);
      alert("ไม่สามารถซิงค์สินค้าทั้งหมดได้");
    } finally {
      setIsLoading((prev) => ({ ...prev, all: false }));
      loadCacheStats();
    }
  };

  const handleSyncCards = async () => {
    setIsLoading((prev) => ({ ...prev, cards: true }));
    try {
      const response = await productApi.syncCards();
      if (response.success) {
        setResults((prev) => ({ ...prev, cards: response.data }));
        setLastSync((prev) => ({ ...prev, cards: new Date() }));
      }
    } catch (error) {
      console.error("Sync cards failed:", error);
      alert("ไม่สามารถซิงค์สินค้าบัตรได้");
    } finally {
      setIsLoading((prev) => ({ ...prev, cards: false }));
      loadCacheStats();
    }
  };

  const handleSyncDirectTopUp = async () => {
    setIsLoading((prev) => ({ ...prev, directTopUp: true }));
    try {
      const response = await productApi.syncDirectTopUp();
      if (response.success) {
        setResults((prev) => ({ ...prev, directTopUp: response.data }));
        setLastSync((prev) => ({ ...prev, directTopUp: new Date() }));
      }
    } catch (error) {
      console.error("Sync direct top-up failed:", error);
      alert("ไม่สามารถซิงค์สินค้าเติมเงินได้");
    } finally {
      setIsLoading((prev) => ({ ...prev, directTopUp: false }));
      loadCacheStats();
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "ไม่เคย";
    return date.toLocaleTimeString("th-TH");
  };

  const SyncCard = ({
    title,
    description,
    icon: Icon,
    onClick,
    isLoading,
    lastSync,
    result,
    color,
  }: {
    title: string;
    description: string;
    icon: React.ElementType;
    onClick: () => void;
    isLoading: boolean;
    lastSync: Date | null;
    result: SyncResult | null;
    color: string;
  }) => (
    <motion.div
      className="bg-mali-card rounded-xl border border-mali-blue/20 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span>{formatTime(lastSync)}</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-6">{description}</p>

      <button
        onClick={onClick}
        disabled={isLoading}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
          isLoading
            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
            : "bg-mali-blue text-white hover:bg-mali-blue/90"
        }`}
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            กำลังซิงค์...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            ซิงค์ตอนนี้
          </>
        )}
      </button>

      {result && (
        <div className="mt-4 pt-4 border-t border-mali-blue/10 space-y-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            สินค้า (เกม)
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">สร้างใหม่</span>
            <span className="text-green-400 font-medium">
              +{result.productsCreated}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">อัปเดต</span>
            <span className="text-blue-400 font-medium">
              {result.productsUpdated}
            </span>
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-3 mb-2">
            ประเภทสินค้า (ตัวเลือก)
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">สร้างใหม่</span>
            <span className="text-green-400 font-medium">
              +{result.productTypesCreated}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">อัปเดต</span>
            <span className="text-blue-400 font-medium">
              {result.productTypesUpdated}
            </span>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-2 p-2 bg-red-900/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{result.errors.length} ข้อผิดพลาด</span>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );

  return (
    <AdminLayout title="ซิงค์ SEAGM">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">ซิงค์ SEAGM</h1>
            <p className="text-gray-400 mt-1">
              ซิงค์สินค้าจาก SEAGM API ไปยังฐานข้อมูลภายใน
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-mali-card border border-mali-blue/20 rounded-lg px-4 py-2 flex items-center gap-3">
              <Database className="w-5 h-5 text-mali-blue" />
              <div>
                <p className="text-xs text-gray-400">ขนาดแคช</p>
                <p className="text-white font-medium">
                  {cacheStats?.size ?? 0} รายการ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SyncCard
            title="ซิงค์ทั้งหมด"
            description="ซิงค์สินค้าทั้งหมด: บัตรและเติมเงิน"
            icon={Layers}
            onClick={handleSyncAll}
            isLoading={isLoading.all}
            lastSync={lastSync.all}
            result={results.all}
            color="bg-gradient-to-br from-purple-500 to-pink-500"
          />
          <SyncCard
            title="ซิงค์บัตร"
            description="ซิงค์เฉพาะหมวดหมู่และประเภทบัตร"
            icon={CreditCard}
            onClick={handleSyncCards}
            isLoading={isLoading.cards}
            lastSync={lastSync.cards}
            result={results.cards}
            color="bg-gradient-to-br from-blue-500 to-cyan-500"
          />
          <SyncCard
            title="ซิงค์เติมเงิน"
            description="ซิงค์หมวดหมู่และประเภทเติมเงิน"
            icon={Zap}
            onClick={handleSyncDirectTopUp}
            isLoading={isLoading.directTopUp}
            lastSync={lastSync.directTopUp}
            result={results.directTopUp}
            color="bg-gradient-to-br from-orange-500 to-red-500"
          />
        </div>

        {/* Info Section */}
        <motion.div
          className="bg-mali-card rounded-xl border border-mali-blue/20 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4">
            ระบบซิงค์ SEAGM ทำงานอย่างไร
          </h2>
          <p className="text-gray-400 mb-4">
            ระบบซิงค์ใหม่ใช้โครงสร้างสองระดับเพื่อจัดระเบียบข้อมูล SEAGM
            ได้ดีขึ้น:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Box className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium">สินค้า (เกม)</h4>
                  <p className="text-sm text-gray-400">
                    แต่ละเกมเก็บเป็นสินค้าพร้อมข้อมูลพื้นฐาน: ชื่อ รหัส โหมด
                    (บัตร/เติมเงิน) ภูมิภาค ตัวอย่าง: "PUBG Mobile UC (MY)"
                    ด้วยรหัส "pubg-mobile-uc-top-up"
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Layers className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium">
                    ประเภทสินค้า (ตัวเลือก)
                  </h4>
                  <p className="text-sm text-gray-400">
                    แต่ละเกมมีหลายประเภทแทนตัวเลือกราคาที่แตกต่างกัน ตัวอย่าง:
                    PUBG Mobile มี 60 UC (35฿) 325 UC (165฿) 660 UC (325฿) ฯลฯ
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium">โหมดบัตร</h4>
                  <p className="text-sm text-gray-400">
                    บัตรของขวัญพร้อมรหัส PIN
                    แต่ละประเภทมีสต็อกและราคาเป็นของตัวเอง ลูกค้าได้รับรหัส PIN
                    หลังการซื้อ
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium">โหมดเติมเงิน</h4>
                  <p className="text-sm text-gray-400">
                    เติมเงินเข้าบัญชีโดยตรงต้องการรหัสผู้เล่น ใช้ได้ที่
                    /games/[gameCode] พร้อม ตัวเลือกราคาทั้งหมดให้เลือก
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Handling Info */}
        <motion.div
          className="bg-mali-card rounded-xl border border-mali-blue/20 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4">
            การจัดการรหัสข้อผิดพลาด 10406
          </h2>
          <p className="text-gray-400 mb-4">
            เมื่อ SEAGM ส่งคืนรหัสข้อผิดพลาด 10406 (พารามิเตอร์ที่จำเป็นขาดหาย)
            ระบบจะ:
          </p>
          <ol className="space-y-2 text-sm text-gray-400 list-decimal list-inside">
            <li>ล้างข้อมูลฟิลด์ที่แคชไว้สำหรับสินค้านั้น</li>
            <li>ดึงข้อกำหนดฟิลด์ใหม่จาก SEAGM API</li>
            <li>ลองส่งคำสั่งซื้ออีกครั้งด้วยฟิลด์ที่อัปเดต</li>
            <li>หากยังไม่สำเร็จ รายงานฟิลด์ที่ขาดหายไปให้ผู้ดูแลระบบ</li>
          </ol>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
