"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ShoppingCart,
  Shield,
  Info,
  Clock,
  Star,
  Tag,
  Gift,
  Loader2,
  AlertCircle,
  CreditCard,
  X,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import { productApi, Product, ProductType } from "@/lib/services/product-api";
import { orderApi } from "@/lib/services/order-api";
import { useCart } from "@/lib/context/cart-context";
import { getMinPrice, formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";

// Card details interface matching the UI expectations
interface CardDetails {
  id: string;
  name: string;
  description: string;
  image: string;
  publisher: string;
  category: string;
  denominations: Denomination[];
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
  const denominations: Denomination[] =
    product.seagmTypes?.map((type) => ({
      id: type.id,
      value: type.name,
      price: type.sellingPrice ?? (type.originPrice || type.unitPrice),
    })) || [];

  return {
    id: product.id,
    name: product.name,
    description:
      product.description ||
      product.shortDescription ||
      `Gift card for ${product.name}`,
    image:
      product.imageUrl ||
      `https://placehold.co/800x450?text=${encodeURIComponent(product.name)}`,
    publisher:
      product.attributes?.find((a) =>
        a.name.toLowerCase().includes("publisher"),
      )?.value ||
      product.category?.name ||
      "Digital",
    category: product.category?.name || "Gift Card",
    denominations,
    rating: product.averageRating || 4.8,
    reviews: product.reviewCount || 0,
    deliveryTime: "Instant",
    isDigital: true,
    instructions: `1. Select a denomination
2. Complete checkout process
3. View your code in purchase history
4. Redeem code on ${product.name} platform
5. Enjoy your purchase!`,
    tags: product.tags?.map((t) => t.name) || [
      "gift card",
      "digital",
      "prepaid",
    ],
  };
}

export default function CardDetailPage() {
  const { cardId } = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const [card, setCard] = useState<CardDetails | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedCards, setRelatedCards] = useState<Product[]>([]);

  const [selectedDenomination, setSelectedDenomination] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  // Fetch card details
  useEffect(() => {
    if (typeof cardId !== "string") return;

    const fetchCardDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch product by slug
        const response = await productApi.getProductBySlug(cardId);

        if (!response.success || !response.data) {
          throw new Error("Card not found");
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
            isActive: true,
            limit: 20,
          });
          if (relatedResponse.success) {
            // Filter out current product and limit to 5
            const filtered = relatedResponse.data.filter(
              (p) => p.id !== productData.id && p.productType === "CARD",
            );
            setRelatedCards(filtered.slice(0, 5));
          }
        } catch {
          // Ignore related products error
        }
      } catch (err) {
        console.error("Error fetching card:", err);
        setError(productApi.getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchCardDetails();
  }, [cardId]);

  const handleAddToCart = () => {
    if (!selectedDenomination) {
      toast.error("กรุณาเลือกมูลค่าบัตร");
      return;
    }

    if (!card || !product) return;

    const selectedDenom = card.denominations.find(
      (d) => d.id === selectedDenomination,
    );

    addItem({
      productId: product.id,
      name: `${card.name} - ${selectedDenom?.value}`,
      image: card.image,
      quantity,
      price: selectedDenom?.price || 0,
      productType: "CARD",
    });

    toast.success("เพิ่มลงตะกร้าแล้ว!");
  };

  const handleBuyNow = () => {
    if (!selectedDenomination) {
      toast.error("กรุณาเลือกมูลค่าบัตร");
      return;
    }

    if (!card || !product) return;

    setShowConfirmModal(true);
  };

  const createOrder = async () => {
    if (!product || !selectedDenomination) return;

    try {
      setIsBuying(true);
      toast.loading("กำลังสร้างคำสั่งซื้อ...");

      const response = await orderApi.createOrder({
        items: [
          {
            productId: product.id,
            productTypeId: selectedDenomination,
            quantity,
          },
        ],
        paymentMethod: "CREDIT_CARD",
        skipPayment: true,
      });

      toast.dismiss();

      if (response.success) {
        toast.success("สั่งซื้อสำเร็จ! โค้ดจะแสดงในประวัติการซื้อ");
        setShowConfirmModal(false);
        router.push(`/dashboard/orders/${response.data.id}`);
      } else {
        toast.error(response.message || "สั่งซื้อไม่สำเร็จ");
      }
    } catch (err: any) {
      toast.dismiss();
      console.error("Create order error:", err);
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง", { duration: 5000 });
    } finally {
      setIsBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-black animate-spin mb-4" />
          <p className="text-gray-600">Loading card details...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="space-y-6">
        <Link
          href="/card"
          className="inline-flex items-center text-gray-600 hover:text-black transition-colors"
        >
          <ChevronLeft size={16} className="mr-1" /> กลับไปยังรายการบัตร
        </Link>

        <div
          className="bg-white border-[3px] border-black p-8 text-center"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <AlertCircle className="w-12 h-12 text-brutal-pink mx-auto mb-4" />
          <h2 className="text-xl font-bold text-black mb-2">Card Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error ||
              "The card you're looking for doesn't exist or has been removed."}
          </p>
          <Link
            href="/card"
            className="bg-black text-white px-6 py-3 font-bold inline-flex items-center border-[3px] border-black hover:bg-gray-800 transition-colors"
            style={{ boxShadow: "2px 2px 0 0 #000000" }}
          >
            <ChevronLeft size={18} className="mr-2" />
            Back to Cards
          </Link>
        </div>
      </div>
    );
  }

  // Calculate current price
  const selectedDenominationPrice =
    card.denominations.find((d) => d.id === selectedDenomination)?.price || 0;
  const totalPrice = selectedDenominationPrice * quantity;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/card"
        className="inline-flex items-center text-gray-600 hover:text-black transition-colors"
      >
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
          <div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="relative aspect-video w-full overflow-hidden">
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-50" />
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-black text-2xl font-bold mb-2">
                    {card.name}
                  </h1>
                  <div className="flex items-center flex-wrap gap-3 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Gift size={16} className="mr-1 text-brutal-blue" />
                      <span>{card.publisher}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Tag size={16} className="mr-1 text-brutal-blue" />
                      <span>{card.category}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Star size={16} className="mr-1 text-brutal-pink" />
                      <span>
                        {card.rating} ({card.reviews} รีวิว)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-brutal-blue text-black px-3 py-1 text-xs font-bold border-[2px] border-black">
                    {card.isDigital ? "Digital" : "Physical"}
                  </span>
                  <span className="bg-brutal-green text-black px-3 py-1 text-xs font-bold border-[2px] border-black flex items-center">
                    <Clock size={12} className="mr-1" /> {card.deliveryTime}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4">{card.description}</p>

              <div className="flex flex-wrap gap-2">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-brutal-gray text-black px-2 py-0.5 text-xs border-[2px] border-black"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* How to use */}
          <div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-4 border-b-[3px] border-black bg-brutal-yellow">
              <h2 className="text-black font-bold text-lg flex items-center">
                <span className="w-1.5 h-5 bg-black mr-2"></span>
                วิธีการใช้งาน
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div
                    className="bg-brutal-gray border-[3px] border-black p-4 flex flex-col items-center text-center"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    <div className="w-8 h-8 bg-brutal-blue border-[2px] border-black rounded-full flex items-center justify-center mb-2">
                      <span className="text-black font-bold">1</span>
                    </div>
                    <p className="text-black font-medium">
                      เลือกเดโนมิเนชั่นและภูมิภาค
                    </p>
                  </div>

                  <div
                    className="bg-brutal-gray border-[3px] border-black p-4 flex flex-col items-center text-center"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    <div className="w-8 h-8 bg-brutal-blue border-[2px] border-black rounded-full flex items-center justify-center mb-2">
                      <span className="text-black font-bold">2</span>
                    </div>
                    <p className="text-black font-medium">ดำเนินการชำระเงิน</p>
                  </div>

                  <div
                    className="bg-brutal-gray border-[3px] border-black p-4 flex flex-col items-center text-center"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    <div className="w-8 h-8 bg-brutal-blue border-[2px] border-black rounded-full flex items-center justify-center mb-2">
                      <span className="text-black font-bold">3</span>
                    </div>
                    <p className="text-black font-medium">
                      ดูโค้ดในประวัติการซื้อ
                    </p>
                  </div>

                  <div
                    className="bg-brutal-gray border-[3px] border-black p-4 flex flex-col items-center text-center"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    <div className="w-8 h-8 bg-brutal-blue border-[2px] border-black rounded-full flex items-center justify-center mb-2">
                      <span className="text-black font-bold">4</span>
                    </div>
                    <p className="text-black font-medium">
                      แลกโค้ดบน {card.publisher}
                    </p>
                  </div>

                  <div
                    className="bg-brutal-gray border-[3px] border-black p-4 flex flex-col items-center text-center"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    <div className="w-8 h-8 bg-brutal-blue border-[2px] border-black rounded-full flex items-center justify-center mb-2">
                      <span className="text-black font-bold">5</span>
                    </div>
                    <p className="text-black font-medium">
                      เพลิดเพลินกับบริการ
                    </p>
                  </div>
                </div>

                <div className="bg-brutal-blue/20 border-[3px] border-black p-4 flex items-start">
                  <Info size={18} className="text-black shrink-0 mt-0.5 mr-3" />
                  <p className="text-gray-700 text-sm">
                    โค้ดที่ซื้อจาก MaliGamePass
                    จะแสดงในหน้าประวัติการซื้อหลังชำระเงินสำเร็จ
                    สามารถดูและคัดลอกโค้ดได้ทันที
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
          <div
            className="bg-white border-[3px] border-black sticky top-24"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-4 border-b-[3px] border-black bg-brutal-pink">
              <h2 className="text-black font-bold text-lg flex items-center">
                <span className="w-1.5 h-5 bg-black mr-2"></span>
                รายละเอียดการซื้อ
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Denomination selection */}
              <div>
                <label className="block text-black text-sm font-bold mb-2">
                  เลือกมูลค่าบัตร
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {card.denominations.map((denom) => (
                    <motion.button
                      key={denom.id}
                      onClick={() => setSelectedDenomination(denom.id)}
                      className={`p-3 text-center border-[3px] transition-all ${
                        selectedDenomination === denom.id
                          ? "bg-brutal-yellow border-black text-black"
                          : "bg-white border-black text-gray-700 hover:bg-gray-50"
                      }`}
                      style={{
                        boxShadow:
                          selectedDenomination === denom.id
                            ? "2px 2px 0 0 #000000"
                            : "none",
                      }}
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                    >
                      <div className="text-sm font-bold">{denom.value}</div>
                      <div className="text-xs mt-1 opacity-80">
                        ฿{denom.price.toFixed(2)}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-black text-sm font-bold mb-2">
                  จำนวน
                </label>
                <div className="flex items-center">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="w-10 h-10 bg-white border-[3px] border-black flex items-center justify-center text-black font-bold hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-16 h-10 bg-white border-y-[3px] border-black text-center text-black font-bold focus:outline-none"
                  />
                  <button
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="w-10 h-10 bg-white border-[3px] border-black flex items-center justify-center text-black font-bold hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price summary */}
              <div className="pt-4 border-t-[3px] border-black">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">ราคา:</span>
                  <span className="text-black font-medium">
                    ฿{selectedDenominationPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">จำนวน:</span>
                  <span className="text-black font-medium">x{quantity}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-black">ราคารวม:</span>
                  <span className="text-black text-lg">
                    ฿{totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Add to cart & Buy buttons */}
              <div className="space-y-3">
                <motion.button
                  onClick={handleAddToCart}
                  className="w-full bg-white text-black py-3 font-bold flex items-center justify-center border-[3px] border-black disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ boxShadow: "4px 4px 0 0 #000000" }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!selectedDenomination}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  หยิบใส่ตะกร้า
                </motion.button>

                <motion.button
                  onClick={handleBuyNow}
                  className="w-full bg-black text-white py-3 font-bold flex items-center justify-center border-[3px] border-black disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ boxShadow: "4px 4px 0 0 #000000" }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!selectedDenomination}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  ซื้อเลย
                </motion.button>
              </div>

              {/* Secure purchase info */}
              <div className="flex items-center justify-center text-gray-600 text-xs mt-2">
                <Shield className="mr-1 h-3 w-3" />
                <span>การชำระเงินที่ปลอดภัย 100%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-[3px] border-black w-full max-w-md overflow-hidden shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b-[3px] border-black bg-brutal-yellow flex items-center justify-between">
                <h3 className="text-lg font-bold text-black flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  ยืนยันการสั่งซื้อ
                </h3>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="p-2 bg-white border-[2px] border-black hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5">
                <div className="space-y-4">
                  {/* Product info */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 border-[2px] border-black">
                    <div className="w-16 h-16 border-[2px] border-black bg-white flex items-center justify-center">
                      <Gift className="h-8 w-8 text-black" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-black">{card?.name}</p>
                      <p className="text-sm text-gray-600">
                        {
                          card?.denominations.find(
                            (d) => d.id === selectedDenomination,
                          )?.value
                        }
                      </p>
                      <p className="text-sm text-gray-600">
                        จำนวน: {quantity} ชิ้น
                      </p>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center p-4 bg-brutal-blue/20 border-[2px] border-black">
                    <span className="font-bold text-black">ราคารวม:</span>
                    <span className="text-xl font-bold text-black">
                      ฿{totalPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex items-start gap-2 p-3 bg-brutal-yellow/30 border-[2px] border-black">
                    <Info className="h-4 w-4 text-black shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      หลังจากยืนยัน
                      โค้ดจะแสดงในประวัติการซื้อของคุณทันทีหลังชำระเงิน
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t-[3px] border-black bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 bg-white border-[2px] border-black text-black hover:bg-gray-100 transition-colors font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={createOrder}
                  disabled={isBuying}
                  className="px-4 py-2 bg-black border-[2px] border-black text-white hover:bg-gray-800 transition-colors font-medium shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isBuying && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isBuying ? "กำลังดำเนินการ..." : "ยืนยันการสั่งซื้อ"}
                </button>
              </div>
            </motion.div>
          </div>,
          document.body,
        )}

      {/* Related cards */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-black flex items-center">
            <span className="w-1.5 h-5 bg-brutal-green mr-2"></span>
            บัตรอื่นๆ ที่คล้ายกัน
          </h2>
          <Link
            href="/card"
            className="text-sm text-gray-600 hover:text-black font-medium"
          >
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
                transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
              >
                <Link href={`/card/${relatedProduct.slug}`}>
                  <motion.div
                    className="relative overflow-hidden bg-white border-[3px] border-black group cursor-pointer"
                    style={{ boxShadow: "4px 4px 0 0 #000000" }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="relative h-32 w-full overflow-hidden">
                      <img
                        src={
                          relatedProduct.imageUrl ||
                          `https://placehold.co/300x200?text=${encodeURIComponent(relatedProduct.name)}`
                        }
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70" />
                    </div>

                    <div className="p-3">
                      <p className="text-black text-sm font-bold line-clamp-1 mb-1">
                        {relatedProduct.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-gray-600 text-xs">
                          {relatedProduct.category?.name || "Gift Card"}
                        </div>
                        <div className="text-xs text-black font-bold">
                          {formatPrice(getMinPrice(relatedProduct.seagmTypes))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-600">
              No related cards found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
