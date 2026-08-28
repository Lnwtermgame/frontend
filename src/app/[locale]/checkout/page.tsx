"use client";

import { useState, useEffect } from "react";
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
  Package,
} from "lucide-react";
import { useCart, CartItem } from "@/lib/context/cart-context";
import { productApi } from "@/lib/services/product-api";
import DynamicProductFields from "@/components/products/DynamicProductFields";
import { SeagmField } from "@/lib/services/product-api";
import { orderApi } from "@/lib/services/order-api";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
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
      <div className="page-container">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid md:grid-cols-[1fr_360px] gap-4 items-start">
          <div className="space-y-4">
            <div className="site-card p-5 space-y-4">
              <div className="flex gap-4">
                <Skeleton className="w-20 h-20 rounded-8 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="site-card p-5 space-y-4">
              <div className="flex gap-4">
                <Skeleton className="w-20 h-20 rounded-8 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            </div>
          </div>
          <div className="site-card p-5 space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full mt-4" />
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="page-container flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="site-card p-8 text-center max-w-md w-full mx-4">
          <ShoppingCart className="mx-auto text-site-muted w-12 h-12 mb-4" />
          <h2 className="text-2xl font-black text-site-text mb-2">
            {t("empty_cart")}
          </h2>
          <p className="text-site-muted mb-6">
            {t("empty_cart_desc")}
          </p>
          <Link href="/games">
            <Button variant="secondary">
              <ChevronLeft className="w-5 h-5 mr-2" />
              {t("browse_products")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <SectionHeader level={1} title={t("title")} sublabel={t("subtitle")} />
        </div>
        <Link
          href="/games"
          className="text-site-muted hover:text-site-text transition-colors flex items-center gap-2 font-medium text-sm"
        >
          <ChevronLeft className="w-5 h-5" />
          {t("continue_shopping")}
        </Link>
      </div>

      <div className="grid md:grid-cols-[1fr_360px] gap-4 items-start">
        {/* Left Column — Cart Items */}
        <div className="space-y-4">
          {itemsWithFields.map((item) => (
            <div
              key={item.productId}
              className="site-card p-5"
            >
              {/* Item Header */}
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
                <div className="w-20 h-20 bg-site-deep border border-site-border-soft rounded-8 overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-site-dim" />
                    </div>
                  )}
                </div>
                <div className="flex-1 w-full text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-site-text line-clamp-1">
                        {item.name}
                      </h3>
                      {item.productType === "DIRECT_TOPUP" ? (
                        <Badge variant="info" className="mt-1">
                          <Zap className="w-3 h-3" />
                          {t("direct_topup")}
                        </Badge>
                      ) : (
                        <Badge variant="neutral" className="mt-1">
                          <CreditCard className="w-3 h-3" />
                          {t("gift_card")}
                        </Badge>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      aria-label="Remove item"
                      className="text-status-danger hover:text-status-danger/80 p-2 hover:bg-status-danger/10 transition-colors rounded-6"
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
              <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-site-border-soft gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-site-muted font-semibold text-sm">{t("quantity")}</span>
                  <div className="flex items-center border border-site-border-soft rounded-6 bg-site-bg">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                      className="px-3 py-1.5 text-site-text hover:bg-site-raised disabled:opacity-50 transition-colors border-r border-site-border-soft rounded-l-6"
                    >
                      <Minus className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <span className="px-4 text-site-text font-bold min-w-[3rem] text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      aria-label="Increase quantity"
                      className="px-3 py-1.5 text-site-text hover:bg-site-raised transition-colors border-l border-site-border-soft rounded-r-6"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="text-right w-full sm:w-auto flex justify-between sm:block">
                  <span className="text-site-muted sm:hidden font-semibold text-sm">
                    {t("total")}
                  </span>
                  <div>
                    <span className="text-2xl font-black text-site-text block">
                      ฿{(item.price * item.quantity).toFixed(2)}
                    </span>
                    {item.quantity > 1 && (
                      <p className="text-site-muted text-xs">
                        ฿{item.price.toFixed(2)} {t("per_item")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column — Order Summary */}
        <div className="site-card p-5 md:sticky md:top-20 h-fit">
          <SectionHeader level={2} title={t("order_summary")} />

          <div className="space-y-3 mb-6">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex justify-between text-sm"
              >
                <span className="text-site-muted truncate max-w-[60%]">
                  {item.name} x {item.quantity}
                </span>
                <span className="text-site-text font-bold">
                  ฿{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-site-border-soft pt-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-site-text">
                {t("grand_total")}
              </span>
              <span className="text-2xl font-black text-site-text">
                ฿{getTotalPrice().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Validation Status */}
          {!allFieldsValid && (
            <div className="mb-4 p-3 bg-status-danger/10 border border-status-danger/20 rounded-6">
              <div className="flex items-start gap-2 text-status-danger">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-bold">
                  {t("fill_required_fields")}
                </span>
              </div>
            </div>
          )}

          {allFieldsValid && (
            <div className="mb-4 p-3 bg-status-success/10 border border-status-success/20 rounded-6">
              <div className="flex items-center gap-2 text-status-success">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-bold">{t("info_complete")}</span>
              </div>
            </div>
          )}

          <Button
            onClick={handlePlaceOrder}
            disabled={!allFieldsValid || isSubmitting}
            isLoading={isSubmitting}
            size="full"
          >
            {!isSubmitting && (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                {t("confirm_order")}
              </>
            )}
          </Button>

          <div className="mt-4 text-center">
            <p className="text-site-dim text-xs">
              {t("terms_agreement")}{" "}
              <Link href="/terms" className="underline hover:text-site-text">
                {t("terms_of_service")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
