"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { creditApi, CreditTransaction } from "@/lib/services/credit-api";
import {
  Coins,
  Calendar,
  InfoIcon,
  History,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonListRow } from "@/components/ui/Skeleton";

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

  // Get transaction type color class
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "TOPUP":
      case "REFUND":
      case "BONUS":
        return "text-status-success";
      case "PURCHASE":
        return "text-status-warning";
      default:
        return "text-site-muted";
    }
  };

  // Get transaction icon background class
  const getTransactionIconBg = (type: string) => {
    switch (type) {
      case "TOPUP":
      case "REFUND":
      case "BONUS":
        return "bg-status-success/10 text-status-success border border-status-success/20";
      case "PURCHASE":
        return "bg-status-warning/10 text-status-warning border border-status-warning/20";
      default:
        return "bg-site-raised text-site-muted border border-site-border-soft";
    }
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-8" />
          <p className="text-site-muted font-medium">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader level={1} title={t("title")} sublabel={t("subtitle")} />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <SkeletonListRow key={i} />)}
        </div>
      ) : (
        <>
          {/* Credits Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <div className="site-card p-6 h-full">
                <div className="flex items-center mb-6">
                  <div className="text-site-accent p-3 bg-site-raised border border-site-border-soft rounded-8 mr-4">
                    <Coins size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-site-text">
                      {t("balance_label", { count: balance.toLocaleString() })}
                    </h2>
                    <p className="text-site-muted text-xs font-medium mt-1">
                      {t("value_hint", { amount: formatCurrency(balance * 0.01) })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="site-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] uppercase text-site-dim font-semibold tracking-wider">
                        {t("earned")}
                      </span>
                      <Badge variant="success">
                        +{earnedCredits.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="text-xl font-bold text-site-text">
                      {earnedCredits.toLocaleString()}
                    </div>
                  </div>

                  <div className="site-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] uppercase text-site-dim font-semibold tracking-wider">
                        {t("spent")}
                      </span>
                      <Badge variant="warning">
                        -{spentCredits.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="text-xl font-bold text-site-text">
                      {spentCredits.toLocaleString()}
                    </div>
                  </div>

                  <div className="site-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] uppercase text-site-dim font-semibold tracking-wider">
                        {t("total_transactions")}
                      </span>
                      <Badge variant="info">
                        {transactions.length}
                      </Badge>
                    </div>
                    <div className="text-xl font-bold text-site-text">
                      {transactions.length}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    onClick={() =>
                      toast.success(t("topup_upcoming"))
                    }
                    className="site-btn flex-1 py-3 px-4 flex items-center justify-center text-sm"
                  >
                    <Coins size={18} className="mr-2" />
                    {t("topup_button")}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="site-card overflow-hidden h-full flex flex-col">
                <div className="p-4 border-b border-site-border-soft bg-site-raised">
                  <h3 className="text-sm font-bold text-site-text flex items-center">
                    <InfoIcon size={16} className="text-site-accent mr-2" />
                    {t("about.title")}
                  </h3>
                </div>

                <div className="p-6 flex-1">
                  <div className="space-y-5 text-site-muted">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-7 h-7 bg-site-raised border border-site-border-soft rounded-4 flex items-center justify-center mr-3 text-site-accent font-semibold">
                        <span className="text-xs">1</span>
                      </div>
                      <div className="mt-1">
                        <h4 className="font-semibold text-site-text mb-1.5 text-sm">
                          {t("about.step1_title")}
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {t("about.step1_desc")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-7 h-7 bg-site-raised border border-site-border-soft rounded-4 flex items-center justify-center mr-3 text-site-accent font-semibold">
                        <span className="text-xs">2</span>
                      </div>
                      <div className="mt-1">
                        <h4 className="font-semibold text-site-text mb-1.5 text-sm">
                          {t("about.step2_title")}
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {t("about.step2_desc")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-7 h-7 bg-site-raised border border-site-border-soft rounded-4 flex items-center justify-center mr-3 text-site-accent font-semibold">
                        <span className="text-xs">3</span>
                      </div>
                      <div className="mt-1">
                        <h4 className="font-semibold text-site-text mb-1.5 text-sm">
                          {t("about.step3_title")}
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {t("about.step3_desc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity History */}
          <div className="site-card overflow-hidden">
            <div className="p-4 border-b border-site-border-soft bg-site-raised flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-sm font-bold text-site-text flex items-center">
                <History size={16} className="text-site-accent mr-2" />
                {t("history.title")}
              </h3>

              <div className="flex bg-site-surface border border-site-border-soft p-1 rounded-6">
                <button
                  onClick={() => setPeriod("all")}
                  className={`px-3 py-1.5 rounded-4 text-xs font-semibold transition-colors ${period === "all" ? "bg-site-raised text-site-text" : "text-site-muted hover:text-site-text"}`}
                >
                  {t("history.all")}
                </button>
                <button
                  onClick={() => setPeriod("month")}
                  className={`px-3 py-1.5 rounded-4 text-xs font-semibold transition-colors ${period === "month" ? "bg-site-raised text-site-text" : "text-site-muted hover:text-site-text"}`}
                >
                  {t("history.this_month")}
                </button>
                <button
                  onClick={() => setPeriod("week")}
                  className={`px-3 py-1.5 rounded-4 text-xs font-semibold transition-colors ${period === "week" ? "bg-site-raised text-site-text" : "text-site-muted hover:text-site-text"}`}
                >
                  {t("history.this_week")}
                </button>
              </div>
            </div>

            <div className="p-4">
              {filteredTransactions.length > 0 ? (
                <div className="space-y-0">
                  {filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border-b border-site-border-soft last:border-b-0 hover:bg-site-raised transition-colors rounded-6"
                    >
                      <div className="flex items-center">
                        <div
                          className={`p-2 rounded-6 mr-3 ${getTransactionIconBg(transaction.type)}`}
                        >
                          {transaction.type === "PURCHASE" ? (
                            <CreditCard size={16} />
                          ) : (
                            <Coins size={16} />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-site-text text-sm tracking-wide">
                            {transaction.description ||
                              getTransactionTypeLabel(transaction.type)}
                          </p>
                          <p className="text-[11px] text-site-dim flex items-center mt-0.5 font-medium">
                            <Calendar size={11} className="mr-1 opacity-70" />
                            {new Date(
                              transaction.createdAt,
                            ).toLocaleDateString()}{" "}
                            {"\u2022"}{" "}
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
                <EmptyState icon={Coins} message={t("history.empty")} description={t("history.empty_desc")} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
