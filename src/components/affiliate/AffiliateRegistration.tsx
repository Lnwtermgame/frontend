"use client";

import React, { useState } from 'react';
import { motion } from '@/lib/framer-exports';
import {
  Users, Link as LinkIcon, Copy, CheckCircle,
  ArrowRight, ShieldCheck, BadgeDollarSign, TrendingUp
} from 'lucide-react';

export interface AffiliateRegistrationProps {
  isRegistered?: boolean;
  referralCode?: string;
  referralLink?: string;
  onRegister?: (data: AffiliateRegistrationData) => Promise<void>;
  className?: string;
}

export interface AffiliateRegistrationData {
  website?: string;
  socialMedia?: string;
  aboutYou: string;
  agreedToTerms: boolean;
}

export function AffiliateRegistration({
  isRegistered = false,
  referralCode = '',
  referralLink = '',
  onRegister,
  className = ''
}: AffiliateRegistrationProps) {

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AffiliateRegistrationData>({
    website: '',
    socialMedia: '',
    aboutYou: '',
    agreedToTerms: false
  });
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (onRegister) {
        await onRegister(formData);
      }
      // In a real app, we would update the isRegistered state based on the response
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error registering affiliate:", error);
      setIsSubmitting(false);
    }
  };

  // Copy referral code to clipboard
  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // If already registered, show the affiliate dashboard
  if (isRegistered) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-mali-purple/30 flex items-center justify-center">
            <BadgeDollarSign className="h-5 w-5 text-mali-purple" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Affiliate Dashboard</h2>
            <p className="text-mali-text-secondary text-sm">Share your referral link and earn commissions</p>
          </div>
        </div>

        {/* Referral Information */}
        <div className="bg-mali-card rounded-xl border border-mali-blue/20 p-6 space-y-4">
          <h3 className="text-white font-bold">Your Referral Information</h3>

          {/* Referral Code */}
          <div>
            <label className="text-mali-text-secondary text-sm block mb-1">Referral Code</label>
            <div className="flex">
              <div className="bg-mali-blue/10 border border-mali-blue/20 text-white rounded-l-md py-2 px-4 flex-grow">
                {referralCode}
              </div>
              <button
                onClick={() => copyToClipboard(referralCode, 'code')}
                className="bg-mali-blue/30 hover:bg-mali-blue/40 text-mali-blue-light px-4 rounded-r-md flex items-center transition-colors"
              >
                {copiedCode ? <CheckCircle size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {/* Referral Link */}
          <div>
            <label className="text-mali-text-secondary text-sm block mb-1">Referral Link</label>
            <div className="flex">
              <div className="bg-mali-blue/10 border border-mali-blue/20 text-white rounded-l-md py-2 px-4 flex-grow truncate">
                {referralLink}
              </div>
              <button
                onClick={() => copyToClipboard(referralLink, 'link')}
                className="bg-mali-blue/30 hover:bg-mali-blue/40 text-mali-blue-light px-4 rounded-r-md flex items-center transition-colors"
              >
                {copiedLink ? <CheckCircle size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-mali-card rounded-xl border border-mali-blue/20 p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-mali-text-secondary text-sm">Referrals</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
            </div>
          </div>

          <div className="bg-mali-card rounded-xl border border-mali-blue/20 p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <BadgeDollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-mali-text-secondary text-sm">Earnings</p>
                <p className="text-2xl font-bold text-white">$0.00</p>
              </div>
            </div>
          </div>

          <div className="bg-mali-card rounded-xl border border-mali-blue/20 p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-mali-text-secondary text-sm">Conversion</p>
                <p className="text-2xl font-bold text-white">0%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Marketing Resources */}
        <div className="bg-gradient-to-r from-mali-blue/20 to-mali-purple/20 border border-mali-blue/30 rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Marketing Resources</h3>
          <p className="text-mali-text-secondary mb-4">
            Boost your affiliate success with our marketing tools and resources
          </p>

          <button className="bg-mali-blue hover:bg-mali-blue-accent text-white rounded-md py-2 px-4 flex items-center transition-colors">
            Access Resources
            <ArrowRight size={16} className="ml-2" />
          </button>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-mali-purple/30 flex items-center justify-center">
          <BadgeDollarSign className="h-5 w-5 text-mali-purple" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Become an Affiliate</h2>
          <p className="text-mali-text-secondary text-sm">Earn commissions by referring users to our platform</p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          className="bg-mali-card rounded-xl border border-mali-blue/20 p-5"
          whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)" }}
          transition={{ duration: 0.2 }}
        >
          <div className="h-12 w-12 rounded-full bg-mali-blue/20 flex items-center justify-center mb-4">
            <BadgeDollarSign className="h-6 w-6 text-mali-blue-light" />
          </div>
          <h3 className="text-white font-medium mb-2">Earn Commission</h3>
          <p className="text-mali-text-secondary text-sm">
            Up to 20% commission on all purchases made using your referral code
          </p>
        </motion.div>

        <motion.div
          className="bg-mali-card rounded-xl border border-mali-blue/20 p-5"
          whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)" }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <div className="h-12 w-12 rounded-full bg-mali-blue/20 flex items-center justify-center mb-4">
            <LinkIcon className="h-6 w-6 text-mali-blue-light" />
          </div>
          <h3 className="text-white font-medium mb-2">Custom Links</h3>
          <p className="text-mali-text-secondary text-sm">
            Get your personalized referral link and marketing resources
          </p>
        </motion.div>

        <motion.div
          className="bg-mali-card rounded-xl border border-mali-blue/20 p-5"
          whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)" }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <div className="h-12 w-12 rounded-full bg-mali-blue/20 flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-mali-blue-light" />
          </div>
          <h3 className="text-white font-medium mb-2">Secure Payments</h3>
          <p className="text-mali-text-secondary text-sm">
            Monthly payouts directly to your account with detailed reporting
          </p>
        </motion.div>
      </div>

      {/* Registration Form */}
      <div className="bg-mali-card rounded-xl border border-mali-blue/20 p-6">
        <h3 className="text-white font-bold mb-4">Registration Form</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="website" className="text-mali-text-secondary text-sm block mb-1">
                  Your Website (Optional)
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  placeholder="https://yourwebsite.com"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full bg-mali-blue/10 border border-mali-blue/30 rounded-md px-4 py-2 text-white focus:outline-none focus:border-mali-blue-light"
                />
                <p className="text-mali-text-secondary text-xs mt-1">If you have a website where you'll promote our products</p>
              </div>

              <div>
                <label htmlFor="socialMedia" className="text-mali-text-secondary text-sm block mb-1">
                  Social Media Profiles (Optional)
                </label>
                <input
                  type="text"
                  id="socialMedia"
                  name="socialMedia"
                  placeholder="@yourusername"
                  value={formData.socialMedia}
                  onChange={handleChange}
                  className="w-full bg-mali-blue/10 border border-mali-blue/30 rounded-md px-4 py-2 text-white focus:outline-none focus:border-mali-blue-light"
                />
                <p className="text-mali-text-secondary text-xs mt-1">Your social media handles where you'll promote our products</p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-mali-blue hover:bg-mali-blue-accent text-white rounded-md py-2 px-6 flex items-center transition-colors"
                >
                  Continue
                  <ArrowRight size={16} className="ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="aboutYou" className="text-mali-text-secondary text-sm block mb-1">
                  Tell Us About You *
                </label>
                <textarea
                  id="aboutYou"
                  name="aboutYou"
                  placeholder="How do you plan to promote our products? What experience do you have?"
                  value={formData.aboutYou}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full bg-mali-blue/10 border border-mali-blue/30 rounded-md px-4 py-2 text-white focus:outline-none focus:border-mali-blue-light resize-none"
                />
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="agreedToTerms"
                  name="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={handleCheckboxChange}
                  required
                  className="mt-1.5 h-4 w-4 rounded border-mali-blue/30 bg-mali-blue/10 text-mali-blue-light focus:ring-mali-blue-light"
                />
                <label htmlFor="agreedToTerms" className="ml-2 block text-sm text-mali-text-secondary">
                  I agree to the <a href="/terms" className="text-mali-blue-light hover:underline">Terms & Conditions</a> and <a href="/privacy" className="text-mali-blue-light hover:underline">Privacy Policy</a>
                </label>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-mali-blue/20 hover:bg-mali-blue/30 text-mali-text-secondary hover:text-white rounded-md py-2 px-4 transition-colors"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !formData.aboutYou || !formData.agreedToTerms}
                  className="bg-gradient-to-r from-mali-blue to-mali-purple text-white rounded-md py-2 px-6 flex items-center transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Register as Affiliate
                      <ArrowRight size={16} className="ml-2" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </form>
      </div>
    </div>
  );
} 
