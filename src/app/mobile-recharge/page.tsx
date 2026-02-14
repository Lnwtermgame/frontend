"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Smartphone,
  Globe,
  Loader2,
  Signal,
  Zap,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { motion } from "@/lib/framer-exports";
import { productApi, Product } from "@/lib/services/product-api";

interface MobileProduct {
  id: string;
  slug: string;
  title: string;
  country: string;
  operator: string;
  mainImage: string;
  rating: number;
  price: number;
  discountPercent?: number;
  autoDelivery?: boolean;
}

function getCountryFlagCode(country: string): string | null {
  const key = country.toLowerCase();
  if (key.includes("thailand")) return "th";
  if (key.includes("malaysia")) return "my";
  if (key.includes("singapore")) return "sg";
  if (key.includes("indonesia")) return "id";
  if (key.includes("philippines")) return "ph";
  if (key.includes("vietnam")) return "vn";
  if (key.includes("china")) return "cn";
  return null;
}

function transformProductToMobile(product: Product): MobileProduct {
  const regionRaw =
    product.gameDetails?.region ||
    product.category?.slug ||
    product.category?.name ||
    "";
  const regionCode = regionRaw.toLowerCase();
  const countryMap: Record<string, string> = {
    th: "Thailand",
    my: "Malaysia",
    sg: "Singapore",
    id: "Indonesia",
    ph: "Philippines",
    vn: "Vietnam",
    cn: "China",
    "mobile-recharge-th": "Thailand",
    "mobile-recharge-my": "Malaysia",
    "mobile-recharge-sg": "Singapore",
    "mobile-recharge-id": "Indonesia",
    "mobile-recharge-ph": "Philippines",
    "mobile-recharge-vn": "Vietnam",
    "mobile-recharge-cn": "China",
  };

  const country =
    countryMap[regionCode] ||
    countryMap[regionCode.replace(/\(.*\)/, "")] ||
    regionRaw ||
    "Unknown";
  const types = product.types || [];
  const validPrices = types
    .filter((t) => t.displayPrice && Number(t.displayPrice) > 0)
    .map((t) => Number(t.displayPrice));
  const startingPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
  const discountRates = types
    .map((t) =>
      typeof t.discountRate === "number" ? Number(t.discountRate) : undefined,
    )
    .filter((v): v is number => v !== undefined && !Number.isNaN(v));
  const discountPercent: number | undefined =
    discountRates.length > 0 ? Math.max(...discountRates) : undefined;

  return {
    id: product.id,
    slug: product.slug,
    title: product.name,
    country: country,
    operator: product.name.split("(")[0].trim(),
    mainImage:
      product.imageUrl ||
      `https://placehold.co/400x400/ffffff/000000?text=${encodeURIComponent(product.name)}`,
    rating: product.averageRating || 4.8,
    price: startingPrice,
    discountPercent,
    autoDelivery: true,
  };
}

function sortThailandFirst<T extends { id: string; name: string }>(
  items: T[],
): T[] {
  const clone = [...items];
  const idx = clone.findIndex(
    (item) =>
      item.name.toLowerCase().includes("thailand") ||
      item.id.toLowerCase().includes("thailand"),
  );
  if (idx > 1) {
    const [thaiItem] = clone.splice(idx, 1);
    clone.splice(1, 0, thaiItem);
  }
  return clone;
}

function MobileRechargeContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("search") || "";
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedProvider, setSelectedProvider] = useState("all");
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [products, setProducts] = useState<MobileProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<
    { id: string; name: string; count: number }[]
  >([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productApi.getProducts({
          isActive: true,
          limit: 100,
          sortBy: "salesCount",
          sortOrder: "desc",
        });

        if (response.success) {
          const mobileProducts = response.data
            .filter((p) => (p.productType as any) === "MOBILE_RECHARGE")
            .map(transformProductToMobile);
          setProducts(mobileProducts);

          const countryCounts = mobileProducts.reduce(
            (acc, product) => {
              acc[product.country] = (acc[product.country] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

          const countryList = [
            { id: "all", name: "ทุกประเทศ", count: mobileProducts.length },
            ...Object.entries(countryCounts).map(([name, count]) => ({
              id: name,
              name,
              count,
            })),
          ];
          setCountries(sortThailandFirst(countryList));
        }
      } catch (error) {
        console.error("Failed to fetch mobile products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const query = searchParams.get("search");
    if (query !== null) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  const PROVIDERS = [
    {
      id: "all",
      name: "ทุกเครือข่าย",
      count: products.length,
      icon: <Signal size={16} className="text-brutal-green" />,
    },
    {
      id: "ais",
      name: "AIS",
      count: products.filter((p) => p.operator.toLowerCase().includes("ais"))
        .length,
      icon: <Smartphone size={16} className="text-brutal-blue" />,
    },
    {
      id: "dtac",
      name: "DTAC",
      count: products.filter((p) => p.operator.toLowerCase().includes("dtac"))
        .length,
      icon: <Smartphone size={16} className="text-brutal-pink" />,
    },
    {
      id: "true",
      name: "TrueMove",
      count: products.filter((p) => p.operator.toLowerCase().includes("true"))
        .length,
      icon: <Smartphone size={16} className="text-brutal-yellow" />,
    },
  ];

  const filteredProducts = products.filter((product) => {
    const matchesCountry =
      selectedCountry === "all" || product.country === selectedCountry;
    const matchesSearch =
      !searchQuery ||
      product.title.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesProvider = true;
    if (selectedProvider !== "all") {
      if (selectedProvider === "ais") {
        matchesProvider = product.operator.toLowerCase().includes("ais");
      } else if (selectedProvider === "dtac") {
        matchesProvider = product.operator.toLowerCase().includes("dtac");
      } else if (selectedProvider === "true") {
        matchesProvider = product.operator.toLowerCase().includes("true");
      }
    }

    return matchesCountry && matchesSearch && matchesProvider;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6 min-w-0">
        {/* Sidebar */}
        <motion.div
          className="w-full lg:w-64 lg:min-w-[256px] shrink-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Providers Card */}
          <div
            className="bg-white border-[3px] border-black overflow-hidden mb-4"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-4 border-b-[3px] border-black bg-brutal-blue">
              <h3 className="text-black font-black text-base flex items-center">
                <Signal size={18} className="mr-2" />
                เครือข่าย
              </h3>
            </div>
            <div className="p-3 space-y-1">
              {PROVIDERS.map((provider) => (
                <motion.button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className={`w-full flex justify-between items-center text-left p-3 group transition-all relative overflow-hidden border-[2px] ${
                    selectedProvider === provider.id
                      ? "bg-brutal-blue border-black text-black"
                      : "bg-white border-transparent text-gray-700 hover:border-gray-300"
                  }`}
                  style={
                    selectedProvider === provider.id
                      ? { boxShadow: "3px 3px 0 0 #000000" }
                      : undefined
                  }
                  whileHover={{ x: 3 }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        selectedProvider === provider.id
                          ? "text-black"
                          : "text-gray-500"
                      }
                    >
                      {provider.icon}
                    </span>
                    <span className="text-sm font-bold">{provider.name}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold border-[2px] border-black ${
                      selectedProvider === provider.id
                        ? "bg-white text-black"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {provider.count}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Countries Card */}
          <div
            className="bg-white border-[3px] border-black overflow-hidden mb-4"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-4 border-b-[3px] border-black bg-brutal-green">
              <h2 className="text-black font-black text-lg flex items-center">
                <Globe size={20} className="mr-2" />
                เลือกประเทศ
              </h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 text-brutal-green animate-spin" />
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {countries.map((country) => (
                  <motion.button
                    key={country.id}
                    onClick={() => setSelectedCountry(country.id)}
                    className={`w-full flex justify-between items-center text-left p-3 group transition-all relative overflow-hidden border-[2px] ${
                      selectedCountry === country.id
                        ? "bg-brutal-green border-black text-black"
                        : "bg-white border-transparent text-gray-700 hover:border-gray-300"
                    }`}
                    style={
                      selectedCountry === country.id
                        ? { boxShadow: "3px 3px 0 0 #000000" }
                        : undefined
                    }
                    whileHover={{ x: 3 }}
                  >
                    <div className="flex items-center gap-3">
                      {getCountryFlagCode(country.name) ? (
                        <img
                          src={`https://flagcdn.com/${getCountryFlagCode(country.name)}.svg`}
                          alt={`${country.name} flag`}
                          className="w-6 h-4 border border-black/10"
                          loading="lazy"
                          width={24}
                          height={18}
                        />
                      ) : (
                        <Globe size={16} className="text-gray-500" />
                      )}
                      <span className="text-sm font-bold">{country.name}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold border-[2px] border-black ${
                        selectedCountry === country.id
                          ? "bg-white text-black"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {country.count}
                    </span>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Promo Card */}
          <div
            className="bg-brutal-yellow border-[3px] border-black p-4 relative overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={18} className="text-black" />
                <span className="font-black text-black text-sm">
                  เติมเงินด่วน
                </span>
              </div>
              <p className="text-black/80 text-xs mb-3">
                เติมเงินมือถือทุกเครือข่าย รวดเร็วทันใจ ภายใน 1 นาที
              </p>
              <motion.button
                className="w-full bg-black text-white px-3 py-2 text-xs font-bold border-[2px] border-black"
                style={{ boxShadow: "3px 3px 0 0 #000000" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                เติมเงินเลย
              </motion.button>
            </div>
          </div>
        </motion.div>

        <div className="flex-1 min-w-0 space-y-6">
          {/* Header with search */}
          <motion.div
            className="bg-white border-[3px] border-black p-5"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-gray-900 text-2xl font-black flex items-center">
                  <Smartphone size={24} className="text-brutal-green mr-2" />
                  เติมเงินมือถือ
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  เติมเงินมือถือทุกเครือข่าย รวดเร็ว ปลอดภัย
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ค้นหาเครือข่าย..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-64 bg-gray-50 border-[2px] border-gray-300 pl-10 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-black transition-all"
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>

                <button className="bg-white text-gray-700 hover:text-black border-[2px] border-gray-300 hover:border-black text-sm px-4 py-2.5 flex items-center gap-1.5 transition-all font-bold">
                  <Filter size={16} /> ตัวกรอง
                </button>
              </div>
            </div>

            {/* Mobile Horizontal Country Scroll */}
            <div className="lg:hidden mt-4 -mx-5 px-5 overflow-x-auto scrollbar-hide flex gap-2 pb-2">
              {countries.slice(0, 6).map((country) => (
                <button
                  key={country.id}
                  onClick={() => setSelectedCountry(country.id)}
                  className={`whitespace-nowrap px-3 py-2 text-xs font-bold border-[2px] border-black transition-all flex-shrink-0 flex items-center gap-1.5 ${
                    selectedCountry === country.id
                      ? "bg-brutal-green text-black"
                      : "bg-white text-gray-700"
                  }`}
                >
                  {getCountryFlagCode(country.name) && (
                    <img
                      src={`https://flagcdn.com/${getCountryFlagCode(country.name)}.svg`}
                      alt=""
                      className="w-4 h-3 border border-black/10"
                    />
                  )}
                  {country.name}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Products grid */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-gray-900 text-lg font-black flex items-center">
                <Signal size={20} className="text-brutal-green mr-2" />
                เครือข่ายทั้งหมด
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filteredProducts.length})
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                >
                  <Link href={`/mobile-recharge/${product.slug}`}>
                    <div
                      className="relative overflow-hidden bg-white border-[3px] border-black transition-all hover:-translate-y-1 group"
                      style={{ boxShadow: "4px 4px 0 0 #000000" }}
                    >
                      {product.discountPercent ? (
                        <div
                          className="absolute top-2 left-2 z-10 bg-brutal-pink px-2 py-1 text-[10px] font-bold text-white border-[2px] border-black"
                          style={{ boxShadow: "2px 2px 0 0 #000000" }}
                        >
                          -{product.discountPercent}%
                        </div>
                      ) : null}

                      <div className="relative aspect-square w-full overflow-hidden">
                        <img
                          src={product.mainImage}
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70" />

                        {product.autoDelivery && (
                          <div
                            className="absolute bottom-2 right-2 z-10"
                            title="ส่งให้ทันทีหลังชำระเงิน"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 512 512"
                              className="h-6 w-6 drop-shadow-[2px_2px_0_rgba(0,0,0,0.6)]"
                              role="img"
                              aria-label="ส่งให้ทันทีหลังชำระเงิน"
                            >
                              <g clipRule="evenodd" fillRule="evenodd">
                                <circle
                                  cx="256"
                                  cy="256"
                                  r="256"
                                  fill="#ffc107"
                                />
                                <path
                                  fill="#fff"
                                  d="M360.475 221.824 267.348 221.823l83.575-146.861-117.011-.003-82.386 194.624 102.683-.001-68.057 187.46z"
                                />
                              </g>
                            </svg>
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div
                            className="bg-brutal-green text-black px-4 py-2 text-sm font-bold border-[2px] border-black translate-y-4 group-hover:translate-y-0 transition-transform"
                            style={{ boxShadow: "3px 3px 0 0 #000000" }}
                          >
                            เติมเงิน
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5">
                        <p className="text-gray-900 text-xs font-bold line-clamp-1 mb-1 group-hover:text-brutal-green transition-colors">
                          {product.operator}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getCountryFlagCode(product.country) ? (
                              <img
                                src={`https://flagcdn.com/${getCountryFlagCode(product.country)}.svg`}
                                alt={product.country}
                                className="w-4 h-3 border border-black/10"
                              />
                            ) : (
                              <Globe size={12} className="text-gray-400" />
                            )}
                            <span className="text-gray-500 text-[10px] ml-1 truncate max-w-[60px]">
                              {product.country}
                            </span>
                          </div>
                          <div className="text-xs text-black font-black">
                            ฿{product.price}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {filteredProducts.length === 0 && !loading && (
              <div className="text-center py-12">
                <Smartphone size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-bold">
                  ไม่พบเครือข่ายที่ค้นหา
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  ลองค้นหาด้วยคำอื่น หรือเลือกประเทศอื่น
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function MobileRechargePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brutal-gray flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="w-8 h-8 text-brutal-green animate-spin" />
            <span className="text-gray-900 font-bold">กำลังโหลด...</span>
          </div>
        </div>
      }
    >
      <MobileRechargeContent />
    </Suspense>
  );
}
