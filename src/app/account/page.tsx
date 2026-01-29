"use client";

import Link from "next/link";
import { 
  ChevronRight,
  Edit,
  Star,
  Shield,
  CreditCard,
  History,
  Gift,
  Settings,
  Heart,
  User,
  LogOut
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { motion } from "@/lib/framer-exports";
import { useTranslations } from "@/lib/context/language-context";

export default function AccountPage() {
  const { user } = useAuth();
  const { t } = useTranslations();

  // Mock data for the account page
  const orderStats = {
    waitSend: 0,
    sending: 0,
    completed: 1,
    refunded: 0
  };

  const recentlyPurchased = [
    {
      id: 'marvel1',
      name: 'Marvel Rivals Top Up',
      amount: '100 Lattices',
      image: 'https://placehold.co/60x60/5C3FC9/white?text=Marvel'
    }
  ];

  const accountLinks = [
    { icon: <User size={18} />, label: 'Profile Settings', href: '/account/profile' },
    { icon: <Shield size={18} />, label: 'Security', href: '/account/security' },
    { icon: <History size={18} />, label: 'Purchase History', href: '/orders' },
    { icon: <CreditCard size={18} />, label: 'Payment Methods', href: '/account/payment' },
    { icon: <Heart size={18} />, label: 'Favorites', href: '/favorite' },
    { icon: <Gift size={18} />, label: 'My Coupons', href: '/coupons' },
    { icon: <LogOut size={18} />, label: 'Logout', href: '/logout' }
  ];

  return (
    <div className="page-container">
      {/* Page Header with blur effect */}
      <div className="relative mb-8">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-mali-purple/20 blur-3xl"></div>
        <div className="absolute -top-10 right-10 w-80 h-80 rounded-full bg-mali-blue/20 blur-3xl"></div>
        
        <motion.h1 
          className="text-3xl font-bold text-white mb-2 relative"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {t('myAccount')}
        </motion.h1>
        <p className="text-mali-text-secondary relative">Manage your account settings and preferences</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid gap-6">
            {/* User profile - Enhanced with gradient border */}
            <motion.div 
              className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Decorative gradient top border */}
              <div className="h-1 w-full bg-gradient-to-r from-mali-blue-light via-mali-purple to-mali-blue-accent"></div>
              
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-mali-blue-light to-mali-purple flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                        {user?.name?.charAt(0) || 'S'}
                      </div>
                      <span className="absolute bottom-0 right-0 bg-mali-accent text-xs text-white font-medium px-1.5 py-0.5 rounded-full border-2 border-mali-card">
                        VIP
                      </span>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-xl font-semibold text-white">{user?.name || 'sanglovepb22'}</h2>
                      <div className="flex items-center mt-1">
                        <span className="text-mali-text-secondary text-sm">Email:</span>
                        <span className="text-mali-text-secondary text-sm ml-2">{user?.email || 'sanglovepb44@gmail.com'}</span>
                        <span className="bg-mali-blue-accent/20 text-mali-blue-accent text-xs font-medium px-2 py-0.5 rounded-full ml-2">
                          Verified
                        </span>
                      </div>
                    </div>
                  </div>
                  <motion.button 
                    className="flex items-center gap-1.5 bg-mali-blue/20 hover:bg-mali-blue/30 text-mali-blue-accent hover:text-mali-blue-light px-3 py-1.5 rounded-full transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Edit size={14} />
                    <span className="text-sm font-medium">Edit Profile</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
            
            {/* Order statistics - Enhanced with icons and better styling */}
            <motion.div 
              className="bg-mali-card rounded-xl border border-mali-blue/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">{t('myOrders')}</h2>
                  <Link 
                    href="/orders" 
                    className="text-mali-blue-accent text-sm flex items-center hover:text-mali-blue-light transition-colors"
                  >
                    All Orders <ChevronRight size={16} />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-gradient-to-b from-mali-blue/20 to-mali-blue/5 border border-mali-blue/20 hover:border-mali-blue/40 transition-colors">
                    <div className="bg-mali-blue/30 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <History size={18} className="text-mali-blue-light" />
                    </div>
                    <div className="text-2xl font-bold text-white">{orderStats.waitSend}</div>
                    <div className="text-mali-text-secondary text-sm">Wait Send</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-b from-mali-blue/20 to-mali-blue/5 border border-mali-blue/20 hover:border-mali-blue/40 transition-colors">
                    <div className="bg-mali-blue/30 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <History size={18} className="text-mali-blue-light" />
                    </div>
                    <div className="text-2xl font-bold text-white">{orderStats.sending}</div>
                    <div className="text-mali-text-secondary text-sm">Sending</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-b from-mali-blue/20 to-mali-blue/5 border border-mali-blue/20 hover:border-mali-blue/40 transition-colors">
                    <div className="bg-mali-blue/30 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <History size={18} className="text-mali-blue-light" />
                    </div>
                    <div className="text-2xl font-bold text-white">{orderStats.completed}</div>
                    <div className="text-mali-text-secondary text-sm">Completed</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-b from-mali-blue/20 to-mali-blue/5 border border-mali-blue/20 hover:border-mali-blue/40 transition-colors">
                    <div className="bg-mali-blue/30 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <History size={18} className="text-mali-blue-light" />
                    </div>
                    <div className="text-2xl font-bold text-white">{orderStats.refunded}</div>
                    <div className="text-mali-text-secondary text-sm">Refunded</div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Recently Purchased - Enhanced with animation and styling */}
            <motion.div 
              className="bg-mali-card rounded-xl border border-mali-blue/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Recently Purchased</h2>
                {recentlyPurchased.length > 0 ? (
                  <div className="space-y-3">
                    {recentlyPurchased.map(item => (
                      <motion.div 
                        key={item.id} 
                        className="flex items-center p-4 rounded-lg bg-gradient-to-r from-mali-blue/10 to-mali-purple/5 border border-mali-blue/20 hover:border-mali-blue/40 transition-colors"
                        whileHover={{ scale: 1.01, boxShadow: "0 0 15px rgba(78, 137, 232, 0.2)" }}
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden mr-4 border border-mali-blue/30">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{item.name}</h3>
                          <p className="text-sm text-mali-blue-light mt-1">{item.amount}</p>
                        </div>
                        <div className="flex gap-2 ml-auto">
                          <motion.button 
                            className="bg-mali-blue/20 hover:bg-mali-blue/30 w-8 h-8 rounded-full flex items-center justify-center text-mali-blue-accent hover:text-mali-blue-light transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Star size={16} />
                          </motion.button>
                          <Link 
                            href={`/orders/${item.id}`}
                            className="bg-mali-blue/20 hover:bg-mali-blue/30 w-8 h-8 rounded-full flex items-center justify-center text-mali-blue-accent hover:text-mali-blue-light transition-colors"
                          >
                            <ChevronRight size={16} />
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-mali-blue/10 text-mali-text-secondary text-center py-8 rounded-lg border border-mali-blue/20">
                    <div className="w-16 h-16 mx-auto mb-3 bg-mali-blue/20 rounded-full flex items-center justify-center">
                      <History size={24} className="text-mali-blue-light" />
                    </div>
                    <p>No recent purchases found.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="grid gap-6">
            {/* Balance section - Enhanced with better gradients */}
            <motion.div 
              className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="h-1 w-full bg-gradient-to-r from-mali-blue-accent to-mali-purple"></div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">{t('balance')}</h2>
                  <Link 
                    href="/balance" 
                    className="bg-mali-blue/20 hover:bg-mali-blue/30 w-8 h-8 rounded-full flex items-center justify-center text-mali-blue-accent hover:text-mali-blue-light transition-colors"
                  >
                    <ChevronRight size={16} />
                  </Link>
                </div>
                <div className="mb-6">
                  <div className="bg-gradient-to-br from-mali-blue/30 to-mali-purple/20 p-5 rounded-lg w-full border border-mali-blue/30 relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-20 w-40 h-40 bg-mali-purple/10 rounded-full blur-2xl"></div>
                    <div className="absolute -left-5 -top-10 w-20 h-20 bg-mali-blue/20 rounded-full blur-xl"></div>
                    
                    <div className="flex items-center">
                      <img 
                        src="https://placehold.co/20x14/ff0000/white?text=TH" 
                        alt="Thailand" 
                        className="mr-2 rounded-sm"
                      />
                      <span className="text-2xl font-bold text-white">฿ 0.00</span>
                    </div>
                    <div className="mt-3 text-sm text-mali-text-secondary flex items-center">
                      <Shield size={14} className="mr-1 text-mali-blue-light" />
                      <span>Secure Balance</span>
                    </div>
                  </div>
                </div>
                <motion.button 
                  className="w-full bg-gradient-to-r from-mali-blue-light to-mali-purple text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-blue-glow"
                  whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(78, 137, 232, 0.5)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('topUp')}
                </motion.button>
              </div>
            </motion.div>
            
            {/* Account Links - New section */}
            <motion.div 
              className="bg-mali-card rounded-xl border border-mali-blue/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Account Settings</h2>
                <div className="divide-y divide-mali-blue/20">
                  {accountLinks.map((link, index) => (
                    <Link 
                      key={link.href} 
                      href={link.href}
                      className="flex items-center py-3 text-mali-text-secondary hover:text-white transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-mali-blue/20 flex items-center justify-center text-mali-blue-accent mr-3">
                        {link.icon}
                      </div>
                      <span>{link.label}</span>
                      <ChevronRight size={16} className="ml-auto" />
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
            
            {/* VIP Status - New section */}
            <motion.div 
              className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <div className="h-1 w-full bg-gradient-to-r from-mali-accent to-mali-purple"></div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">VIP Status</h2>
                  <Link 
                    href="/star" 
                    className="text-mali-blue-accent text-sm flex items-center hover:text-mali-blue-light transition-colors"
                  >
                    Details <ChevronRight size={16} />
                  </Link>
                </div>
                <div className="bg-gradient-to-br from-mali-accent/20 to-mali-purple/10 p-4 rounded-lg border border-mali-accent/30 mb-2">
                  <div className="flex items-center">
                    <div className="flex mr-3">
                      <Star size={18} className="text-mali-accent" fill="currentColor" />
                      <Star size={18} className="text-mali-accent -ml-1" fill="currentColor" />
                      <Star size={18} className="text-mali-accent -ml-1" fill="currentColor" />
                    </div>
                    <span className="font-semibold text-white">Gold Member</span>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 w-full bg-mali-blue/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-mali-accent to-mali-purple w-[65%]"></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                      <span className="text-mali-text-secondary">5,200 Points</span>
                      <span className="text-mali-text-secondary">8,000 Points for Platinum</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-mali-text-secondary">
                  You have <span className="text-mali-accent">3</span> exclusive rewards available
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
} 