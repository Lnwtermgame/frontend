"use client";

// Stub: interface contract for Task 9 — the full implementation
// (dynamic fields, verify, qty, payment select, totals) lands there.
import type { Product, ProductTypePublic } from "@/lib/api/products";

export interface BuyPayload {
  playerInfo: Record<string, string>;
  quantity: number;
  paymentOptionCode?: string;
  paymentMethod: "PROMPTPAY" | "TRUEMONEY" | "LINEPAY" | "CREDIT_CARD" | "BANK_TRANSFER";
}

export function OrderSummary({
  product,
  selectedType,
  onBuy,
  buying,
}: {
  product: Product;
  selectedType: ProductTypePublic | null;
  onBuy: (payload: BuyPayload) => void;
  buying: boolean;
}) {
  void product;
  void selectedType;
  void onBuy;
  void buying;
  return null;
}
