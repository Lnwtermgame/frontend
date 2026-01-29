"use client";

import { useState } from 'react';
import { motion } from '@/lib/framer-exports';
import { usePromotion } from '@/lib/context/promotion-context';
import { 
  Users,
  Share2,
  Copy,
  Facebook,
  Twitter,
  Mail,
  CheckCircle,
  UserPlus,
  Gift,
  CircleDollarSign
} from 'lucide-react';

export interface ReferralCardProps {
  compact?: boolean;
  // Add new props to match what we're passing from the referral page
  referralCode?: string;
  referralLink?: string;
  rewardAmount?: number;
  bonusThreshold?: number;
  bonusAmount?: number;
}

export function ReferralCard({ 
  compact = false,
  referralCode: externalReferralCode,
  referralLink: externalReferralLink,
  rewardAmount,
  bonusThreshold,
  bonusAmount
}: ReferralCardProps) {
  const { 
    getReferralCode,
    getReferralStats,
    generateReferralLink
  } = usePromotion();
  
  const [copied, setCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  
  // Use provided props if available, otherwise use from context
  const referralCode = externalReferralCode || getReferralCode();
  const referralLink = externalReferralLink || generateReferralLink();
  const { totalReferred, totalRewards } = getReferralStats();
  
  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleShare = (platform: 'facebook' | 'twitter' | 'email') => {
    const text = `Join MaliGamePass using my referral code and get $${rewardAmount || 5} off your first purchase!`;
    let url = '';
    
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent('Join MaliGamePass!')}&body=${encodeURIComponent(`${text}\n\n${referralLink}`)}`;
        break;
    }
    
    if (url) window.open(url, '_blank');
  };
  
  if (compact) {
    return (
      <div className="bg-mali-card border border-mali-blue/20 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="text-mali-blue-accent" size={20} />
            <h3 className="font-medium text-white">Your Referrals</h3>
          </div>
          <div className="text-lg font-semibold text-white">
            {totalReferred} <span className="text-xs text-mali-text-secondary">users</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden">
      <div className="p-4 bg-mali-blue/10 border-b border-mali-blue/20 flex justify-between items-center">
        <h3 className="font-medium text-white flex items-center gap-2">
          <Users className="text-mali-blue-accent" />
          Refer Friends & Earn Rewards
        </h3>
      </div>
      
      <div className="p-5 space-y-6">
        {/* Rewards Info */}
        {rewardAmount && (
          <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/20 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Gift className="text-purple-400 mr-2" size={20} />
              <h3 className="text-lg font-medium text-white">Referral Rewards</h3>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              Give ${rewardAmount}, get ${rewardAmount}! You'll both receive credits when they make their first purchase.
            </p>
            {bonusThreshold && bonusAmount && (
              <div className="bg-purple-500/20 text-purple-300 text-sm py-1.5 px-3 rounded inline-block">
                Bonus: ${bonusAmount} after {bonusThreshold} referrals!
              </div>
            )}
          </div>
        )}
        
        {/* Referral Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-mali-blue/10 border border-mali-blue/20 rounded-lg flex flex-col items-center">
            <UserPlus className="text-mali-blue-accent mb-1" size={20} />
            <div className="text-2xl font-bold text-white">{totalReferred}</div>
            <div className="text-xs text-mali-text-secondary">Friends Referred</div>
          </div>
          <div className="p-4 bg-mali-blue/10 border border-mali-blue/20 rounded-lg flex flex-col items-center">
            <CircleDollarSign className="text-green-400 mb-1" size={20} />
            <div className="text-2xl font-bold text-green-400">${totalRewards}</div>
            <div className="text-xs text-mali-text-secondary">Total Rewards</div>
          </div>
        </div>
        
        {/* Referral Code Display */}
        <div className="space-y-3">
          <div className="text-sm text-mali-text-secondary">Your Referral Code</div>
          <div className="flex gap-2">
            <div className="flex-grow p-3 bg-mali-blue/10 border border-mali-blue/20 rounded-lg font-mono text-white text-center">
              {referralCode}
            </div>
            <button 
              onClick={handleCopy}
              className="p-3 bg-mali-blue-accent text-white rounded-lg hover:bg-mali-blue-accent/90"
            >
              {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
            </button>
          </div>
          <div className="text-xs text-mali-text-secondary flex items-center gap-1">
            <Gift size={14} />
            Friends get ${rewardAmount || 5} off their first purchase, you get ${rewardAmount || 5} when they buy
          </div>
        </div>
        
        {/* Share Options */}
        <div className="space-y-3 pt-4 border-t border-mali-blue/20">
          <div className="text-sm text-white font-medium mb-2">Share Your Referral Link</div>
          
          <button
            onClick={() => setShowShareOptions(!showShareOptions)}
            className="w-full py-2.5 px-4 bg-mali-blue/20 hover:bg-mali-blue/30 text-white rounded-lg flex items-center justify-center gap-2"
          >
            <Share2 size={18} />
            Share with Friends
          </button>
          
          {showShareOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-center gap-4 mt-4"
            >
              <button
                onClick={() => handleShare('facebook')}
                className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                aria-label="Share to Facebook"
              >
                <Facebook size={20} />
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
                aria-label="Share to Twitter"
              >
                <Twitter size={20} />
              </button>
              <button
                onClick={() => handleShare('email')}
                className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                aria-label="Share via Email"
              >
                <Mail size={20} />
              </button>
              <button
                onClick={handleCopy}
                className="p-3 bg-mali-blue-accent text-white rounded-lg hover:bg-mali-blue-accent/90"
                aria-label="Copy Link"
              >
                {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
} 