"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { favoriteApi, Favorite } from "@/lib/services/favorite-api";
import { Heart, ShoppingCart, Trash2, Search, ExternalLink, Package } from "lucide-react";
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
          <div className="w-10 h-10 border-2 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-mali-text-secondary text-sm thai-font">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-4">
        <h2 className="text-base font-bold text-white mb-0.5 relative">
          รายการโปรดของฉัน
        </h2>
        <p className="text-mali-text-secondary text-xs relative thai-font">
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
            className="w-full rounded-full bg-mali-blue/10 px-3 py-1.5 text-xs text-white border border-mali-blue/20 focus:outline-none focus:ring-1 focus:ring-mali-blue-accent pl-9 transition-all thai-font"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mali-text-secondary" />
        </div>

        <div className="ml-auto text-xs text-mali-text-secondary thai-font">
          พบ {filteredFavorites.length} รายการ
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredFavorites.map((item) => (
            <div
              key={item.id}
              className="bg-mali-card border border-mali-blue/20 rounded-lg overflow-hidden group hover:border-mali-blue/40 transition-all hover:shadow-lg relative"
            >
              <div className="relative aspect-[4/3] bg-mali-blue/5 border-b border-mali-blue/10">
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={(e) => removeFavorite(item.id, e)}
                    className="w-6 h-6 rounded-full bg-black/40 hover:bg-mali-red/20 text-white/70 hover:text-mali-red flex items-center justify-center backdrop-blur-sm transition-all"
                    title="ลบออกจากรายการโปรด"
                  >
                    <Trash2 size={12} />
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
                    <Package size={32} className="text-mali-blue-light/50" />
                  )}
                </div>
              </div>

              <div className="p-2.5">
                <h3 className="text-white text-xs font-medium mb-0.5 line-clamp-1 group-hover:text-mali-blue-light transition-colors">
                  {item.product.name}
                </h3>
                <p className="text-mali-text-secondary text-xs mb-2">
                  {item.product.price > 0 ? formatCurrency(item.product.price) : 'เลือกดูราคา'}
                </p>

                <div className="flex gap-1.5">
                  <Link
                    href={`/games/${item.product.slug}`}
                    className="flex-1 bg-mali-blue/10 hover:bg-mali-blue/20 text-mali-blue-accent hover:text-white border border-mali-blue/20 rounded py-1.5 flex items-center justify-center text-xs font-medium transition-all thai-font"
                  >
                    <ExternalLink size={12} className="mr-1" />
                    ดูเพิ่ม
                  </Link>
                  <button
                    onClick={() => toast.success('เพิ่มลงตะกร้าแล้ว')}
                    className="flex-1 bg-mali-blue hover:bg-mali-blue/90 text-white rounded py-1.5 flex items-center justify-center text-xs font-medium transition-all shadow-button-glow thai-font"
                  >
                    <ShoppingCart size={12} className="mr-1" />
                    ซื้อ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="bg-mali-card border border-mali-blue/20 rounded-lg p-8 text-center"
        >
          <div className="w-14 h-14 bg-mali-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart size={28} className="text-mali-text-secondary opacity-50" />
          </div>
          <h2 className="text-base font-bold text-white mb-2 thai-font">ไม่พบรายการโปรด</h2>
          <p className="text-mali-text-secondary text-sm max-w-md mx-auto mb-6 thai-font">
            {searchTerm
              ? `เราไม่พบรายการโปรดที่ตรงกับ "${searchTerm}"`
              : "คุณยังไม่ได้เพิ่มรายการใดๆ ลงในรายการโปรด เลือกดูสินค้าและคลิกไอคอนหัวใจเพื่อบันทึกไว้ที่นี่"}
          </p>
          <Link
            href="/"
            className="bg-mali-blue hover:bg-mali-blue/90 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-button-glow inline-flex items-center transition-all hover:scale-105 active:scale-95 thai-font"
          >
            เริ่มช้อปปิ้ง
          </Link>
        </div>
      )}
    </div>
  );
}
