"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { favoriteApi, Favorite } from "@/lib/services/favorite-api";
import { getMinPrice, formatPrice } from "@/lib/utils";
import { Heart, ShoppingCart, Trash2, Search, ExternalLink, Package } from "lucide-react";
import { motion } from "@/lib/framer-exports";
import Link from "next/link";
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
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-gray-600 text-sm thai-font">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-1 relative flex items-center">
          <span className="w-1.5 h-5 bg-brutal-pink mr-2"></span>
          รายการโปรดของฉัน
        </h2>
        <p className="text-gray-600 text-sm relative thai-font">
          จัดการรายการที่คุณบันทึกไว้เพื่อการเข้าถึงที่รวดเร็ว
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="ค้นหารายการโปรด..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white px-3 py-2 text-sm text-black border-[2px] border-gray-300 focus:outline-none focus:border-black pl-9 transition-all thai-font"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        <div className="ml-auto text-sm text-gray-600 font-medium thai-font">
          พบ {filteredFavorites.length} รายการ
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredFavorites.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -4 }}
              className="bg-white border-[3px] border-black overflow-hidden group relative"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}
            >
              <div className="relative aspect-[4/3] bg-gray-50 border-b-[3px] border-black">
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={(e) => removeFavorite(item.id, e)}
                    className="w-7 h-7 border-[2px] border-black bg-white hover:bg-brutal-pink text-black hover:text-white flex items-center justify-center transition-all"
                    title="ลบออกจากรายการโปรด"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="absolute inset-0 flex items-center justify-center p-3">
                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-contain drop-shadow-md transition-transform group-hover:scale-105 duration-300"
                    />
                  ) : (
                    <Package size={32} className="text-gray-300" />
                  )}
                </div>
              </div>

              <div className="p-3">
                <h3 className="text-black text-sm font-bold mb-0.5 line-clamp-1 group-hover:text-brutal-blue transition-colors">
                  {item.product.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {item.product.seagmTypes && item.product.seagmTypes.length > 0
                    ? formatPrice(getMinPrice(item.product.seagmTypes))
                    : 'เลือกดูราคา'}
                </p>

                <div className="flex gap-2">
                  <Link
                    href={`/games/${item.product.slug}`}
                    className="flex-1 bg-white hover:bg-gray-50 text-black border-[3px] border-black py-1.5 flex items-center justify-center text-xs font-bold transition-all thai-font"
                    style={{ boxShadow: '2px 2px 0 0 #000000' }}
                  >
                    <ExternalLink size={12} className="mr-1" />
                    ดูเพิ่ม
                  </Link>
                  <motion.button
                    onClick={() => toast.success('เพิ่มลงตะกร้าแล้ว')}
                    whileHover={{ y: -2 }}
                    className="flex-1 bg-brutal-blue hover:bg-brutal-blue/90 text-white border-[3px] border-black py-1.5 flex items-center justify-center text-xs font-bold transition-all thai-font"
                    style={{ boxShadow: '2px 2px 0 0 #000000' }}
                  >
                    <ShoppingCart size={12} className="mr-1" />
                    ซื้อ
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-[3px] border-black p-8 text-center"
          style={{ boxShadow: '4px 4px 0 0 #000000' }}
        >
          <div className="w-14 h-14 bg-gray-100 border-[3px] border-black flex items-center justify-center mx-auto mb-4">
            <Heart size={28} className="text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-black mb-2 thai-font">ไม่พบรายการโปรด</h2>
          <p className="text-gray-600 text-sm max-w-md mx-auto mb-6 thai-font">
            {searchTerm
              ? `เราไม่พบรายการโปรดที่ตรงกับ "${searchTerm}"`
              : "คุณยังไม่ได้เพิ่มรายการใดๆ ลงในรายการโปรด เลือกดูสินค้าและคลิกไอคอนหัวใจเพื่อบันทึกไว้ที่นี่"}
          </p>
          <Link
            href="/"
            className="bg-black hover:bg-gray-800 text-white px-6 py-2.5 border-[3px] border-black text-sm font-bold inline-flex items-center transition-all hover:-translate-y-0.5 thai-font"
            style={{ boxShadow: '4px 4px 0 0 #000000' }}
          >
            เริ่มช้อปปิ้ง
          </Link>
        </motion.div>
      )}
    </div>
  );
}
