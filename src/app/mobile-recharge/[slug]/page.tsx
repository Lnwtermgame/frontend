"use client";

import { useState, useEffect } from "react";
import { motion } from "@/lib/framer-exports";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { orderApi } from "@/lib/services/order-api";
import {
  ChevronLeft,
  ShoppingCart,
  Star,
  Package,
  Award,
  Smartphone,
  Info,
  DollarSign,
  Gift,
  Check,
  X,
  AlertTriangle,
  Phone,
  Signal,
  Globe,
  Loader2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import ProductDescription from "@/components/products/ProductDescription";
import {
  productApi,
  Product,
  ProductType,
  SeagmField,
} from "@/lib/services/product-api";
import { createPortal } from "react-dom";

// Game details interface matching the UI expectations
interface MobileProductDetails {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  mainImage: string;
  coverImage?: string;
  category: string;
  operator: string;
  country: string;
  rating: number;
  credits: TopUpOption[];
  bundles: TopUpOption[];
  mode?: "mobile-recharge";
}

interface TopUpOption {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  isPopular?: boolean;
  fields?: SeagmField[];
}

// Helper function to transform Product to MobileProductDetails
function transformProductToMobileDetails(
  product: Product,
  productTypes: ProductType[],
): MobileProductDetails {
  const credits: TopUpOption[] = [];
  const bundles: TopUpOption[] = [];

  productTypes.forEach((type, index) => {
    const option: TopUpOption = {
      id: type.id,
      title: type.name,
      price: type.displayPrice,
      originalPrice: type.displayPrice,
      isPopular: false, // We'll set this later or ignore
      fields: type.fields,
    };

    const nameLower = type.name.toLowerCase();
    // Keywords for bundles
    const bundleKeywords = [
      "bundle",
      "internet",
      "data",
      "speed",
      "day",
      "unlimited",
      "free call",
      "net",
    ];

    const isBundle = bundleKeywords.some((keyword) =>
      nameLower.includes(keyword),
    );
    // Keywords for credits (usually explicit "credits" or just currency/amount)
    // If it's not a bundle, we assume it's credit, but we can be more specific if needed.
    // The example data shows "10 THB Credits".

    if (isBundle) {
      bundles.push(option);
    } else {
      credits.push(option);
    }
  });

  const region = product.gameDetails?.region || "Unknown";
  const countryMap: Record<string, string> = {
    th: "Thailand",
    my: "Malaysia",
    sg: "Singapore",
    id: "Indonesia",
    ph: "Philippines",
    vn: "Vietnam",
    cn: "China",
  };
  const country = countryMap[region] || region.toUpperCase();

  return {
    id: product.id,
    title: product.name,
    description: `เติมเงินมือถือ ${product.name} ง่ายๆ รวดเร็ว`,
    longDescription:
      product.description || `เติมเงินมือถือ ${product.name} ทันที`,
    mainImage:
      product.imageUrl ||
      `https://placehold.co/400x400/ffffff/000000?text=${encodeURIComponent(product.name)}`,
    coverImage: product.coverImageUrl,
    category: "Mobile Recharge",
    operator: product.name.split("(")[0].trim(),
    country: country,
    rating: 4.8,
    credits,
    bundles,
    mode: "mobile-recharge",
  };
}

export default function MobileRechargeDetailsPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [mobileProduct, setMobileProduct] =
    useState<MobileProductDetails | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("topup");
  const [packageType, setPackageType] = useState<"credits" | "bundles">(
    "credits",
  );
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isBuying, setIsBuying] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Helper function to detect if a string is a CUID or UUID (database ID)
  const isValidDatabaseId = (id: string): boolean => {
    const cuidPattern = /^c[a-z0-9]{24,}$/i;
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return cuidPattern.test(id) || uuidPattern.test(id);
  };

  useEffect(() => {
    if (typeof slug !== "string") return;

    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        let productResponse;
        if (isValidDatabaseId(slug)) {
          productResponse = await productApi.getProductById(slug);
        } else {
          productResponse = await productApi.getProductBySlug(slug);
        }

        if (!productResponse.success || !productResponse.data) {
          throw new Error("Product not found");
        }

        const productData = productResponse.data;
        setProduct(productData);

        let typesData: ProductType[] = [];
        if (productData.types && productData.types.length > 0) {
          typesData = productData.types;
        }
        setProductTypes(typesData);

        const details = transformProductToMobileDetails(productData, typesData);
        setMobileProduct(details);

        // Set default selection
        if (details.credits.length > 0) {
          setPackageType("credits");
          setSelectedOption(details.credits[0].id);
        } else if (details.bundles.length > 0) {
          setPackageType("bundles");
          setSelectedOption(details.bundles[0].id);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(productApi.getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [slug]);

  const handleBuyNow = () => {
    if (!product || !selectedOption) {
      toast.error("กรุณาเลือกจำนวนเงิน");
      return;
    }

    if (!phoneNumber || phoneNumber.trim() === "") {
      toast.error("กรุณากรอกเบอร์โทรศัพท์");
      return;
    }

    // Basic phone validation (can be enhanced based on country)
    if (phoneNumber.length < 9) {
      toast.error("เบอร์โทรศัพท์ไม่ถูกต้อง");
      return;
    }

    setShowConfirmModal(true);
  };

  const createOrder = async () => {
    if (!product || !selectedOption) return;

    try {
      setIsBuying(true);
      toast.loading("กำลังสร้างคำสั่งซื้อ...");

      // For mobile recharge, we pass phone number in playerInfo
      // The backend expects specific field name depending on the provider,
      // but usually for SEAGM integration via fields mapping it might be 'User ID' or specific field
      // We'll send it as 'phone' and 'User ID' to be safe
      const playerInfo = {
        "User ID": phoneNumber,
        phone: phoneNumber,
        Phone: phoneNumber,
      };

      const response = await orderApi.createOrder({
        items: [
          {
            productId: product.id,
            productTypeId: selectedOption,
            quantity: 1,
            playerInfo: playerInfo,
          },
        ],
        paymentMethod: "CREDIT_CARD",
        skipPayment: true,
      });

      toast.dismiss();

      if (response.success) {
        toast.success("สั่งซื้อสำเร็จ! กำลังดำเนินการ...");
        setShowConfirmModal(false);
        router.push(`/dashboard/orders/${response.data.id}`);
      } else {
        toast.error(response.message || "สั่งซื้อไม่สำเร็จ");
      }
    } catch (err: any) {
      toast.dismiss();
      console.error("Create order error:", err);
      toast.error(
        err?.response?.data?.error?.message ||
          "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setIsBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center h-96 bg-brutal-gray">
        <div className="animate-pulse flex flex-col items-center">
          <Loader2 className="w-16 h-16 text-brutal-green animate-spin" />
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error || !mobileProduct) {
    return (
      <div className="page-container bg-brutal-gray">
        <div
          className="bg-white border-[3px] border-black p-8 text-center"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <AlertCircle size={48} className="mx-auto text-brutal-pink mb-4" />
          <h2 className="text-2xl font-bold text-black mb-2">ไม่พบสินค้า</h2>
          <p className="text-gray-600 mb-6">
            {error || "สินค้าที่คุณกำลังค้นหาไม่มีอยู่หรืออาจถูกลบไปแล้ว"}
          </p>
          <Link
            href="/mobile-recharge"
            className="bg-black hover:bg-gray-800 text-white px-6 py-3 font-bold inline-flex items-center border-[3px] border-black transition-colors"
            style={{ boxShadow: "2px 2px 0 0 #000000" }}
          >
            <ChevronLeft size={18} className="mr-2" />
            กลับไปหน้าเติมเงินมือถือ
          </Link>
        </div>
      </div>
    );
  }

  const selectedOptionData =
    mobileProduct.credits.find((opt) => opt.id === selectedOption) ||
    mobileProduct.bundles.find((opt) => opt.id === selectedOption);

  const displayedOptions =
    packageType === "credits" ? mobileProduct.credits : mobileProduct.bundles;

  return (
    <div className="page-container bg-brutal-gray">
      <div className="mb-6">
        <Link
          href="/mobile-recharge"
          className="text-gray-600 hover:text-black transition-colors inline-flex items-center font-medium"
        >
          <ChevronLeft size={18} className="mr-1" />
          กลับไปหน้าเติมเงินมือถือ
        </Link>
      </div>

      <div
        className="bg-white border-[3px] border-black overflow-hidden mb-8"
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
      >
        <div className="relative h-64 md:h-80 overflow-hidden bg-brutal-green/20">
          {/* Pattern background */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div
                className="relative w-24 h-24 md:w-32 md:h-32 bg-white border-[3px] border-black flex items-center justify-center p-4"
                style={{ boxShadow: "2px 2px 0 0 #000000" }}
              >
                <img
                  src={mobileProduct.mainImage}
                  alt={mobileProduct.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
                  {mobileProduct.operator}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="bg-brutal-green text-black px-3 py-1 font-bold border-[2px] border-black flex items-center">
                    <Globe size={14} className="mr-1" />
                    {mobileProduct.country}
                  </span>
                  <div className="flex items-center text-black">
                    <Star
                      size={16}
                      className="fill-brutal-yellow text-brutal-yellow"
                    />
                    <span className="ml-1 font-bold">
                      {mobileProduct.rating}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="flex border-b-[3px] border-black overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setActiveTab("topup")}
                className={`py-4 px-6 text-sm font-bold flex items-center ${activeTab === "topup" ? "text-black bg-brutal-green border-r-[3px] border-black" : "text-gray-600 hover:text-black hover:bg-gray-100"}`}
              >
                <DollarSign size={18} className="mr-2" />
                แพ็กเกจเติมเงิน
              </button>
              <button
                onClick={() => setActiveTab("info")}
                className={`py-4 px-6 text-sm font-bold flex items-center ${activeTab === "info" ? "text-black bg-brutal-green border-l-[3px] border-r-[3px] border-black" : "text-gray-600 hover:text-black hover:bg-gray-100"}`}
              >
                <Info size={18} className="mr-2" />
                รายละเอียด
              </button>
            </div>

            <div className="p-6 md:p-8">
              {activeTab === "topup" && (
                <div className="space-y-6">
                  {/* Package Type Selector */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setPackageType("credits")}
                      className={`flex-1 py-2 px-4 font-bold border-[2px] border-black transition-all ${
                        packageType === "credits"
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-gray-100"
                      }`}
                      style={
                        packageType === "credits"
                          ? { boxShadow: "2px 2px 0 0 #000000" }
                          : undefined
                      }
                    >
                      เติมเงิน (Credits)
                    </button>
                    <button
                      onClick={() => setPackageType("bundles")}
                      className={`flex-1 py-2 px-4 font-bold border-[2px] border-black transition-all ${
                        packageType === "bundles"
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-gray-100"
                      }`}
                      style={
                        packageType === "bundles"
                          ? { boxShadow: "2px 2px 0 0 #000000" }
                          : undefined
                      }
                    >
                      แพ็กเกจ (Bundles)
                    </button>
                  </div>

                  <p className="text-gray-600">
                    เลือก{packageType === "credits" ? "จำนวนเงิน" : "แพ็กเกจ"}:
                  </p>

                  {displayedOptions.length === 0 ? (
                    <div className="text-center py-8 bg-brutal-gray border-[3px] border-black">
                      <AlertCircle
                        className="mx-auto text-gray-500 mb-2"
                        size={32}
                      />
                      <p className="text-gray-600">
                        ไม่มี
                        {packageType === "credits"
                          ? "ตัวเลือกการเติมเงิน"
                          : "แพ็กเกจ"}
                        ในขณะนี้
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                      {displayedOptions.map((option) => (
                        <motion.div
                          key={option.id}
                          onClick={() => setSelectedOption(option.id)}
                          className={`relative border-[3px] p-4 cursor-pointer transition-all ${
                            selectedOption === option.id
                              ? "bg-brutal-green border-black"
                              : "bg-white border-black hover:bg-gray-100"
                          }`}
                          style={{
                            boxShadow:
                              selectedOption === option.id
                                ? "4px 4px 0 0 #000000"
                                : "none",
                          }}
                          whileHover={{ y: -2 }}
                        >
                          <h4 className="text-black font-bold text-center mb-1 text-sm">
                            {option.title}
                          </h4>
                          <div className="text-center">
                            <span className="text-black font-bold">
                              ฿{Number(option.price).toFixed(2)}
                            </span>
                          </div>
                          {selectedOption === option.id && (
                            <div className="absolute bottom-2 right-2 text-black">
                              <Check size={16} />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "info" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-black font-bold mb-2 flex items-center">
                      <span className="w-1.5 h-5 bg-brutal-green mr-2"></span>
                      รายละเอียดบริการ
                    </h3>
                    <ProductDescription
                      description={
                        mobileProduct.longDescription ||
                        mobileProduct.description
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      className="bg-brutal-gray border-[3px] border-black p-4"
                      style={{ boxShadow: "2px 2px 0 0 #000000" }}
                    >
                      <h4 className="text-black font-bold mb-2 flex items-center">
                        <Signal className="mr-2 text-black" size={18} />
                        ผู้ให้บริการ
                      </h4>
                      <p className="text-gray-700">{mobileProduct.operator}</p>
                    </div>
                    <div
                      className="bg-brutal-gray border-[3px] border-black p-4"
                      style={{ boxShadow: "2px 2px 0 0 #000000" }}
                    >
                      <h4 className="text-black font-bold mb-2 flex items-center">
                        <Globe className="mr-2 text-black" size={18} />
                        ประเทศ
                      </h4>
                      <p className="text-gray-700">{mobileProduct.country}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div
            className="bg-white border-[3px] border-black p-6 sticky top-4"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <h3 className="text-xl font-bold text-black mb-4 flex items-center">
              <span className="w-1.5 h-5 bg-brutal-yellow mr-2"></span>
              ข้อมูลการเติมเงิน
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  เบอร์โทรศัพท์ <span className="text-brutal-pink">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="กรอกเบอร์โทรศัพท์"
                    className="w-full bg-white border-[3px] border-black pl-10 pr-4 py-3 text-black focus:outline-none focus:ring-0"
                  />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ตรวจสอบเบอร์โทรศัพท์ให้ถูกต้องก่อนยืนยัน
                </p>
              </div>

              {selectedOptionData && (
                <div className="py-4 border-y-[3px] border-black">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">แพ็กเกจ:</span>
                    <span className="text-black font-bold text-right">
                      {selectedOptionData.title}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ราคา:</span>
                    <span className="text-black font-bold text-lg">
                      ฿{Number(selectedOptionData.price).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <motion.button
                type="button"
                onClick={handleBuyNow}
                disabled={isBuying || !selectedOption}
                className="w-full bg-black text-white py-3 font-bold flex items-center justify-center border-[3px] border-black hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: "4px 4px 0 0 #000000" }}
                whileHover={isBuying || !selectedOption ? {} : { y: -2 }}
                whileTap={isBuying || !selectedOption ? {} : { y: 0 }}
              >
                {isBuying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    กำลังดำเนินการ...
                  </>
                ) : (
                  <>
                    <ShoppingCart
                      size={18}
                      className="mr-2"
                      aria-hidden="true"
                    />
                    ยืนยันการเติมเงิน
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal &&
        selectedOptionData &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-[3px] border-black w-full max-w-md overflow-hidden"
              style={{ boxShadow: "8px 8px 0 0 #000000" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b-[3px] border-black bg-brutal-yellow flex items-center justify-between">
                <h3 className="text-lg font-bold text-black flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  ยืนยันความถูกต้อง
                </h3>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1 hover:bg-black/10 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-brutal-gray border-[3px] border-black p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">เบอร์โทรศัพท์:</span>
                    <span className="font-bold text-black">{phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">เครือข่าย:</span>
                    <span className="font-bold text-black">
                      {mobileProduct?.operator}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ยอดเงิน:</span>
                    <span className="font-bold text-black">
                      {selectedOptionData.title}
                    </span>
                  </div>
                  <div className="border-t border-black pt-2 flex justify-between items-center">
                    <span className="font-bold text-black">
                      ราคาที่ต้องชำระ:
                    </span>
                    <span className="text-xl font-bold text-brutal-green">
                      ฿{Number(selectedOptionData.price).toFixed(2)}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 text-center">
                  กรุณาตรวจสอบเบอร์โทรศัพท์ให้ถูกต้อง
                  หากเติมผิดเบอร์จะไม่สามารถแก้ไขหรือคืนเงินได้
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 bg-white border-[3px] border-black font-bold hover:bg-gray-100"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={createOrder}
                    disabled={isBuying}
                    className="flex-1 py-3 bg-black text-white border-[3px] border-black font-bold hover:bg-gray-800 disabled:opacity-50"
                  >
                    {isBuying ? "กำลังทำรายการ..." : "ยืนยัน"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body,
        )}
    </div>
  );
}
