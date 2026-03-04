"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { couponApi, UserCoupon } from "@/lib/services/coupon-api";
import {
  Ticket,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Search,
  Plus,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function CouponsPage() {
  const t = useTranslations("Coupons");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const pathname = usePathname();
  const { user, isSessionChecked } = useAuth();
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCoupons, setExpandedCoupons] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [newCouponCode, setNewCouponCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [filteredCoupons, setFilteredCoupons] = useState<UserCoupon[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch coupons from API
  useEffect(() => {
    if (isSessionChecked && user) {
      fetchCoupons();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isSessionChecked, user]);

  const fetchCoupons = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const response = await couponApi.getMyCoupons(1, 20, controller.signal);
      if (response.success) {
        setCoupons(response.data);
        setFilteredCoupons(response.data);
      }
    } catch (error: any) {
      if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
        toast.error(t("add_failed"));
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isSessionChecked && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, router, isSessionChecked, pathname]);

  // Filter coupons based on search term and status
  useEffect(() => {
    let result = coupons;

    // Apply status filter
    if (filter !== "all") {
      result = result.filter((coupon) => {
        if (filter === "active")
          return !coupon.isUsed && new Date(coupon.endDate) > new Date();
        if (filter === "used") return coupon.isUsed;
        if (filter === "expired")
          return new Date(coupon.endDate) <= new Date() && !coupon.isUsed;
        return true;
      });
    }

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (coupon) =>
          coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (coupon.description &&
            coupon.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase())),
      );
    }

    setFilteredCoupons(result);
  }, [searchTerm, filter, coupons]);

  // Toggle coupon expansion
  const toggleCouponExpansion = (couponId: string) => {
    setExpandedCoupons((prev) =>
      prev.includes(couponId)
        ? prev.filter((id) => id !== couponId)
        : [...prev, couponId],
    );
  };

  // Copy code to clipboard
  const copyToClipboard = (code: string, couponId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(couponId);
    toast.success(t("details.copied"));
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Claim coupon
  const handleClaimCoupon = async () => {
    if (!newCouponCode.trim()) {
      setErrorMessage(t("code_label"));
      return;
    }

    setErrorMessage(t("validating"));

    try {
      // First validate the coupon
      const validateResponse = await couponApi.validateCoupon(
        newCouponCode.trim(),
      );

      if (!validateResponse.success || !validateResponse.data.valid) {
        setErrorMessage(
          validateResponse.data?.message || t("invalid_code"),
        );
        return;
      }

      // Then claim it
      const couponId = validateResponse.data.coupon?.id;
      if (!couponId) {
        setErrorMessage(t("not_found"));
        return;
      }

      const claimResponse = await couponApi.claimCoupon(couponId);

      if (claimResponse.success) {
        toast.success(t("add_success"));
        setErrorMessage("");
        setNewCouponCode("");
        fetchCoupons(); // Refresh the list
      } else {
        setErrorMessage(claimResponse.message || t("add_failed"));
      }
    } catch (error) {
      const message = couponApi.getErrorMessage(error);
      setErrorMessage(message || t("invalid_code"));
    }
  };

  // Get coupon status
  const getCouponStatus = (coupon: UserCoupon): string => {
    if (coupon.isUsed) return "used";
    if (new Date(coupon.endDate) <= new Date()) return "expired";
    return "active";
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return "-";
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isSessionChecked || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  // Get active coupon count
  const activeCouponCount = coupons.filter(
    (coupon) => getCouponStatus(coupon) === "active",
  ).length;

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-4">
        <motion.h2
          className="text-lg font-bold text-black mb-1 relative flex items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="w-1.5 h-4 bg-brutal-pink mr-2"></span>
          {t("title")}
        </motion.h2>
        <p className="text-gray-600 text-xs relative font-bold">
          {t("subtitle", { count: activeCouponCount })}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder={t("search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-[2px] border-gray-300 px-3 py-1.5 text-xs text-black focus:outline-none focus:border-black pl-8 transition-all"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
        </div>

        <div className="relative w-full sm:w-auto ml-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none w-full bg-white border-[2px] border-gray-300 px-3 py-1.5 pr-8 text-xs text-black focus:outline-none focus:border-black transition-all cursor-pointer"
          >
            <option value="all">{t("filter.all")}</option>
            <option value="active">{t("filter.active")}</option>
            <option value="used">{t("filter.used")}</option>
            <option value="expired">{t("filter.expired")}</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <motion.div
              className="bg-white border-[3px] border-black p-6 text-center"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Ticket className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h2 className="text-lg font-bold text-black mb-1">
                {t("no_coupons")}
              </h2>
              <p className="text-gray-600 text-xs mb-4 font-bold">
                {searchTerm
                  ? t("no_search_results", { query: searchTerm })
                  : t("no_coupons_desc")}
              </p>
              <Link
                href="/games"
                className="bg-black text-white border-[3px] border-black px-3 py-1.5 text-xs font-bold inline-flex items-center hover:bg-gray-800 transition-all"
                style={{ boxShadow: "3px 3px 0 0 #000000" }}
              >
                {t("start_shopping")}
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredCoupons.map((coupon, index) => {
                const status = getCouponStatus(coupon);
                return (
                  <motion.div
                    key={coupon.userCouponId || coupon.id}
                    className="bg-white border-[3px] border-black overflow-hidden"
                    style={{ boxShadow: "4px 4px 0 0 #000000" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -2 }}
                  >
                    <div
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleCouponExpansion(coupon.id)}
                    >
                      <div className="flex items-center mb-2 sm:mb-0">
                        <div className="h-10 w-10 bg-brutal-yellow border-[2px] border-black flex items-center justify-center mr-3">
                          <Ticket className="h-5 w-5 text-black" />
                        </div>
                        <div>
                          <div className="text-black font-bold text-base">
                            {coupon.description ||
                              `${tCommon("member")} ${coupon.discountPercentage}%`}
                          </div>
                          <div className="text-gray-600 text-xs font-bold">
                            {coupon.minPurchase
                              ? t("details.min_purchase", { amount: formatCurrency(coupon.minPurchase) })
                              : t("details.no_min_purchase")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
                        <div className="mr-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 border-[2px] border-black inline-flex items-center font-bold
                            ${status === "active"
                                ? "bg-brutal-green text-black"
                                : status === "used"
                                  ? "bg-gray-300 text-black"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                          >
                            {status === "active"
                              ? t("status.active")
                              : status === "used"
                                ? t("status.used")
                                : t("status.expired")}
                          </span>
                        </div>
                        {expandedCoupons.includes(coupon.id) ? (
                          <ChevronUp className="h-4 w-4 text-gray-600" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                    </div>

                    {expandedCoupons.includes(coupon.id) && (
                      <div className="p-3 border-t-[2px] border-black bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-white p-3 border-[2px] border-black">
                            <h3 className="text-black text-xs font-bold mb-2 flex items-center gap-1.5">
                              <Clock size={12} className="text-black" />{" "}
                              {t("details.title")}
                            </h3>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between p-1.5 border-b border-gray-200">
                                <span className="text-gray-600 font-bold">
                                  {t("details.discount")}
                                </span>
                                <span className="text-black font-bold">
                                  {coupon.discountPercentage}%
                                </span>
                              </div>
                              {coupon.maxDiscount && (
                                <div className="flex justify-between p-1.5 border-b border-gray-200">
                                  <span className="text-gray-600 font-bold">
                                    {t("details.max_discount")}
                                  </span>
                                  <span className="text-black font-bold">
                                    {formatCurrency(coupon.maxDiscount)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between p-1.5 border-b border-gray-200">
                                <span className="text-gray-600 font-bold">
                                  {t("details.valid_until")}
                                </span>
                                <span
                                  className={`font-bold ${status === "expired" ? "text-red-600" : "text-black"}`}
                                >
                                  {new Date(coupon.endDate).toLocaleDateString()}
                                </span>
                              </div>
                              {coupon.isUsed && coupon.usedAt && (
                                <div className="flex justify-between p-1.5 border-b border-gray-200">
                                  <span className="text-gray-600 font-bold">
                                    {t("details.used_at")}
                                  </span>
                                  <span className="text-black font-bold">
                                    {new Date(coupon.usedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-white p-3 border-[2px] border-black">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="text-black text-xs font-bold">
                                {t("add_coupon")}
                              </h3>
                              {status === "active" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(coupon.code, coupon.id);
                                  }}
                                  className="text-[10px] text-black underline font-bold flex items-center transition-colors"
                                >
                                  {copiedCode === coupon.id ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      {t("details.copied")}
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3 mr-1" />
                                      {t("details.copy_code")}
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            <div className="p-2 bg-gray-100 border-[2px] border-black font-mono text-black text-xs select-all text-center tracking-wider font-bold">
                              {coupon.code}
                            </div>

                            {status === "active" && (
                              <div className="mt-3 text-center">
                                <Link
                                  href="/games"
                                  className="w-full bg-brutal-blue border-[2px] border-black hover:bg-brutal-blue/80 text-black inline-flex items-center justify-center text-xs py-1.5 transition-all font-bold"
                                >
                                  {t("details.use_now")}
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

        <div className="space-y-4">
          <motion.div
            className="bg-white border-[3px] border-black p-4"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -2 }}
          >
            <h2 className="text-black font-bold mb-3 flex items-center gap-2 text-sm">
              <Plus size={16} className="text-black" /> {t("add_coupon")}
            </h2>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1.5 font-bold">
                  {t("code_label")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t("example_code")}
                    value={newCouponCode}
                    onChange={(e) => {
                      setNewCouponCode(e.target.value.toUpperCase());
                      setErrorMessage("");
                    }}
                    onKeyPress={(e) => e.key === "Enter" && handleClaimCoupon()}
                    className="flex-1 bg-white border-[2px] border-gray-300 px-3 py-1.5 text-xs text-black focus:outline-none focus:border-black transition-all"
                  />
                  <button
                    onClick={handleClaimCoupon}
                    className="bg-black border-[2px] border-black text-white px-3 py-1.5 flex items-center hover:bg-gray-800 transition-all"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                {errorMessage && (
                  <motion.div
                    className={`mt-2 text-[10px] flex items-start p-1.5 border-[2px] ${errorMessage.includes(t("validating")) || errorMessage.includes("กำลัง")
                        ? "text-yellow-700 bg-yellow-50 border-yellow-500"
                        : "text-red-600 bg-red-50 border-red-500"
                      }`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <AlertCircle className="h-3 w-3 mt-0.5 mr-1 flex-shrink-0" />
                    <span className="font-bold">{errorMessage}</span>
                  </motion.div>
                )}
                <p className="text-gray-600 text-[10px] mt-1.5 font-bold">
                  {t("expiry_hint")}
                </p>
              </div>
            </div>
          </motion.div>

          {/* How to Use Section */}
          <motion.div
            className="bg-white border-[3px] border-black p-4"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -2 }}
          >
            <h2 className="text-black font-bold mb-3 text-sm">
              {t("how_to_use.title")}
            </h2>
            <div className="space-y-3">
              <div className="flex">
                <div className="h-5 w-5 bg-brutal-blue border-[2px] border-black text-black flex items-center justify-center mr-2 flex-shrink-0 text-[10px] font-bold">
                  1
                </div>
                <div>
                  <p className="text-gray-600 text-xs font-bold">
                    {t("how_to_use.step1")}
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="h-5 w-5 bg-brutal-blue border-[2px] border-black text-black flex items-center justify-center mr-2 flex-shrink-0 text-[10px] font-bold">
                  2
                </div>
                <div>
                  <p className="text-gray-600 text-xs font-bold">
                    {t("how_to_use.step2")}
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="h-5 w-5 bg-brutal-blue border-[2px] border-black text-black flex items-center justify-center mr-2 flex-shrink-0 text-[10px] font-bold">
                  3
                </div>
                <div>
                  <p className="text-gray-600 text-xs font-bold">
                    {t("how_to_use.step3")}
                  </p>
                </div>
              </div>

              <div className="flex items-center mt-2 pt-2 border-t-[2px] border-black">
                <Clock className="h-3.5 w-3.5 text-gray-600 mr-1.5" />
                <span className="text-gray-600 text-[10px] font-bold">
                  {t("how_to_use.expiry_hint")}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
