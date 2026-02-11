"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "@/lib/framer-exports";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Zap,
  ChevronLeft,
  Loader2,
  Package,
} from "lucide-react";
import { useCart, CartItem } from "@/lib/context/cart-context";
import { productApi } from "@/lib/services/product-api";
import DynamicProductFields from "@/components/products/DynamicProductFields";
import { SeagmField } from "@/lib/services/product-api";
import { orderApi } from "@/lib/services/order-api";
import toast from "react-hot-toast";

interface ItemWithFields extends CartItem {
  fields: SeagmField[];
  fieldValues: Record<string, string>;
  fieldsValid: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    removeItem,
    updateQuantity,
    updatePlayerInfo,
    getTotalPrice,
    clearCart,
  } = useCart();

  const [itemsWithFields, setItemsWithFields] = useState<ItemWithFields[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load product fields for each item
  useEffect(() => {
    const loadFields = async () => {
      if (items.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const productIds = items.map((item) => item.productId);
        const response = await productApi.getBatchProductFields(productIds);

        if (response.success) {
          const fieldsMap = new Map(
            response.data.map((d) => [
              d.productId,
              { fields: d.fields, productType: d.productType },
            ]),
          );

          const itemsWithFieldsData: ItemWithFields[] = items.map((item) => {
            const fieldData = fieldsMap.get(item.productId);
            return {
              ...item,
              fields: fieldData?.fields || [],
              productType: fieldData?.productType || undefined,
              fieldValues: item.playerInfo || {},
              fieldsValid: !fieldData?.fields?.length,
            };
          });

          setItemsWithFields(itemsWithFieldsData);
        }
      } catch (error) {
        console.error("Failed to load product fields:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFields();
  }, [items]);

  const handleFieldChange = (
    productId: string,
    values: Record<string, string>,
    isValid: boolean,
  ) => {
    setItemsWithFields((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, fieldValues: values, fieldsValid: isValid }
          : item,
      ),
    );

    // Update cart context
    updatePlayerInfo(productId, values);
  };

  const allFieldsValid = itemsWithFields.every((item) => item.fieldsValid);

  const handlePlaceOrder = async () => {
    if (!allFieldsValid) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็นทั้งหมดสำหรับรายการเติมเงินโดยตรง");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order
      const orderData = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          playerInfo: item.playerInfo,
        })),
      };

      const response = await orderApi.createOrder(orderData);

      if (response.success) {
        clearCart();
        router.push(`/orders/${response.data.id}/success`);
      } else {
        toast.error("สร้างคำสั่งซื้อไม่สำเร็จ");
      }
    } catch (error: any) {
      console.error("Order creation failed:", error);

      const errorMessage = error.response?.data?.error?.message || "";
      const errorCode =
        error.response?.data?.error?.details?.infoCode ||
        error.response?.data?.error?.infoCode;

      // Check for player verification errors
      if (
        errorMessage.includes("Player verification failed") ||
        errorCode === 20133 ||
        errorCode === 20093
      ) {
        toast.error(
          "User ID หรือ Zone ID ไม่ถูกต้อง กรุณาตรวจสอบข้อมูลบัญชีเกมของคุณ",
          { duration: 5000 },
        );
      } else if (errorCode === 10406) {
        toast.error(
          "ข้อมูลสินค้าบางอย่างมีการเปลี่ยนแปลง กรุณารีเฟรชหน้าและลองใหม่อีกครั้ง",
          { duration: 5000 },
        );
      } else {
        toast.error(errorMessage || error.message || "สั่งซื้อไม่สำเร็จ", {
          duration: 5000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brutal-gray">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-brutal-pink animate-spin" />
          <p className="mt-4 text-gray-600">กำลังโหลดหน้าชำระเงิน...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brutal-gray">
        <div
          className="bg-white border-[3px] border-black p-8 text-center max-w-md"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <ShoppingCart className="mx-auto text-gray-600 w-12 h-12 mb-4" />
          <h2 className="text-2xl font-bold text-black mb-2">
            ตะกร้าของคุณว่างเปล่า
          </h2>
          <p className="text-gray-600 mb-6">
            เพิ่มสินค้าลงในตะกร้าเพื่อดำเนินการชำระเงิน
          </p>
          <Link
            href="/products"
            className="bg-black text-white border-[3px] border-black px-6 py-3 font-medium inline-flex items-center hover:bg-gray-800 transition-colors"
            style={{ boxShadow: "3px 3px 0 0 #000000" }}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            เลือกดูสินค้า
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brutal-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-black flex items-center">
              <span className="w-1.5 h-6 bg-brutal-pink mr-3"></span>
              ชำระเงิน
            </h1>
            <p className="text-gray-600 ml-5">
              ตรวจสอบสินค้าและดำเนินการชำระเงิน
            </p>
          </div>
          <Link
            href="/products"
            className="text-gray-600 hover:text-black transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            เลือกซื้อสินค้าต่อ
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {itemsWithFields.map((item) => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-[3px] border-black p-6"
                style={{ boxShadow: "4px 4px 0 0 #000000" }}
              >
                {/* Item Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-20 h-20 bg-gray-100 border-2 border-gray-200 overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-black">
                          {item.name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 text-sm mt-1 ${
                            item.productType === "DIRECT_TOPUP"
                              ? "text-brutal-pink"
                              : "text-brutal-blue"
                          }`}
                        >
                          {item.productType === "DIRECT_TOPUP" ? (
                            <>
                              <Zap className="w-4 h-4" />
                              เติมเงินโดยตรง
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4" />
                              บัตรของขวัญ
                            </>
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        aria-label="Remove item"
                        className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dynamic Fields for Direct Top-Up */}
                {item.productType === "DIRECT_TOPUP" &&
                  item.fields.length > 0 && (
                    <div className="mb-6">
                      <DynamicProductFields
                        productId={item.productId}
                        onFieldsChange={(values, isValid) =>
                          handleFieldChange(item.productId, values, isValid)
                        }
                        initialValues={item.fieldValues}
                      />
                    </div>
                  )}

                {/* Quantity & Price */}
                <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">Quantity:</span>
                    <div className="flex items-center border-[2px] border-gray-300 bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                        className="px-3 py-1 text-black hover:bg-gray-100 disabled:opacity-50 transition-colors"
                      >
                        <Minus className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <span className="px-4 text-black font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        aria-label="Increase quantity"
                        className="px-3 py-1 text-black hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-black">
                      ฿{(item.price * item.quantity).toFixed(2)}
                    </span>
                    {item.quantity > 1 && (
                      <p className="text-gray-600 text-sm">
                        ฿{item.price.toFixed(2)} each
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div
              className="bg-white border-[3px] border-black p-6 sticky top-4"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <h2 className="text-xl font-bold text-black mb-6 flex items-center">
                <span className="w-1.5 h-5 bg-brutal-yellow mr-2"></span>
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-600">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="text-black">
                      ฿{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-black">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-brutal-pink">
                    ฿{getTotalPrice().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Validation Status */}
              {!allFieldsValid && (
                <div className="mb-4 p-4 bg-red-50 border-[2px] border-red-200">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">
                      Please fill in all required fields
                    </span>
                  </div>
                </div>
              )}

              {allFieldsValid && (
                <div className="mb-4 p-4 bg-green-50 border-[2px] border-green-200">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm">All fields completed</span>
                  </div>
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={!allFieldsValid || isSubmitting}
                className="w-full bg-black text-white border-[3px] border-black py-4 font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                style={{ boxShadow: "3px 3px 0 0 #000000" }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Place Order
                  </>
                )}
              </button>

              <div className="mt-4 text-center">
                <p className="text-gray-500 text-sm">
                  By placing this order, you agree to our Terms of Service
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
