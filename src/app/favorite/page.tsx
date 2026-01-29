"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Heart, Search, Trash2, Filter, ChevronDown, ShoppingCart } from "lucide-react";
import Link from "next/link";

// Mock favorites data
const favorites = [
  {
    id: "FAV1",
    productId: "PROD1",
    name: "Mobile Legends",
    image: "https://placehold.co/120x120/1E88E5/white?text=ML",
    type: "game",
    category: "Mobile",
    addedDate: "2023-11-01T12:30:00Z",
    price: 9.99
  },
  {
    id: "FAV2",
    productId: "PROD2",
    name: "Steam Gift Card",
    image: "https://placehold.co/120x120/5E35B1/white?text=Steam",
    type: "card",
    category: "PC",
    addedDate: "2023-10-25T14:15:00Z",
    price: 19.99
  },
  {
    id: "FAV3",
    productId: "PROD3",
    name: "PUBG Mobile",
    image: "https://placehold.co/120x120/D81B60/white?text=PUBG",
    type: "game",
    category: "Mobile",
    addedDate: "2023-10-20T09:45:00Z",
    price: 14.99
  },
  {
    id: "FAV4",
    productId: "PROD4",
    name: "iTunes Gift Card",
    image: "https://placehold.co/120x120/7CB342/white?text=iTunes",
    type: "card",
    category: "iOS",
    addedDate: "2023-10-15T16:20:00Z",
    price: 15.00
  }
];

export default function FavoritePage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [userFavorites, setUserFavorites] = useState(favorites);
  const [filteredFavorites, setFilteredFavorites] = useState(favorites);

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Filter favorites based on search term and type
  useEffect(() => {
    let result = userFavorites;

    // Apply type filter
    if (filter !== "all") {
      result = result.filter(favorite => favorite.type === filter);
    }

    // Apply search filter
    if (searchTerm) {
      result = result.filter(favorite =>
        favorite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        favorite.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFavorites(result);
  }, [searchTerm, filter, userFavorites]);

  // Remove from favorites
  const handleRemoveFavorite = (id: string) => {
    setUserFavorites(prev => prev.filter(fav => fav.id !== id));
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-lg text-mali-text-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">My Favorites</h1>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search favorites..."
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
              <option value="all">All Favorites</option>
              <option value="game">Games</option>
              <option value="card">Gift Cards</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mali-text-secondary pointer-events-none" />
          </div>
        </div>
      </div>

      {filteredFavorites.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Heart className="h-16 w-16 mx-auto text-mali-text-secondary mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No favorites found</h2>
          <p className="text-mali-text-secondary mb-6">You haven't added any items to your favorites yet.</p>
          <div className="flex justify-center space-x-4">
            <Link href="/direct-topup" className="btn-primary inline-flex items-center">
              Browse Games
            </Link>
            <Link href="/card" className="btn-secondary inline-flex items-center">
              Browse Gift Cards
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFavorites.map((favorite) => (
            <div key={favorite.id} className="glass-card overflow-hidden group card-hover">
              <div className="relative">
                <img
                  src={favorite.image}
                  alt={favorite.name}
                  className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <button
                  onClick={() => handleRemoveFavorite(favorite.id)}
                  className="absolute top-2 right-2 p-1.5 bg-mali-dark/70 hover:bg-mali-red/90 rounded-full transition-colors"
                >
                  <Heart className="h-4 w-4 text-white fill-mali-red" />
                </button>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-white font-medium line-clamp-1">{favorite.name}</h3>
                    <span className="text-mali-text-secondary text-xs">{favorite.category}</span>
                  </div>
                  <span className="text-white font-medium">${favorite.price.toFixed(2)}</span>
                </div>

                <div className="flex space-x-2 mt-3">
                  <Link
                    href={favorite.type === 'game' ? `/direct-topup/${favorite.productId}` : `/card/${favorite.productId}`}
                    className="flex-1 bg-mali-navy hover:bg-mali-blue/40 text-white text-xs py-2 rounded-md inline-flex items-center justify-center transition-colors"
                  >
                    View Details
                  </Link>
                  <button
                    className="flex-1 bg-button-gradient shadow-button-glow hover:opacity-90 text-white text-xs py-2 rounded-md inline-flex items-center justify-center"
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredFavorites.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setUserFavorites([])}
            className="inline-flex items-center text-mali-red hover:text-mali-red/80 transition-colors text-sm"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All Favorites
          </button>
        </div>
      )}
    </div>
  );
} 
