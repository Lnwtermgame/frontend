"use client";

import React, { useState } from 'react';
import { motion } from '@/lib/framer-exports';
import { Trophy, Medal, Users, ChevronRight, Star, Sparkles, Calendar, Search, Filter } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from "@/lib/context/language-context";

export interface Agent {
  id: string;
  name: string;
  rank: number;
  avatar: string;
  sales: number;
  referrals: number;
  conversionRate: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  isCurrentUser?: boolean;
}

export interface AgentRankingsProps {
  agents?: Agent[];
  userRank?: Agent | null;
  totalAgents?: number;
  period?: 'weekly' | 'monthly' | 'allTime';
  onPeriodChange?: (period: 'weekly' | 'monthly' | 'allTime') => void;
  onSearch?: (query: string) => void;
  className?: string;
}

export function AgentRankings({
  agents = [],
  userRank = null,
  totalAgents = 0,
  period = 'monthly',
  onPeriodChange,
  onSearch,
  className = ''
}: AgentRankingsProps) {
  const { t } = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };
  
  // Get tier badge styling
  const getTierBadge = (tier: string) => {
    switch(tier) {
      case 'bronze':
        return "bg-amber-900/30 text-amber-600";
      case 'silver':
        return "bg-gray-500/30 text-gray-300";
      case 'gold':
        return "bg-yellow-500/30 text-yellow-400";
      case 'platinum':
        return "bg-cyan-500/30 text-cyan-300";
      case 'diamond':
        return "bg-purple-500/30 text-purple-300";
      default:
        return "bg-mali-blue/20 text-mali-blue-light";
    }
  };
  
  // Get rank medal for top 3
  const getRankMedal = (rank: number) => {
    if (rank === 1) {
      return <Trophy size={20} className="text-yellow-400 ml-1" />;
    } else if (rank === 2) {
      return <Medal size={20} className="text-gray-300 ml-1" />;
    } else if (rank === 3) {
      return <Medal size={20} className="text-amber-600 ml-1" />;
    }
    return null;
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Title Section */}
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-mali-blue/30 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-mali-blue-light" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Agent Rankings</h2>
          <p className="text-mali-text-secondary text-sm">Top performing agents in our affiliate program</p>
        </div>
      </div>
      
      {/* Period Selector and Search */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex space-x-2 items-center">
          <button
            onClick={() => onPeriodChange?.('weekly')}
            className={`text-sm px-4 py-2 rounded-lg ${
              period === 'weekly' 
                ? 'bg-mali-blue text-white' 
                : 'bg-mali-blue/10 text-mali-text-secondary hover:bg-mali-blue/20'
            } transition-colors`}
          >
            Weekly
          </button>
          <button
            onClick={() => onPeriodChange?.('monthly')}
            className={`text-sm px-4 py-2 rounded-lg ${
              period === 'monthly' 
                ? 'bg-mali-blue text-white' 
                : 'bg-mali-blue/10 text-mali-text-secondary hover:bg-mali-blue/20'
            } transition-colors`}
          >
            Monthly
          </button>
          <button
            onClick={() => onPeriodChange?.('allTime')}
            className={`text-sm px-4 py-2 rounded-lg ${
              period === 'allTime' 
                ? 'bg-mali-blue text-white' 
                : 'bg-mali-blue/10 text-mali-text-secondary hover:bg-mali-blue/20'
            } transition-colors`}
          >
            All Time
          </button>
        </div>
        
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mali-text-secondary h-4 w-4" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-mali-blue/10 border border-mali-blue/20 rounded-lg py-2 pl-10 pr-4 w-full md:w-64 text-white focus:outline-none focus:border-mali-blue-light"
          />
        </form>
      </div>
      
      {/* User Stats (if available) */}
      {userRank && (
        <motion.div 
          className="bg-gradient-to-r from-mali-blue/20 to-mali-purple/20 border border-mali-blue/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-mali-blue/50">
                <Image
                  src={userRank.avatar}
                  alt={userRank.name}
                  fill
                  className="object-cover"
                />
                {userRank.rank <= 10 && (
                  <div className="absolute -bottom-1 -right-1 bg-mali-blue rounded-full p-1">
                    <Star className="h-3 w-3 text-white fill-white" />
                  </div>
                )}
              </div>
              
              <div className="ml-4">
                <div className="flex items-center">
                  <h3 className="text-white font-bold">{userRank.name}</h3>
                  <span className="bg-mali-blue/30 text-mali-blue-light text-xs font-medium rounded-full px-2 py-0.5 ml-2">
                    You
                  </span>
                </div>
                
                <div className="flex items-center mt-1">
                  <span className="text-mali-blue-light font-bold text-sm mr-1">
                    Rank #{userRank.rank}
                  </span>
                  <span className="text-mali-text-secondary text-xs">
                    of {totalAgents} agents
                  </span>
                </div>
                
                <div className="mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getTierBadge(userRank.tier)}`}>
                    {userRank.tier.charAt(0).toUpperCase() + userRank.tier.slice(1)} Tier
                  </span>
                </div>
              </div>
            </div>
            
            {/* User Stats */}
            <div className="flex space-x-6">
              <div className="text-center">
                <p className="text-mali-text-secondary text-xs">Sales</p>
                <p className="text-white font-bold">${userRank.sales.toLocaleString()}</p>
              </div>
              
              <div className="text-center">
                <p className="text-mali-text-secondary text-xs">Referrals</p>
                <p className="text-white font-bold">{userRank.referrals}</p>
              </div>
              
              <div className="text-center">
                <p className="text-mali-text-secondary text-xs">Conversion</p>
                <p className="text-white font-bold">{userRank.conversionRate}%</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Rankings Table */}
      <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-mali-blue/20 flex items-center">
          <Calendar className="text-mali-text-secondary h-4 w-4 mr-2" />
          <span className="text-mali-text-secondary">
            {period === 'weekly' ? 'This Week\'s' : period === 'monthly' ? 'This Month\'s' : 'All-Time'} Rankings
          </span>
        </div>
        
        {agents.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-mali-text-secondary">No agents found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-mali-blue/10 border-b border-mali-blue/20">
                  <th className="p-4 text-left text-mali-text-secondary text-sm font-medium">Rank</th>
                  <th className="p-4 text-left text-mali-text-secondary text-sm font-medium">Agent</th>
                  <th className="p-4 text-right text-mali-text-secondary text-sm font-medium">Sales</th>
                  <th className="p-4 text-right text-mali-text-secondary text-sm font-medium">Referrals</th>
                  <th className="p-4 text-right text-mali-text-secondary text-sm font-medium">Conversion</th>
                  <th className="p-4 text-right text-mali-text-secondary text-sm font-medium">Tier</th>
                </tr>
              </thead>
              
              <tbody>
                {agents.map((agent, index) => (
                  <motion.tr 
                    key={agent.id}
                    className={`border-b border-mali-blue/10 hover:bg-mali-blue/5 ${agent.isCurrentUser ? 'bg-mali-blue/10' : ''}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <td className="p-4">
                      <div className="flex items-center">
                        {agent.rank <= 3 ? (
                          <span className="text-white font-bold flex items-center">
                            {agent.rank}
                            {getRankMedal(agent.rank)}
                          </span>
                        ) : (
                          <span className="text-mali-text-secondary">{agent.rank}</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex items-center">
                        <div className="relative h-8 w-8 rounded-full overflow-hidden">
                          <Image
                            src={agent.avatar}
                            alt={agent.name}
                            fill
                            className="object-cover"
                          />
                          {agent.rank <= 3 && (
                            <div className="absolute -bottom-1 -right-1 bg-mali-blue rounded-full p-0.5">
                              <Star className="h-2 w-2 text-white fill-white" />
                            </div>
                          )}
                        </div>
                        
                        <span className={`ml-3 ${agent.isCurrentUser ? 'text-white font-medium' : 'text-mali-text-secondary'}`}>
                          {agent.name}
                        </span>
                        
                        {agent.isCurrentUser && (
                          <span className="ml-2 text-xs bg-mali-blue/30 text-mali-blue-light px-1.5 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className="p-4 text-right">
                      <span className={agent.isCurrentUser ? 'text-white font-medium' : 'text-mali-text-secondary'}>
                        ${agent.sales.toLocaleString()}
                      </span>
                    </td>
                    
                    <td className="p-4 text-right">
                      <span className={agent.isCurrentUser ? 'text-white font-medium' : 'text-mali-text-secondary'}>
                        {agent.referrals}
                      </span>
                    </td>
                    
                    <td className="p-4 text-right">
                      <span className={agent.isCurrentUser ? 'text-white font-medium' : 'text-mali-text-secondary'}>
                        {agent.conversionRate}%
                      </span>
                    </td>
                    
                    <td className="p-4 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getTierBadge(agent.tier)}`}>
                        {agent.tier.charAt(0).toUpperCase() + agent.tier.slice(1)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Bottom Info Box */}
      <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-xl p-4">
        <div className="flex items-start">
          <Sparkles className="h-5 w-5 text-mali-blue-light mr-3 mt-0.5" />
          <div>
            <h4 className="text-white font-medium">Want to improve your ranking?</h4>
            <p className="text-mali-text-secondary text-sm mt-1">
              Check out our <Link href="/affiliate/resources" className="text-mali-blue-light hover:underline">marketing resources</Link> for tips on how to boost your affiliate performance and climb the leaderboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 