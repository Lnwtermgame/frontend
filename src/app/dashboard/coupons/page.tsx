"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { couponApi, UserCoupon } from "@/lib/services/coupon-api";
import { Ticket, Copy, Check, ChevronDown, ChevronUp, Clock, Search, Plus, AlertCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import toast from "react-hot-toast";

export default function CouponsPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCoupons, setExpandedCoupons] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [newCouponCode, setNewCouponCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [filteredCoupons, setFilteredCoupons] = useState<UserCoupon[]>([]);

  // Fetch coupons from API
  useEffect(() => {
    if (isInitialized && user) {
      fetchCoupons();
    }
  }, [isInitialized, user]);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const response = await couponApi.getMyCoupons();
      if (response.success) {
        setCoupons(response.data);
        setFilteredCoupons(response.data);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดคูปองได้');
    } finally {
      setIsLoading(false);
    }
  };

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Filter coupons based on search term and status
  useEffect(() => {
    let result = coupons;

    // Apply status filter
    if (filter !== "all") {
      result = result.filter(coupon => {
        if (filter === "active") return !coupon.isUsed && new Date(coupon.endDate) > new Date();
        if (filter === "used") return coupon.isUsed;
        if (filter === "expired") return new Date(coupon.endDate) <= new Date() && !coupon.isUsed;
        return true;
      });
    }

    // Apply search filter
    if (searchTerm) {
      result = result.filter(coupon =>
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (coupon.description && coupon.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredCoupons(result);
  }, [searchTerm, filter, coupons]);

  // Toggle coupon expansion
  const toggleCouponExpansion = (couponId: string) => {
    setExpandedCoupons(prev =>
      prev.includes(couponId)
        ? prev.filter(id => id !== couponId)
        : [...prev, couponId]
    );
  };

  // Copy code to clipboard
  const copyToClipboard = (code: string, couponId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(couponId);
    toast.success('คัดลอกรหัสคูปองแล้ว');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Claim coupon
  const handleClaimCoupon = async () => {
    if (!newCouponCode.trim()) {
      setErrorMessage("กรุณากรอกรหัสคูปอง");
      return;
    }

    setErrorMessage("กำลังตรวจสอบคูปอง...");

    try {
      // First validate the coupon
      const validateResponse = await couponApi.validateCoupon(newCouponCode.trim());

      if (!validateResponse.success || !validateResponse.data.valid) {
        setErrorMessage(validateResponse.data?.message || "รหัสคูปองไม่ถูกต้อง");
        return;
      }

      // Then claim it
      const couponId = validateResponse.data.coupon?.id;
      if (!couponId) {
        setErrorMessage("ไม่พบคูปองนี้");
        return;
      }

      const claimResponse = await couponApi.claimCoupon(couponId);

      if (claimResponse.success) {
        toast.success('เพิ่มคูปองสำเร็จ!');
        setErrorMessage("");
        setNewCouponCode("");
        fetchCoupons(); // Refresh the list
      } else {
        setErrorMessage(claimResponse.message || "ไม่สามารถเพิ่มคูปองได้");
      }
    } catch (error) {
      const message = couponApi.getErrorMessage(error);
      setErrorMessage(message || "รหัสคูปองไม่ถูกต้อง");
    }
  };

  // Get coupon status
  const getCouponStatus = (coupon: UserCoupon): string => {
    if (coupon.isUsed) return 'used';
    if (new Date(coupon.endDate) <= new Date()) return 'expired';
    return 'active';
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return '-';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-mali-text-secondary thai-font">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Get active coupon count
  const activeCouponCount = coupons.filter(coupon => getCouponStatus(coupon) === "active").length;

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-6">
        <motion.h2
          className="text-xl font-bold text-white mb-1 relative"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          คูปองของฉัน
        </motion.h2>
        <p className="text-mali-text-secondary text-sm relative thai-font">คุณมีคูปองที่ใช้งานได้ {activeCouponCount} ใบ</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="ค้นหาคูปอง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full bg-mali-blue/10 px-4 py-2 text-sm text-white border border-mali-blue/20 focus:outline-none focus:ring-1 focus:ring-mali-blue-accent pl-10 transition-all thai-font"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mali-text-secondary" />
        </div>

        <div className="relative w-full sm:w-auto ml-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none w-full rounded-full bg-mali-blue/10 px-4 py-2 pr-10 text-sm text-white border border-mali-blue/20 focus:outline-none focus:ring-1 focus:ring-mali-blue-accent transition-all cursor-pointer thai-font"
          >
            <option value="all">คูปองทั้งหมด</option>
            <option value="active">ใช้งานได้</option>
            <option value="used">ใช้แล้ว</option>
            <option value="expired">หมดอายุ</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mali-text-secondary pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <motion.div
              className="bg-mali-card border border-mali-blue/20 rounded-xl p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Ticket className="h-16 w-16 mx-auto text-mali-text-secondary mb-4 opacity-50" />
              <h2 className="text-xl font-bold text-white mb-2 thai-font">ไม่พบคูปอง</h2>
              <p className="text-mali-text-secondary mb-6 thai-font">
                {searchTerm ? `ไม่พบผลลัพธ์สำหรับ "${searchTerm}"` : "คุณยังไม่มีคูปองในระบบ"}
              </p>
              <Link href="/products" className="bg-mali-blue hover:bg-mali-blue/90 text-white px-4 py-2 rounded-lg inline-flex items-center transition-all thai-font">
                ช้อปปิ้งเลย
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredCoupons.map((coupon, index) => {
                const status = getCouponStatus(coupon);
                return (
                  <motion.div
                    key={coupon.userCouponId || coupon.id}
                    className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden hover:border-mali-blue/40 transition-all"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-mali-blue/5 transition-colors"
                      onClick={() => toggleCouponExpansion(coupon.id)}
                    >
                      <div className="flex items-center mb-3 sm:mb-0">
                        <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-mali-blue/10 border border-mali-blue/20 mr-4">
                          <Ticket className="h-6 w-6 text-mali-blue-light" />
                        </div>
                        <div>
                          <div className="text-white font-medium text-lg">
                            {coupon.description || `ส่วนลด ${coupon.discountPercentage}%`}
                          </div>
                          <div className="text-mali-text-secondary text-sm">
                            {coupon.minPurchase ? `ขั้นต่ำ ${formatCurrency(coupon.minPurchase)}` : 'ไม่มีขั้นต่ำ'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
                        <div className="mr-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full inline-flex items-center font-medium
                            ${status === 'active'
                              ? 'bg-mali-green/20 text-mali-green border border-mali-green/20'
                              : status === 'used'
                                ? 'bg-mali-blue/20 text-mali-blue-light border border-mali-blue/20'
                                : 'bg-mali-red/20 text-mali-red border border-mali-red/20'
                            }`}>
                            {status === 'active' ? 'ใช้งานได้' : status === 'used' ? 'ใช้แล้ว' : 'หมดอายุ'}
                          </span>
                        </div>
                        {expandedCoupons.includes(coupon.id) ? (
                          <ChevronUp className="h-5 w-5 text-mali-text-secondary" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-mali-text-secondary" />
                        )}
                      </div>
                    </div>

                    {expandedCoupons.includes(coupon.id) && (
                      <div className="p-4 border-t border-mali-blue/20 bg-mali-blue/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-mali-card p-4 rounded-lg border border-mali-blue/10">
                            <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2 thai-font">
                              <Clock size={14} className="text-mali-blue-accent" /> รายละเอียดคูปอง
                            </h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between p-2 rounded hover:bg-mali-blue/5 transition-colors">
                                <span className="text-mali-text-secondary thai-font">ส่วนลด:</span>
                                <span className="text-white font-medium">{coupon.discountPercentage}%</span>
                              </div>
                              {coupon.maxDiscount && (
                                <div className="flex justify-between p-2 rounded hover:bg-mali-blue/5 transition-colors">
                                  <span className="text-mali-text-secondary thai-font">ส่วนลดสูงสุด:</span>
                                  <span className="text-white font-medium">{formatCurrency(coupon.maxDiscount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between p-2 rounded hover:bg-mali-blue/5 transition-colors">
                                <span className="text-mali-text-secondary thai-font">ใช้ได้ถึง:</span>
                                <span className={`font-medium ${status === 'expired' ? 'text-mali-red' : 'text-white'}`}>
                                  {new Date(coupon.endDate).toLocaleDateString('th-TH')}
                                </span>
                              </div>
                              {coupon.isUsed && coupon.usedAt && (
                                <div className="flex justify-between p-2 rounded hover:bg-mali-blue/5 transition-colors">
                                  <span className="text-mali-text-secondary thai-font">ใช้เมื่อ:</span>
                                  <span className="text-white">{new Date(coupon.usedAt).toLocaleDateString('th-TH')}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-mali-card p-4 rounded-lg border border-mali-blue/10">
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="text-white text-sm font-medium thai-font">รหัสคูปอง</h3>
                              {status === 'active' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(coupon.code, coupon.id);
                                  }}
                                  className="text-xs text-mali-blue-light hover:text-mali-blue-accent hover:underline flex items-center transition-colors thai-font"
                                >
                                  {copiedCode === coupon.id ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      คัดลอกแล้ว
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3 mr-1" />
                                      คัดลอกรหัส
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            <div className="p-3 bg-mali-dark/50 border border-mali-blue/10 rounded-lg font-mono text-white text-sm select-all text-center tracking-wider">
                              {coupon.code}
                            </div>

                            {status === 'active' && (
                              <div className="mt-4 text-center">
                                <Link
                                  href="/products"
                                  className="w-full bg-mali-blue/20 hover:bg-mali-blue/30 text-mali-blue-accent hover:text-white rounded-lg inline-flex items-center justify-center text-sm py-2 transition-all font-medium thai-font"
                                >
                                  ใช้ทันที
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <motion.div
            className="bg-mali-card border border-mali-blue/20 rounded-xl p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2 thai-font">
              <Plus size={18} className="text-mali-blue-accent" /> เพิ่มคูปอง
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-mali-text-secondary mb-2 thai-font">กรอกรหัสคูปอง</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="เช่น SAVE20"
                    value={newCouponCode}
                    onChange={(e) => {
                      setNewCouponCode(e.target.value.toUpperCase());
                      setErrorMessage("");
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleClaimCoupon()}
                    className="flex-1 rounded-lg bg-mali-blue/10 px-3 py-2 text-sm text-white border border-mali-blue/20 focus:outline-none focus:ring-1 focus:ring-mali-blue-accent transition-all"
                  />
                  <button
                    onClick={handleClaimCoupon}
                    className="rounded-lg bg-mali-blue hover:bg-mali-blue/90 text-white px-3 py-2 flex items-center transition-all shadow-button-glow"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {errorMessage && (
                  <motion.div
                    className={`mt-2 text-xs flex items-start p-2 rounded ${
                      errorMessage.includes('กำลัง')
                        ? 'text-yellow-400 bg-yellow-900/20'
                        : 'text-mali-red bg-mali-red/10'
                    }`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <AlertCircle className="h-3 w-3 mt-0.5 mr-1 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}
                <p className="text-mali-text-secondary text-xs mt-2 thai-font">
                  กรอกรหัสคูปองที่ถูกต้องเพื่อเพิ่มลงในบัญชีของคุณ
                </p>
              </div>
            </div>
          </motion.div>

          {/* How to Use Section */}
          <motion.div
            className="bg-mali-card border border-mali-blue/20 rounded-xl p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-white font-semibold mb-4 thai-font">วิธีใช้งาน</h2>
            <div className="space-y-4">
              <div className="flex">
                <div className="h-6 w-6 rounded-full bg-mali-blue/20 border border-mali-blue/30 text-mali-blue-accent flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="text-mali-text-secondary text-sm thai-font">ค้นหาคูปองหรือกรอกรหัสคูปอง</p>
                </div>
              </div>

              <div className="flex">
                <div className="h-6 w-6 rounded-full bg-mali-blue/20 border border-mali-blue/30 text-mali-blue-accent flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="text-mali-text-secondary text-sm thai-font">คัดลอกรหัสคูปอง</p>
                </div>
              </div>

              <div className="flex">
                <div className="h-6 w-6 rounded-full bg-mali-blue/20 border border-mali-blue/30 text-mali-blue-accent flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="text-mali-text-secondary text-sm thai-font">ใช้รหัสตอนชำระเงิน</p>
                </div>
              </div>

              <div className="flex items-center mt-3 pt-3 border-t border-mali-blue/10">
                <Clock className="h-4 w-4 text-mali-blue-light mr-2" />
                <span className="text-mali-text-secondary text-xs thai-font">คูปองมีวันหมดอายุ โปรดใช้ก่อนที่จะหมดอายุ</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
