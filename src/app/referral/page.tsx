"use client";

import { motion } from "@/lib/framer-exports";
import { ReferralCard } from "@/components/promotion/ReferralCard";
import { Share2, Users, Gift, ArrowRight, CreditCard } from "lucide-react";

export default function ReferralPage() {
  // Sample referral data for demonstration
  const referralInfo = {
    code: "GAMERFRIEND20",
    totalReferred: 8,
    pendingRewards: 250,
    claimedRewards: 750,
    rewardPerReferral: 100,
    bonusRewardThreshold: 5,
    bonusReward: 250,
    referralLink: "https://maligamepass.com/ref/GAMERFRIEND20"
  };
  
  return (
    <div className="page-container">
      {/* Hero Section */}
      <motion.div 
        className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-mali-blue/30 rounded-xl p-8 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-center mb-4">
              <Share2 className="h-8 w-8 text-purple-400 mr-3" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">Refer & Earn</h1>
            </div>
            <p className="text-gray-300 mb-6">
              Invite your friends to MaliGamePass and earn rewards for every successful referral
            </p>
          </motion.div>
          
          {/* Referral Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-mali-card/60 backdrop-blur-sm p-4 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-mali-blue mr-2" />
                <h3 className="text-white font-medium">Friends Referred</h3>
              </div>
              <p className="text-2xl font-bold text-white">{referralInfo.totalReferred}</p>
            </div>
            
            <div className="bg-mali-card/60 backdrop-blur-sm p-4 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <CreditCard className="h-5 w-5 text-mali-blue mr-2" />
                <h3 className="text-white font-medium">Total Earned</h3>
              </div>
              <p className="text-2xl font-bold text-white">{referralInfo.claimedRewards} Credits</p>
            </div>
            
            <div className="bg-mali-card/60 backdrop-blur-sm p-4 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Gift className="h-5 w-5 text-mali-blue mr-2" />
                <h3 className="text-white font-medium">Pending Rewards</h3>
              </div>
              <p className="text-2xl font-bold text-white">{referralInfo.pendingRewards} Credits</p>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Referral Card */}
      <div className="max-w-2xl mx-auto mb-12">
        <ReferralCard 
          referralCode={referralInfo.code}
          rewardAmount={referralInfo.rewardPerReferral}
          referralLink={referralInfo.referralLink}
          bonusThreshold={referralInfo.bonusRewardThreshold}
          bonusAmount={referralInfo.bonusReward}
        />
      </div>
      
      {/* How It Works */}
      <motion.div 
        className="bg-mali-card border border-mali-blue/20 rounded-xl p-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-xl font-bold text-white mb-6">How Our Referral Program Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-3 relative">
            <div className="bg-mali-blue/20 text-mali-blue w-10 h-10 rounded-full flex items-center justify-center font-bold mb-4">1</div>
            <h3 className="text-white font-medium">Share Your Code</h3>
            <p className="text-gray-400 text-sm">Share your unique referral code with friends</p>
            <ArrowRight className="absolute right-0 top-10 h-6 w-6 text-mali-blue hidden md:block" />
          </div>
          
          <div className="space-y-3 relative">
            <div className="bg-mali-blue/20 text-mali-blue w-10 h-10 rounded-full flex items-center justify-center font-bold mb-4">2</div>
            <h3 className="text-white font-medium">Friends Sign Up</h3>
            <p className="text-gray-400 text-sm">Friends create an account using your code</p>
            <ArrowRight className="absolute right-0 top-10 h-6 w-6 text-mali-blue hidden md:block" />
          </div>
          
          <div className="space-y-3 relative">
            <div className="bg-mali-blue/20 text-mali-blue w-10 h-10 rounded-full flex items-center justify-center font-bold mb-4">3</div>
            <h3 className="text-white font-medium">They Make a Purchase</h3>
            <p className="text-gray-400 text-sm">Your friends make their first purchase</p>
            <ArrowRight className="absolute right-0 top-10 h-6 w-6 text-mali-blue hidden md:block" />
          </div>
          
          <div className="space-y-3">
            <div className="bg-mali-blue/20 text-mali-blue w-10 h-10 rounded-full flex items-center justify-center font-bold mb-4">4</div>
            <h3 className="text-white font-medium">You Earn Rewards</h3>
            <p className="text-gray-400 text-sm">You both receive reward credits</p>
          </div>
        </div>
      </motion.div>
      
      {/* Bonus Rewards */}
      <motion.div 
        className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/20 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-3/4">
            <h2 className="text-xl font-bold text-white mb-2">Bonus Rewards</h2>
            <p className="text-gray-300 mb-4">
              Refer {referralInfo.bonusRewardThreshold} or more friends and get a bonus {referralInfo.bonusReward} credits on top of your regular rewards!
            </p>
          </div>
          <div className="md:w-1/4 text-center">
            <div className="bg-purple-500/20 text-purple-300 text-xl font-bold py-3 px-6 rounded-lg inline-block">
              +{referralInfo.bonusReward} BONUS
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 
