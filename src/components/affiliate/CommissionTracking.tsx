"use client";

import React, { useState } from 'react';
import { motion } from '@/lib/framer-exports';
import { 
  ArrowUpRight, ArrowDownRight, DollarSign, Calendar, 
  Download, ArrowRight, TrendingUp, Filter, PieChart
} from 'lucide-react';

export interface Commission {
  id: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'paid' | 'declined';
  date: string;
  customer?: string;
  products?: string[];
}

export interface CommissionStatistics {
  totalEarnings: number;
  pendingEarnings: number;
  conversionRate: number;
  referralsCount: number;
  monthlyEarnings: {
    month: string;
    earnings: number;
  }[];
  commissionTiers: {
    name: string;
    rate: number;
    threshold: number;
    isActive: boolean;
  }[];
}

export interface CommissionTrackingProps {
  commissions?: Commission[];
  statistics?: CommissionStatistics;
  className?: string;
  onFilterChange?: (filters: any) => void;
  onExport?: () => void;
  onViewDetails?: (commissionId: string) => void;
}

export function CommissionTracking({
  commissions = [],
  statistics,
  className = '',
  onFilterChange,
  onExport,
  onViewDetails
}: CommissionTrackingProps) {
  
  const [activeTab, setActiveTab] = useState<'earnings' | 'commissions'>('earnings');
  const [dateRange, setDateRange] = useState<'all' | '7days' | '30days' | '90days'>('30days');
  
  // Default statistics if none provided
  const defaultStatistics: CommissionStatistics = {
    totalEarnings: 0,
    pendingEarnings: 0,
    conversionRate: 0,
    referralsCount: 0,
    monthlyEarnings: [
      { month: 'Jan', earnings: 0 },
      { month: 'Feb', earnings: 0 },
      { month: 'Mar', earnings: 0 },
      { month: 'Apr', earnings: 0 },
      { month: 'May', earnings: 0 },
      { month: 'Jun', earnings: 0 }
    ],
    commissionTiers: [
      { name: 'Bronze', rate: 5, threshold: 0, isActive: true },
      { name: 'Silver', rate: 10, threshold: 500, isActive: false },
      { name: 'Gold', rate: 15, threshold: 2000, isActive: false },
      { name: 'Platinum', rate: 20, threshold: 5000, isActive: false }
    ]
  };
  
  const statsData = statistics || defaultStatistics;
  
  // Find current tier
  const currentTier = statsData.commissionTiers.find(tier => tier.isActive);
  
  // Find next tier if there is one
  const currentTierIndex = statsData.commissionTiers.findIndex(tier => tier.isActive);
  const nextTier = currentTierIndex < statsData.commissionTiers.length - 1 
    ? statsData.commissionTiers[currentTierIndex + 1] 
    : null;
  
  // Calculate progress to next tier
  const progress = nextTier 
    ? (statsData.totalEarnings / nextTier.threshold) * 100
    : 100;
  
  // Get commissions with default empty array
  const commissionsData = commissions.length > 0 ? commissions : [];
  
  // Handle date range filter change
  const handleDateRangeChange = (range: 'all' | '7days' | '30days' | '90days') => {
    setDateRange(range);
    if (onFilterChange) {
      onFilterChange({ dateRange: range });
    }
  };
  
  // Get status badge style based on status
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'paid':
        return "bg-green-500/20 text-green-400";
      case 'pending':
        return "bg-amber-500/20 text-amber-400";
      case 'declined':
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-mali-blue/20 text-mali-blue-light";
    }
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Page Title */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-mali-blue/30 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-mali-blue-light" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Commission Tracking</h2>
            <p className="text-mali-text-secondary text-sm">Monitor your earnings and commissions</p>
          </div>
        </div>
        
        <button 
          onClick={onExport}
          className="text-mali-text-secondary hover:text-white bg-mali-blue/10 hover:bg-mali-blue/20 border border-mali-blue/20 rounded-md py-1.5 px-3 text-sm flex items-center transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          className="bg-mali-card border border-mali-blue/20 rounded-xl p-5"
          whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)" }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex justify-between items-start mb-3">
            <p className="text-mali-text-secondary text-sm">Total Earnings</p>
            <div className="bg-green-500/20 rounded-full p-1.5">
              <DollarSign className="h-4 w-4 text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">${statsData.totalEarnings.toFixed(2)}</p>
          <p className="text-xs text-green-400 flex items-center mt-1">
            <ArrowUpRight className="h-3 w-3 mr-1" />
            Lifetime earnings
          </p>
        </motion.div>
        
        <motion.div 
          className="bg-mali-card border border-mali-blue/20 rounded-xl p-5"
          whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)" }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <div className="flex justify-between items-start mb-3">
            <p className="text-mali-text-secondary text-sm">Pending Earnings</p>
            <div className="bg-amber-500/20 rounded-full p-1.5">
              <Calendar className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">${statsData.pendingEarnings.toFixed(2)}</p>
          <p className="text-xs text-amber-400 flex items-center mt-1">
            <Calendar className="h-3 w-3 mr-1" />
            Awaiting payout
          </p>
        </motion.div>
        
        <motion.div 
          className="bg-mali-card border border-mali-blue/20 rounded-xl p-5"
          whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)" }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <div className="flex justify-between items-start mb-3">
            <p className="text-mali-text-secondary text-sm">Conversion Rate</p>
            <div className="bg-mali-purple/20 rounded-full p-1.5">
              <TrendingUp className="h-4 w-4 text-mali-purple" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{statsData.conversionRate}%</p>
          <p className="text-xs text-mali-purple flex items-center mt-1">
            <ArrowUpRight className="h-3 w-3 mr-1" />
            From referral clicks
          </p>
        </motion.div>
        
        <motion.div 
          className="bg-mali-card border border-mali-blue/20 rounded-xl p-5"
          whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)" }}
          transition={{ duration: 0.2, delay: 0.15 }}
        >
          <div className="flex justify-between items-start mb-3">
            <p className="text-mali-text-secondary text-sm">Total Referrals</p>
            <div className="bg-mali-blue/20 rounded-full p-1.5">
              <PieChart className="h-4 w-4 text-mali-blue-light" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{statsData.referralsCount}</p>
          <p className="text-xs text-mali-blue-light flex items-center mt-1">
            <ArrowUpRight className="h-3 w-3 mr-1" />
            Converted customers
          </p>
        </motion.div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-mali-blue/20">
        <div className="flex">
          <button
            onClick={() => setActiveTab('earnings')}
            className={`px-4 py-2 border-b-2 ${
              activeTab === 'earnings' 
                ? 'border-mali-blue-light text-mali-blue-light' 
                : 'border-transparent text-mali-text-secondary hover:text-white'
            } transition-colors`}
          >
            Earnings & Tier
          </button>
          <button
            onClick={() => setActiveTab('commissions')}
            className={`px-4 py-2 border-b-2 ${
              activeTab === 'commissions' 
                ? 'border-mali-blue-light text-mali-blue-light' 
                : 'border-transparent text-mali-text-secondary hover:text-white'
            } transition-colors`}
          >
            Commission History
          </button>
        </div>
      </div>
      
      {/* Earnings Tab Content */}
      {activeTab === 'earnings' && (
        <>
          {/* Tier Progress */}
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Commission Tier</h3>
            
            <div className="flex items-center mb-6">
              <div className="h-16 w-16 flex-shrink-0 rounded-full bg-gradient-to-r from-mali-blue to-mali-purple flex items-center justify-center">
                <span className="text-white font-bold">{currentTier?.rate}%</span>
              </div>
              
              <div className="ml-4">
                <div className="flex items-center">
                  <h4 className="text-white font-bold">{currentTier?.name} Tier</h4>
                  <span className="ml-2 px-2 py-0.5 bg-mali-blue/20 text-mali-blue-light text-xs rounded-full">
                    Current
                  </span>
                </div>
                <p className="text-mali-text-secondary text-sm mt-1">
                  You earn {currentTier?.rate}% commission on all referred sales
                </p>
              </div>
            </div>
            
            {nextTier && (
              <>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-mali-text-secondary">Progress to {nextTier.name} Tier</span>
                  <span className="text-white">${statsData.totalEarnings.toFixed(2)} / ${nextTier.threshold}</span>
                </div>
                
                <div className="h-2 bg-mali-blue/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-mali-blue to-mali-purple"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
                
                <p className="mt-3 text-mali-text-secondary text-sm">
                  You need ${(nextTier.threshold - statsData.totalEarnings).toFixed(2)} more in affiliate sales to reach {nextTier.name} Tier and earn {nextTier.rate}% commission.
                </p>
              </>
            )}
            
            {!nextTier && (
              <p className="mt-3 text-mali-green text-sm">
                Congratulations! You have reached the highest tier level.
              </p>
            )}
          </div>
          
          {/* Monthly Earnings Chart */}
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Monthly Earnings</h3>
            
            <div className="h-64">
              <div className="h-full flex items-end justify-between">
                {statsData.monthlyEarnings.map((month, index) => {
                  const maxEarning = Math.max(...statsData.monthlyEarnings.map(m => m.earnings));
                  const height = maxEarning > 0 ? (month.earnings / maxEarning) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex flex-col items-center" style={{ width: `${100 / statsData.monthlyEarnings.length - 2}%` }}>
                      <div className="relative w-full mb-2 flex justify-center">
                        <div 
                          className="w-full max-w-[40px] bg-gradient-to-t from-mali-blue-light to-mali-purple rounded-t-md"
                          style={{ height: `${height}%` }}
                        ></div>
                        
                        {month.earnings > 0 && (
                          <div className="absolute -top-6 text-xs text-mali-text-secondary">
                            ${month.earnings}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-mali-text-secondary">
                        {month.month}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Commission History Tab Content */}
      {activeTab === 'commissions' && (
        <>
          {/* Filters */}
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-4 flex flex-wrap justify-between items-center">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleDateRangeChange('all')}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  dateRange === 'all' 
                    ? 'bg-mali-blue text-white' 
                    : 'bg-mali-blue/10 text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white'
                } transition-colors`}
              >
                All Time
              </button>
              <button
                onClick={() => handleDateRangeChange('7days')}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  dateRange === '7days' 
                    ? 'bg-mali-blue text-white' 
                    : 'bg-mali-blue/10 text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white'
                } transition-colors`}
              >
                7 Days
              </button>
              <button
                onClick={() => handleDateRangeChange('30days')}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  dateRange === '30days' 
                    ? 'bg-mali-blue text-white' 
                    : 'bg-mali-blue/10 text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white'
                } transition-colors`}
              >
                30 Days
              </button>
              <button
                onClick={() => handleDateRangeChange('90days')}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  dateRange === '90days' 
                    ? 'bg-mali-blue text-white' 
                    : 'bg-mali-blue/10 text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white'
                } transition-colors`}
              >
                90 Days
              </button>
            </div>
            
            <button className="bg-mali-blue/10 hover:bg-mali-blue/20 border border-mali-blue/30 text-mali-text-secondary hover:text-white rounded-md py-1.5 px-3 text-sm flex items-center mt-2 sm:mt-0">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </button>
          </div>
          
          {/* Commission List */}
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden">
            {commissionsData.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-mali-text-secondary">No commission history found.</p>
                <p className="text-sm text-mali-text-secondary mt-1">
                  Start referring customers to earn commissions!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-mali-blue/20">
                      <th className="text-left p-4 text-mali-text-secondary text-sm font-medium">Date</th>
                      <th className="text-left p-4 text-mali-text-secondary text-sm font-medium">Order ID</th>
                      <th className="text-left p-4 text-mali-text-secondary text-sm font-medium">Customer</th>
                      <th className="text-left p-4 text-mali-text-secondary text-sm font-medium">Amount</th>
                      <th className="text-left p-4 text-mali-text-secondary text-sm font-medium">Status</th>
                      <th className="text-right p-4 text-mali-text-secondary text-sm font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionsData.map((commission) => (
                      <tr key={commission.id} className="border-b border-mali-blue/10 hover:bg-mali-blue/5">
                        <td className="p-4 text-mali-text-secondary text-sm">
                          {new Date(commission.date).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-white">
                          #{commission.orderId}
                        </td>
                        <td className="p-4 text-mali-text-secondary text-sm">
                          {commission.customer || 'Anonymous'}
                        </td>
                        <td className="p-4 text-white font-medium">
                          ${commission.amount.toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(commission.status)}`}>
                            {commission.status.charAt(0).toUpperCase() + commission.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => onViewDetails?.(commission.id)}
                            className="text-mali-blue-light hover:text-mali-blue-accent text-sm inline-flex items-center"
                          >
                            View
                            <ArrowRight size={14} className="ml-1" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 
