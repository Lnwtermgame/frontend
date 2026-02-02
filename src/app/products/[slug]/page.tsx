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
import { SeagmField } from "@/lib/services/product-api";
import { useCart } from "@/lib/context/cart-context";

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
    isValid: boolean
  ) => {
    setFieldValues(values);
    setFieldsValid(isValid);
  };

  // Handle fields loaded
  const handleFieldsLoad = (loadedFields: SeagmField[], type: string | null) => {
    setFields(loadedFields);
    setProductType(type);
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!product) return;

    // Validate fields for DIRECT_TOPUP
    if (productType === "DIRECT_TOPUP" && fields.length > 0 && !fieldsValid) {
      alert("Please fill in all required fields");
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      image: product.imageUrl || "",
      quantity,
      price: product.price,
      // Include field values for direct top-up
      playerInfo: productType === "DIRECT_TOPUP" ? fieldValues : undefined,
    });

    // Show success feedback
    alert("Added to cart!");
  };

  // Handle buy now
  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-mali-blue animate-spin" />
          <p className="mt-4 text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-8 text-center max-w-md">
          <AlertCircle className="mx-auto text-red-500 w-12 h-12 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Product Not Found
          </h2>
          <p className="text-gray-400 mb-6">
            {error || "The product you're looking for doesn't exist."}
          </p>
          <Link
            href="/products"
            className="bg-mali-blue hover:bg-mali-blue/90 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center"
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
    <div className="min-h-screen bg-mali-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link href="/products" className="hover:text-white transition-colors">
            Products
          </Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-white truncate">{product.name}</span>
        </nav>

        {/* Product Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden"
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
                <div className="w-full h-full flex items-center justify-center bg-mali-blue/5">
                  <Package className="w-24 h-24 text-mali-blue/30" />
                </div>
              )}
              {/* Product Type Badge */}
              <div className="absolute top-4 left-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isDirectTopUp
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
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
              <h1 className="text-3xl font-bold text-white mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center text-yellow-400">
                  <Star className="w-5 h-5 fill-yellow-400" />
                  <span className="ml-1 text-white">
                    {product.averageRating?.toFixed(1) || "0.0"}
                  </span>
                  <span className="ml-1 text-gray-400">
                    ({product.reviewCount || 0} reviews)
                  </span>
                </div>
                <span className="text-gray-400">|</span>
                <span className="text-gray-400">
                  {product.category?.name || "Uncategorized"}
                </span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-gray-300 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Price */}
            <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  ฿{product.price.toFixed(2)}
                </span>
                {product.comparePrice && (
                  <>
                    <span className="text-lg text-gray-500 line-through">
                      ฿{product.comparePrice.toFixed(2)}
                    </span>
                    <span className="text-green-400 text-sm font-medium">
                      Save ฿
                      {(product.comparePrice - product.price).toFixed(2)}
                    </span>
                  </>
                )}
              </div>

              {/* Stock Status */}
              <div className="mt-4 flex items-center gap-2">
                {product.stockQuantity > 0 ? (
                  <>
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-green-400">
                      In Stock ({product.stockQuantity} available)
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">Out of Stock</span>
                  </>
                )}
              </div>
            </div>

            {/* Dynamic Product Fields */}
            {isDirectTopUp && (
              <DynamicProductFields
                productId={product.id}
                onFieldsChange={handleFieldsChange}
                onFieldsLoad={handleFieldsLoad}
                disabled={product.stockQuantity === 0}
              />
            )}

            {/* Quantity Selector */}
            <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-6">
              <label className="block text-sm font-medium text-white mb-3">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-mali-blue/20 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="px-4 py-2 text-white hover:bg-mali-blue/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-white font-medium min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(
                        Math.min(product.stockQuantity, quantity + 1)
                      )
                    }
                    disabled={quantity >= product.stockQuantity}
                    className="px-4 py-2 text-white hover:bg-mali-blue/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-gray-400">
                  Total: ฿{(product.price * quantity).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stockQuantity === 0}
                className="flex-1 bg-mali-card border border-mali-blue text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-mali-blue/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stockQuantity === 0}
                className="flex-1 bg-mali-blue text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-mali-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Zap className="w-5 h-5" />
                Buy Now
              </button>
            </div>

            {/* Delivery Info */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-blue-200 font-medium">
                    Fast Auto-Delivery
                  </h4>
                  <p className="text-blue-300 text-sm mt-1">
                    {isDirectTopUp
                      ? "Direct top-up to your account within 5-15 minutes after payment confirmation."
                      : "Gift card codes delivered instantly to your email after payment confirmation."}
                  </p>
                </div>
              </div>
            </div>

            {/* Share & Favorite */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  isFavorite
                    ? "bg-red-500/20 border-red-500/40 text-red-400"
                    : "bg-mali-card border-mali-blue/20 text-gray-400 hover:text-white"
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-400" : ""}`} />
                {isFavorite ? "Saved" : "Save"}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-mali-blue/20 text-gray-400 hover:text-white bg-mali-card transition-colors">
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
