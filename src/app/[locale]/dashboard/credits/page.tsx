"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { creditApi, CreditTransaction } from "@/lib/services/credit-api";
import {
  Coins,
  Calendar,
  Award,
  InfoIcon,
  History,
  CreditCard,
  Check,
} from "lucide-react";
import { motion } from "@/lib/framer-exports";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function CreditsPage() {
  const t = useTranslations("Credits");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const pathname = usePathname();
  const { user, isInitialized } = useAuth();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [filteredTransactions, setFilteredTransactions] = useState<
    CreditTransaction[]
  >([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch credits data from API
  useEffect(() => {
    if (isInitialized && user) {
      fetchCreditsData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isInitialized, user]);

  const fetchCreditsData = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const [balanceResponse, transactionsResponse] = await Promise.all([
        creditApi.getBalance(controller.signal),
        creditApi.getTransactions(1, 50, controller.signal),
      ]);

      if (balanceResponse.success) {
        setBalance(balanceResponse.data.balance);
      }

      if (transactionsResponse.success) {
        setTransactions(transactionsResponse.data);
        setFilteredTransactions(transactionsResponse.data);
      }
    } catch (error: any) {
      if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
        toast.error(t("error_loading"));
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, router, isInitialized, pathname]);

  // Filter transactions based on selected period
  useEffect(() => {
    if (period === "all") {
      setFilteredTransactions(transactions);
      return;
    }

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    setFilteredTransactions(
      transactions.filter(
        (transaction) => new Date(transaction.createdAt) >= startDate,
      ),
    );
  }, [period, transactions]);

  // Calculate stats
  const earnedCredits = transactions
    .filter((t) => t.type === "BONUS" || t.type === "REFUND")
    .reduce((sum, t) => sum + t.amount, 0);

  const spentCredits = transactions
    .filter((t) => t.type === "PURCHASE")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  // Get transaction type label
  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "TOPUP":
        return t("types.topup");
      case "PURCHASE":
        return t("types.purchase");
      case "REFUND":
        return t("types.refund");
      case "BONUS":
        return t("types.bonus");
      default:
        return type;
    }
  };

  // Get transaction type color
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "TOPUP":
      case "REFUND":
      case "BONUS":
        return "text-green-500";
      case "PURCHASE":
        return "text-yellow-500";
      default:
        return "text-gray-400";
    }
  };

  // Get transaction icon background
  const getTransactionIconBg = (type: string) => {
    switch (type) {
      case "TOPUP":
      case "REFUND":
      case "BONUS":
        return "bg-green-500/10 text-green-500 border border-green-500/30/20";
      case "PURCHASE":
        return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30/20";
      default:
        return "bg-[#1A1C1E] text-gray-400 border border-site-border";
    }
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#222427] border-t-[var(--site-accent)] rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400 font-medium">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

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
          {t("subtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 bg-[#222427] border border-site-border rounded-xl shadow-ocean">
          <div className="w-8 h-8 border-3 border-[#1A1C1E] border-t-[var(--site-accent)] rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Credits Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <motion.div
                className="bg-[#222427] border border-site-border shadow-ocean rounded-xl overflow-hidden h-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="p-6">
                  <div className="flex items-center mb-6">
                    <div className="text-[var(--site-accent)] p-3 bg-[#1A1C1E] border border-site-border rounded-xl mr-4 shadow-sm">
                      <Coins size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {t("balance_label", { count: balance.toLocaleString() })}
                      </h2>
                      <p className="text-gray-400 text-sm font-medium mt-1">
                        {t("value_hint", { amount: formatCurrency(balance * 0.01) })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#1A1C1E] border border-site-border rounded-xl p-4 transition-colors hover:border-green-500/30/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                          {t("earned")}
                        </span>
                        <span className="bg-green-500/10 border border-green-500/30/20 text-green-500 rounded-md text-[10px] px-2 py-0.5 font-bold">
                          +{earnedCredits.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-white">
                        {earnedCredits.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-[#1A1C1E] border border-site-border rounded-xl p-4 transition-colors hover:border-yellow-500/30/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                          {t("spent")}
                        </span>
                        <span className="bg-yellow-500/10 border border-yellow-500/30/20 text-yellow-500 rounded-md text-[10px] px-2 py-0.5 font-bold">
                          -{spentCredits.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-white">
                        {spentCredits.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-[#1A1C1E] border border-site-border rounded-xl p-4 transition-colors hover:border-[var(--site-accent)]/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                          {t("total_transactions")}
                        </span>
                        <span className="bg-[var(--site-accent)]/10 border border-[var(--site-accent)]/20 text-[var(--site-accent)] rounded-md text-[10px] px-2 py-0.5 font-bold">
                          {transactions.length}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-white">
                        {transactions.length}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    <button
                      onClick={() =>
                        toast.success(t("topup_upcoming"))
                      }
                      className="flex-1 bg-[var(--site-accent)] text-white rounded-lg py-3 px-4 font-semibold flex items-center justify-center hover:bg-[var(--site-accent)]/90 transition-all text-sm shadow-[0_0_15px_rgba(103,176,186,0.3)]"
                    >
                      <Coins size={18} className="mr-2" />
                      {t("topup_button")}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            <div>
              <motion.div
                className="bg-[#222427] border border-site-border shadow-ocean rounded-xl overflow-hidden h-full flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="p-4 border-b border-site-border bg-[#1A1C1E]">
                  <h3 className="text-base font-bold text-white flex items-center">
                    <InfoIcon size={18} className="text-[var(--site-accent)] mr-2.5" />
                    {t("about.title")}
                  </h3>
                </div>

                <div className="p-6 flex-1 bg-[#222427]">
                  <div className="space-y-5 text-gray-400">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-7 h-7 bg-[#1A1C1E] border border-site-border rounded-full flex items-center justify-center mr-3 text-[var(--site-accent)] font-semibold shadow-sm">
                        <span className="text-xs">1</span>
                      </div>
                      <div className="mt-1">
                        <h4 className="font-semibold text-white mb-1.5 text-sm">
                          {t("about.step1_title")}
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {t("about.step1_desc")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-7 h-7 bg-[#1A1C1E] border border-site-border rounded-full flex items-center justify-center mr-3 text-[var(--site-accent)] font-semibold shadow-sm">
                        <span className="text-xs">2</span>
                      </div>
                      <div className="mt-1">
                        <h4 className="font-semibold text-white mb-1.5 text-sm">
                          {t("about.step2_title")}
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {t("about.step2_desc")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-7 h-7 bg-[#1A1C1E] border border-site-border rounded-full flex items-center justify-center mr-3 text-[var(--site-accent)] font-semibold shadow-sm">
                        <span className="text-xs">3</span>
                      </div>
                      <div className="mt-1">
                        <h4 className="font-semibold text-white mb-1.5 text-sm">
                          {t("about.step3_title")}
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {t("about.step3_desc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Activity History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <div
              className="bg-[#222427] border border-site-border shadow-ocean rounded-xl overflow-hidden"
            >
              <div className="p-4 border-b border-site-border bg-[#1A1C1E] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-base font-bold text-white flex items-center">
                  <History size={18} className="text-[var(--site-accent)] mr-2.5" />
                  {t("history.title")}
                </h3>

                <div className="flex bg-[#1A1C1E] border border-site-border p-1 rounded-lg">
                  <button
                    onClick={() => setPeriod("all")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${period === "all" ? "bg-[#222427] text-white shadow-sm" : "text-gray-400 hover:text-white"}`}
                  >
                    {t("history.all")}
                  </button>
                  <button
                    onClick={() => setPeriod("month")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${period === "month" ? "bg-[#222427] text-white shadow-sm" : "text-gray-400 hover:text-white"}`}
                  >
                    {t("history.this_month")}
                  </button>
                  <button
                    onClick={() => setPeriod("week")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${period === "week" ? "bg-[#222427] text-white shadow-sm" : "text-gray-400 hover:text-white"}`}
                  >
                    {t("history.this_week")}
                  </button>
                </div>
              </div>

              <div className="p-4">
                {filteredTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {filteredTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 bg-[#1A1C1E]/50 rounded-xl border border-site-border hover:bg-[#1A1C1E] transition-colors"
                      >
                        <div className="flex items-center">
                          <div
                            className={`p-2.5 rounded-lg mr-4 ${getTransactionIconBg(transaction.type)}`}
                          >
                            {transaction.type === "PURCHASE" ? (
                              <CreditCard size={18} />
                            ) : (
                              <Coins size={18} />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm tracking-wide">
                              {transaction.description ||
                                getTransactionTypeLabel(transaction.type)}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center mt-1 font-medium">
                              <Calendar size={12} className="mr-1.5 opacity-70" />
                              {new Date(
                                transaction.createdAt,
                              ).toLocaleDateString()}{" "}
                              •{" "}
                              {new Date(
                                transaction.createdAt,
                              ).toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`text-lg font-bold ${getTransactionTypeColor(transaction.type)}`}
                        >
                          {transaction.amount > 0 ? "+" : ""}
                          {transaction.amount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-[#1A1C1E] border border-site-border rounded-full flex items-center justify-center mx-auto mb-4">
                      <Coins size={28} className="text-gray-500" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">
                      {t("history.empty")}
                    </h4>
                    <p className="text-gray-400 text-sm max-w-sm mx-auto">
                      {t("history.empty_desc")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
