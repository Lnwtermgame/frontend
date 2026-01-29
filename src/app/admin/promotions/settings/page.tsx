"use client";

import { useState } from "react";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import { Settings, Save, ChevronLeft, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";

export default function AdminPromotionSettings() {
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for coupon settings
  const [settings, setSettings] = useState({
    // Coupon Display Settings
    showCouponsOnHomepage: true,
    highlightNewCoupons: true,
    expiringSoonDays: 3,
    
    // Coupon Usage Settings
    allowMultipleCoupons: false,
    maxCouponsPerOrder: 1,
    allowCouponStacking: false,
    minOrderValueForCoupons: 10,
    
    // Coupon Generation Settings
    defaultCouponLength: 8,
    includeSpecialCharacters: false,
    useRandomCodes: true,
    
    // Notification Settings
    notifyBeforeCouponExpiry: true,
    expiryNotificationDays: 3,
    
    // Security Settings
    maxFailedAttempts: 5,
    blockDurationMinutes: 30,
    restrictToLoggedInUsers: true
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setSettings({
        ...settings,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else if (type === 'number') {
      setSettings({
        ...settings,
        [name]: parseInt(value, 10)
      });
    } else {
      setSettings({
        ...settings,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // TODO: This will be implemented by backend
      console.log('Settings to be saved:', settings);
      
      // For UI demonstration purposes only
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Show success message (would be handled by a notification system)
      alert("Settings updated successfully!");
    } catch (error) {
      console.error('Error saving settings:', error);
      alert("Failed to update settings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle switch component
  const ToggleSwitch = ({ 
    name, 
    label, 
    description,
    checked, 
    onChange 
  }: { 
    name: string; 
    label: string; 
    description?: string;
    checked: boolean; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div className="flex items-start space-x-3">
      <div className="mt-0.5">
        <label htmlFor={name} className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            id={name} 
            name={name} 
            className="sr-only" 
            checked={checked} 
            onChange={onChange}
          />
          <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-mali-blue' : 'bg-mali-blue/20'}`}>
            <div className={`h-5 w-5 rounded-full bg-white absolute left-0.5 top-0.5 transition-transform ${checked ? 'translate-x-5 shadow-button-glow' : ''}`}></div>
          </div>
        </label>
      </div>
      <div>
        <label htmlFor={name} className="text-white text-sm font-medium block cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-mali-text-secondary text-xs mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );

  return (
    <AdminLayout title={"Promotion Settings" as any}>
      <div className="space-y-6">
        {/* Back Button */}
        <div>
          <Link href="/admin/promotions">
            <button className="flex items-center text-mali-blue hover:text-white transition-colors">
              <ChevronLeft className="h-5 w-5 mr-1" />
              <span>Back to Promotions</span>
            </button>
          </Link>
        </div>
        
        {/* Settings Container */}
        <motion.div 
          className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="p-5 border-b border-mali-blue/20">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Settings className="mr-2 h-5 w-5 text-mali-blue" />
              Coupon & Promotion Settings
            </h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
              {/* Coupon Display Settings */}
              <div className="lg:col-span-2">
                <h4 className="text-white font-medium mb-4 flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-mali-blue-light" />
                  Coupon Display Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-mali-blue/5 p-4 rounded-lg border border-mali-blue/10">
                  <ToggleSwitch
                    name="showCouponsOnHomepage"
                    label="Show Coupons on Homepage"
                    description="Display available coupons on the homepage for better visibility"
                    checked={settings.showCouponsOnHomepage}
                    onChange={handleChange}
                  />
                  
                  <ToggleSwitch
                    name="highlightNewCoupons"
                    label="Highlight New Coupons"
                    description="Highlight newly added coupons with special indicators"
                    checked={settings.highlightNewCoupons}
                    onChange={handleChange}
                  />
                  
                  <div>
                    <label htmlFor="expiringSoonDays" className="block text-white text-sm font-medium mb-1">
                      "Expiring Soon" Threshold (days)
                    </label>
                    <input
                      type="number"
                      id="expiringSoonDays"
                      name="expiringSoonDays"
                      min="1"
                      max="30"
                      value={settings.expiringSoonDays}
                      onChange={handleChange}
                      className="bg-mali-card/50 border border-mali-blue/20 text-white rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-mali-blue focus:outline-none"
                    />
                    <p className="text-mali-text-secondary text-xs mt-1">
                      Coupons with fewer days remaining will be marked as "expiring soon"
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Coupon Usage Settings */}
              <div>
                <h4 className="text-white font-medium mb-4">Coupon Usage Settings</h4>
                <div className="space-y-4 bg-mali-blue/5 p-4 rounded-lg border border-mali-blue/10">
                  <ToggleSwitch
                    name="allowMultipleCoupons"
                    label="Allow Multiple Coupons"
                    description="Enable users to apply multiple coupons to a single order"
                    checked={settings.allowMultipleCoupons}
                    onChange={handleChange}
                  />
                  
                  {settings.allowMultipleCoupons && (
                    <div>
                      <label htmlFor="maxCouponsPerOrder" className="block text-white text-sm font-medium mb-1">
                        Max Coupons Per Order
                      </label>
                      <input
                        type="number"
                        id="maxCouponsPerOrder"
                        name="maxCouponsPerOrder"
                        min="1"
                        max="10"
                        value={settings.maxCouponsPerOrder}
                        onChange={handleChange}
                        className="bg-mali-card/50 border border-mali-blue/20 text-white rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-mali-blue focus:outline-none"
                      />
                    </div>
                  )}
                  
                  <ToggleSwitch
                    name="allowCouponStacking"
                    label="Allow Coupon Stacking"
                    description="Let discounts from multiple coupons stack on the same products"
                    checked={settings.allowCouponStacking}
                    onChange={handleChange}
                  />
                  
                  <div>
                    <label htmlFor="minOrderValueForCoupons" className="block text-white text-sm font-medium mb-1">
                      Minimum Order Value ($)
                    </label>
                    <input
                      type="number"
                      id="minOrderValueForCoupons"
                      name="minOrderValueForCoupons"
                      min="0"
                      value={settings.minOrderValueForCoupons}
                      onChange={handleChange}
                      className="bg-mali-card/50 border border-mali-blue/20 text-white rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-mali-blue focus:outline-none"
                    />
                    <p className="text-mali-text-secondary text-xs mt-1">
                      Default minimum order value required to use any coupon
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Security Settings */}
              <div>
                <h4 className="text-white font-medium mb-4">Security Settings</h4>
                <div className="space-y-4 bg-mali-blue/5 p-4 rounded-lg border border-mali-blue/10">
                  <ToggleSwitch
                    name="restrictToLoggedInUsers"
                    label="Restrict to Logged-in Users"
                    description="Only allow logged-in users to apply coupons"
                    checked={settings.restrictToLoggedInUsers}
                    onChange={handleChange}
                  />
                  
                  <div>
                    <label htmlFor="maxFailedAttempts" className="block text-white text-sm font-medium mb-1">
                      Max Failed Attempts
                    </label>
                    <input
                      type="number"
                      id="maxFailedAttempts"
                      name="maxFailedAttempts"
                      min="1"
                      max="20"
                      value={settings.maxFailedAttempts}
                      onChange={handleChange}
                      className="bg-mali-card/50 border border-mali-blue/20 text-white rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-mali-blue focus:outline-none"
                    />
                    <p className="text-mali-text-secondary text-xs mt-1">
                      Number of failed coupon attempts before temporary block
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="blockDurationMinutes" className="block text-white text-sm font-medium mb-1">
                      Block Duration (minutes)
                    </label>
                    <input
                      type="number"
                      id="blockDurationMinutes"
                      name="blockDurationMinutes"
                      min="5"
                      max="1440"
                      value={settings.blockDurationMinutes}
                      onChange={handleChange}
                      className="bg-mali-card/50 border border-mali-blue/20 text-white rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-mali-blue focus:outline-none"
                    />
                    <p className="text-mali-text-secondary text-xs mt-1">
                      How long to block coupon attempts after too many failed tries
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Coupon Generation Settings */}
              <div className="lg:col-span-2">
                <h4 className="text-white font-medium mb-4">Coupon Generation Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-mali-blue/5 p-4 rounded-lg border border-mali-blue/10">
                  <div>
                    <label htmlFor="defaultCouponLength" className="block text-white text-sm font-medium mb-1">
                      Default Coupon Code Length
                    </label>
                    <input
                      type="number"
                      id="defaultCouponLength"
                      name="defaultCouponLength"
                      min="4"
                      max="16"
                      value={settings.defaultCouponLength}
                      onChange={handleChange}
                      className="bg-mali-card/50 border border-mali-blue/20 text-white rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-mali-blue focus:outline-none"
                    />
                  </div>
                  
                  <ToggleSwitch
                    name="includeSpecialCharacters"
                    label="Include Special Characters"
                    description="Include special characters in generated coupon codes"
                    checked={settings.includeSpecialCharacters}
                    onChange={handleChange}
                  />
                  
                  <ToggleSwitch
                    name="useRandomCodes"
                    label="Use Random Codes"
                    description="Generate random codes instead of sequential ones"
                    checked={settings.useRandomCodes}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              {/* Notification Settings */}
              <div className="lg:col-span-2">
                <h4 className="text-white font-medium mb-4">Notification Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-mali-blue/5 p-4 rounded-lg border border-mali-blue/10">
                  <ToggleSwitch
                    name="notifyBeforeCouponExpiry"
                    label="Notify Before Coupon Expiry"
                    description="Send notifications to users before their coupons expire"
                    checked={settings.notifyBeforeCouponExpiry}
                    onChange={handleChange}
                  />
                  
                  {settings.notifyBeforeCouponExpiry && (
                    <div>
                      <label htmlFor="expiryNotificationDays" className="block text-white text-sm font-medium mb-1">
                        Expiry Notification Days
                      </label>
                      <input
                        type="number"
                        id="expiryNotificationDays"
                        name="expiryNotificationDays"
                        min="1"
                        max="30"
                        value={settings.expiryNotificationDays}
                        onChange={handleChange}
                        className="bg-mali-card/50 border border-mali-blue/20 text-white rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-mali-blue focus:outline-none"
                      />
                      <p className="text-mali-text-secondary text-xs mt-1">
                        Days before expiry to send notification
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-mali-blue text-white px-6 py-2.5 rounded-lg flex items-center justify-center hover:bg-mali-blue/90 transition-colors shadow-button-glow ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <Save className="h-5 w-5 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AdminLayout>
  );
} 
