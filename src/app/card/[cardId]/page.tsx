"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ShoppingCart, Shield, Info, Clock, Star, Globe, Tag, Gift, Loader2, AlertCircle } from "lucide-react";
import { motion } from "@/lib/framer-exports";
import { productApi, Product } from "@/lib/services/product-api";

// Card details interface matching the UI expectations
interface CardDetails {
  id: string;
  name: string;
  description: string;
  image: string;
  publisher: string;
  category: string;
  denominations: Denomination[];
  regions: string[];
  rating: number;
  reviews: number;
  deliveryTime: string;
  isDigital: boolean;
  instructions: string;
  tags: string[];
}

interface Denomination {
  id: string;
  value: string;
  price: number;
}

// Helper function to transform Product to CardDetails
function transformProductToCardDetails(product: Product): CardDetails {
  // Map seagmTypes to denominations (API returns seagmTypes, not variants)
  const denominations: Denomination[] = product.seagmTypes?.map((type) => ({
    id: type.id,
    value: type.name,
    price: type.unitPrice,
  })) || [{
    id: product.id,
    value: product.name,
    price: product.price,
  }];

  // Extract regions from attributes if available
  const regions: string[] = [];
  const regionAttr = product.attributes?.find(a =>
    a.name.toLowerCase().includes('region') ||
    a.name.toLowerCase().includes('country')
  );
  if (regionAttr) {
    regions.push(...regionAttr.value.split(',').map(r => r.trim()));
  }
  if (regions.length === 0) {
    regions.push("Global", "North America", "Europe", "Asia");
  }

  return {
    id: product.id,
    name: product.name,
    description: product.description || product.shortDescription || `Gift card for ${product.name}`,
    image: product.imageUrl || `https://placehold.co/800x450?text=${encodeURIComponent(product.name)}`,
    publisher: product.attributes?.find(a => a.name.toLowerCase().includes('publisher'))?.value ||
               product.category?.name || "Digital",
    category: product.category?.name || "Gift Card",
    denominations,
    regions,
    rating: product.averageRating || 4.8,
    reviews: product.reviewCount || 0,
    deliveryTime: "Instant",
    isDigital: true,
    instructions: `1. Select a denomination and region
2. Complete checkout process
3. Receive your code instantly via email
4. Redeem code on ${product.name} platform
5. Enjoy your purchase!`,
    tags: product.tags?.map(t => t.name) || ["gift card", "digital", "prepaid"],
  };
}

export default function CardDetailPage() {
  const { cardId } = useParams();
  const [card, setCard] = useState<CardDetails | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedCards, setRelatedCards] = useState<Product[]>([]);

  const [selectedDenomination, setSelectedDenomination] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Fetch card details
  useEffect(() => {
    if (typeof cardId !== 'string') return;

    const fetchCardDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch product by slug
        const response = await productApi.getProductBySlug(cardId);

        if (!response.success || !response.data) {
          throw new Error('Card not found');
        }

        const productData = response.data;
        setProduct(productData);

        // Transform to CardDetails
        const cardData = transformProductToCardDetails(productData);
        setCard(cardData);

        // Fetch related CARD products only (not DIRECT_TOPUP games)
        try {
          const relatedResponse = await productApi.getProducts({
            categoryId: productData.categoryId,
            productType: "CARD",
            isActive: true,
            limit: 6,
          });
          if (relatedResponse.success) {
            // Filter out current product and limit to 5
            const filtered = relatedResponse.data.filter(p => p.id !== productData.id && p.productType === "CARD");
            setRelatedCards(filtered.slice(0, 5));
          }
        } catch {
          // Ignore related products error
        }
      } catch (err) {
        console.error('Error fetching card:', err);
        setError(productApi.getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchCardDetails();
  }, [cardId]);

  const handleAddToCart = () => {
    if (!selectedDenomination || !selectedRegion || !email) {
      alert("Please fill all fields");
      return;
    }

    if (!card) return;

    const selectedValue = card.denominations.find(d => d.id === selectedDenomination)?.value;
    alert("Added to cart: " + card.name + " - " + selectedValue + " for region: " + selectedRegion + " and email: " + email);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-mali-blue animate-spin mb-4" />
          <p className="text-mali-text-secondary">Loading card details...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="space-y-6">
        <Link href="/card" className="inline-flex items-center text-mali-text-secondary hover:text-white transition-colors">
          <ChevronLeft size={16} className="mr-1" /> กลับไปยังรายการบัตร
        </Link>

        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Card Not Found</h2>
          <p className="text-red-300 mb-6">{error || "The card you're looking for doesn't exist or has been removed."}</p>
          <Link href="/card" className="bg-mali-blue hover:bg-mali-blue/90 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center">
            <ChevronLeft size={18} className="mr-2" />
            Back to Cards
          </Link>
        </div>
      </div>
    );
  }

  // Calculate current price
  const selectedDenominationPrice = card.denominations.find(d => d.id === selectedDenomination)?.price || 0;
  const totalPrice = selectedDenominationPrice * quantity;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/card" className="inline-flex items-center text-mali-text-secondary hover:text-white transition-colors">
        <ChevronLeft size={16} className="mr-1" /> กลับไปยังรายการบัตร
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card info - Left column */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Card main info */}
          <div className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden">
            <div className="relative aspect-video w-full overflow-hidden">
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-mali-dark to-transparent opacity-50" />
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-white text-2xl font-bold mb-2">{card.name}</h1>
                  <div className="flex items-center flex-wrap gap-3 text-sm">
                    <div className="flex items-center text-mali-text-secondary">
                      <Gift size={16} className="mr-1 text-mali-blue-accent" />
                      <span>{card.publisher}</span>
                    </div>
                    <div className="flex items-center text-mali-text-secondary">
                      <Tag size={16} className="mr-1 text-mali-blue-accent" />
                      <span>{card.category}</span>
                    </div>
                    <div className="flex items-center text-mali-text-secondary">
                      <Star size={16} className="mr-1 text-mali-pink" />
                      <span>{card.rating} ({card.reviews} รีวิว)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-mali-blue-accent/20 text-mali-blue-accent px-3 py-1 rounded-full text-xs font-medium">
                    {card.isDigital ? 'Digital' : 'Physical'}
                  </span>
                  <span className="bg-mali-green/20 text-mali-green px-3 py-1 rounded-full text-xs font-medium flex items-center">
                    <Clock size={12} className="mr-1" /> {card.deliveryTime}
                  </span>
                </div>
              </div>

              <p className="text-mali-text-secondary text-sm mb-4">{card.description}</p>

              <div className="flex flex-wrap gap-2">
                {card.tags.map(tag => (
                  <span key={tag} className="bg-mali-blue/20 text-mali-text-secondary px-2 py-0.5 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* How to use */}
          <div className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden">
            <div className="p-4 border-b border-mali-blue/20 bg-mali-sidebar">
              <h2 className="text-white font-bold text-lg">วิธีการใช้งาน</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-mali-blue/10 rounded-lg p-4 flex flex-col items-center text-center">
                    <div className="w-8 h-8 bg-mali-blue-accent/20 rounded-full flex items-center justify-center mb-2">
                      <span className="text-mali-blue-accent font-bold">1</span>
                    </div>
                    <p className="text-white">เลือกเดโนมิเนชั่นและภูมิภาค</p>
                  </div>

                  <div className="bg-mali-blue/10 rounded-lg p-4 flex flex-col items-center text-center">
                    <div className="w-8 h-8 bg-mali-blue-accent/20 rounded-full flex items-center justify-center mb-2">
                      <span className="text-mali-blue-accent font-bold">2</span>
                    </div>
                    <p className="text-white">ดำเนินการชำระเงิน</p>
                  </div>

                  <div className="bg-mali-blue/10 rounded-lg p-4 flex flex-col items-center text-center">
                    <div className="w-8 h-8 bg-mali-blue-accent/20 rounded-full flex items-center justify-center mb-2">
                      <span className="text-mali-blue-accent font-bold">3</span>
                    </div>
                    <p className="text-white">รับโค้ดทางอีเมลทันที</p>
                  </div>

                  <div className="bg-mali-blue/10 rounded-lg p-4 flex flex-col items-center text-center">
                    <div className="w-8 h-8 bg-mali-blue-accent/20 rounded-full flex items-center justify-center mb-2">
                      <span className="text-mali-blue-accent font-bold">4</span>
                    </div>
                    <p className="text-white">แลกโค้ดบน {card.publisher}</p>
                  </div>

                  <div className="bg-mali-blue/10 rounded-lg p-4 flex flex-col items-center text-center">
                    <div className="w-8 h-8 bg-mali-blue-accent/20 rounded-full flex items-center justify-center mb-2">
                      <span className="text-mali-blue-accent font-bold">5</span>
                    </div>
                    <p className="text-white">เพลิดเพลินกับบริการ</p>
                  </div>
                </div>

                <div className="bg-mali-blue-accent/10 border border-mali-blue-accent/20 rounded-lg p-4 flex items-start">
                  <Info size={18} className="text-mali-blue-accent shrink-0 mt-0.5 mr-3" />
                  <p className="text-mali-text-secondary text-sm">
                    โค้ดที่ซื้อจาก MaliGamePass ใช้ได้เฉพาะในระบบของเอเจนซี่ที่ให้บริการแต่ละเกมเท่านั้น อาจมีข้อจำกัดบางประการสำหรับภูมิภาคที่เลือก โปรดตรวจสอบข้อกำหนดและเงื่อนไขก่อนซื้อ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Purchase form - Right column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="bg-mali-card rounded-xl border border-mali-blue/20 sticky top-24">
            <div className="p-4 border-b border-mali-blue/20 bg-mali-sidebar">
              <h2 className="text-white font-bold text-lg">รายละเอียดการซื้อ</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Denomination selection */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">เลือกมูลค่าบัตร</label>
                <div className="grid grid-cols-2 gap-3">
                  {card.denominations.map((denom) => (
                    <motion.button
                      key={denom.id}
                      onClick={() => setSelectedDenomination(denom.id)}
                      className={`p-3 rounded-md text-center border transition-all ${selectedDenomination === denom.id
                          ? "bg-button-gradient border-transparent text-white"
                          : "bg-mali-blue/10 border-mali-blue/20 text-mali-text-secondary hover:border-mali-blue-accent/50 hover:text-white"
                        }`}
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                    >
                      <div className="text-sm font-medium">{denom.value}</div>
                      <div className="text-xs mt-1 opacity-80">฿{denom.price.toFixed(2)}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Region selection */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">เลือกภูมิภาค</label>
                <div className="relative">
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full p-3 rounded-md bg-mali-blue/10 border border-mali-blue/20 text-white appearance-none focus:outline-none focus:ring-1 focus:ring-mali-blue-accent focus:border-mali-blue-accent"
                  >
                    <option value="">เลือกภูมิภาค</option>
                    {card.regions.map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                  <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mali-text-secondary pointer-events-none h-4 w-4" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">อีเมลสำหรับรับโค้ด</label>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-md bg-mali-blue/10 border border-mali-blue/20 text-white focus:outline-none focus:ring-1 focus:ring-mali-blue-accent focus:border-mali-blue-accent"
                />
                <p className="mt-1 text-mali-text-secondary text-xs">โค้ดเกมจะถูกส่งไปที่อีเมลนี้ทันทีหลังชำระเงิน</p>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">จำนวน</label>
                <div className="flex items-center">
                  <button
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="w-10 h-10 bg-mali-blue/10 border border-mali-blue/20 rounded-md flex items-center justify-center text-white"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 h-10 bg-mali-blue/10 border-y border-mali-blue/20 text-center text-white focus:outline-none"
                  />
                  <button
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="w-10 h-10 bg-mali-blue/10 border border-mali-blue/20 rounded-md flex items-center justify-center text-white"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price summary */}
              <div className="pt-4 border-t border-mali-blue/20">
                <div className="flex justify-between mb-2">
                  <span className="text-mali-text-secondary">ราคา:</span>
                  <span className="text-white">฿{selectedDenominationPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-mali-text-secondary">จำนวน:</span>
                  <span className="text-white">x{quantity}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-white">ราคารวม:</span>
                  <span className="text-white text-lg">฿{totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Add to cart button */}
              <motion.button
                onClick={handleAddToCart}
                className="w-full bg-button-gradient text-white py-3 rounded-md font-medium flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!selectedDenomination || !selectedRegion || !email}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                หยิบใส่ตะกร้า
              </motion.button>

              {/* Secure purchase info */}
              <div className="flex items-center justify-center text-mali-text-secondary text-xs mt-2">
                <Shield className="mr-1 h-3 w-3" />
                <span>การชำระเงินที่ปลอดภัย 100%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Related cards */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">บัตรอื่นๆ ที่คล้ายกัน</h2>
          <Link href="/card" className="text-sm text-mali-text-secondary hover:text-white">
            ดูทั้งหมด
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {relatedCards.length > 0 ? (
            relatedCards.map((relatedProduct, i) => (
              <motion.div
                key={relatedProduct.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + (i * 0.05) }}
              >
                <Link href={`/card/${relatedProduct.slug}`}>
                  <div className="relative overflow-hidden rounded-lg bg-mali-card border border-mali-blue/20 transition-all hover:-translate-y-1 hover:border-mali-blue/40 group">
                    <div className="relative h-32 w-full overflow-hidden">
                      <img
                        src={relatedProduct.imageUrl || `https://placehold.co/300x200?text=${encodeURIComponent(relatedProduct.name)}`}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-mali-dark to-transparent opacity-70" />
                    </div>

                    <div className="p-3">
                      <p className="text-white text-sm font-medium line-clamp-1 mb-1">{relatedProduct.name}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-mali-text-secondary text-xs">{relatedProduct.category?.name || 'Gift Card'}</div>
                        <div className="text-xs text-white font-medium">฿{relatedProduct.price.toFixed(0)}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-mali-text-secondary">
              No related cards found
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 