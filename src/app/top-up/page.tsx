"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  Plus,
  Minus,
  CreditCard,
  Wallet,
  CircleDollarSign,
  ArrowRight,
  CheckCircle,
  DollarSign,
  CreditCard as CreditCardIcon,
  BanknoteIcon,
  Smartphone,
  Shield,
  Check,
  ChevronDown
} from "lucide-react";
import { motion } from "@/lib/framer-exports";
import Image from "next/image";

// Dummy translation helper
const t = (str: string) => str === 'topUp' ? 'Top Up' : str;

export default function TopUpPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();

  const [amount, setAmount] = useState(20);
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState("USD");

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 5 && value <= 1000) {
      setAmount(value);
    }
  };

  const increaseAmount = () => {
    if (amount < 1000) {
      setAmount(prev => prev + 10);
    }
  };

  const decreaseAmount = () => {
    if (amount > 10) {
      setAmount(prev => prev - 10);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call for processing top-up
    setTimeout(() => {
      setLoading(false);
      alert(`Successfully topped up ${currency === 'USD' ? '$' : currency === 'THB' ? '฿' : '€'}${amount} using ${paymentMethod === 'credit-card' ? 'Credit Card' : paymentMethod === 'e-wallet' ? 'E-Wallet' : 'Bank Transfer'}`);
    }, 1500);
  };

  const currencySymbol = currency === 'USD' ? '$' : currency === 'THB' ? '฿' : '€';

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="page-container text-center">
        <div className="bg-mali-card rounded-xl border border-mali-blue/20 p-8">
          <div className="animate-pulse flex space-x-4 justify-center">
            <div className="rounded-full bg-mali-blue/20 h-12 w-12"></div>
            <div className="flex-1 space-y-4 max-w-md">
              <div className="h-4 bg-mali-blue/20 rounded w-3/4"></div>
              <div className="h-4 bg-mali-blue/20 rounded"></div>
              <div className="h-4 bg-mali-blue/20 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="relative mb-8 pt-4">

        <motion.h1 className="text-3xl font-bold text-white mb-2 relative">
          {t('topUp')}
        </motion.h1>
        <p className="text-mali-text-secondary relative">Add funds to your account balance</p>
      </div>

      {/* Promotional banner */}
      <motion.div
        className="mb-8 rounded-xl overflow-hidden relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-gradient-to-r from-mali-blue to-mali-purple p-0.5 rounded-xl">
          <div className="bg-gradient-to-r from-[#111A38] to-[#161F42] rounded-[calc(0.75rem-1px)] overflow-hidden">
            <div className="flex flex-col md:flex-row items-center p-6 relative">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://placehold.co/400x200/0a1123/2a2f4e')] opacity-20 bg-cover bg-center"></div>

              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-mali-blue-light via-mali-blue to-mali-purple flex items-center justify-center mb-4 md:mb-0 md:mr-6 relative z-10">
                <CircleDollarSign size={36} className="text-white" />
              </div>

              <div className="md:flex-1 text-center md:text-left relative z-10">
                <h2 className="text-2xl font-bold text-white mb-2">Get 10% Bonus Credits</h2>
                <p className="text-mali-text-secondary mb-4">Top up ฿500 or more and receive 10% extra credits instantly!</p>
                <div className="hidden md:block">
                  <span className="inline-block bg-mali-purple/20 border border-mali-purple/30 text-mali-purple-light text-sm font-medium px-3 py-1 rounded-full">
                    Limited Time Offer
                  </span>
                </div>
              </div>

              <div className="mt-4 md:mt-0 relative z-10">
                <motion.button
                  className="bg-gradient-to-r from-mali-blue-light to-mali-purple text-white font-medium px-6 py-2.5 rounded-md transition-all shadow-blue-glow"
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(78, 137, 232, 0.5)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  Learn More
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Top up details */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Amount selection */}
            <div className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden shadow-card-hover">
              <div className="h-1 w-full bg-gradient-to-r from-mali-blue-light via-mali-purple to-mali-blue-accent"></div>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-mali-blue/20 flex items-center justify-center mr-3 text-mali-blue-accent">
                    <DollarSign size={18} />
                  </span>
                  Select Amount
                </h2>

                {/* Currency selector */}
                <div className="mb-6 flex justify-end">
                  <div className="relative inline-block">
                    <div className="flex items-center gap-1 bg-mali-blue/20 hover:bg-mali-blue/30 text-white rounded-lg px-3 py-1.5 text-sm cursor-pointer">
                      <span className={`inline-flex items-center justify-center w-5 h-5 ${currency === 'USD' ? 'bg-blue-500' :
                        currency === 'THB' ? 'bg-red-500' : 'bg-yellow-500'
                        } rounded-full text-xs text-white font-medium mr-1`}>
                        {currency === 'USD' ? '$' : currency === 'THB' ? '฿' : '€'}
                      </span>
                      {currency}
                      <ChevronDown size={14} />
                    </div>
                    {/* Currency dropdown would go here in a real implementation */}
                  </div>
                </div>

                {/* Preset amounts */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  {[10, 20, 50, 100, 200, 500].map((value) => (
                    <motion.button
                      key={value}
                      type="button"
                      className={`rounded-lg py-4 px-3 text-center transition-all ${amount === value
                        ? 'bg-gradient-to-r from-mali-blue-light to-mali-purple border-none text-white shadow-blue-glow'
                        : 'border border-mali-blue/20 bg-mali-blue/10 text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white'
                        }`}
                      onClick={() => setAmount(value)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-xl font-bold">{currencySymbol}{value}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-mali-text-secondary mb-2">Or enter custom amount</label>
                  <div className="flex items-center">
                    <motion.button
                      type="button"
                      className="bg-mali-blue/20 hover:bg-mali-blue/30 text-white rounded-l-lg p-3 transition-colors"
                      onClick={decreaseAmount}
                      whileTap={{ scale: 0.95 }}
                      disabled={amount <= 5}
                    >
                      <Minus size={18} />
                    </motion.button>

                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <span className="text-mali-text-secondary">{currencySymbol}</span>
                      </div>
                      <input
                        type="number"
                        value={amount}
                        onChange={handleAmountChange}
                        className="block w-full py-3 px-10 bg-mali-blue/10 border border-mali-blue/30 text-white rounded-none font-medium text-center focus:outline-none focus:ring-1 focus:ring-mali-blue-accent focus:border-mali-blue-accent transition-colors"
                        min={5}
                        max={1000}
                      />
                    </div>

                    <motion.button
                      type="button"
                      className="bg-mali-blue/20 hover:bg-mali-blue/30 text-white rounded-r-lg p-3 transition-colors"
                      onClick={increaseAmount}
                      whileTap={{ scale: 0.95 }}
                      disabled={amount >= 1000}
                    >
                      <Plus size={18} />
                    </motion.button>
                  </div>
                  <p className="text-xs text-mali-text-secondary mt-2">Min: {currencySymbol}5, Max: {currencySymbol}1,000</p>
                </div>
              </div>
            </div>

            {/* Payment methods */}
            <div className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden shadow-card-hover">
              <div className="h-1 w-full bg-gradient-to-r from-mali-blue-accent to-mali-purple"></div>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-mali-blue/20 flex items-center justify-center mr-3 text-mali-blue-accent">
                    <CreditCardIcon size={18} />
                  </span>
                  Select Payment Method
                </h2>
                <div className="space-y-3">
                  <motion.div
                    className={`relative rounded-lg overflow-hidden transition-all ${paymentMethod === 'credit-card'
                      ? 'ring-2 ring-mali-blue-accent shadow-blue-glow'
                      : 'hover:scale-[1.01]'
                      }`}
                    onClick={() => setPaymentMethod('credit-card')}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full ${paymentMethod === 'credit-card' ? 'bg-gradient-to-b from-mali-blue-light to-mali-purple' : 'bg-transparent'}`}></div>
                    <div className="p-4 bg-gradient-to-r from-mali-blue/20 to-mali-blue/10 border border-mali-blue/20 cursor-pointer pl-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mali-blue-light to-mali-purple flex items-center justify-center mr-4">
                          <CreditCardIcon size={22} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">Credit/Debit Card</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-8 h-5 bg-white rounded flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-600">VISA</span>
                            </div>
                            <div className="w-8 h-5 bg-white rounded flex items-center justify-center">
                              <span className="text-xs font-bold text-red-500">MC</span>
                            </div>
                            <span className="text-xs text-mali-text-secondary">and more</span>
                          </div>
                        </div>
                        {paymentMethod === 'credit-card' && (
                          <div className="w-6 h-6 rounded-full bg-mali-blue-light flex items-center justify-center">
                            <Check className="text-white h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className={`relative rounded-lg overflow-hidden transition-all ${paymentMethod === 'bank-transfer'
                      ? 'ring-2 ring-mali-blue-accent shadow-blue-glow'
                      : 'hover:scale-[1.01]'
                      }`}
                    onClick={() => setPaymentMethod('bank-transfer')}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full ${paymentMethod === 'bank-transfer' ? 'bg-gradient-to-b from-mali-blue-light to-mali-purple' : 'bg-transparent'}`}></div>
                    <div className="p-4 bg-gradient-to-r from-mali-blue/20 to-mali-blue/10 border border-mali-blue/20 cursor-pointer pl-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mali-blue-light to-mali-purple flex items-center justify-center mr-4">
                          <BanknoteIcon size={22} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">Bank Transfer</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-5 px-2 bg-blue-500/20 text-blue-400 rounded flex items-center justify-center">
                              <span className="text-xs font-medium">All Banks</span>
                            </div>
                            <span className="text-xs text-mali-text-secondary">Fast Processing</span>
                          </div>
                        </div>
                        {paymentMethod === 'bank-transfer' && (
                          <div className="w-6 h-6 rounded-full bg-mali-blue-light flex items-center justify-center">
                            <Check className="text-white h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className={`relative rounded-lg overflow-hidden transition-all ${paymentMethod === 'e-wallet'
                      ? 'ring-2 ring-mali-blue-accent shadow-blue-glow'
                      : 'hover:scale-[1.01]'
                      }`}
                    onClick={() => setPaymentMethod('e-wallet')}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full ${paymentMethod === 'e-wallet' ? 'bg-gradient-to-b from-mali-blue-light to-mali-purple' : 'bg-transparent'}`}></div>
                    <div className="p-4 bg-gradient-to-r from-mali-blue/20 to-mali-blue/10 border border-mali-blue/20 cursor-pointer pl-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mali-blue-light to-mali-purple flex items-center justify-center mr-4">
                          <Smartphone size={22} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">E-Wallet</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-5 px-2 bg-mali-blue/20 text-mali-blue-light rounded flex items-center justify-center">
                              <span className="text-xs font-medium">PayPal</span>
                            </div>
                            <div className="h-5 px-2 bg-mali-purple/20 text-mali-purple-light rounded flex items-center justify-center">
                              <span className="text-xs font-medium">Alipay</span>
                            </div>
                            <span className="text-xs text-mali-text-secondary">and more</span>
                          </div>
                        </div>
                        {paymentMethod === 'e-wallet' && (
                          <div className="w-6 h-6 rounded-full bg-mali-blue-light flex items-center justify-center">
                            <Check className="text-white h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Payment Security */}
            <div className="bg-mali-blue/10 rounded-xl border border-mali-blue/20 p-4">
              <div className="flex items-start">
                <div className="bg-mali-blue/20 rounded-full p-2 mr-3">
                  <Shield className="h-5 w-5 text-mali-blue-light" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium mb-1">100% Secure Payments</p>
                  <p className="text-mali-text-secondary text-xs">All transactions are secured with industry-standard encryption. Your payment information is never stored on our servers.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right column - Summary and checkout */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden sticky top-24 shadow-card-hover">
              <div className="h-1 w-full bg-gradient-to-r from-mali-accent to-mali-purple"></div>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-mali-blue/20 flex items-center justify-center mr-3 text-mali-blue-accent">
                    <CircleDollarSign size={18} />
                  </span>
                  Order Summary
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-mali-blue/20">
                    <span className="text-mali-text-secondary">Amount</span>
                    <span className="text-white font-medium">{currencySymbol}{amount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between py-3 border-b border-mali-blue/20">
                    <span className="text-mali-text-secondary">Fee</span>
                    <span className="text-white font-medium">{currencySymbol}0.00</span>
                  </div>

                  <div className="flex justify-between py-3">
                    <span className="text-white font-medium">Total</span>
                    <div className="text-right">
                      <div className="text-white font-bold text-xl">{currencySymbol}{amount.toFixed(2)}</div>
                      <div className="text-green-400 text-xs font-medium">+ 0 Bonus Credits</div>
                    </div>
                  </div>

                  <div className="pt-3">
                    <motion.button
                      type="submit"
                      className="w-full bg-gradient-to-r from-mali-blue-light to-mali-purple text-white font-medium py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-blue-glow transition-all"
                      disabled={loading}
                      whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(78, 137, 232, 0.5)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? 'Processing...' : 'Continue to Payment'}
                      {!loading && <ArrowRight className="h-4 w-4" />}
                    </motion.button>
                  </div>

                  <div className="flex items-center justify-center text-mali-text-secondary text-xs mt-2">
                    <Shield className="mr-1 h-3 w-3" />
                    <span>Secure Payment Processing</span>
                  </div>
                </div>
              </div>

              <div className="bg-mali-blue/10 p-4 border-t border-mali-blue/20">
                <div className="flex items-center mb-3">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20 text-green-400">
                    <Check size={12} />
                  </div>
                  <span className="ml-2 text-xs text-mali-text-secondary">Instant top-up to your account</span>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20 text-green-400">
                    <Check size={12} />
                  </div>
                  <span className="ml-2 text-xs text-mali-text-secondary">24/7 customer support</span>
                </div>
              </div>
            </div>

            {/* Need help section */}
            <div className="mt-6 bg-mali-blue/10 rounded-xl border border-mali-blue/20 p-4 text-center">
              <p className="text-sm text-mali-text-secondary mb-2">Need help with your top-up?</p>
              <a href="/support" className="text-mali-blue-accent text-sm font-medium hover:text-mali-blue-light transition-colors">Contact Support</a>
            </div>
          </motion.div>
        </div>
      </form>
    </div>
  );
} 
