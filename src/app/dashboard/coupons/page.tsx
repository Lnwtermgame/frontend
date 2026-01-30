"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Ticket, Copy, Check, ChevronDown, ChevronUp, Clock, Search, Plus, AlertCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";

// Mock coupons data
const coupons = [
  {
    id: "COUPON1",
    code: "SAVE10NOW",
    discount: "10%",
    minSpend: 20,
    maxDiscount: 50,
    expiryDate: "2023-12-31T23:59:59Z",
    isUsed: false,
    status: "active",
    description: "10% off your next purchase"
  },
  {
    id: "COUPON2",
    code: "FREESHIP",
    discount: "100%",
    minSpend: 15,
    maxDiscount: 10,
    expiryDate: "2023-12-15T23:59:59Z",
    isUsed: false,
    status: "active",
    description: "Free shipping on your order"
  },
  {
    id: "COUPON3",
    code: "WELCOME25",
    discount: "25%",
    minSpend: 30,
    maxDiscount: 100,
    expiryDate: "2023-11-10T23:59:59Z",
    isUsed: true,
    status: "used",
    description: "25% off your first purchase",
    usedDate: "2023-11-07T14:30:00Z",
    orderReference: "ORD12345"
  },
  {
    id: "COUPON4",
    code: "SUMMER15",
    discount: "15%",
    minSpend: 25,
    maxDiscount: 75,
    expiryDate: "2023-08-31T23:59:59Z",
    isUsed: false,
    status: "expired",
    description: "Summer sale discount"
  }
];

export default function CouponsPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCoupons, setExpandedCoupons] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [newCouponCode, setNewCouponCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [filteredCoupons, setFilteredCoupons] = useState(coupons);

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Filter coupons based on search term and status
  useEffect(() => {
    let result = coupons;

    // Apply status filter
    if (filter !== "all") {
      result = result.filter(coupon => coupon.status === filter);
    }

    // Apply search filter
    if (searchTerm) {
      result = result.filter(coupon =>
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCoupons(result);
  }, [searchTerm, filter]);

  // Toggle coupon expansion
  const toggleCouponExpansion = (couponId: string) => {
    setExpandedCoupons(prev =>
      prev.includes(couponId)
        ? prev.filter(id => id !== couponId)
        : [...prev, couponId]
    );
  };

  // Copy code to clipboard
  const copyToClipboard = (code: string, couponId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(couponId);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Add new coupon
  const handleAddCoupon = () => {
    if (!newCouponCode) {
      setErrorMessage("Please enter a coupon code");
      return;
    }

    // Check if coupon already exists
    if (coupons.some(coupon => coupon.code === newCouponCode)) {
      setErrorMessage("This coupon has already been added");
      return;
    }

    // Simulate API call to validate and add coupon
    setErrorMessage("Validating coupon...");
    setTimeout(() => {
      // Simulate successful coupon addition
      if (newCouponCode === "NEWUSER50") {
        setErrorMessage("");
        setNewCouponCode("");
        alert("Coupon added successfully!");
      } else {
        setErrorMessage("Invalid coupon code");
      }
    }, 1000);
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-mali-blue/20 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-mali-blue/20 rounded"></div>
            <div className="h-4 bg-mali-blue/20 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Get active coupon count
  const activeCouponCount = coupons.filter(coupon => coupon.status === "active").length;

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-6">
        <motion.h2
          className="text-xl font-bold text-white mb-1 relative"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          My Coupons
        </motion.h2>
        <p className="text-mali-text-secondary text-sm relative">You have {activeCouponCount} active coupons</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search coupons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full bg-mali-blue/10 px-4 py-2 text-sm text-white border border-mali-blue/20 focus:outline-none focus:ring-1 focus:ring-mali-blue-accent pl-10 transition-all"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mali-text-secondary" />
        </div>

        <div className="relative w-full sm:w-auto ml-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none w-full rounded-full bg-mali-blue/10 px-4 py-2 pr-10 text-sm text-white border border-mali-blue/20 focus:outline-none focus:ring-1 focus:ring-mali-blue-accent transition-all cursor-pointer"
          >
            <option value="all">All Coupons</option>
            <option value="active">Active</option>
            <option value="used">Used</option>
            <option value="expired">Expired</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mali-text-secondary pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {filteredCoupons.length === 0 ? (
            <motion.div
              className="bg-mali-card border border-mali-blue/20 rounded-xl p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Ticket className="h-16 w-16 mx-auto text-mali-text-secondary mb-4 opacity-50" />
              <h2 className="text-xl font-bold text-white mb-2">No coupons found</h2>
              <p className="text-mali-text-secondary mb-6">You don't have any coupons matching your criteria.</p>
              <Link href="/rewards" className="bg-mali-blue hover:bg-mali-blue/90 text-white px-4 py-2 rounded-lg inline-flex items-center transition-all">
                Browse Rewards
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredCoupons.map((coupon, index) => (
                <motion.div
                  key={coupon.id}
                  className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden hover:border-mali-blue/40 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-mali-blue/5 transition-colors"
                    onClick={() => toggleCouponExpansion(coupon.id)}
                  >
                    <div className="flex items-center mb-3 sm:mb-0">
                      <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-mali-blue/10 border border-mali-blue/20 mr-4">
                        <Ticket className="h-6 w-6 text-mali-blue-light" />
                      </div>
                      <div>
                        <div className="text-white font-medium text-lg">{coupon.description}</div>
                        <div className="text-mali-text-secondary text-sm">Min. spend: ${coupon.minSpend.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
                      <div className="mr-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full inline-flex items-center font-medium
                          ${coupon.status === 'active'
                            ? 'bg-mali-green/20 text-mali-green border border-mali-green/20'
                            : coupon.status === 'used'
                              ? 'bg-mali-blue/20 text-mali-blue-light border border-mali-blue/20'
                              : 'bg-mali-red/20 text-mali-red border border-mali-red/20'
                          }`}>
                          {coupon.status === 'active' ? 'Active' : coupon.status === 'used' ? 'Used' : 'Expired'}
                        </span>
                      </div>
                      {expandedCoupons.includes(coupon.id) ? (
                        <ChevronUp className="h-5 w-5 text-mali-text-secondary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-mali-text-secondary" />
                      )}
                    </div>
                  </div>

                  {expandedCoupons.includes(coupon.id) && (
                    <div className="p-4 border-t border-mali-blue/20 bg-mali-blue/5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-mali-card p-4 rounded-lg border border-mali-blue/10">
                          <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                            <Clock size={14} className="text-mali-blue-accent" /> Coupon Details
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between p-2 rounded hover:bg-mali-blue/5 transition-colors">
                              <span className="text-mali-text-secondary">Discount:</span>
                              <span className="text-white font-medium">{coupon.discount}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded hover:bg-mali-blue/5 transition-colors">
                              <span className="text-mali-text-secondary">Max Discount:</span>
                              <span className="text-white font-medium">${coupon.maxDiscount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded hover:bg-mali-blue/5 transition-colors">
                              <span className="text-mali-text-secondary">Valid Until:</span>
                              <span className={`font-medium ${new Date() > new Date(coupon.expiryDate) ? 'text-mali-red' : 'text-white'}`}>
                                {new Date(coupon.expiryDate).toLocaleDateString()}
                              </span>
                            </div>
                            {coupon.status === 'used' && coupon.usedDate && (
                              <div className="flex justify-between p-2 rounded hover:bg-mali-blue/5 transition-colors">
                                <span className="text-mali-text-secondary">Used On:</span>
                                <span className="text-white">{new Date(coupon.usedDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            {coupon.status === 'used' && coupon.orderReference && (
                              <div className="flex justify-between p-2 rounded hover:bg-mali-blue/5 transition-colors">
                                <span className="text-mali-text-secondary">Order:</span>
                                <Link href={`/orders/${coupon.orderReference}`} className="text-mali-blue-light hover:text-mali-blue-accent hover:underline">
                                  {coupon.orderReference}
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-mali-card p-4 rounded-lg border border-mali-blue/10">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-white text-sm font-medium">Coupon Code</h3>
                            {coupon.status === 'active' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(coupon.code, coupon.id);
                                }}
                                className="text-xs text-mali-blue-light hover:text-mali-blue-accent hover:underline flex items-center transition-colors"
                              >
                                {copiedCode === coupon.id ? (
                                  <>
                                    <Check className="h-3 w-3 mr-1" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy Code
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          <div className="p-3 bg-mali-dark/50 border border-mali-blue/10 rounded-lg font-mono text-white text-sm select-all text-center tracking-wider">
                            {coupon.code}
                          </div>

                          {coupon.status === 'active' && (
                            <div className="mt-4 text-center">
                              <Link
                                href="/checkout"
                                className="w-full bg-mali-blue/20 hover:bg-mali-blue/30 text-mali-blue-accent hover:text-white rounded-lg inline-flex items-center justify-center text-sm py-2 transition-all font-medium"
                              >
                                Use Now
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <motion.div
            className="bg-mali-card border border-mali-blue/20 rounded-xl p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Plus size={18} className="text-mali-blue-accent" /> Add Coupon
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-mali-text-secondary mb-2">Enter coupon code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. SAVE20"
                    value={newCouponCode}
                    onChange={(e) => {
                      setNewCouponCode(e.target.value.toUpperCase());
                      setErrorMessage("");
                    }}
                    className="flex-1 rounded-lg bg-mali-blue/10 px-3 py-2 text-sm text-white border border-mali-blue/20 focus:outline-none focus:ring-1 focus:ring-mali-blue-accent transition-all"
                  />
                  <button
                    onClick={handleAddCoupon}
                    className="rounded-lg bg-mali-blue hover:bg-mali-blue/90 text-white px-3 py-2 flex items-center transition-all shadow-button-glow"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {errorMessage && (
                  <motion.div
                    className="mt-2 text-xs flex items-start text-mali-red bg-mali-red/10 p-2 rounded"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <AlertCircle className="h-3 w-3 mt-0.5 mr-1 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}
                <p className="text-mali-text-secondary text-xs mt-2">
                  Enter a valid coupon code to add it to your account
                </p>
              </div>
            </div>
          </motion.div>

          {/* How to Use Section */}
          <motion.div
            className="bg-mali-card border border-mali-blue/20 rounded-xl p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-white font-semibold mb-4">How to Use</h2>
            <div className="space-y-4">
              <div className="flex">
                <div className="h-6 w-6 rounded-full bg-mali-blue/20 border border-mali-blue/30 text-mali-blue-accent flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="text-mali-text-secondary text-sm">Find a coupon or enter a coupon code</p>
                </div>
              </div>

              <div className="flex">
                <div className="h-6 w-6 rounded-full bg-mali-blue/20 border border-mali-blue/30 text-mali-blue-accent flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="text-mali-text-secondary text-sm">Copy the coupon code</p>
                </div>
              </div>

              <div className="flex">
                <div className="h-6 w-6 rounded-full bg-mali-blue/20 border border-mali-blue/30 text-mali-blue-accent flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="text-mali-text-secondary text-sm">Apply it during checkout or click "Use Now"</p>
                </div>
              </div>

              <div className="flex items-center mt-3 pt-3 border-t border-mali-blue/10">
                <Clock className="h-4 w-4 text-mali-blue-light mr-2" />
                <span className="text-mali-text-secondary text-xs">Coupons have expiry dates, use them before they expire</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 
