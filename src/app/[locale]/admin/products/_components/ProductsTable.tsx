"use client";

import Link from "next/link";
import {
  CreditCard,
  DollarSign,
  Edit,
  Gamepad2,
  ImageIcon,
  Package,
  Smartphone,
  Trash2,
} from "lucide-react";
import { DataTable, StatusBadge, type Column } from "@/components/admin";
import type { AdminProduct } from "@/lib/services/product-api";

const getProductTypeIcon = (productType: string) => {
  if (productType === "CARD") {
    return <CreditCard className="w-4 h-4 text-site-accent" />;
  }
  if ((productType as any) === "MOBILE_RECHARGE") {
    return <Smartphone className="w-4 h-4 text-semantic-green" />;
  }
  return <Gamepad2 className="w-4 h-4 text-site-accent" />;
};

const getProductTypeLabel = (productType: string) => {
  if (productType === "CARD") return "บัตร";
  if ((productType as any) === "MOBILE_RECHARGE") return "เติมเงินมือถือ";
  return "เติมเกม";
};

interface ProductsTableProps {
  products: AdminProduct[];
  loading: boolean;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
  };
  onPageChange: (page: number) => void;
  onEditPrice: (product: AdminProduct) => void;
  onEditImage: (product: AdminProduct) => void;
  onDelete: (productId: string) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export function ProductsTable({
  products,
  loading,
  pagination,
  onPageChange,
  onEditPrice,
  onEditImage,
  onDelete,
  selectable = true,
  selectedIds = [],
  onSelectionChange,
}: ProductsTableProps) {
  const columns: Column<AdminProduct>[] = [
    {
      key: "name",
      header: "สินค้า",
      render: (product) => (
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 border border-site-border rounded-lg bg-site-raised flex items-center justify-center overflow-hidden flex-shrink-0">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-5 h-5 text-site-dim" />
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/admin/products/${product.id}/edit`}
              className="text-[13px] font-bold text-site-text hover:text-site-accent transition-colors truncate max-w-[200px] block"
            >
              {product.name}
            </Link>
            <div className="text-[11px] text-site-dim font-mono truncate max-w-[200px] mt-0.5">
              {product.slug}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "productType",
      header: "ประเภท",
      render: (product) => (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-site-raised border border-site-border rounded-md text-[11px]">
          {getProductTypeIcon(product.productType)}
          <span className="text-site-muted font-bold tracking-wide">
            {getProductTypeLabel(product.productType)}
          </span>
        </div>
      ),
    },
    {
      key: "category",
      header: "หมวดหมู่",
      render: (product) =>
        product.category?.name || (
          <span className="text-site-dim italic">ไม่ระบุ</span>
        ),
    },
    {
      key: "pricing",
      header: "การตั้งราคา",
      render: (product) => (
        <button
          onClick={() => onEditPrice(product)}
          className="inline-flex items-center gap-1.5 text-[12px] text-site-accent hover:text-site-accent transition-all font-bold px-3 py-1.5 rounded-lg hover:bg-site-accent/10 border border-transparent hover:border-site-accent/20 whitespace-nowrap"
        >
          <DollarSign className="h-3.5 w-3.5" />
          <span>จัดการราคา</span>
        </button>
      ),
    },
    {
      key: "status",
      header: "สถานะ",
      render: (product) => (
        <StatusBadge status={product.isActive ? "ACTIVE" : "INACTIVE"} />
      ),
    },
    {
      key: "actions",
      header: "จัดการ",
      align: "center",
      render: (product) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => onEditImage(product)}
            className="p-2 text-site-dim hover:text-site-text hover:bg-site-surface transition-all border border-transparent rounded-lg hover:border-site-border"
            title="อัปโหลดรูปภาพด่วน"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <Link href={`/admin/products/${product.id}/edit`}>
            <button
              className="p-2 text-site-dim hover:text-site-accent hover:bg-site-accent/10 transition-all border border-transparent rounded-lg hover:border-site-accent/20"
              title="แก้ไขไฟล์โดยละเอียด"
            >
              <Edit className="h-4 w-4" />
            </button>
          </Link>
          <button
            onClick={() => onDelete(product.id)}
            className="p-2 text-site-dim hover:text-semantic-rose hover:bg-semantic-rose/10 transition-all border border-transparent rounded-lg hover:border-semantic-rose/20"
            title="ลบสินค้า"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={products}
      rowKey={(p) => p.id}
      loading={loading}
      selectable={selectable}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      pagination={pagination}
      onPageChange={onPageChange}
      empty={{
        icon: Package,
        title: "ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา",
      }}
    />
  );
}
