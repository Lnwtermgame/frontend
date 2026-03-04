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
        return "text-brutal-green";
      case "PURCHASE":
        return "text-brutal-yellow";
      default:
        return "text-gray-600";
    }
  };

  // Get transaction icon background
  const getTransactionIconBg = (type: string) => {
    switch (type) {
      case "TOPUP":
      case "REFUND":
      case "BONUS":
        return "bg-brutal-green border-[2px] border-black";
      case "PURCHASE":
        return "bg-brutal-yellow border-[2px] border-black";
      default:
        return "bg-gray-200 border-[2px] border-black";
    }
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-4">
        <motion.h2
          className="text-lg font-bold text-black mb-1 relative flex items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="w-1.5 h-4 bg-brutal-yellow mr-2"></span>
          {t("title")}
        </motion.h2>
        <p className="text-gray-600 text-xs relative">
          {t("subtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Credits Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2">
              <motion.div
                className="bg-white border-[3px] border-black overflow-hidden h-full"
                style={{ boxShadow: "4px 4px 0 0 #000000" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                whileHover={{ y: -2 }}
              >
                <div className="p-4">
                  <div className="flex items-center mb-4">
                    <div className="text-black p-2 bg-brutal-yellow border-[3px] border-black mr-3">
                      <Coins size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-black">
                        {t("balance_label", { count: balance.toLocaleString() })}
                      </h2>
                      <p className="text-gray-600 text-xs font-bold">
                        {t("value_hint", { amount: formatCurrency(balance * 0.01) })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div className="bg-gray-50 border-[2px] border-black p-3 transition-colors hover:bg-brutal-green/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-600 text-xs font-bold">
                          {t("earned")}
                        </span>
                        <span className="bg-brutal-green border-[2px] border-black text-black text-[10px] px-1.5 py-0.5 font-bold">
                          +{earnedCredits.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-black">
                        {earnedCredits.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-gray-50 border-[2px] border-black p-3 transition-colors hover:bg-brutal-yellow/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-600 text-xs font-bold">
                          {t("spent")}
                        </span>
                        <span className="bg-brutal-yellow border-[2px] border-black text-black text-[10px] px-1.5 py-0.5 font-bold">
                          -{spentCredits.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-black">
                        {spentCredits.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-gray-50 border-[2px] border-black p-3 transition-colors hover:bg-brutal-blue/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-600 text-xs font-bold">
                          {t("total_transactions")}
                        </span>
                        <span className="bg-brutal-blue border-[2px] border-black text-black text-[10px] px-1.5 py-0.5 font-bold">
                          {transactions.length}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-black">
                        {transactions.length}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <button
                      onClick={() =>
                        toast.success(t("topup_upcoming"))
                      }
                      className="flex-1 bg-black text-white border-[3px] border-black text-center py-2 px-3 font-bold flex items-center justify-center hover:bg-gray-800 transition-all text-sm"
                      style={{ boxShadow: "3px 3px 0 0 #000000" }}
                    >
                      <Coins size={16} className="mr-2" />
                      {t("topup_button")}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            <div>
              <motion.div
                className="bg-white border-[3px] border-black overflow-hidden h-full"
                style={{ boxShadow: "4px 4px 0 0 #000000" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                whileHover={{ y: -2 }}
              >
                <div className="p-3 border-b-[3px] border-black bg-brutal-blue">
                  <h3 className="text-base font-bold text-black flex items-center">
                    <InfoIcon size={16} className="text-black mr-2" />
                    {t("about.title")}
                  </h3>
                </div>

                <div className="p-4">
                  <div className="space-y-3 text-gray-600">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-brutal-blue border-[2px] border-black flex items-center justify-center mr-2 text-black font-bold">
                        <span className="font-bold text-xs">1</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-black mb-0.5 text-sm">
                          {t("about.step1_title")}
                        </h4>
                        <p className="text-xs font-medium">
                          {t("about.step1_desc")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-brutal-blue border-[2px] border-black flex items-center justify-center mr-2 text-black font-bold">
                        <span className="font-bold text-xs">2</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-black mb-0.5 text-sm">
                          {t("about.step2_title")}
                        </h4>
                        <p className="text-xs font-medium">
                          {t("about.step2_desc")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-brutal-blue border-[2px] border-black flex items-center justify-center mr-2 text-black font-bold">
                        <span className="font-bold text-xs">3</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-black mb-0.5 text-sm">
                          {t("about.step3_title")}
                        </h4>
                        <p className="text-xs font-medium">
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
              className="bg-white border-[3px] border-black overflow-hidden"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <div className="p-3 border-b-[3px] border-black bg-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base font-bold text-black flex items-center">
                  <History size={16} className="text-black mr-2" />
                  {t("history.title")}
                </h3>

                <div className="flex bg-white border-[2px] border-black p-1">
                  <button
                    onClick={() => setPeriod("all")}
                    className={`px-2 py-1 text-[10px] font-bold transition-all ${period === "all" ? "bg-black text-white" : "text-gray-600 hover:text-black"}`}
                  >
                    {t("history.all")}
                  </button>
                  <button
                    onClick={() => setPeriod("month")}
                    className={`px-2 py-1 text-[10px] font-bold transition-all ${period === "month" ? "bg-black text-white" : "text-gray-600 hover:text-black"}`}
                  >
                    {t("history.this_month")}
                  </button>
                  <button
                    onClick={() => setPeriod("week")}
                    className={`px-2 py-1 text-[10px] font-bold transition-all ${period === "week" ? "bg-black text-white" : "text-gray-600 hover:text-black"}`}
                  >
                    {t("history.this_week")}
                  </button>
                </div>
              </div>

              <div className="p-3">
                {filteredTransactions.length > 0 ? (
                  <div className="space-y-2">
                    {filteredTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-gray-50 border-[2px] border-black hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          <div
                            className={`p-2 mr-3 ${getTransactionIconBg(transaction.type)}`}
                          >
                            {transaction.type === "PURCHASE" ? (
                              <CreditCard size={16} className="text-black" />
                            ) : (
                              <Coins size={16} className="text-black" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-black text-sm">
                              {transaction.description ||
                                getTransactionTypeLabel(transaction.type)}
                            </p>
                            <p className="text-[10px] text-gray-600 flex items-center mt-0.5 font-bold">
                              <Calendar size={10} className="mr-1" />
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
                          className={`text-base font-bold ${getTransactionTypeColor(transaction.type)}`}
                        >
                          {transaction.amount > 0 ? "+" : ""}
                          {transaction.amount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 border-[2px] border-black flex items-center justify-center mx-auto mb-3">
                      <Coins size={24} className="text-gray-400" />
                    </div>
                    <h4 className="text-base font-bold text-black mb-1">
                      {t("history.empty")}
                    </h4>
                    <p className="text-gray-600 text-xs font-bold">
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
