"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { favoriteApi, Favorite } from "@/lib/services/favorite-api";
import { Heart, ShoppingCart, Trash2, Search, ExternalLink, Package } from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import toast from "react-hot-toast";

export default function FavoritePage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFavorites, setFilteredFavorites] = useState<Favorite[]>([]);

  // Fetch favorites from API
  useEffect(() => {
    if (isInitialized && user) {
      fetchFavorites();
    }
  }, [isInitialized, user]);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const response = await favoriteApi.getFavorites();
      if (response.success) {
        setFavorites(response.data);
        setFilteredFavorites(response.data);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดรายการโปรดได้');
    } finally {
      setIsLoading(false);
    }
  };

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
          item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredFavorites(favorites);
    }
  }, [searchTerm, favorites]);

  // Remove item from favorites
  const removeFavorite = async (favoriteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const response = await favoriteApi.removeFavorite(favoriteId);
      if (response.success) {
        toast.success('ลบออกจากรายการโปรดแล้ว');
        setFavorites(prev => prev.filter(item => item.id !== favoriteId));
      }
    } catch (error) {
      const message = favoriteApi.getErrorMessage(error);
      toast.error(message || 'ไม่สามารถลบรายการโปรดได้');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-mali-text-secondary thai-font">กำลังโหลด...</p>
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
          รายการโปรดของฉัน
        </motion.h2>
        <p className="text-mali-text-secondary text-sm relative thai-font">
          จัดการรายการที่คุณบันทึกไว้เพื่อการเข้าถึงที่รวดเร็ว
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="ค้นหารายการโปรด..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full bg-mali-blue/10 px-4 py-2 text-sm text-white border border-mali-blue/20 focus:outline-none focus:ring-1 focus:ring-mali-blue-accent pl-10 transition-all thai-font"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mali-text-secondary" />
        </div>

        <div className="ml-auto text-sm text-mali-text-secondary thai-font">
          พบ {filteredFavorites.length} รายการ
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredFavorites.length > 0 ? (
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
                    title="ลบออกจากรายการโปรด"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="absolute inset-0 flex items-center justify-center p-6">
                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-contain drop-shadow-md transition-transform group-hover:scale-105 duration-300"
                    />
                  ) : (
                    <Package size={48} className="text-mali-blue-light/50" />
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="text-xs text-mali-blue-accent mb-1 font-medium bg-mali-blue/10 inline-block px-2 py-0.5 rounded-md">
                  สินค้า
                </div>
                <h3 className="text-white font-medium mb-1 line-clamp-1 group-hover:text-mali-blue-light transition-colors">
                  {item.product.name}
                </h3>
                <p className="text-mali-text-secondary text-sm mb-4">
                  {formatCurrency(item.product.price)}
                </p>

                <div className="flex gap-2">
                  <Link
                    href={`/product/${item.product.slug}`}
                    className="flex-1 bg-mali-blue/10 hover:bg-mali-blue/20 text-mali-blue-accent hover:text-white border border-mali-blue/20 rounded-lg py-2 flex items-center justify-center text-sm font-medium transition-all thai-font"
                  >
                    <ExternalLink size={16} className="mr-2" />
                    รายละเอียด
                  </Link>
                  <button
                    onClick={() => toast.success('เพิ่มลงตะกร้าแล้ว')}
                    className="flex-1 bg-mali-blue hover:bg-mali-blue/90 text-white rounded-lg py-2 flex items-center justify-center text-sm font-medium transition-all shadow-button-glow thai-font"
                  >
                    <ShoppingCart size={16} className="mr-2" />
                    ซื้อเลย
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
          <h2 className="text-xl font-bold text-white mb-2 thai-font">ไม่พบรายการโปรด</h2>
          <p className="text-mali-text-secondary max-w-md mx-auto mb-8 thai-font">
            {searchTerm
              ? `เราไม่พบรายการโปรดที่ตรงกับ "${searchTerm}"`
              : "คุณยังไม่ได้เพิ่มรายการใดๆ ลงในรายการโปรด เลือกดูสินค้าและคลิกไอคอนหัวใจเพื่อบันทึกไว้ที่นี่"}
          </p>
          <Link
            href="/"
            className="bg-mali-blue hover:bg-mali-blue/90 text-white px-6 py-3 rounded-xl font-medium shadow-button-glow inline-flex items-center transition-all hover:scale-105 active:scale-95 thai-font"
          >
            เริ่มช้อปปิ้ง
          </Link>
        </motion.div>
      )}
    </div>
  );
}
