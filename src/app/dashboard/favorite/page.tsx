"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Heart, ShoppingCart, Trash2, Search, ExternalLink, Package } from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";

// Mock favorite items
const initialFavorites = [
  {
    id: "FAV1",
    productId: "PROD101",
    name: "Steam Wallet Code (US)",
    image: "https://placehold.co/200x200?text=Steam",
    price: "$10.00 - $100.00",
    category: "Game Cards",
    inStock: true
  },
  {
    id: "FAV2",
    productId: "PROD102",
    name: "Mobile Legends Diamonds",
    image: "https://placehold.co/200x200?text=Mobile+Legends",
    price: "$1.00 - $100.00",
    category: "Mobile Games",
    inStock: true
  },
  {
    id: "FAV3",
    productId: "PROD103",
    name: "Genshin Impact Genesis Crystals",
    image: "https://placehold.co/200x200?text=Genshin",
    price: "$0.99 - $99.99",
    category: "Mobile Games",
    inStock: true
  },
  {
    id: "FAV4",
    productId: "PROD104",
    name: "Netflix Gift Card",
    image: "https://placehold.co/200x200?text=Netflix",
    price: "$25.00 - $50.00",
    category: "Entertainment",
    inStock: false
  }
];

export default function FavoritePage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();

  const [favorites, setFavorites] = useState(initialFavorites);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFavorites, setFilteredFavorites] = useState(initialFavorites);

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Filter favorites based on search term
  useEffect(() => {
    if (searchTerm) {
      setFilteredFavorites(
        favorites.filter(item =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredFavorites(favorites);
    }
  }, [searchTerm, favorites]);

  // Remove item from favorites
  const removeFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setFavorites(prev => prev.filter(item => item.id !== id));
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-mali-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-6">
        <motion.h2
          className="text-xl font-bold text-white mb-1 relative"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          My Favorites
        </motion.h2>
        <p className="text-mali-text-secondary text-sm relative">
          Manage your saved items for quick access
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search favorites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full bg-mali-blue/10 px-4 py-2 text-sm text-white border border-mali-blue/20 focus:outline-none focus:ring-1 focus:ring-mali-blue-accent pl-10 transition-all"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mali-text-secondary" />
        </div>

        <div className="ml-auto text-sm text-mali-text-secondary">
          {filteredFavorites.length} items found
        </div>
      </div>

      {filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.map((item, index) => (
            <motion.div
              key={item.id}
              className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden group hover:border-mali-blue/40 transition-all hover:shadow-lg relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="relative aspect-[4/3] bg-mali-blue/5 border-b border-mali-blue/10">
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={(e) => removeFavorite(item.id, e)}
                    className="w-8 h-8 rounded-full bg-black/40 hover:bg-mali-red/20 text-white/70 hover:text-mali-red flex items-center justify-center backdrop-blur-sm transition-all"
                    title="Remove from favorites"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="absolute inset-0 flex items-center justify-center p-6">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain drop-shadow-md transition-transform group-hover:scale-105 duration-300"
                    />
                  ) : (
                    <Package size={48} className="text-mali-blue-light/50" />
                  )}
                </div>

                {!item.inStock && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="bg-red-500/80 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/10">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="text-xs text-mali-blue-accent mb-1 font-medium bg-mali-blue/10 inline-block px-2 py-0.5 rounded-md">
                  {item.category}
                </div>
                <h3 className="text-white font-medium mb-1 line-clamp-1 group-hover:text-mali-blue-light transition-colors">
                  {item.name}
                </h3>
                <p className="text-mali-text-secondary text-sm mb-4">
                  {item.price}
                </p>

                <div className="flex gap-2">
                  <Link
                    href={`/product/${item.productId}`}
                    className="flex-1 bg-mali-blue/10 hover:bg-mali-blue/20 text-mali-blue-accent hover:text-white border border-mali-blue/20 rounded-lg py-2 flex items-center justify-center text-sm font-medium transition-all"
                  >
                    <ExternalLink size={16} className="mr-2" />
                    Details
                  </Link>
                  <button
                    disabled={!item.inStock}
                    className="flex-1 bg-mali-blue hover:bg-mali-blue/90 text-white rounded-lg py-2 flex items-center justify-center text-sm font-medium transition-all shadow-button-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <ShoppingCart size={16} className="mr-2" />
                    Buy Now
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          className="bg-mali-card border border-mali-blue/20 rounded-xl p-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 bg-mali-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart size={40} className="text-mali-text-secondary opacity-50" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No favorites found</h2>
          <p className="text-mali-text-secondary max-w-md mx-auto mb-8">
            {searchTerm
              ? `We couldn't find any favorite items matching "${searchTerm}"`
              : "You haven't added any items to your favorites yet. Browse product pages and click the heart icon to save them here."}
          </p>
          <Link
            href="/"
            className="bg-mali-blue hover:bg-mali-blue/90 text-white px-6 py-3 rounded-xl font-medium shadow-button-glow inline-flex items-center transition-all hover:scale-105 active:scale-95"
          >
            Start Shopping
          </Link>
        </motion.div>
      )}
    </div>
  );
}
