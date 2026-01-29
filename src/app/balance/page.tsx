"use client";

import { motion } from "@/lib/framer-exports";
import { useTranslations } from "@/lib/context/language-context";
import Link from "next/link";
import { DollarSign, Clock, ChevronRight, Info, Shield, ArrowUp, Wallet, PiggyBank, Receipt, AlertCircle } from "lucide-react";

interface Transaction {
  date: string;
  description: string;
  amount: number;
  balance: string;
}

export default function BalancePage() {
  const { t } = useTranslations();
  
  // Mock transaction history
  const transactions: Transaction[] = [];

  return (
    <div className="page-container">
      {/* Page Header with blur effect - redesigned to match the preferred style */}
      <div className="relative mb-8">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-mali-purple/20 blur-3xl"></div>
        <div className="absolute -top-10 right-10 w-80 h-80 rounded-full bg-mali-blue/20 blur-3xl"></div>
        
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl font-bold text-white">
        {t('balance')}
            </h1>
            <p className="text-mali-text-secondary mt-1">
              Add funds to your account balance
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Balance display */}
        <motion.div 
          className="lg:col-span-2 bg-mali-card rounded-xl border border-mali-blue/20 shadow-card-hover"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Wallet size={22} className="text-mali-blue-light mr-2" />
              <h2 className="text-lg font-semibold text-white">Current Balance</h2>
            </div>
            
            <div className="bg-gradient-to-r from-mali-blue/30 to-mali-purple/30 p-6 rounded-lg border border-mali-blue/30 mb-6 shadow-blue-glow">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mali-blue-light to-mali-purple flex items-center justify-center mr-4 shadow-blue-glow">
                  <PiggyBank size={24} className="text-white" />
                </div>
                <div>
                  <span className="text-mali-text-secondary text-sm">Available funds</span>
              <div className="flex items-center">
                <img 
                  src="https://placehold.co/20x14/ff0000/white?text=TH" 
                  alt="Thailand" 
                  className="mr-2 rounded-sm"
                />
                <span className="text-3xl font-bold text-white">฿ 0.00</span>
              </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-mali-text-secondary flex items-center">
                <Shield size={14} className="mr-1 text-mali-blue-light" />
                <span>Secure Balance Protection</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/top-up">
              <motion.button 
                  className="w-full bg-button-gradient text-white font-medium py-3 px-4 rounded-md shadow-button-glow flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowUp size={18} className="mr-2" />
                <span>Top Up Now</span>
              </motion.button>
              </Link>
              
              <Link href="/credits">
                <motion.button 
                  className="w-full border border-mali-blue-accent text-mali-blue-accent hover:bg-mali-blue-accent/10 font-medium py-3 px-4 rounded-md flex items-center justify-center transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <DollarSign size={18} className="mr-2" />
                  <span>View Credits</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
        
        {/* Top up info */}
        <motion.div 
          className="bg-mali-card rounded-xl border border-mali-blue/20 shadow-card-hover"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Receipt size={22} className="text-mali-blue-light mr-2" />
              <h2 className="text-lg font-semibold text-white">Top Up Your Balance</h2>
            </div>
            
            <div className="bg-accent-gradient rounded-xl p-5 mb-6 text-white shadow-purple-glow relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-purple-300/20 rounded-full blur-xl"></div>
              <div className="absolute right-5 bottom-5 w-16 h-16 bg-pink-300/30 rounded-full blur-lg"></div>
              <div className="relative z-10">
              <h3 className="font-medium mb-2">First Top-up Bonus</h3>
              <p className="text-sm text-white/80 mb-3">Get a 20% bonus on your first balance top-up</p>
              <motion.button
                className="w-full bg-white text-mali-purple px-3 py-1.5 rounded text-sm font-medium"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Get Bonus
              </motion.button>
              </div>
            </div>
            
            <ul className="space-y-3 text-sm text-mali-text-secondary">
              <li className="flex">
                <div className="text-mali-blue-accent mr-2 text-lg">•</div>
                <span>Add funds to your account to make purchases faster</span>
              </li>
              <li className="flex">
                <div className="text-mali-blue-accent mr-2 text-lg">•</div>
                <span>Your balance never expires</span>
              </li>
              <li className="flex">
                <div className="text-mali-blue-accent mr-2 text-lg">•</div>
                <span>Multiple secure payment options available</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
      
      {/* Balance history */}
      <motion.div 
        className="mt-6 bg-mali-card rounded-xl border border-mali-blue/20 shadow-card-hover"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <Clock size={22} className="text-mali-blue-light mr-2" />
            <h2 className="text-lg font-semibold text-white">Balance History</h2>
            </div>
            <div className="flex items-center text-mali-text-secondary">
              <Clock size={14} className="mr-1" />
              <span className="text-xs">Last 30 days</span>
            </div>
          </div>
          
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-mali-blue/20">
                  <tr>
                    <th className="pb-3 text-sm font-medium text-mali-text-secondary">Date</th>
                    <th className="pb-3 text-sm font-medium text-mali-text-secondary">Transaction</th>
                    <th className="pb-3 text-sm font-medium text-mali-text-secondary">Amount</th>
                    <th className="pb-3 text-sm font-medium text-mali-text-secondary text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={index} className="border-b border-mali-blue/10 hover:bg-mali-blue/5">
                      <td className="py-3 text-sm text-white">{transaction.date}</td>
                      <td className="py-3 text-sm text-white">{transaction.description}</td>
                      <td className={`py-3 text-sm ${transaction.amount > 0 ? 'text-mali-green' : 'text-mali-red'}`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </td>
                      <td className="py-3 text-sm text-white text-right">{transaction.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-mali-blue/10 text-mali-text-secondary text-center py-10 rounded-lg border border-mali-blue/20">
              <motion.div 
                initial={{ opacity: 0.5, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2 }}
              >
                <DollarSign className="mx-auto mb-2 h-12 w-12 opacity-50 text-mali-blue-light" />
              </motion.div>
              <p className="font-medium text-white mt-2">No balance history found.</p>
              <p className="text-sm mt-1 max-w-md mx-auto">Top up your balance to see transactions here. Your complete history will appear after your first transaction.</p>
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Helpful information */}
      <motion.div 
        className="mt-6 bg-mali-blue-accent/10 border border-mali-blue-accent/20 rounded-lg p-4 flex items-start"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <AlertCircle size={18} className="text-mali-blue-accent shrink-0 mt-0.5 mr-3" />
        <p className="text-mali-text-secondary text-sm">
          Your balance can be used for any purchases on MaliGamePass including game top-ups, gift cards, and more. 
          Balance amounts are stored in your local currency and are non-transferable. 
          <Link href="/support" className="text-mali-blue-accent hover:underline ml-1 transition-colors">
            Learn more
          </Link>
        </p>
      </motion.div>
    </div>
  );
} 