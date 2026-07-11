"use client";

import { FilterBar } from "@/components/admin";
import type { Category } from "@/lib/services/product-api";

interface ProductsFilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  categories: Category[];
  productType: string;
  setProductType: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  actions?: React.ReactNode;
}

export function ProductsFilterBar({
  search,
  setSearch,
  category,
  setCategory,
  categories,
  productType,
  setProductType,
  status,
  setStatus,
  actions,
}: ProductsFilterBarProps) {
  return (
    <FilterBar
      search={{
        value: search,
        onChange: setSearch,
        placeholder: "ค้นหาชื่อสินค้า รหัสสินค้า...",
      }}
      filters={[
        {
          key: "category",
          value: category,
          onChange: setCategory,
          options: [
            { value: "all", label: "ทุกหมวดหมู่" },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ],
        },
        {
          key: "productType",
          value: productType,
          onChange: setProductType,
          options: [
            { value: "all", label: "ทั้งหมด" },
            { value: "DIRECT_TOPUP", label: "เติมเกม" },
            { value: "MOBILE_RECHARGE", label: "เติมเงินมือถือ" },
            { value: "CARD", label: "บัตร" },
          ],
        },
        {
          key: "status",
          value: status,
          onChange: setStatus,
          options: [
            { value: "all", label: "ทั้งหมด" },
            { value: "active", label: "เปิดขาย" },
            { value: "inactive", label: "ปิดขาย" },
          ],
        },
      ]}
      actions={actions}
    />
  );
}
