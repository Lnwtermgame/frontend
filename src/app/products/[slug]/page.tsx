"use client";

import { useState, useEffect } from "react";
import { motion } from "@/lib/framer-exports";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Package,
  Clock,
  Check,
  AlertCircle,
  Loader2,
  Zap,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { productApi, Product } from "@/lib/services/product-api";
import DynamicProductFields from "@/components/products/DynamicProductFields";
import ProductDescription from "@/components/products/ProductDescription";
import { SeagmField } from "@/lib/services/product-api";
import { useCart } from "@/lib/context/cart-context";
import { getMinPrice, formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Field states
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fieldsValid, setFieldsValid] = useState(false);
  const [fields, setFields] = useState<SeagmField[]>([]);
  const [productType, setProductType] = useState<string | null>(null);

  // Quantity
  const [quantity, setQuantity] = useState(1);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      if (typeof slug !== "string") return;

      try {
        setLoading(true);
        setError(null);

        const response = await productApi.getProductBySlug(slug);

        if (response.success) {
          setProduct(response.data);
        } else {
          setError("Product not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  // Handle field changes
  const handleFieldsChange = (
    values: Record<string, string>,
    isValid: boolean,
  ) => {
    setFieldValues(values);
    setFieldsValid(isValid);
  };

  // Handle fields loaded
  const handleFieldsLoad = (
    loadedFields: SeagmField[],
    type: string | null,
  ) => {
    setFields(loadedFields);
    setProductType(type);
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!product) return;

    // Validate fields for DIRECT_TOPUP
    if (productType === "DIRECT_TOPUP" && fields.length > 0 && !fieldsValid) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    // Get price from types (lowest displayPrice)
    const price = getMinPrice(product.types);

    addItem({
      productId: product.id,
      name: product.name,
      image: product.imageUrl || "",
      quantity,
      price: price,
      // Include field values for direct top-up
      playerInfo: productType === "DIRECT_TOPUP" ? fieldValues : undefined,
    });

    // Show success feedback
    toast.success("เพิ่มลงตะกร้าแล้ว!");
  };

  // Handle buy now
  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brutal-gray">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-black animate-spin" />
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brutal-gray">
        <div
          className="bg-white border-[3px] border-black p-8 text-center max-w-md"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <AlertCircle className="mx-auto text-brutal-pink w-12 h-12 mb-4" />
          <h2 className="text-2xl font-bold text-black mb-2">
            Product Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "The product you're looking for doesn't exist."}
          </p>
          <Link
            href="/products"
            className="bg-black text-white px-6 py-3 font-bold inline-flex items-center border-[3px] border-black hover:bg-gray-800 transition-colors"
            style={{ boxShadow: "2px 2px 0 0 #000000" }}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const isDirectTopUp = product.productType === "DIRECT_TOPUP";

  return (
    <div className="min-h-screen bg-brutal-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-600 mb-6">
          <Link
            href="/"
            className="hover:text-black transition-colors font-medium"
          >
            Home
          </Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link
            href="/products"
            className="hover:text-black transition-colors font-medium"
          >
            Products
          </Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-black font-bold truncate">{product.name}</span>
        </nav>

        {/* Product Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="relative aspect-square">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brutal-gray">
                  <Package className="w-24 h-24 text-gray-400" />
                </div>
              )}
              {/* Product Type Badge */}
              <div className="absolute top-4 left-4">
                <span
                  className={`px-3 py-1 text-sm font-bold border-[2px] border-black ${
                    isDirectTopUp
                      ? "bg-brutal-yellow text-black"
                      : "bg-brutal-blue text-black"
                  }`}
                >
                  {isDirectTopUp ? (
                    <span className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      Direct Top-Up
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-4 h-4" />
                      Gift Card
                    </span>
                  )}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Title & Rating */}
            <div>
              <h1 className="text-3xl font-bold text-black mb-2 flex items-center">
                <span className="w-1.5 h-8 bg-brutal-pink mr-3"></span>
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center text-black">
                  <Star className="w-5 h-5 fill-brutal-yellow text-black" />
                  <span className="ml-1 font-bold">
                    {product.averageRating?.toFixed(1) || "0.0"}
                  </span>
                  <span className="ml-1 text-gray-600">
                    ({product.reviewCount || 0} reviews)
                  </span>
                </div>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">
                  {product.category?.name || "Uncategorized"}
                </span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <ProductDescription description={product.description} />
            )}

            {/* Price */}
            <div
              className="bg-white border-[3px] border-black p-6"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-black">
                  {formatPrice(getMinPrice(product.types))}
                </span>
              </div>

              {/* Stock Status - Now always available via SEAGM */}
              <div className="mt-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-brutal-green" />
                <span className="text-brutal-green font-medium">Available</span>
              </div>
            </div>

            {/* Dynamic Product Fields */}
            {isDirectTopUp && (
              <DynamicProductFields
                productId={product.id}
                onFieldsChange={handleFieldsChange}
                onFieldsLoad={handleFieldsLoad}
              />
            )}

            {/* Quantity Selector */}
            <div
              className="bg-white border-[3px] border-black p-6"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <label className="block text-sm font-bold text-black mb-3">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-[3px] border-black">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="px-4 py-2 text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-black font-bold min-w-[3rem] text-center border-x-[3px] border-black">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
                  >
                    +
                  </button>
                </div>
                <span className="text-gray-600 font-medium">
                  Total: {formatPrice(getMinPrice(product.types) * quantity)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <motion.button
                onClick={handleAddToCart}
                className="flex-1 bg-white border-[3px] border-black text-black py-4 font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                style={{ boxShadow: "4px 4px 0 0 #000000" }}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </motion.button>
              <motion.button
                onClick={handleBuyNow}
                className="flex-1 bg-black text-white py-4 font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors border-[3px] border-black"
                style={{ boxShadow: "4px 4px 0 0 #000000" }}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
              >
                <Zap className="w-5 h-5" />
                Buy Now
              </motion.button>
            </div>

            {/* Delivery Info */}
            <div className="bg-brutal-blue/20 border-[3px] border-black p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-black mt-0.5" />
                <div>
                  <h4 className="text-black font-bold">Fast Auto-Delivery</h4>
                  <p className="text-gray-700 text-sm mt-1">
                    {isDirectTopUp
                      ? "Direct top-up to your account within 5-15 minutes after payment confirmation."
                      : "Gift card codes delivered instantly to your email after payment confirmation."}
                  </p>
                </div>
              </div>
            </div>

            {/* Share & Favorite */}
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`flex items-center gap-2 px-4 py-2 border-[3px] transition-colors font-medium ${
                  isFavorite
                    ? "bg-brutal-pink text-black border-black"
                    : "bg-white border-black text-gray-700 hover:bg-gray-100"
                }`}
                style={{
                  boxShadow: isFavorite ? "2px 2px 0 0 #000000" : "none",
                }}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? "fill-black" : ""}`}
                />
                {isFavorite ? "Saved" : "Save"}
              </motion.button>
              <motion.button
                className="flex items-center gap-2 px-4 py-2 border-[3px] border-black text-gray-700 hover:text-black bg-white transition-colors font-medium"
                style={{ boxShadow: "2px 2px 0 0 #000000" }}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
              >
                <Share2 className="w-5 h-5" />
                Share
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
