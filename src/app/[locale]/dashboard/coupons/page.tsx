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
          <div className="w-12 h-12 border-4 border-[#222427] border-t-[var(--site-accent)] rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400 font-medium">{tCommon("loading")}</p>
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
      <div className="relative mb-6">
        <motion.h2
          className="text-2xl font-bold text-white mb-2 relative flex items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="w-1.5 h-6 bg-[var(--site-accent)] mr-3 rounded-full"></span>
          {t("title")}
        </motion.h2>
        <p className="text-gray-400 text-sm ml-4 border-l-2 border-site-border pl-3">
          {t("subtitle", { count: activeCouponCount })}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder={t("search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1A1C1E] border border-site-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--site-accent)] pl-10 transition-all placeholder-gray-500"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>

        <div className="relative w-full sm:w-auto ml-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none w-full sm:w-48 bg-[#1A1C1E] border border-site-border rounded-lg px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-[var(--site-accent)] transition-all cursor-pointer"
          >
            <option value="all">{t("filter.all")}</option>
            <option value="active">{t("filter.active")}</option>
            <option value="used">{t("filter.used")}</option>
            <option value="expired">{t("filter.expired")}</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 bg-[#222427] border border-site-border rounded-xl shadow-ocean">
              <div className="w-8 h-8 border-3 border-[#1A1C1E] border-t-[var(--site-accent)] rounded-full animate-spin"></div>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <motion.div
              className="bg-[#222427] border border-site-border rounded-xl shadow-ocean p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-16 h-16 bg-[#1A1C1E] rounded-full border border-site-border flex items-center justify-center mx-auto mb-4">
                <Ticket className="h-8 w-8 text-gray-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {t("no_coupons")}
              </h2>
              <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                {searchTerm
                  ? t("no_search_results", { query: searchTerm })
                  : t("no_coupons_desc")}
              </p>
              <Link
                href="/games"
                className="inline-flex items-center px-6 py-2.5 rounded-lg bg-[var(--site-accent)] hover:bg-[var(--site-accent)]/90 text-white font-semibold transition-all shadow-[0_0_15px_rgba(103,176,186,0.3)] text-sm"
              >
                {t("start_shopping")}
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredCoupons.map((coupon, index) => {
                const status = getCouponStatus(coupon);
                return (
                  <motion.div
                    key={coupon.userCouponId || coupon.id}
                    className="bg-[#222427] border border-site-border rounded-xl shadow-ocean overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-[#1A1C1E]/50 transition-colors"
                      onClick={() => toggleCouponExpansion(coupon.id)}
                    >
                      <div className="flex items-center mb-3 sm:mb-0">
                        <div className="h-12 w-12 bg-[#1A1C1E] border border-site-border rounded-lg flex items-center justify-center mr-4 shrink-0 text-[var(--site-accent)]">
                          <Ticket className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="text-white font-semibold text-base mb-1">
                            {coupon.description ||
                              `${tCommon("member")} ${coupon.discountPercentage}%`}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {coupon.minPurchase
                              ? t("details.min_purchase", { amount: formatCurrency(coupon.minPurchase) })
                              : t("details.no_min_purchase")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
                        <div className="mr-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide border
                            ${status === "active"
                                ? "bg-green-500/10 text-green-500 border-green-500/30/20"
                                : status === "used"
                                  ? "bg-[#181A1D]0/10 text-gray-400 border-gray-500/20"
                                  : "bg-red-500/10 text-red-500 border-red-500/30/20"
                              }`}
                          >
                            {status === "active"
                              ? t("status.active")
                              : status === "used"
                                ? t("status.used")
                                : t("status.expired")}
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-[#1A1C1E] border border-site-border">
                          {expandedCoupons.includes(coupon.id) ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedCoupons.includes(coupon.id) && (
                      <div className="p-4 border-t border-site-border bg-[#1A1C1E]/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-[#1A1C1E] p-4 rounded-xl border border-site-border">
                            <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                              <Clock size={14} className="text-[var(--site-accent)]" />{" "}
                              {t("details.title")}
                            </h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-center p-2 rounded-lg bg-[#222427] border border-site-border">
                                <span className="text-gray-400">
                                  {t("details.discount")}
                                </span>
                                <span className="text-[var(--site-accent)] font-semibold">
                                  {coupon.discountPercentage}%
                                </span>
                              </div>
                              {coupon.maxDiscount && (
                                <div className="flex justify-between items-center p-2 rounded-lg bg-[#222427] border border-site-border">
                                  <span className="text-gray-400">
                                    {t("details.max_discount")}
                                  </span>
                                  <span className="text-white font-medium">
                                    {formatCurrency(coupon.maxDiscount)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between items-center p-2 rounded-lg bg-[#222427] border border-site-border">
                                <span className="text-gray-400">
                                  {t("details.valid_until")}
                                </span>
                                <span
                                  className={`font-medium ${status === "expired" ? "text-red-500" : "text-white"}`}
                                >
                                  {new Date(coupon.endDate).toLocaleDateString()}
                                </span>
                              </div>
                              {coupon.isUsed && coupon.usedAt && (
                                <div className="flex justify-between items-center p-2 rounded-lg bg-[#222427] border border-site-border">
                                  <span className="text-gray-400">
                                    {t("details.used_at")}
                                  </span>
                                  <span className="text-white font-medium">
                                    {new Date(coupon.usedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-[#1A1C1E] p-4 rounded-xl border border-site-border flex flex-col justify-center">
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="text-white text-sm font-semibold">
                                {t("add_coupon")}
                              </h3>
                              {status === "active" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(coupon.code, coupon.id);
                                  }}
                                  className="text-xs text-[var(--site-accent)] hover:text-white font-medium flex items-center transition-colors"
                                >
                                  {copiedCode === coupon.id ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 mr-1" />
                                      {t("details.copied")}
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5 mr-1" />
                                      {t("details.copy_code")}
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            <div className="p-3 bg-[#222427] border border-site-border rounded-lg font-mono text-[var(--site-accent)] text-lg select-all text-center tracking-widest font-bold">
                              {coupon.code}
                            </div>

                            {status === "active" && (
                              <div className="mt-4">
                                <Link
                                  href="/games"
                                  className="w-full rounded-lg bg-[#222427] border border-site-border hover:border-[var(--site-accent)]/50 hover:bg-[#2A2D31] text-white inline-flex items-center justify-center text-sm py-2.5 transition-all shadow-sm font-medium"
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

        <div className="space-y-6">
          <motion.div
            className="bg-[#222427] border border-site-border rounded-xl shadow-ocean p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-white font-bold mb-4 flex items-center gap-2 text-base">
              <Plus size={18} className="text-[var(--site-accent)]" /> {t("add_coupon")}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-2 font-medium">
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
                    className="flex-1 min-w-0 bg-[#1A1C1E] border border-site-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--site-accent)] transition-all placeholder-gray-500"
                  />
                  <button
                    onClick={handleClaimCoupon}
                    className="bg-[var(--site-accent)] hover:bg-[var(--site-accent)]/80 text-white rounded-lg px-3 flex items-center justify-center transition-all shadow-[0_0_10px_rgba(103,176,186,0.2)]"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                {errorMessage && (
                  <motion.div
                    className={`mt-3 text-xs flex items-start p-2.5 rounded-lg border ${errorMessage.includes(t("validating")) || errorMessage.includes("กำลัง")
                      ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/30/20"
                      : "text-red-500 bg-red-500/10 border-red-500/30/20"
                      }`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <AlertCircle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="font-medium">{errorMessage}</span>
                  </motion.div>
                )}
                <p className="text-gray-500 text-xs mt-3 flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3 text-[var(--site-accent)]" />
                  {t("expiry_hint")}
                </p>
              </div>
            </div>
          </motion.div>

          {/* How to Use Section */}
          <motion.div
            className="bg-[#222427] border border-site-border rounded-xl shadow-ocean p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-white font-bold mb-4 flex items-center gap-2 text-base">
              {t("how_to_use.title")}
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="h-6 w-6 rounded-full bg-[#1A1C1E] border border-site-border text-[var(--site-accent)] flex items-center justify-center mr-3 flex-shrink-0 text-xs font-semibold">
                  1
                </div>
                <div className="mt-0.5">
                  <p className="text-gray-300 text-sm">
                    {t("how_to_use.step1")}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="h-6 w-6 rounded-full bg-[#1A1C1E] border border-site-border text-[var(--site-accent)] flex items-center justify-center mr-3 flex-shrink-0 text-xs font-semibold">
                  2
                </div>
                <div className="mt-0.5">
                  <p className="text-gray-300 text-sm">
                    {t("how_to_use.step2")}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="h-6 w-6 rounded-full bg-[#1A1C1E] border border-site-border text-[var(--site-accent)] flex items-center justify-center mr-3 flex-shrink-0 text-xs font-semibold">
                  3
                </div>
                <div className="mt-0.5">
                  <p className="text-gray-300 text-sm">
                    {t("how_to_use.step3")}
                  </p>
                </div>
              </div>

              <div className="flex items-start mt-6 pt-4 border-t border-site-border">
                <Clock className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                <span className="text-gray-500 text-xs leading-relaxed">
                  {t("expiry_hint")}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
