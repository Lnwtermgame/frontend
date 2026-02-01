"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { creditApi, CreditTransaction } from "@/lib/services/credit-api";
import { Coins, Calendar, Award, InfoIcon, History, CreditCard, Check } from "lucide-react";
import { motion } from "@/lib/framer-exports";
import toast from "react-hot-toast";

export default function CreditsPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [filteredTransactions, setFilteredTransactions] = useState<CreditTransaction[]>([]);

  // Fetch credits data from API
  useEffect(() => {
    if (isInitialized && user) {
      fetchCreditsData();
    }
  }, [isInitialized, user]);

  const fetchCreditsData = async () => {
    setIsLoading(true);
    try {
      const [balanceResponse, transactionsResponse] = await Promise.all([
        creditApi.getBalance(),
        creditApi.getTransactions(1, 50)
      ]);

      if (balanceResponse.success) {
        setBalance(balanceResponse.data.balance);
      }

      if (transactionsResponse.success) {
        setTransactions(transactionsResponse.data);
        setFilteredTransactions(transactionsResponse.data);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลเครดิตได้');
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
      transactions.filter(transaction =>
        new Date(transaction.createdAt) >= startDate
      )
    );
  }, [period, transactions]);

  // Calculate stats
  const earnedCredits = transactions
    .filter(t => t.type === 'BONUS' || t.type === 'REFUND')
    .reduce((sum, t) => sum + t.amount, 0);

  const spentCredits = transactions
    .filter(t => t.type === 'PURCHASE')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  // Get transaction type label
  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'TOPUP': return 'เติมเงิน';
      case 'PURCHASE': return 'ซื้อสินค้า';
      case 'REFUND': return 'คืนเงิน';
      case 'BONUS': return 'โบนัส';
      default: return type;
    }
  };

  // Get transaction type color
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'TOPUP':
      case 'REFUND':
      case 'BONUS':
        return 'text-green-400';
      case 'PURCHASE':
        return 'text-amber-400';
      default:
        return 'text-mali-text-secondary';
    }
  };

  // Get transaction icon background
  const getTransactionIconBg = (type: string) => {
    switch (type) {
      case 'TOPUP':
      case 'REFUND':
      case 'BONUS':
        return 'bg-green-900/20 text-green-400 border-green-500/20';
      case 'PURCHASE':
        return 'bg-amber-900/20 text-amber-400 border-amber-500/20';
      default:
        return 'bg-mali-blue/20 text-mali-blue-light border-mali-blue/20';
    }
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

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-6">
        <motion.h2
          className="text-xl font-bold text-white mb-1 relative"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          เครดิต
        </motion.h2>
        <p className="text-mali-text-secondary text-sm relative thai-font">สะสมและแลกเครดิตเพื่อรับของรางวัลสุดพิเศษ</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Credits Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <motion.div
                className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden h-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="p-6 md:p-8">
                  <div className="flex items-center mb-6">
                    <div className="text-mali-blue-accent p-3 bg-mali-blue/10 rounded-xl mr-4 border border-mali-blue/20">
                      <Coins size={32} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white thai-font">
                        {balance.toLocaleString()} เครดิต
                      </h2>
                      <p className="text-mali-text-secondary text-sm thai-font">
                        มูลค่าเทียบเท่า {formatCurrency(balance * 0.01)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-mali-blue/5 border border-mali-blue/10 rounded-xl p-4 transition-colors hover:bg-mali-blue/10 hover:border-mali-blue/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-mali-text-secondary text-sm thai-font">เครดิตที่ได้รับ</span>
                        <span className="bg-green-900/30 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/20">
                          +{earnedCredits.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-white">{earnedCredits.toLocaleString()}</div>
                    </div>

                    <div className="bg-mali-blue/5 border border-mali-blue/10 rounded-xl p-4 transition-colors hover:bg-mali-blue/10 hover:border-mali-blue/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-mali-text-secondary text-sm thai-font">เครดิตที่ใช้ไป</span>
                        <span className="bg-amber-900/30 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-mali-blue/10">
                          -{spentCredits.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-white">{spentCredits.toLocaleString()}</div>
                    </div>

                    <div className="bg-mali-blue/5 border border-mali-blue/10 rounded-xl p-4 transition-colors hover:bg-mali-blue/10 hover:border-mali-blue/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-mali-text-secondary text-sm thai-font">ธุรกรรมทั้งหมด</span>
                        <span className="bg-mali-blue/30 text-mali-blue-accent text-xs px-2 py-0.5 rounded-full border border-mali-blue/20">
                          {transactions.length}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-white">{transactions.length}</div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    <button
                      onClick={() => toast.success('ฟีเจอร์เติมเงินจะเปิดให้ใช้งานเร็วๆ นี้')}
                      className="flex-1 bg-mali-blue hover:bg-mali-blue/90 text-white text-center py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-all thai-font"
                    >
                      <Coins size={18} className="mr-2" />
                      เติมเครดิต
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            <div>
              <motion.div
                className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden h-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="p-5 border-b border-mali-blue/20 bg-mali-blue/5">
                  <h3 className="text-lg font-bold text-white flex items-center thai-font">
                    <InfoIcon size={18} className="text-mali-blue-accent mr-2" />
                    เกี่ยวกับเครดิต
                  </h3>
                </div>

                <div className="p-5">
                  <div className="space-y-4 text-mali-text-secondary">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-mali-blue/10 border border-mali-blue/20 flex items-center justify-center mr-3 text-mali-blue-accent">
                        <span className="font-bold text-sm">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-white mb-1 thai-font">รับเครดิต</h4>
                        <p className="text-sm thai-font">รับเครดิตจากการซื้อสินค้า โปรโมชั่น และการแนะนำเพื่อน</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-mali-blue/10 border border-mali-blue/20 flex items-center justify-center mr-3 text-mali-blue-accent">
                        <span className="font-bold text-sm">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-white mb-1 thai-font">แลกเครดิต</h4>
                        <p className="text-sm thai-font">ใช้เครดิตเป็นส่วนลดในการซื้อสินค้าหรือแลกของรางวัล</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-mali-blue/10 border border-mali-blue/20 flex items-center justify-center mr-3 text-mali-blue-accent">
                        <span className="font-bold text-sm">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-white mb-1 thai-font">มูลค่าเครดิต</h4>
                        <p className="text-sm thai-font">ทุกๆ 100 เครดิตมีมูลค่า 1 THB เมื่อใช้เป็นส่วนลด</p>
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
            <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-mali-blue/20 bg-mali-blue/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-white flex items-center thai-font">
                  <History size={18} className="text-mali-blue-accent mr-2" />
                  ประวัติเครดิต
                </h3>

                <div className="flex bg-mali-blue/10 p-1 rounded-lg self-start sm:self-auto">
                  <button
                    onClick={() => setPeriod('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all thai-font ${period === 'all' ? 'bg-mali-card text-white shadow-sm' : 'text-mali-text-secondary hover:text-white'}`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    onClick={() => setPeriod('month')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all thai-font ${period === 'month' ? 'bg-mali-card text-white shadow-sm' : 'text-mali-text-secondary hover:text-white'}`}
                  >
                    เดือนนี้
                  </button>
                  <button
                    onClick={() => setPeriod('week')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all thai-font ${period === 'week' ? 'bg-mali-card text-white shadow-sm' : 'text-mali-text-secondary hover:text-white'}`}
                  >
                    สัปดาห์นี้
                  </button>
                </div>
              </div>

              <div className="p-5">
                {filteredTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {filteredTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 bg-mali-blue/5 border border-mali-blue/10 rounded-xl hover:bg-mali-blue/10 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className={`p-3 rounded-lg mr-4 border ${getTransactionIconBg(transaction.type)}`}>
                            {transaction.type === 'PURCHASE' ? <CreditCard size={20} /> : <Coins size={20} />}
                          </div>
                          <div>
                            <p className="font-medium text-white">{transaction.description || getTransactionTypeLabel(transaction.type)}</p>
                            <p className="text-xs text-mali-text-secondary flex items-center mt-1">
                              <Calendar size={10} className="mr-1" />
                              {new Date(transaction.createdAt).toLocaleDateString('th-TH')} • {new Date(transaction.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className={`text-lg font-bold ${getTransactionTypeColor(transaction.type)}`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-mali-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Coins size={32} className="text-mali-text-secondary opacity-50" />
                    </div>
                    <h4 className="text-lg font-medium text-white mb-2 thai-font">ไม่มีรายการเคลื่อนไหวเครดิต</h4>
                    <p className="text-mali-text-secondary text-sm thai-font">
                      คุณไม่มีรายการเคลื่อนไหวเครดิตในช่วงเวลาที่เลือก
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
