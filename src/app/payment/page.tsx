"use client";

import { useState } from 'react';
import Image from 'next/image';
import { motion } from '@/lib/framer-exports';
import { usePayment } from '@/lib/context/payment-context';
import { 
  CreditCard, 
  QrCode, 
  BadgePercent, 
  CircleDollarSign, 
  Shield, 
  Plus, 
  Wallet, 
  ArrowRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function PaymentPage() {
  const {
    availablePaymentMethods,
    savedPaymentMethods,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    isProcessing,
    processingError,
    processPayment
  } = usePayment();
  
  const [amount, setAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState('');

  // Group payment methods by type for better organization
  const groupedPaymentMethods = availablePaymentMethods.reduce((acc, method) => {
    if (!acc[method.type]) {
      acc[method.type] = [];
    }
    acc[method.type].push(method);
    return acc;
  }, {} as Record<string, typeof availablePaymentMethods>);

  const handlePaymentMethodSelect = (method: typeof availablePaymentMethods[0]) => {
    setSelectedPaymentMethod(method);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    setPaymentStatus('processing');
    
    const result = await processPayment(parseFloat(amount), 'THB');
    
    if (result.success) {
      setPaymentStatus('success');
      setTransactionId(result.transactionId || '');
    } else {
      setPaymentStatus('error');
      setError(result.error || 'Payment failed');
    }
  };

  // Get the appropriate icon for payment type
  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'card': return <CreditCard size={20} />;
      case 'qr': return <QrCode size={20} />;
      case 'bank': return <CircleDollarSign size={20} />;
      case 'wallet': return <Wallet size={20} />;
      case 'crypto': return <CircleDollarSign size={20} />;
      default: return <CircleDollarSign size={20} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Payment</h1>
          <p className="text-mali-text-secondary">Select your preferred payment method</p>
        </div>
        
        {/* Payment Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Payment Methods Selection */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-6">
              <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Wallet className="text-mali-blue-accent" />
                Payment Methods
              </h2>
              
              <div className="space-y-6">
                {/* Saved Payment Methods */}
                {savedPaymentMethods.length > 0 && (
                  <div>
                    <h3 className="text-sm text-mali-text-secondary mb-3">Saved Methods</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {savedPaymentMethods.map(method => (
                        <button
                          key={method.id}
                          className={`flex items-center p-3 rounded-lg border ${
                            selectedPaymentMethod?.id === method.id
                              ? 'border-mali-blue-accent bg-mali-blue/20'
                              : 'border-mali-blue/20 hover:bg-mali-blue/10'
                          }`}
                        >
                          {method.icon && (
                            <Image 
                              src={method.icon} 
                              alt={method.nickname}
                              width={28}
                              height={28}
                              className="mr-3"
                            />
                          )}
                          <div className="text-left">
                            <div className="text-sm font-medium text-white">{method.nickname}</div>
                            {method.maskedNumber && (
                              <div className="text-xs text-mali-text-secondary">{method.maskedNumber}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Payment Methods */}
                <div className="space-y-5">
                  {/* QR Payment */}
                  {groupedPaymentMethods.qr && (
                    <div>
                      <h3 className="text-sm text-mali-text-secondary mb-3 flex items-center gap-1.5">
                        <QrCode size={16} />
                        QR Code Payment
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupedPaymentMethods.qr.map(method => (
                          <button
                            key={method.id}
                            onClick={() => handlePaymentMethodSelect(method)}
                            className={`flex items-center p-3 rounded-lg border ${
                              selectedPaymentMethod?.id === method.id
                                ? 'border-mali-blue-accent bg-mali-blue/20'
                                : 'border-mali-blue/20 hover:bg-mali-blue/10'
                            }`}
                          >
                            <Image 
                              src={method.icon} 
                              alt={method.name}
                              width={28}
                              height={28}
                              className="mr-3"
                            />
                            <div className="text-left">
                              <div className="text-sm font-medium text-white">{method.name}</div>
                              <div className="text-xs text-mali-text-secondary">
                                {method.fee === 0 ? 'No Fee' : `${method.fee}% fee`}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Credit/Debit Cards */}
                  {groupedPaymentMethods.card && (
                    <div>
                      <h3 className="text-sm text-mali-text-secondary mb-3 flex items-center gap-1.5">
                        <CreditCard size={16} />
                        Credit / Debit Cards
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupedPaymentMethods.card.map(method => (
                          <button
                            key={method.id}
                            onClick={() => handlePaymentMethodSelect(method)}
                            className={`flex items-center p-3 rounded-lg border ${
                              selectedPaymentMethod?.id === method.id
                                ? 'border-mali-blue-accent bg-mali-blue/20'
                                : 'border-mali-blue/20 hover:bg-mali-blue/10'
                            }`}
                          >
                            <Image 
                              src={method.icon} 
                              alt={method.name}
                              width={28}
                              height={28}
                              className="mr-3"
                            />
                            <div className="text-left">
                              <div className="text-sm font-medium text-white">{method.name}</div>
                              <div className="text-xs text-mali-text-secondary">
                                {method.fee === 0 ? 'No Fee' : `${method.fee}% fee`}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* E-Wallets */}
                  {groupedPaymentMethods.wallet && (
                    <div>
                      <h3 className="text-sm text-mali-text-secondary mb-3 flex items-center gap-1.5">
                        <Wallet size={16} />
                        E-Wallets
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupedPaymentMethods.wallet.map(method => (
                          <button
                            key={method.id}
                            onClick={() => handlePaymentMethodSelect(method)}
                            className={`flex items-center p-3 rounded-lg border ${
                              selectedPaymentMethod?.id === method.id
                                ? 'border-mali-blue-accent bg-mali-blue/20'
                                : 'border-mali-blue/20 hover:bg-mali-blue/10'
                            }`}
                          >
                            <Image 
                              src={method.icon} 
                              alt={method.name}
                              width={28}
                              height={28}
                              className="mr-3"
                            />
                            <div className="text-left">
                              <div className="text-sm font-medium text-white">{method.name}</div>
                              <div className="text-xs text-mali-text-secondary">
                                {method.fee === 0 ? 'No Fee' : `${method.fee}% fee`}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Internet Banking */}
                  {groupedPaymentMethods.bank && (
                    <div>
                      <h3 className="text-sm text-mali-text-secondary mb-3 flex items-center gap-1.5">
                        <CircleDollarSign size={16} />
                        Internet Banking
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupedPaymentMethods.bank.map(method => (
                          <button
                            key={method.id}
                            onClick={() => handlePaymentMethodSelect(method)}
                            className={`flex items-center p-3 rounded-lg border ${
                              selectedPaymentMethod?.id === method.id
                                ? 'border-mali-blue-accent bg-mali-blue/20'
                                : 'border-mali-blue/20 hover:bg-mali-blue/10'
                            }`}
                          >
                            <Image 
                              src={method.icon} 
                              alt={method.name}
                              width={28}
                              height={28}
                              className="mr-3"
                            />
                            <div className="text-left">
                              <div className="text-sm font-medium text-white">{method.name}</div>
                              <div className="text-xs text-mali-text-secondary">
                                {method.fee === 0 ? 'No Fee' : `${method.fee}% fee`}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cryptocurrency */}
                  {groupedPaymentMethods.crypto && (
                    <div>
                      <h3 className="text-sm text-mali-text-secondary mb-3 flex items-center gap-1.5">
                        <CircleDollarSign size={16} />
                        Cryptocurrency
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupedPaymentMethods.crypto.map(method => (
                          <button
                            key={method.id}
                            onClick={() => handlePaymentMethodSelect(method)}
                            className={`flex items-center p-3 rounded-lg border ${
                              selectedPaymentMethod?.id === method.id
                                ? 'border-mali-blue-accent bg-mali-blue/20'
                                : 'border-mali-blue/20 hover:bg-mali-blue/10'
                            }`}
                          >
                            <Image 
                              src={method.icon} 
                              alt={method.name}
                              width={28}
                              height={28}
                              className="mr-3"
                            />
                            <div className="text-left">
                              <div className="text-sm font-medium text-white">{method.name}</div>
                              <div className="text-xs text-mali-text-secondary">
                                Exchange rate: {method.exchangeRate} THB
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Security Badge */}
            <div className="p-4 border border-mali-blue/20 bg-mali-blue/10 rounded-xl flex items-center gap-3">
              <Shield size={20} className="text-mali-blue-accent" />
              <div>
                <div className="text-sm font-medium text-white">Secure Payment</div>
                <div className="text-xs text-mali-text-secondary">
                  All transactions are secure and encrypted
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Summary */}
          <div className="md:col-span-1">
            <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-6">
              <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <CircleDollarSign className="text-mali-blue-accent" />
                Summary
              </h2>
              
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                {/* Amount Input */}
                <div>
                  <label htmlFor="amount" className="block text-sm text-mali-text-secondary mb-2">
                    Amount (THB)
                  </label>
                  <div className="relative">
                    <input
                      id="amount"
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-3 bg-mali-blue/10 border border-mali-blue/20 rounded-lg text-white focus:outline-none focus:border-mali-blue-accent"
                      placeholder="0.00"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-mali-text-secondary">
                      THB
                    </div>
                  </div>
                </div>
                
                {/* Selected Payment Method */}
                {selectedPaymentMethod && (
                  <div>
                    <div className="text-sm text-mali-text-secondary mb-2">
                      Payment Method
                    </div>
                    <div className="flex items-center p-3 rounded-lg border border-mali-blue/20 bg-mali-blue/5">
                      <Image 
                        src={selectedPaymentMethod.icon} 
                        alt={selectedPaymentMethod.name}
                        width={24}
                        height={24}
                        className="mr-3"
                      />
                      <div className="text-sm font-medium text-white">
                        {selectedPaymentMethod.name}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Fee Calculation */}
                {selectedPaymentMethod && amount && !isNaN(parseFloat(amount)) && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-mali-text-secondary">Subtotal</span>
                      <span className="text-white">{parseFloat(amount).toFixed(2)} THB</span>
                    </div>
                    
                    {selectedPaymentMethod.fee && selectedPaymentMethod.fee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-mali-text-secondary flex items-center gap-1">
                          <BadgePercent size={14} />
                          Fee ({selectedPaymentMethod.fee}%)
                        </span>
                        <span className="text-white">
                          {(parseFloat(amount) * selectedPaymentMethod.fee / 100).toFixed(2)} THB
                        </span>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-mali-blue/20 flex justify-between font-medium">
                      <span className="text-mali-text-secondary">Total</span>
                      <span className="text-white">
                        {selectedPaymentMethod.fee 
                          ? (parseFloat(amount) * (1 + selectedPaymentMethod.fee / 100)).toFixed(2) 
                          : parseFloat(amount).toFixed(2)} THB
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg text-sm text-red-400 flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
                
                {/* Pay Button */}
                <button
                  type="submit"
                  disabled={!selectedPaymentMethod || !amount || isProcessing || paymentStatus === 'success'}
                  className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 
                    ${paymentStatus === 'success'
                      ? 'bg-green-600 text-white cursor-default'
                      : selectedPaymentMethod && amount
                        ? 'bg-mali-blue-accent text-white hover:bg-mali-blue-accent/90'
                        : 'bg-mali-blue/20 text-mali-text-secondary cursor-not-allowed'
                    }`}
                >
                  {paymentStatus === 'processing' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : paymentStatus === 'success' ? (
                    <>
                      <CheckCircle size={18} />
                      Payment Successful
                    </>
                  ) : (
                    <>
                      {amount && selectedPaymentMethod
                        ? `Pay ${(selectedPaymentMethod.fee && selectedPaymentMethod.fee > 0)
                            ? (parseFloat(amount) * (1 + selectedPaymentMethod.fee / 100)).toFixed(2)
                            : parseFloat(amount).toFixed(2)} THB`
                        : 'Pay'}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
                
                {/* Success Message */}
                {paymentStatus === 'success' && (
                  <div className="p-3 bg-green-900/20 border border-green-500/20 rounded-lg text-sm">
                    <p className="text-green-400 flex items-center gap-2 mb-1">
                      <CheckCircle size={16} />
                      Payment successful!
                    </p>
                    <p className="text-mali-text-secondary text-xs">
                      Transaction ID: {transactionId}
                    </p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 