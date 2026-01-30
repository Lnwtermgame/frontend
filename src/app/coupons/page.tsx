"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Ticket, Copy, Check, ChevronDown, ChevronUp, Clock, Search, Plus, AlertCircle } from "lucide-react";
import Link from "next/link";

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
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-lg text-mali-text-secondary">Loading...</p>
      </div>
    );
  }

  // Get active coupon count
  const activeCouponCount = coupons.filter(coupon => coupon.status === "active").length;

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Coupons</h1>
          <p className="text-mali-text-secondary text-sm">You have {activeCouponCount} active coupons</p>
        </div>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3 mt-4 sm:mt-0">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md bg-mali-navy px-3 py-2 text-sm text-white border border-mali-blue focus:outline-none focus:ring-1 focus:ring-mali-blue-accent"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mali-text-secondary" />
          </div>

          <div className="relative w-full sm:w-auto">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none w-full rounded-md bg-mali-navy px-3 py-2 pr-8 text-sm text-white border border-mali-blue focus:outline-none focus:ring-1 focus:ring-mali-blue-accent"
            >
              <option value="all">All Coupons</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
              <option value="expired">Expired</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mali-text-secondary pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {filteredCoupons.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Ticket className="h-16 w-16 mx-auto text-mali-text-secondary mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">No coupons found</h2>
              <p className="text-mali-text-secondary mb-6">You don't have any coupons matching your criteria.</p>
              <Link href="/rewards" className="btn-primary inline-flex items-center">
                Browse Rewards
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCoupons.map((coupon) => (
                <div key={coupon.id} className="glass-card overflow-hidden">
                  <div
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-mali-blue/10 transition-colors"
                    onClick={() => toggleCouponExpansion(coupon.id)}
                  >
                    <div className="flex items-center mb-3 sm:mb-0">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-mali-blue/30 mr-3">
                        <Ticket className="h-5 w-5 text-mali-blue-light" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{coupon.description}</div>
                        <div className="text-mali-text-secondary text-xs">Min. spend: ${coupon.minSpend.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
                      <div className="mr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center
                          ${coupon.status === 'active'
                            ? 'bg-mali-green/20 text-mali-green'
                            : coupon.status === 'used'
                              ? 'bg-mali-blue/20 text-mali-blue-light'
                              : 'bg-mali-red/20 text-mali-red'
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
                    <div className="p-4 border-t border-mali-blue/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-mali-navy/50 p-4 rounded-md">
                          <h3 className="text-white text-sm font-medium mb-3">Coupon Details</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-mali-text-secondary">Discount:</span>
                              <span className="text-white">{coupon.discount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-mali-text-secondary">Max Discount:</span>
                              <span className="text-white">${coupon.maxDiscount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-mali-text-secondary">Valid Until:</span>
                              <span className={`${new Date() > new Date(coupon.expiryDate) ? 'text-mali-red' : 'text-white'}`}>
                                {new Date(coupon.expiryDate).toLocaleDateString()}
                              </span>
                            </div>
                            {coupon.status === 'used' && coupon.usedDate && (
                              <div className="flex justify-between">
                                <span className="text-mali-text-secondary">Used On:</span>
                                <span className="text-white">{new Date(coupon.usedDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            {coupon.status === 'used' && coupon.orderReference && (
                              <div className="flex justify-between">
                                <span className="text-mali-text-secondary">Order:</span>
                                <Link href={`/orders/${coupon.orderReference}`} className="text-mali-blue-light hover:text-mali-blue-accent hover:underline">
                                  {coupon.orderReference}
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-mali-navy/50 p-4 rounded-md">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-white text-sm font-medium">Coupon Code</h3>
                            {coupon.status === 'active' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(coupon.code, coupon.id);
                                }}
                                className="text-xs text-mali-blue-light hover:text-mali-blue-accent hover:underline flex items-center"
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
                          <div className="p-3 bg-mali-dark rounded-md font-mono text-white text-sm select-all">
                            {coupon.code}
                          </div>

                          {coupon.status === 'active' && (
                            <div className="mt-4 text-center">
                              <Link
                                href="/checkout"
                                className="btn-primary inline-flex items-center text-xs py-1.5 px-3"
                              >
                                Use Now
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-4">
            <h2 className="text-white font-medium mb-4">Add Coupon</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-mali-text-secondary mb-1">Enter coupon code</label>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="e.g. SAVE20"
                    value={newCouponCode}
                    onChange={(e) => {
                      setNewCouponCode(e.target.value.toUpperCase());
                      setErrorMessage("");
                    }}
                    className="flex-1 rounded-l-md bg-mali-navy px-3 py-2 text-sm text-white border border-mali-blue focus:outline-none focus:ring-1 focus:ring-mali-blue-accent"
                  />
                  <button
                    onClick={handleAddCoupon}
                    className="rounded-r-md bg-button-gradient shadow-button-glow hover:opacity-90 text-white px-3 py-2 flex items-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {errorMessage && (
                  <div className="mt-2 text-xs flex items-start text-mali-red">
                    <AlertCircle className="h-3 w-3 mt-0.5 mr-1 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
                <p className="text-mali-text-secondary text-xs mt-2">
                  Enter a valid coupon code to add it to your account
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <h2 className="text-white font-medium mb-4">How to Use</h2>
            <div className="space-y-4">
              <div className="flex">
                <div className="h-6 w-6 rounded-full bg-mali-blue/30 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-white text-xs">1</span>
                </div>
                <div>
                  <p className="text-mali-text-secondary text-xs">Find a coupon or enter a coupon code</p>
                </div>
              </div>

              <div className="flex">
                <div className="h-6 w-6 rounded-full bg-mali-blue/30 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-white text-xs">2</span>
                </div>
                <div>
                  <p className="text-mali-text-secondary text-xs">Copy the coupon code</p>
                </div>
              </div>

              <div className="flex">
                <div className="h-6 w-6 rounded-full bg-mali-blue/30 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-white text-xs">3</span>
                </div>
                <div>
                  <p className="text-mali-text-secondary text-xs">Apply it during checkout or click "Use Now"</p>
                </div>
              </div>

              <div className="flex items-center mt-3">
                <Clock className="h-4 w-4 text-mali-blue-light mr-2" />
                <span className="text-mali-text-secondary text-xs">Coupons have expiry dates, use them before they expire</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <h2 className="text-white font-medium mb-4">Get More Coupons</h2>
            <div className="space-y-2">
              <Link
                href="/rewards"
                className="block p-2 text-mali-text-secondary hover:text-white hover:bg-mali-blue/20 rounded-md text-sm transition-colors"
              >
                SEAGM Rewards Program
              </Link>
              <Link
                href="/newsletter"
                className="block p-2 text-mali-text-secondary hover:text-white hover:bg-mali-blue/20 rounded-md text-sm transition-colors"
              >
                Subscribe to Newsletter
              </Link>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
