"use client";

import { useState, useEffect } from "react";
import { motion } from "@/lib/framer-exports";
import Link from "next/link";
import { 
  HelpCircle, ChevronDown, ChevronUp, Search, 
  Tag, Filter, ArrowLeft, MessageSquare, 
  ThumbsUp, ThumbsDown, Clock
} from "lucide-react";
import { useTranslations } from "@/lib/context/language-context";

// FAQ Categories
const faqCategories = [
  {
    id: "account",
    name: "Account & Security",
    icon: <span className="bg-blue-500/20 p-1.5 rounded text-blue-400">A</span>
  },
  {
    id: "payment",
    name: "Payment & Billing",
    icon: <span className="bg-green-500/20 p-1.5 rounded text-green-400">P</span>
  },
  {
    id: "orders",
    name: "Orders & Top-ups",
    icon: <span className="bg-amber-500/20 p-1.5 rounded text-amber-400">O</span>
  },
  {
    id: "games",
    name: "Games & Products",
    icon: <span className="bg-purple-500/20 p-1.5 rounded text-purple-400">G</span>
  },
  {
    id: "promotions",
    name: "Promotions & Rewards",
    icon: <span className="bg-pink-500/20 p-1.5 rounded text-pink-400">R</span>
  },
  {
    id: "technical",
    name: "Technical Issues",
    icon: <span className="bg-red-500/20 p-1.5 rounded text-red-400">T</span>
  }
];

// FAQ data
const faqData = [
  // Account & Security
  {
    id: "create-account",
    category: "account",
    question: "How do I create an account?",
    answer: "To create an account, click on the 'Sign Up' button in the top right corner of the homepage. Fill in your details including your name, email address, and create a password. You'll receive a verification email to confirm your account. Click the link in the email to verify your account and complete the registration process.",
    tags: ["account", "signup", "registration"]
  },
  {
    id: "reset-password",
    category: "account",
    question: "I forgot my password. How do I reset it?",
    answer: "If you forgot your password, click the 'Login' button and then select 'Forgot Password'. Enter the email address associated with your account and we'll send you a password reset link. Click the link in the email and follow the instructions to create a new password.",
    tags: ["account", "password", "reset"]
  },
  {
    id: "account-security",
    category: "account",
    question: "How can I secure my account?",
    answer: "To enhance your account security, we recommend: 1) Use a strong, unique password. 2) Enable two-factor authentication in your account settings. 3) Keep your email address up to date. 4) Never share your login credentials with anyone. 5) Log out from shared devices. 6) Regularly check your order history for any unauthorized transactions.",
    tags: ["account", "security", "2fa"]
  },
  {
    id: "change-email",
    category: "account",
    question: "How do I change my email address?",
    answer: "To change your email address, log into your account and go to the 'Account Settings' page. Click on 'Edit' next to your email address, enter your new email address and your current password for verification. We'll send a verification email to your new address. Click the link in the email to confirm the change.",
    tags: ["account", "email", "settings"]
  },
  
  // Payment & Billing
  {
    id: "payment-methods",
    category: "payment",
    question: "What payment methods do you accept?",
    answer: "We accept various payment methods including major credit/debit cards (Visa, Mastercard, American Express), PayPal, various e-wallets (GCash, GrabPay, TrueMoney), bank transfers, and cryptocurrency. Available payment methods may vary depending on your location.",
    tags: ["payment", "methods", "billing"]
  },
  {
    id: "payment-security",
    category: "payment",
    question: "Is my payment information secure?",
    answer: "Yes, your payment information is secure. We use industry-standard SSL encryption for all transactions. We don't store your full credit card details on our servers. All payment processing is handled by trusted third-party payment processors that comply with PCI DSS standards.",
    tags: ["payment", "security", "encryption"]
  },
  {
    id: "refund-policy",
    category: "payment",
    question: "What is your refund policy?",
    answer: "Our refund policy varies depending on the product and situation. For digital goods like game credits, refunds are generally only available for unsuccessful or incorrect transactions. Once the game credits have been successfully delivered to your game account, refunds are typically not available. For specific refund inquiries, please contact our support team with your order details.",
    tags: ["payment", "refund", "policy"]
  },
  {
    id: "payment-failed",
    category: "payment",
    question: "My payment failed but I was charged. What should I do?",
    answer: "If your payment failed but you were charged, don't worry. This is usually a temporary authorization hold that will be reversed by your bank within 3-5 business days. If you see a charge (not just an authorization) on your statement, please contact our support team with your order details and payment proof, and we'll help resolve the issue.",
    tags: ["payment", "failed", "charged"]
  },
  {
    id: "currency-conversion",
    category: "payment",
    question: "Do you support multiple currencies?",
    answer: "Yes, we support multiple currencies. The default currency is displayed based on your location, but you can change it in your account settings or during checkout. Please note that if you pay in a currency different from your card's currency, your bank may apply conversion fees.",
    tags: ["payment", "currency", "conversion"]
  },
  
  // Orders & Top-ups
  {
    id: "delivery-time",
    category: "orders",
    question: "How long does it take to receive game credits after purchase?",
    answer: "Most top-ups are processed automatically and delivered within 5 minutes after successful payment. For some games, it might take up to 24 hours depending on the game server's processing time. If you haven't received your credits after 24 hours, please contact our support team with your order ID.",
    tags: ["orders", "delivery", "time"]
  },
  {
    id: "check-order-status",
    category: "orders",
    question: "How do I check the status of my order?",
    answer: "To check your order status, log into your account and go to 'My Orders'. You'll see all your orders listed with their current status. Click on any order to view detailed information, including delivery status, payment details, and product information.",
    tags: ["orders", "status", "tracking"]
  },
  {
    id: "order-id",
    category: "orders",
    question: "Where can I find my order ID?",
    answer: "Your order ID is provided in the order confirmation email sent after your purchase. You can also find it by logging into your account and going to 'My Orders'. Each order has a unique ID displayed in the order list and order details page.",
    tags: ["orders", "id", "tracking"]
  },
  {
    id: "top-up-wrong-account",
    category: "orders",
    question: "I topped up the wrong account. Can I transfer the credits?",
    answer: "Unfortunately, once game credits have been delivered to an account, they cannot be transferred to another account. This is due to the policies of game publishers. We recommend double-checking the account details before confirming your purchase. If you haven't completed the purchase yet, you can cancel it and place a new order with the correct details.",
    tags: ["orders", "top-up", "error"]
  },
  {
    id: "cancel-order",
    category: "orders",
    question: "Can I cancel my order?",
    answer: "You can cancel your order only if it has not been processed yet. Go to 'My Orders', find the order you want to cancel, and click on the 'Cancel' button if it's available. If the order has already been processed or delivered, it cannot be canceled. Please contact our support team if you have any issues with your order.",
    tags: ["orders", "cancel", "refund"]
  },
  
  // Games & Products
  {
    id: "game-not-listed",
    category: "games",
    question: "The game I want to top up isn't listed. What can I do?",
    answer: "If a game you want to top up isn't listed on our platform, you can request it by submitting a suggestion through the 'Contact Support' page. Select 'Feedback' as the category and provide details about the game. We regularly add new games based on customer demand, and we'll notify you if we add the game you requested.",
    tags: ["games", "request", "new"]
  },
  {
    id: "game-region",
    category: "games",
    question: "Do you support different game regions and servers?",
    answer: "Yes, we support multiple regions and servers for most games. When making a purchase, you'll be asked to select the appropriate server or region for your game account. Make sure to select the correct region, as game credits are usually region-specific and cannot be transferred between different regions.",
    tags: ["games", "region", "server"]
  },
  {
    id: "game-compatibility",
    category: "games",
    question: "Will the in-game currency work on my device?",
    answer: "In-game currency is tied to your game account, not your device. As long as you use the same account on different devices, your purchased in-game currency will be available. For example, if you buy Mobile Legends diamonds for your account, you can access those diamonds whether you play on an Android device, iOS device, or emulator.",
    tags: ["games", "compatibility", "device"]
  },
  {
    id: "game-gift-codes",
    category: "games",
    question: "How do I redeem a gift code?",
    answer: "To redeem a gift code, log into your account and navigate to the 'Redeem' page. Enter your gift code in the provided field and click 'Redeem'. If the code is valid, the credits will be added to your account balance immediately. Gift codes are case-sensitive and have expiration dates, so make sure to enter them correctly and use them before they expire.",
    tags: ["games", "gift", "redeem"]
  },
  
  // Promotions & Rewards
  {
    id: "current-promotions",
    category: "promotions",
    question: "What promotions are currently available?",
    answer: "You can find all current promotions on our 'Flash Sales' and 'Promotions' pages. We regularly offer discounts, cashback rewards, and special bundles. You can also check our 'Cashback' and 'Referral' pages for ongoing programs that let you earn rewards. To stay updated on new promotions, subscribe to our newsletter and follow our social media channels.",
    tags: ["promotions", "discounts", "sales"]
  },
  {
    id: "cashback-program",
    category: "promotions",
    question: "How does the cashback program work?",
    answer: "Our cashback program rewards you with a percentage of your purchase value back as MaliCoins. For example, if you make a purchase with 10% cashback, you'll receive 10% of the purchase value in MaliCoins. These coins can be used for future purchases on our platform. Cashback rates vary by game and promotion. You can view your accumulated MaliCoins and cashback history in your account dashboard.",
    tags: ["promotions", "cashback", "rewards"]
  },
  {
    id: "referral-program",
    category: "promotions",
    question: "How does the referral program work?",
    answer: "Our referral program lets you earn rewards by inviting friends to use our platform. Share your unique referral code with friends. When they sign up and make their first purchase, you'll both receive bonus credits. You earn a reward for each successful referral, and additional bonuses when you reach certain referral milestones. Visit the 'Referral' page in your account to get your code and track your referrals.",
    tags: ["promotions", "referral", "rewards"]
  },
  {
    id: "coupon-usage",
    category: "promotions",
    question: "How do I use a coupon code?",
    answer: "To use a coupon code, add items to your cart and proceed to checkout. On the payment page, you'll see a field labeled 'Coupon Code' or 'Promo Code'. Enter your code there and click 'Apply' to see the discount reflected in your total. Note that some coupon codes have restrictions such as minimum purchase amounts, expiration dates, or can only be used once per account.",
    tags: ["promotions", "coupon", "discount"]
  },
  
  // Technical Issues
  {
    id: "website-issues",
    category: "technical",
    question: "The website is slow or not loading properly. What should I do?",
    answer: "If you're experiencing website issues, try these troubleshooting steps: 1) Refresh the page. 2) Clear your browser cache and cookies. 3) Try a different browser. 4) Check your internet connection. 5) Disable browser extensions that might interfere. If the problem persists, please contact our support team with details about the issue, including your device, browser, and screenshots if possible.",
    tags: ["technical", "website", "loading"]
  },
  {
    id: "platform-access",
    category: "technical",
    question: "How can I access MaliGamePass?",
    answer: "MaliGamePass is available as a web-based platform optimized for all devices. You can access all features through any modern web browser on your desktop, laptop, tablet, or smartphone. Our responsive design ensures a great experience across all screen sizes. We support push notifications through compatible web browsers so you'll never miss important updates about your orders.",
    tags: ["technical", "access", "website", "browser"]
  },
  {
    id: "browser-compatibility",
    category: "technical",
    question: "Which browsers do you support?",
    answer: "Our website is compatible with all major modern browsers, including Google Chrome, Mozilla Firefox, Safari, Microsoft Edge, and Opera. For the best experience, we recommend using the latest version of these browsers. Some features might not work properly on older browser versions or Internet Explorer.",
    tags: ["technical", "browser", "compatibility"]
  },
  {
    id: "login-issues",
    category: "technical",
    question: "I can't log into my account. What should I do?",
    answer: "If you're having trouble logging in, try these steps: 1) Make sure you're using the correct email and password. 2) Use the 'Forgot Password' feature to reset your password if needed. 3) Check if Caps Lock is turned on. 4) Clear your browser cache and cookies. 5) Try a different browser. If you still can't log in, contact our support team with your account email address for assistance.",
    tags: ["technical", "login", "account"]
  },
  {    id: "website-responsive",    category: "technical",    question: "Is your website mobile-friendly?",    answer: "Yes! Our website is fully responsive and optimized for all devices. You can access the platform from any modern web browser on your desktop, laptop, tablet, or smartphone with a consistent experience. The interface automatically adjusts to your screen size to ensure easy navigation and usability. We also support web push notifications on compatible browsers so you can receive important updates.",    tags: ["technical", "responsive", "mobile-friendly"]  }
];

export default function FaqPage() {
  const { t } = useTranslations();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [filteredFaqs, setFilteredFaqs] = useState(faqData);
  
  // Filter FAQs based on search query and selected category
  useEffect(() => {
    let results = faqData;
    
    // Filter by category if selected
    if (selectedCategory) {
      results = results.filter(faq => faq.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        faq =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query) ||
          faq.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredFaqs(results);
  }, [searchQuery, selectedCategory]);
  
  return (
    <div className="page-container">
      {/* Hero Section */}
      <motion.div 
        className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-mali-blue/30 rounded-xl p-8 mb-8"
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
              <HelpCircle className="h-8 w-8 text-mali-blue-accent mr-3" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">Frequently Asked Questions</h1>
            </div>
            <p className="text-gray-300 mb-6">
              Find answers to common questions about our services, orders, and account management.
            </p>
            
            {/* Search Box */}
            <div className="max-w-xl mx-auto mt-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3 px-5 pl-12 bg-mali-blue/20 border border-mali-blue/30 rounded-xl text-white focus:outline-none focus:border-mali-blue-accent focus:ring-1 focus:ring-mali-blue-accent"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-mali-text-secondary" size={18} />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Back to Support Home */}
      <div className="mb-6">
        <Link href="/support" className="text-mali-text-secondary hover:text-white transition-colors inline-flex items-center">
          <ArrowLeft size={18} className="mr-1" />
          Back to Support Center
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Categories */}
        <div className="lg:col-span-1">
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden">
            <div className="p-4 bg-mali-blue/10 border-b border-mali-blue/20">
              <h3 className="text-white font-medium flex items-center">
                <Filter size={16} className="mr-2" />
                Categories
              </h3>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setExpandedQuestion(null);
                }}
                className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                  selectedCategory === null
                    ? 'bg-mali-blue/20 text-white font-medium'
                    : 'text-mali-text-secondary hover:bg-mali-blue/10 hover:text-white'
                }`}
              >
                <span className="bg-gray-500/20 p-1.5 rounded text-gray-400 mr-3">All</span>
                All Categories
              </button>
              
              {faqCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setExpandedQuestion(null);
                  }}
                  className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                    selectedCategory === category.id
                      ? 'bg-mali-blue/20 text-white font-medium'
                      : 'text-mali-text-secondary hover:bg-mali-blue/10 hover:text-white'
                  }`}
                >
                  <span className="mr-3">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Need more help */}
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-5 mt-6">
            <div className="flex items-center mb-4">
              <MessageSquare size={20} className="text-mali-blue-accent mr-2" />
              <h3 className="text-white font-medium">Need More Help?</h3>
            </div>
            <p className="text-mali-text-secondary text-sm mb-4">
              Can't find what you're looking for? Our support team is ready to help.
            </p>
            <Link 
              href="/support/contact" 
              className="bg-mali-blue/20 hover:bg-mali-blue/30 text-mali-blue-accent w-full py-2 rounded-lg font-medium flex items-center justify-center"
            >
              Contact Support
            </Link>
          </div>
        </div>
        
        {/* Main Content - FAQ List */}
        <div className="lg:col-span-3">
          {/* Category Title */}
          {selectedCategory && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                {faqCategories.find(c => c.id === selectedCategory)?.name || "FAQs"}
              </h2>
            </div>
          )}
          
          {/* FAQ Questions */}
          {filteredFaqs.length > 0 ? (
            <div className="space-y-4">
              {filteredFaqs.map((faq) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border border-mali-blue/20 rounded-xl overflow-hidden ${
                    expandedQuestion === faq.id ? 'bg-mali-blue/5' : 'bg-mali-card'
                  }`}
                >
                  <button
                    onClick={() => setExpandedQuestion(expandedQuestion === faq.id ? null : faq.id)}
                    className="w-full text-left p-5 font-medium text-white focus:outline-none flex justify-between items-center"
                  >
                    <span className="pr-8">{faq.question}</span>
                    {expandedQuestion === faq.id ? (
                      <ChevronUp size={20} className="text-mali-text-secondary flex-shrink-0" />
                    ) : (
                      <ChevronDown size={20} className="text-mali-text-secondary flex-shrink-0" />
                    )}
                  </button>
                  
                  {expandedQuestion === faq.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="px-5 pb-5"
                    >
                      <div className="border-t border-mali-blue/20 pt-4 text-mali-text-secondary">
                        <p className="whitespace-pre-line">{faq.answer}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-4">
                          {faq.tags.map(tag => (
                            <div
                              key={tag}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-mali-blue/10 text-mali-text-secondary"
                            >
                              <Tag size={12} />
                              {tag}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-mali-blue/10">
                          <span className="text-xs text-mali-text-secondary flex items-center">
                            <Clock size={12} className="mr-1" />
                            Last updated: 2 weeks ago
                          </span>
                          
                          <div className="flex gap-2">
                            <button className="text-xs flex items-center text-mali-text-secondary hover:text-mali-blue-accent">
                              <ThumbsUp size={12} className="mr-1" />
                              Helpful
                            </button>
                            <button className="text-xs flex items-center text-mali-text-secondary hover:text-mali-blue-accent">
                              <ThumbsDown size={12} className="mr-1" />
                              Not helpful
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-8 text-center">
              <HelpCircle size={48} className="mx-auto text-mali-text-secondary/50 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Matching Questions</h3>
              <p className="text-mali-text-secondary mb-6">
                We couldn't find any FAQs matching your search. Try adjusting your search terms or browse by category.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
                className="bg-mali-blue hover:bg-mali-blue/90 text-white px-6 py-2 rounded-lg font-medium"
              >
                View All FAQs
              </button>
            </div>
          )}
          
          {/* Contact Support CTA */}
          {filteredFaqs.length > 0 && (
            <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-mali-blue/30 rounded-xl p-6 mt-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Still need help?</h3>
                  <p className="text-mali-text-secondary">
                    If you couldn't find the answer you were looking for, our support team is here to help.
                  </p>
                </div>
                <Link 
                  href="/support/contact" 
                  className="mt-4 md:mt-0 bg-mali-blue hover:bg-mali-blue/90 text-white px-6 py-3 rounded-lg font-medium whitespace-nowrap"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 