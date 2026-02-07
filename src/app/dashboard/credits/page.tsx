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
        return 'text-brutal-green';
      case 'PURCHASE':
        return 'text-brutal-yellow';
      default:
        return 'text-gray-600';
    }
  };

  // Get transaction icon background
  const getTransactionIconBg = (type: string) => {
    switch (type) {
      case 'TOPUP':
      case 'REFUND':
      case 'BONUS':
        return 'bg-brutal-green border-[2px] border-black';
      case 'PURCHASE':
        return 'bg-brutal-yellow border-[2px] border-black';
      default:
        return 'bg-gray-200 border-[2px] border-black';
    }
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 thai-font">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-6">
        <motion.h2
          className="text-xl font-bold text-black mb-1 relative flex items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="w-1.5 h-5 bg-brutal-yellow mr-2"></span>
          เครดิต
        </motion.h2>
        <p className="text-gray-600 text-sm relative thai-font">สะสมและแลกเครดิตเพื่อรับของรางวัลสุดพิเศษ</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Credits Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <motion.div
                className="bg-white border-[3px] border-black overflow-hidden h-full"
                style={{ boxShadow: '4px 4px 0 0 #000000' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                whileHover={{ y: -2 }}
              >
                <div className="p-6 md:p-8">
                  <div className="flex items-center mb-6">
                    <div className="text-black p-3 bg-brutal-yellow border-[3px] border-black mr-4">
                      <Coins size={32} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-black thai-font">
                        {balance.toLocaleString()} เครดิต
                      </h2>
                      <p className="text-gray-600 text-sm thai-font">
                        มูลค่าเทียบเท่า {formatCurrency(balance * 0.01)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 border-[2px] border-black p-4 transition-colors hover:bg-brutal-green/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 text-sm thai-font">เครดิตที่ได้รับ</span>
                        <span className="bg-brutal-green border-[2px] border-black text-black text-xs px-2 py-0.5 font-bold">
                          +{earnedCredits.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-black">{earnedCredits.toLocaleString()}</div>
                    </div>

                    <div className="bg-gray-50 border-[2px] border-black p-4 transition-colors hover:bg-brutal-yellow/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 text-sm thai-font">เครดิตที่ใช้ไป</span>
                        <span className="bg-brutal-yellow border-[2px] border-black text-black text-xs px-2 py-0.5 font-bold">
                          -{spentCredits.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-black">{spentCredits.toLocaleString()}</div>
                    </div>

                    <div className="bg-gray-50 border-[2px] border-black p-4 transition-colors hover:bg-brutal-blue/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 text-sm thai-font">ธุรกรรมทั้งหมด</span>
                        <span className="bg-brutal-blue border-[2px] border-black text-black text-xs px-2 py-0.5 font-bold">
                          {transactions.length}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-black">{transactions.length}</div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    <button
                      onClick={() => toast.success('ฟีเจอร์เติมเงินจะเปิดให้ใช้งานเร็วๆ นี้')}
                      className="flex-1 bg-black text-white border-[3px] border-black text-center py-3 px-4 font-bold flex items-center justify-center hover:bg-gray-800 transition-all thai-font"
                      style={{ boxShadow: '3px 3px 0 0 #000000' }}
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
                className="bg-white border-[3px] border-black overflow-hidden h-full"
                style={{ boxShadow: '4px 4px 0 0 #000000' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                whileHover={{ y: -2 }}
              >
                <div className="p-5 border-b-[3px] border-black bg-brutal-blue">
                  <h3 className="text-lg font-bold text-black flex items-center thai-font">
                    <InfoIcon size={18} className="text-black mr-2" />
                    เกี่ยวกับเครดิต
                  </h3>
                </div>

                <div className="p-5">
                  <div className="space-y-4 text-gray-600">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-brutal-blue border-[2px] border-black flex items-center justify-center mr-3 text-black font-bold">
                        <span className="font-bold text-sm">1</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-black mb-1 thai-font">รับเครดิต</h4>
                        <p className="text-sm thai-font">รับเครดิตจากการซื้อสินค้า โปรโมชั่น และการแนะนำเพื่อน</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-brutal-blue border-[2px] border-black flex items-center justify-center mr-3 text-black font-bold">
                        <span className="font-bold text-sm">2</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-black mb-1 thai-font">แลกเครดิต</h4>
                        <p className="text-sm thai-font">ใช้เครดิตเป็นส่วนลดในการซื้อสินค้าหรือแลกของรางวัล</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-brutal-blue border-[2px] border-black flex items-center justify-center mr-3 text-black font-bold">
                        <span className="font-bold text-sm">3</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-black mb-1 thai-font">มูลค่าเครดิต</h4>
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
            <div className="bg-white border-[3px] border-black overflow-hidden" style={{ boxShadow: '4px 4px 0 0 #000000' }}>
              <div className="p-5 border-b-[3px] border-black bg-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-black flex items-center thai-font">
                  <History size={18} className="text-black mr-2" />
                  ประวัติเครดิต
                </h3>

                <div className="flex bg-white border-[2px] border-black p-1">
                  <button
                    onClick={() => setPeriod('all')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all thai-font ${period === 'all' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'}`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    onClick={() => setPeriod('month')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all thai-font ${period === 'month' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'}`}
                  >
                    เดือนนี้
                  </button>
                  <button
                    onClick={() => setPeriod('week')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all thai-font ${period === 'week' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'}`}
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
                        className="flex items-center justify-between p-4 bg-gray-50 border-[2px] border-black hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className={`p-3 mr-4 ${getTransactionIconBg(transaction.type)}`}>
                            {transaction.type === 'PURCHASE' ? <CreditCard size={20} className="text-black" /> : <Coins size={20} className="text-black" />}
                          </div>
                          <div>
                            <p className="font-bold text-black">{transaction.description || getTransactionTypeLabel(transaction.type)}</p>
                            <p className="text-xs text-gray-600 flex items-center mt-1">
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
                    <div className="w-16 h-16 bg-gray-100 border-[2px] border-black flex items-center justify-center mx-auto mb-4">
                      <Coins size={32} className="text-gray-400" />
                    </div>
                    <h4 className="text-lg font-bold text-black mb-2 thai-font">ไม่มีรายการเคลื่อนไหวเครดิต</h4>
                    <p className="text-gray-600 text-sm thai-font">
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
