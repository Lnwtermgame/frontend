"use client";

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

interface ItemWithFields extends CartItem {
  fields: SeagmField[];
  fieldValues: Record<string, string>;
  fieldsValid: boolean;
}

export default function CheckoutPage() {
  const t = useTranslations("Checkout");
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
      toast.error(t("error.fill_all_fields"));
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
        router.push(`/dashboard/orders/${response.data.id}`);
      } else {
        toast.error(t("error.order_failed"));
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
          t("error.player_id_invalid"),
          { duration: 5000 },
        );
      } else if (errorCode === 10406) {
        toast.error(
          t("error.product_changed"),
          { duration: 5000 },
        );
      } else {
        toast.error(t("error.generic_failed", { message: errorMessage || error.message || t("error.order_failed") }), {
          duration: 5000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center bg-transparent h-96">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-brutal-pink animate-spin" />
          <p className="mt-4 text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="page-container flex items-center justify-center bg-transparent h-[calc(100vh-200px)]">
        <div
          className="bg-white border-[3px] border-black p-8 text-center max-w-md w-full mx-4"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <ShoppingCart className="mx-auto text-gray-600 w-12 h-12 mb-4" />
          <h2 className="text-2xl font-black text-black mb-2">
            {t("empty_cart")}
          </h2>
          <p className="text-gray-600 mb-6">
            {t("empty_cart_desc")}
          </p>
          <Link href="/games">
            <Button>
              <ChevronLeft className="w-5 h-5 mr-2" />
              {t("browse_products")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container bg-transparent">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-black flex items-center">
            <span className="w-2 h-6 bg-brutal-pink mr-3"></span>
            {t("title")}
          </h1>
          <p className="text-gray-600 ml-5">
            {t("subtitle")}
          </p>
        </div>
        <Link
          href="/games"
          className="text-gray-600 hover:text-black transition-colors flex items-center gap-2 font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          {t("continue_shopping")}
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
              className="bg-white border-[3px] border-black p-4 md:p-6"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              {/* Item Header */}
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
                <div className="w-20 h-20 bg-gray-100 border-2 border-gray-200 overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
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
                <div className="flex-1 w-full text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-black line-clamp-1">
                        {item.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 text-sm mt-1 font-medium ${item.productType === "DIRECT_TOPUP"
                            ? "text-brutal-pink"
                            : "text-brutal-blue"
                          }`}
                      >
                        {item.productType === "DIRECT_TOPUP" ? (
                          <>
                            <Zap className="w-4 h-4" />
                            {t("direct_topup")}
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" />
                            {t("gift_card")}
                          </>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      aria-label="Remove item"
                      className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 transition-colors rounded-full sm:rounded-none"
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
              <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t-2 border-gray-200 gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 font-bold">{t("quantity")}</span>
                  <div className="flex items-center border-[2px] border-black bg-white">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                      className="px-3 py-1 text-black hover:bg-gray-100 disabled:opacity-50 transition-colors border-r border-gray-300"
                    >
                      <Minus className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <span className="px-4 text-black font-bold min-w-[3rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      aria-label="Increase quantity"
                      className="px-3 py-1 text-black hover:bg-gray-100 transition-colors border-l border-gray-300"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="text-right w-full sm:w-auto flex justify-between sm:block">
                  <span className="text-gray-600 sm:hidden font-bold">
                    {t("total")}
                  </span>
                  <div>
                    <span className="text-2xl font-black text-black block">
                      ฿{(item.price * item.quantity).toFixed(2)}
                    </span>
                    {item.quantity > 1 && (
                      <p className="text-gray-600 text-sm">
                        ฿{item.price.toFixed(2)} {t("per_item")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div
            className="bg-white border-[3px] border-black p-6 sticky top-24"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <h2 className="text-xl font-black text-black mb-6 flex items-center">
              <span className="w-1.5 h-5 bg-brutal-yellow mr-2"></span>
              {t("order_summary")}
            </h2>

            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex justify-between text-sm"
                >
                  <span className="text-gray-600 truncate max-w-[60%]">
                    {item.name} x {item.quantity}
                  </span>
                  <span className="text-black font-bold">
                    ฿{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-black">
                  {t("grand_total")}
                </span>
                <span className="text-2xl font-black text-brutal-pink">
                  ฿{getTotalPrice().toFixed(2)}
                </span>
              </div>
            </div>

            {/* Validation Status */}
            {!allFieldsValid && (
              <div className="mb-4 p-4 bg-red-50 border-[2px] border-red-200">
                <div className="flex items-start gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-bold">
                    {t("fill_required_fields")}
                  </span>
                </div>
              </div>
            )}

            {allFieldsValid && (
              <div className="mb-4 p-4 bg-green-50 border-[2px] border-green-200">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-bold">{t("info_complete")}</span>
                </div>
              </div>
            )}

            <Button
              onClick={handlePlaceOrder}
              disabled={!allFieldsValid || isSubmitting}
              isLoading={isSubmitting}
              fullWidth
              size="lg"
              className="bg-black text-white hover:bg-gray-800"
            >
              {!isSubmitting && (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  {t("confirm_order")}
                </>
              )}
            </Button>

            <div className="mt-4 text-center">
              <p className="text-gray-500 text-xs">
                {t("terms_agreement")}{" "}
                <Link href="/terms" className="underline hover:text-black">
                  {t("terms_of_service")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
