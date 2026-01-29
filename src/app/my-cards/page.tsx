"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { CreditCard, Copy, Check, Download, Search, Gift, ChevronDown, ChevronUp, ExternalLink, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";

// Mock cards data
const cards = [
  {
    id: "CARD1",
    name: "Steam Gift Card",
    value: "$20",
    purchaseDate: "2023-10-15",
    expiryDate: "2024-10-15",
    code: "XXXX-YYYY-ZZZZ-ABCD",
    status: "Active",
    orderReference: "ORD12345",
    image: "https://placehold.co/100x60/2a429b/white?text=Steam"
  },
  {
    id: "CARD2",
    name: "Google Play Gift Card",
    value: "$50",
    purchaseDate: "2023-09-28",
    expiryDate: "2024-09-28",
    code: "AAAA-BBBB-CCCC-DDDD",
    status: "Active",
    orderReference: "ORD12346",
    image: "https://placehold.co/100x60/4caf50/white?text=Google"
  },
  {
    id: "CARD3",
    name: "PlayStation Store Card",
    value: "$25",
    purchaseDate: "2023-08-20",
    expiryDate: "2024-08-20",
    code: "EEEE-FFFF-GGGG-HHHH",
    status: "Active",
    orderReference: "ORD12348",
    image: "https://placehold.co/100x60/006FCD/white?text=PS"
  },
  {
    id: "CARD4",
    name: "iTunes Gift Card",
    value: "$15",
    purchaseDate: "2023-11-05",
    expiryDate: "2024-11-05",
    code: "IIII-JJJJ-KKKK-LLLL",
    status: "Redeemed",
    orderReference: "ORD12350",
    image: "https://placehold.co/100x60/555555/white?text=iTunes"
  }
];

export default function MyCardsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filteredCards, setFilteredCards] = useState(cards);
  const [visibleCodes, setVisibleCodes] = useState<string[]>([]);

  // If not logged in, redirect to login page
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // Filter cards based on search term
  useEffect(() => {
    if (searchTerm) {
      setFilteredCards(
        cards.filter(card => 
          card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.code.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredCards(cards);
    }
  }, [searchTerm]);

  // Toggle card expansion
  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId) 
        : [...prev, cardId]
    );
  };

  // Toggle code visibility
  const toggleCodeVisibility = (cardId: string) => {
    setVisibleCodes(prev => 
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  // Copy code to clipboard
  const copyToClipboard = (code: string, cardId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(cardId);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Mask code for display
  const displayCode = (code: string, cardId: string) => {
    if (visibleCodes.includes(cardId)) {
      return code;
    }
    
    const segments = code.split('-');
    if (segments.length > 1) {
      // Keep first segment visible, mask the rest
      return segments.map((segment, index) => 
        index === 0 ? segment : 'XXXX'
      ).join('-');
    }
    
    // Simple masking if no segments
    return code.substring(0, 4) + '-XXXX-XXXX-XXXX';
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!user) {
    return (
      <div className="page-container text-center">
        <div className="bg-mali-card rounded-xl border border-mali-blue/20 p-8">
          <div className="animate-pulse flex space-x-4 justify-center">
            <div className="rounded-full bg-mali-blue/20 h-12 w-12"></div>
            <div className="flex-1 space-y-4 max-w-md">
              <div className="h-4 bg-mali-blue/20 rounded w-3/4"></div>
              <div className="h-4 bg-mali-blue/20 rounded"></div>
              <div className="h-4 bg-mali-blue/20 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header with blur effect - redesigned to match the preferred style */}
      <div className="relative mb-8">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-mali-purple/20 blur-3xl"></div>
        <div className="absolute -top-10 right-10 w-80 h-80 rounded-full bg-mali-blue/20 blur-3xl"></div>
        
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl font-bold text-white">
              My Cards
            </h1>
            <p className="text-mali-text-secondary mt-1">
              Manage your gift cards and redemption codes
            </p>
          </div>
        </div>
      </div>

      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <span className="bg-mali-blue/20 text-mali-blue-light px-3 py-1.5 rounded-lg text-xs font-medium">
            Total: {filteredCards.length} Cards
          </span>
          <div className="h-4 border-r border-mali-blue/30"></div>
          <Link 
            href="/card"
            className="flex items-center gap-1.5 text-mali-text-secondary hover:text-white transition-colors text-sm"
          >
            <Gift size={14} />
            <span>Browse Gift Cards</span>
          </Link>
        </div>
        
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-mali-text-secondary" />
          </div>
          <input
            type="text"
            placeholder="Search cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg bg-mali-blue/10 border border-mali-blue/20 pl-10 pr-4 py-2.5 text-sm text-white placeholder-mali-text-secondary focus:outline-none focus:ring-1 focus:ring-mali-blue-accent focus:border-mali-blue-accent transition-colors"
          />
        </div>
      </div>

      {filteredCards.length === 0 ? (
        <motion.div 
          className="bg-mali-card rounded-xl border border-mali-blue/20 p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="w-16 h-16 rounded-full bg-mali-blue/10 flex items-center justify-center mx-auto mb-4">
            <Gift className="h-8 w-8 text-mali-blue-light" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No cards found</h2>
          <p className="text-mali-text-secondary mb-6">You don't have any gift cards matching your search criteria.</p>
          <Link 
            href="/card" 
            className="inline-flex items-center bg-gradient-to-r from-mali-blue-light to-mali-purple text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-blue-glow transition-all hover:shadow-lg"
          >
            Browse Gift Cards
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredCards.map((card, index) => (
            <motion.div 
              key={card.id} 
              className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden shadow-card-hover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            >
              <div 
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-mali-blue/10 transition-colors"
                onClick={() => toggleCardExpansion(card.id)}
              >
                <div className="flex items-center mb-3 sm:mb-0">
                  <div className="h-14 w-20 bg-mali-blue/10 rounded-lg flex items-center justify-center mr-4 overflow-hidden">
                    <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{card.name}</div>
                    <div className="text-mali-blue-light text-sm font-medium">{card.value}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
                  <div className="sm:mr-8">
                    <div className={`text-xs px-3 py-1 rounded-full inline-flex items-center
                      ${card.status === 'Active' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'}`}>
                      {card.status}
                    </div>
                    <div className="text-mali-text-secondary text-xs mt-1">
                      Exp: {new Date(card.expiryDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    expandedCards.includes(card.id) 
                      ? 'bg-mali-blue/30 text-mali-blue-light' 
                      : 'bg-mali-blue/10 text-mali-text-secondary'}`}>
                    {expandedCards.includes(card.id) ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </div>
              
              {expandedCards.includes(card.id) && (
                <div className="p-5 border-t border-mali-blue/20 bg-mali-blue/5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-mali-blue/10 p-5 rounded-lg border border-mali-blue/20">
                      <h3 className="text-white text-sm font-medium mb-4 flex items-center">
                        <span className="w-6 h-6 rounded-full bg-mali-blue/20 flex items-center justify-center mr-2 text-mali-blue-accent">
                          <CreditCard className="h-3 w-3" />
                        </span>
                        Card Details
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-mali-text-secondary">Purchase Date:</span>
                          <span className="text-white">{new Date(card.purchaseDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-mali-text-secondary">Expiry Date:</span>
                          <span className="text-white">{new Date(card.expiryDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-mali-text-secondary">Order Reference:</span>
                          <Link 
                            href={`/orders/${card.orderReference}`} 
                            className="text-mali-blue-accent hover:text-mali-blue-light transition-colors flex items-center"
                          >
                            {card.orderReference}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Link>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-mali-blue/10 p-5 rounded-lg border border-mali-blue/20">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white text-sm font-medium flex items-center">
                          <span className="w-6 h-6 rounded-full bg-mali-blue/20 flex items-center justify-center mr-2 text-mali-blue-accent">
                            <Copy className="h-3 w-3" />
                          </span>
                          Redemption Code
                        </h3>
                        <div className="flex items-center gap-2">
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCodeVisibility(card.id);
                            }}
                            className="flex items-center text-mali-blue-accent hover:text-mali-blue-light"
                            whileTap={{ scale: 0.95 }}
                          >
                            <span className="text-xs">
                              {visibleCodes.includes(card.id) ? 'Hide' : 'Show'}
                            </span>
                            {visibleCodes.includes(card.id) ? (
                              <EyeOff className="h-3.5 w-3.5 ml-1.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 ml-1.5" />
                            )}
                          </motion.button>
                          <motion.button 
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(card.code, card.id);
                            }}
                            className="flex items-center text-mali-blue-accent hover:text-mali-blue-light"
                            whileTap={{ scale: 0.95 }}
                          >
                            <span className="text-xs">
                              {copiedCode === card.id ? 'Copied' : 'Copy'}
                            </span>
                            {copiedCode === card.id ? (
                              <Check className="h-3.5 w-3.5 ml-1.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 ml-1.5" />
                            )}
                          </motion.button>
                        </div>
                      </div>
                      <div className="bg-[#151e3d] p-3 rounded-lg border border-mali-blue/20">
                        {visibleCodes.includes(card.id) ? (
                          <div className="font-mono text-white text-sm tracking-wider">
                            {card.code}
                          </div>
                        ) : (
                          <div className="font-mono text-mali-text-secondary text-sm tracking-wider">
                            {displayCode(card.code, card.id)}
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <motion.button 
                          className="px-3 py-1.5 rounded-lg bg-mali-blue/20 hover:bg-mali-blue/30 transition-colors flex items-center text-xs text-mali-blue-light"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Download className="h-3 w-3 mr-1.5" />
                          Download Card
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
} 
