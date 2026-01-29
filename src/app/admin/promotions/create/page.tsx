"use client";

import { useState } from "react";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import { Tag, Calendar, Save, ChevronLeft, X, Clock, Percent, CreditCard, Gamepad, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminPromotionCreate() {
  
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    type: "discount",
    code: "",
    discount: "",
    startDate: "",
    endDate: "",
    minPurchase: "",
    maxDiscount: "",
    usageLimit: "",
    description: "",
    isActive: true,
    applyToAll: true,
    selectedGames: []
  });

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Redirect to promotions list
    router.push("/admin/promotions");
  };

  return (
    <AdminLayout title={"Create Promotion" as any}>
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
        
        {/* Form Container */}
        <motion.div 
          className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="p-5 border-b border-mali-blue/20">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Tag className="mr-2 h-5 w-5 text-mali-blue" />
              New Promotion
            </h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Promotion Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
                    Promotion Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    className="bg-mali-card/50 border border-mali-blue/20 text-white rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-mali-blue focus:outline-none"
                    placeholder="e.g. Summer Sale 30% Off"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>
                
                {/* Promotion Type */}
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">
                    Promotion Type <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Sparkles className="h-5 w-5 text-mali-blue/70" />
                    </div>
                    <select
                      id="type"
                      name="type"
                      required
                      className="bg-mali-card/50 border border-mali-blue/20 text-white rounded-lg pl-10 pr-4 py-2.5 w-full appearance-none focus:ring-2 focus:ring-mali-blue focus:outline-none"
                      value={formData.type}
                      onChange={handleChange}
                    >
                      <option value="discount">Regular Discount</option>
                      <option value="flash">Flash Sale</option>
                      <option value="cashback">Cashback</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-mali-blue/70">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Promotion Code */}
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-1">
                    Promo Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    required
                    className="bg-mali-card/50 border border-mali-blue/20 text-white rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-mali-blue focus:outline-none font-mono"
                    placeholder="e.g. SUMMER30"
                    value={formData.code}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-xs text-gray-400">Codes are case-sensitive and should be unique</p>
                </div>
                
                {/* Discount Amount */}
                <div>
                  <label htmlFor="discount" className="block text-sm font-medium text-gray-300 mb-1">
                    Discount Amount <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Percent className="h-5 w-5 text-mali-blue/70" />
                    </div>
                    <input
                      type="text"
                      id="discount"
                      name="discount"
                      required
                      className="bg-mali-card/50 border border-mali-blue/20 text-white rounded-lg pl-10 pr-4 py-2.5 w-full focus:ring-2 focus:ring-mali-blue focus:outline-none"
                      placeholder="e.g. 30"
                      value={formData.discount}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                {/* Min Purchase */}
                <div>
                  <label htmlFor="minPurchase" className="block text-sm font-medium text-gray-300 mb-1">
                    Minimum Purchase (optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-mali-blue/70" />
                    </div>
                    <input
                      type="text"
                      id="minPurchase"
                      name="minPurchase"
                      className="bg-mali-card/50 border border-mali-blue/20 text-white rounded-lg pl-10 pr-4 py-2.5 w-full focus:ring-2 focus:ring-mali-blue focus:outline-none"
                      placeholder="e.g. 20"
                      value={formData.minPurchase}
                      onChange={handleChange}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Minimum purchase amount required to use this promotion</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Date Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1">
                      Start Date <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-mali-blue/70" />
                      </div>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        required
                        className="bg-mali-card/50 border border-mali-blue/20 text-white rounded-lg pl-10 pr-4 py-2.5 w-full focus:ring-2 focus:ring-mali-blue focus:outline-none"
                        value={formData.startDate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1">
                      End Date <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-mali-blue/70" />
                      </div>
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        required
                        className="bg-mali-card/50 border border-mali-blue/20 text-white rounded-lg pl-10 pr-4 py-2.5 w-full focus:ring-2 focus:ring-mali-blue focus:outline-none"
                        value={formData.endDate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Usage Limit */}
                <div>
                  <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-300 mb-1">
                    Usage Limit (optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-mali-blue/70" />
                    </div>
                    <input
                      type="number"
                      id="usageLimit"
                      name="usageLimit"
                      className="bg-mali-card/50 border border-mali-blue/20 text-white rounded-lg pl-10 pr-4 py-2.5 w-full focus:ring-2 focus:ring-mali-blue focus:outline-none"
                      placeholder="Leave blank for unlimited"
                      value={formData.usageLimit}
                      onChange={handleChange}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Maximum number of times this promotion can be used</p>
                </div>

                {/* Max Discount */}
                <div>
                  <label htmlFor="maxDiscount" className="block text-sm font-medium text-gray-300 mb-1">
                    Maximum Discount (optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-mali-blue/70" />
                    </div>
                    <input
                      type="text"
                      id="maxDiscount"
                      name="maxDiscount"
                      className="bg-mali-card/50 border border-mali-blue/20 text-white rounded-lg pl-10 pr-4 py-2.5 w-full focus:ring-2 focus:ring-mali-blue focus:outline-none"
                      placeholder="e.g. 50"
                      value={formData.maxDiscount}
                      onChange={handleChange}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Maximum discount amount in currency units</p>
                </div>

                {/* Active Status */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleChange(e as any)}
                    className="bg-mali-card/50 border border-mali-blue/20 rounded text-mali-blue focus:ring-mali-blue focus:ring-2"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-300">
                    Make promotion active immediately
                  </label>
                </div>

                {/* Apply to All */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="applyToAll"
                    name="applyToAll"
                    checked={formData.applyToAll}
                    onChange={(e) => handleChange(e as any)}
                    className="bg-mali-card/50 border border-mali-blue/20 rounded text-mali-blue focus:ring-mali-blue focus:ring-2"
                  />
                  <label htmlFor="applyToAll" className="text-sm font-medium text-gray-300">
                    Apply to all products & games
                  </label>
                </div>
              </div>
            </div>

            {/* Description Textarea - Full Width */}
            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                Description (optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="bg-mali-card/50 border border-mali-blue/20 text-white rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-mali-blue focus:outline-none"
                placeholder="Describe the promotion details..."
                value={formData.description}
                onChange={handleChange}
              ></textarea>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
              <Link href="/admin/promotions">
                <button 
                  type="button"
                  className="px-5 py-2.5 rounded-lg border border-mali-blue/20 text-mali-blue hover:bg-mali-blue/10 transition-colors w-full sm:w-auto flex items-center justify-center"
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancel
                </button>
              </Link>
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-2.5 rounded-lg bg-mali-blue text-white hover:bg-mali-blue/90 transition-colors w-full sm:w-auto flex items-center justify-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <Save className="h-5 w-5 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Promotion'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AdminLayout>
  );
} 
