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
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonListRow } from "@/components/ui/Skeleton";

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
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-8" />
          <p className="text-site-muted font-medium">{tCommon("loading")}</p>
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
      <SectionHeader level={1} title={t("title")} />

      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder={t("search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="site-input w-full pl-10"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-site-dim" />
        </div>

        <div className="relative w-full sm:w-auto ml-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="site-input appearance-none w-full sm:w-48 pr-10 cursor-pointer"
          >
            <option value="all">{t("filter.all")}</option>
            <option value="active">{t("filter.active")}</option>
            <option value="used">{t("filter.used")}</option>
            <option value="expired">{t("filter.expired")}</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-site-muted pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <SkeletonListRow key={i} />)}
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="site-card p-8 text-center">
              <EmptyState icon={Ticket} message={
                searchTerm
                  ? t("no_search_results", { query: searchTerm })
                  : t("no_coupons_desc")
              } />
              <Link
                href="/games"
                className="site-btn inline-flex mt-4"
              >
                {t("start_shopping")}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCoupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <div
                    key={coupon.userCouponId || coupon.id}
                    className="site-card overflow-hidden"
                  >
                    <div
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-site-raised transition-colors"
                      onClick={() => toggleCouponExpansion(coupon.id)}
                    >
                      <div className="flex items-center mb-3 sm:mb-0">
                        <div className="h-10 w-10 bg-site-raised border border-site-border-soft rounded-6 flex items-center justify-center mr-3 shrink-0 text-site-accent">
                          <Ticket className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-site-text font-semibold text-sm mb-0.5">
                            {coupon.description ||
                              `${tCommon("member")} ${coupon.discountPercentage}%`}
                          </div>
                          <div className="text-site-muted text-xs">
                            {coupon.minPurchase
                              ? t("details.min_purchase", { amount: formatCurrency(coupon.minPurchase) })
                              : t("details.no_min_purchase")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
                        <div className="mr-3">
                          <Badge variant={
                            status === "active" ? "success"
                              : status === "used" ? "neutral"
                                : "danger"
                          }>
                            {status === "active"
                              ? t("status.active")
                              : status === "used"
                                ? t("status.used")
                                : t("status.expired")}
                          </Badge>
                        </div>
                        <div className="p-1.5 rounded-6 bg-site-raised border border-site-border-soft">
                          {expandedCoupons.includes(coupon.id) ? (
                            <ChevronUp className="h-4 w-4 text-site-muted" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-site-muted" />
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedCoupons.includes(coupon.id) && (
                      <div className="p-4 border-t border-site-border-soft bg-site-raised/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-site-surface p-4 rounded-8 border border-site-border-soft">
                            <h3 className="text-site-text text-sm font-semibold mb-3 flex items-center gap-2">
                              <Clock size={14} className="text-site-accent" />{" "}
                              {t("details.title")}
                            </h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-center p-2 rounded-6 bg-site-raised border border-site-border-soft">
                                <span className="text-site-muted">
                                  {t("details.discount")}
                                </span>
                                <span className="text-site-accent font-semibold">
                                  {coupon.discountPercentage}%
                                </span>
                              </div>
                              {coupon.maxDiscount && (
                                <div className="flex justify-between items-center p-2 rounded-6 bg-site-raised border border-site-border-soft">
                                  <span className="text-site-muted">
                                    {t("details.max_discount")}
                                  </span>
                                  <span className="text-site-text font-medium">
                                    {formatCurrency(coupon.maxDiscount)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between items-center p-2 rounded-6 bg-site-raised border border-site-border-soft">
                                <span className="text-site-muted">
                                  {t("details.valid_until")}
                                </span>
                                <span
                                  className={`font-medium ${status === "expired" ? "text-status-danger" : "text-site-text"}`}
                                >
                                  {new Date(coupon.endDate).toLocaleDateString()}
                                </span>
                              </div>
                              {coupon.isUsed && coupon.usedAt && (
                                <div className="flex justify-between items-center p-2 rounded-6 bg-site-raised border border-site-border-soft">
                                  <span className="text-site-muted">
                                    {t("details.used_at")}
                                  </span>
                                  <span className="text-site-text font-medium">
                                    {new Date(coupon.usedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-site-surface p-4 rounded-8 border border-site-border-soft flex flex-col justify-center">
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="text-site-text text-sm font-semibold">
                                {t("add_coupon")}
                              </h3>
                              {status === "active" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(coupon.code, coupon.id);
                                  }}
                                  className="text-xs text-site-accent hover:text-site-text font-medium flex items-center transition-colors"
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
                            <div className="p-3 bg-site-raised border border-site-border-soft rounded-6 font-mono text-site-accent text-lg select-all text-center tracking-wide font-bold">
                              {coupon.code}
                            </div>

                            {status === "active" && (
                              <div className="mt-4">
                                <Link
                                  href="/games"
                                  className="w-full rounded-6 bg-site-surface border border-site-border-soft hover:border-site-accent/50 hover:bg-site-raised text-site-text inline-flex items-center justify-center text-sm py-2.5 transition-colors font-medium"
                                >
                                  {t("details.use_now")}
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="site-card p-6">
            <h2 className="text-site-text font-bold mb-4 flex items-center gap-2 text-sm">
              <Plus size={16} className="text-site-accent" /> {t("add_coupon")}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-site-muted mb-2 font-medium">
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
                    onKeyDown={(e) => e.key === "Enter" && handleClaimCoupon()}
                    className="site-input flex-1 min-w-0"
                  />
                  <button
                    onClick={handleClaimCoupon}
                    className="site-btn px-3 flex items-center justify-center"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                {errorMessage && (
                  <div
                    className={`mt-3 text-xs flex items-start p-2.5 rounded-6 border ${errorMessage.includes(t("validating")) || errorMessage.includes("\u0E01\u0E33\u0E25\u0E31\u0E07")
                      ? "text-status-warning bg-status-warning/10 border-status-warning/20"
                      : "text-status-danger bg-status-danger/10 border-status-danger/20"
                      }`}
                  >
                    <AlertCircle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="font-medium">{errorMessage}</span>
                  </div>
                )}
                <p className="text-site-dim text-xs mt-3 flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3 text-site-accent" />
                  {t("expiry_hint")}
                </p>
              </div>
            </div>
          </div>

          {/* How to Use Section */}
          <div className="site-card p-6">
            <h2 className="text-site-text font-bold mb-4 flex items-center gap-2 text-sm">
              {t("how_to_use.title")}
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="h-6 w-6 rounded-4 bg-site-raised border border-site-border-soft text-site-accent flex items-center justify-center mr-3 flex-shrink-0 text-xs font-semibold">
                  1
                </div>
                <div className="mt-0.5">
                  <p className="text-site-muted text-sm">
                    {t("how_to_use.step1")}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="h-6 w-6 rounded-4 bg-site-raised border border-site-border-soft text-site-accent flex items-center justify-center mr-3 flex-shrink-0 text-xs font-semibold">
                  2
                </div>
                <div className="mt-0.5">
                  <p className="text-site-muted text-sm">
                    {t("how_to_use.step2")}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="h-6 w-6 rounded-4 bg-site-raised border border-site-border-soft text-site-accent flex items-center justify-center mr-3 flex-shrink-0 text-xs font-semibold">
                  3
                </div>
                <div className="mt-0.5">
                  <p className="text-site-muted text-sm">
                    {t("how_to_use.step3")}
                  </p>
                </div>
              </div>

              <div className="flex items-start mt-6 pt-4 border-t border-site-border-soft">
                <Clock className="h-4 w-4 text-site-dim mr-2 mt-0.5" />
                <span className="text-site-dim text-xs leading-relaxed">
                  {t("expiry_hint")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
