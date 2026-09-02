"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  CreditCard,
  DollarSign,
  Edit,
  Gamepad2,
  ImagePlus,
  Package,
  Smartphone,
  Trash2,
} from "lucide-react";
import { StatusBadge } from "@/components/admin";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminProduct, AdminProductType } from "@/lib/services/product-api";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const formatBaht = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);

const getProductTypeMeta = (productType: string) => {
  if (productType === "CARD")
    return {
      icon: <CreditCard className="w-3.5 h-3.5 text-site-accent" />,
      label: "บัตร",
    };
  if (productType === "MOBILE_RECHARGE")
    return {
      icon: <Smartphone className="w-3.5 h-3.5 text-semantic-green" />,
      label: "มือถือ",
    };
  return { icon: <Gamepad2 className="w-3.5 h-3.5 text-site-accent" />, label: "เกม" };
};

/** Cost basis for a product: cheapest SEAGM type unit price, if any. */
const getCost = (p: AdminProduct): number | null => {
  const prices = (p.seagmTypes ?? [])
    .map((t) => Number(t.unitPrice) || 0)
    .filter((n) => n > 0);
  if (prices.length === 0) return null;
  return Math.min(...prices);
};

/** Cheapest display price across types. */
const getPrice = (p: AdminProduct): number | null => {
  const prices = (p.seagmTypes ?? [])
    .map((t) => Number(t.displayPrice) || Number(t.sellingPrice) || 0)
    .filter((n) => n > 0);
  if (prices.length === 0) return null;
  return Math.min(...prices);
};

const getMargin = (p: AdminProduct): number | null => {
  const cost = getCost(p);
  const price = getPrice(p);
  if (cost === null || price === null || cost <= 0) return null;
  return ((price - cost) / cost) * 100;
};

const getStockState = (
  p: AdminProduct,
): { ratio: number; tone: string; label: string } => {
  const types = p.seagmTypes ?? [];
  if (types.length === 0)
    return { ratio: 0, tone: "bg-site-border", label: "ไม่มีข้อมูล" };
  const inStock = types.filter((t) => t.hasStock).length;
  const ratio = inStock / types.length;
  if (ratio === 0)
    return { ratio: 0, tone: "bg-semantic-rose", label: "สต็อกหมด" };
  if (ratio < 0.5)
    return {
      ratio,
      tone: "bg-semantic-amber",
      label: `ใกล้หมด · ${inStock}/${types.length}`,
    };
  return {
    ratio,
    tone: "bg-semantic-green",
    label: `พร้อมขาย · ${inStock}/${types.length}`,
  };
};

const marginTone = (m: number | null) => {
  if (m === null) return "text-site-dim";
  if (m >= 15) return "text-semantic-green";
  if (m >= 5) return "text-semantic-amber";
  return "text-semantic-rose";
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface CommandDeckTableProps {
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
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  /** Lazy-load types for expansion when seagmTypes is empty. */
  onExpandProduct?: (product: AdminProduct) => void;
  typesById?: Record<string, AdminProductType[]>;
}

export function CommandDeckTable({
  products,
  loading,
  pagination,
  onPageChange,
  onEditPrice,
  onEditImage,
  onDelete,
  selectedIds,
  onSelectionChange,
  onExpandProduct,
  typesById = {},
}: CommandDeckTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (product: AdminProduct) => {
    if (expandedId === product.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(product.id);
    if (onExpandProduct && (product.seagmTypes ?? []).length === 0) {
      onExpandProduct(product);
    }
  };

  const allSelected =
    products.length > 0 && products.every((p) => selectedIds.includes(p.id));
  const toggleAll = () =>
    onSelectionChange(allSelected ? [] : products.map((p) => p.id));
  const toggleRow = (id: string) =>
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );

  const colCount = 8;

  if (loading) {
    return (
      <div className="bg-site-surface border border-site-border-soft rounded-12 overflow-hidden">
        <div className="py-12 flex items-center justify-center">
          <Package className="w-5 h-5 text-site-accent animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-site-surface border border-site-border-soft rounded-12 overflow-hidden">
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="border-site-border-soft bg-site-raised hover:bg-transparent">
            <TableHead className="h-auto w-10 px-4 py-2.5">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="เลือกทั้งหมด"
                className="h-4 w-4 accent-[var(--site-accent)] cursor-pointer"
              />
            </TableHead>
            <TableHead className="h-auto px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">
              สินค้า
            </TableHead>
            <TableHead className="h-auto px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">
              ประเภท
            </TableHead>
            <TableHead className="h-auto px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-site-dim">
              ราคาขาย / ทุน
            </TableHead>
            <TableHead className="h-auto px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-site-dim">
              กำไร
            </TableHead>
            <TableHead className="h-auto px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-site-dim min-w-[110px]">
              สต็อก
            </TableHead>
            <TableHead className="h-auto px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">
              สถานะ
            </TableHead>
            <TableHead className="h-auto px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-site-dim w-[128px]">
              จัดการ
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colCount}>
                <div className="flex flex-col items-center py-12 gap-2 text-site-dim">
                  <Package className="w-8 h-8 opacity-40" />
                  <p className="text-sm font-semibold text-site-text">
                    ไม่พบสินค้าที่ตรงกับเงื่อนไข
                  </p>
                  <p className="text-xs">
                    ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองดูนะ
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => {
              const id = product.id;
              const selected = selectedIds.includes(id);
              const expanded = expandedId === id;
              const typeMeta = getProductTypeMeta(product.productType);
              const price = getPrice(product);
              const cost = getCost(product);
              const margin = getMargin(product);
              const stock = getStockState(product);
              const types =
                product.seagmTypes ?? typesById[id] ?? [];

              return (
                <Fragment key={id}>
                  <TableRow
                    onClick={() => toggleExpand(product)}
                    className={cn(
                      "border-site-border-soft cursor-pointer transition-colors",
                      selected
                        ? "bg-site-accent/5 hover:bg-site-accent/8"
                        : "hover:bg-site-raised/50",
                      selected && "shadow-[inset_3px_0_0_var(--site-accent)]",
                    )}
                  >
                    <TableCell
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleRow(id)}
                        aria-label={`เลือก ${product.name}`}
                        className="h-4 w-4 accent-[var(--site-accent)] cursor-pointer"
                      />
                    </TableCell>

                    {/* name + expand caret */}
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {expanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-site-dim shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-site-dim shrink-0" />
                        )}
                        <div className="w-9 h-9 rounded-lg bg-site-raised border border-site-border-soft overflow-hidden flex items-center justify-center shrink-0">
                          {product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImagePlus className="w-4 h-4 text-site-dim" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[13px] font-bold text-site-text hover:text-site-accent transition-colors block truncate max-w-[220px]"
                          >
                            {product.name}
                          </Link>
                          <div className="text-[10.5px] text-site-dim font-mono truncate max-w-[220px]">
                            {product.slug}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* type */}
                    <TableCell className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-site-raised border border-site-border rounded-md text-[11px] font-bold text-site-muted whitespace-nowrap">
                        {typeMeta.icon}
                        {typeMeta.label}
                      </span>
                    </TableCell>

                    {/* price / cost */}
                    <TableCell
                      className="px-4 py-3 text-right"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditPrice(product);
                      }}
                    >
                      <div className="group inline-flex items-center gap-1.5 cursor-pointer rounded-lg px-2 py-1 -my-1 border border-transparent hover:border-site-accent/20 hover:bg-site-accent/8 transition-colors">
                        <div className="text-right">
                          <div className="font-mono font-bold text-[12.5px] text-site-text whitespace-nowrap">
                            {price !== null ? formatBaht(price) : "—"}
                            {types.length > 1 && (
                              <span className="text-site-dim font-normal">
                                {" "}
                                เริ่มต้น
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-site-dim">
                            {cost !== null ? `ทุน ${formatBaht(cost)}` : "ไม่มีข้อมูลทุน"}
                          </div>
                        </div>
                        <DollarSign className="w-3 h-3 text-site-dim group-hover:text-site-accent transition-colors" />
                      </div>
                    </TableCell>

                    {/* margin */}
                    <TableCell className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          "font-mono text-[11.5px] font-bold",
                          marginTone(margin),
                        )}
                      >
                        {margin !== null ? `+${margin.toFixed(1)}%` : "—"}
                      </span>
                    </TableCell>

                    {/* stock */}
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col gap-1.5 min-w-[90px]">
                        <div className="h-1 w-full rounded-full bg-site-border-soft overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              stock.tone,
                            )}
                            style={{ width: `${Math.max(stock.ratio * 100, 4)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-site-dim">
                          {stock.label}
                        </span>
                      </div>
                    </TableCell>

                    {/* status toggle */}
                    <TableCell className="px-4 py-3">
                      <StatusBadge
                        status={product.isActive ? "ACTIVE" : "INACTIVE"}
                      />
                    </TableCell>

                    {/* actions */}
                    <TableCell className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-60 hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-site-dim hover:text-site-accent"
                          title="จัดการราคา"
                          onClick={() => onEditPrice(product)}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-site-dim hover:text-site-text"
                          title="เปลี่ยนรูปภาพ"
                          onClick={() => onEditImage(product)}
                        >
                          <ImagePlus className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-site-dim hover:text-site-accent"
                          title="แก้ไขสินค้า"
                          asChild
                        >
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-site-dim hover:text-semantic-rose hover:bg-semantic-rose/10"
                          title="ลบสินค้า"
                          onClick={() => onDelete(product.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* expanded: inline sub-type pricing */}
                  {expanded && (
                    <TableRow className="border-site-border-soft hover:bg-transparent">
                      <TableCell
                        colSpan={colCount}
                        className="bg-site-raised px-4 py-4 border-b border-site-border max-w-0 w-full"
                      >
                        <div className="pl-9 min-w-0">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-site-dim">
                              ราคาประเภทย่อย · {types.length} รายการ
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-[11px] shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditPrice(product);
                              }}
                            >
                              <DollarSign className="w-3 h-3" />
                              แก้ไขทั้งหมด
                            </Button>
                          </div>

                          {types.length > 0 ? (
                            <div className="bg-site-surface border border-site-border-soft rounded-xl overflow-hidden">
                              <div className="max-h-[420px] overflow-y-auto">
                                <table className="w-full border-collapse">
                                  <thead className="sticky top-0 z-10">
                                    <tr className="bg-site-raised text-[9.5px] font-bold uppercase tracking-wider text-site-dim">
                                      <th className="text-left font-bold px-4 py-2 border-b border-site-border-soft">
                                        ประเภท
                                      </th>
                                      <th className="text-right font-bold px-4 py-2 border-b border-site-border-soft w-[120px]">
                                        ทุน (SEAGM)
                                      </th>
                                      <th className="text-right font-bold px-4 py-2 border-b border-site-border-soft w-[120px]">
                                        ราคาขาย
                                      </th>
                                      <th className="text-right font-bold px-4 py-2 border-b border-site-border-soft w-[80px]">
                                        กำไร
                                      </th>
                                      <th className="text-right font-bold px-4 py-2 border-b border-site-border-soft w-[110px]">
                                        สถานะ
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {types.map((t) => {
                                      const cost = Number(t.unitPrice) || 0;
                                      const price =
                                        Number(t.displayPrice) ||
                                        Number(t.sellingPrice) ||
                                        0;
                                      const m =
                                        cost > 0 && price > 0
                                          ? ((price - cost) / cost) * 100
                                          : null;
                                      return (
                                        <tr
                                          key={t.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onEditPrice(product);
                                          }}
                                          className="cursor-pointer border-b border-site-border-soft last:border-b-0 transition-colors hover:bg-site-accent/5"
                                        >
                                          <td className="px-4 py-2.5 text-xs font-semibold text-site-text">
                                            {t.name}
                                          </td>
                                          <td className="px-4 py-2.5 text-right font-mono text-[11.5px] text-site-dim">
                                            {cost > 0 ? formatBaht(cost) : "—"}
                                          </td>
                                          <td className="px-4 py-2.5 text-right font-mono text-[12px] font-bold text-site-text">
                                            {price > 0 ? formatBaht(price) : "—"}
                                          </td>
                                          <td
                                            className={cn(
                                              "px-4 py-2.5 text-right font-mono text-[11px] font-bold",
                                              marginTone(m),
                                            )}
                                          >
                                            {m !== null
                                              ? `+${m.toFixed(1)}%`
                                              : "—"}
                                          </td>
                                          <td className="px-4 py-2.5 text-right">
                                            <span
                                              className={cn(
                                                "inline-flex items-center gap-1.5 text-[10px] font-bold rounded-md px-2 py-0.5 border whitespace-nowrap",
                                                t.hasStock
                                                  ? "text-semantic-green bg-semantic-green/8 border-semantic-green/20"
                                                  : "text-semantic-rose bg-semantic-rose/8 border-semantic-rose/20",
                                              )}
                                            >
                                              <span
                                                className={cn(
                                                  "w-1.5 h-1.5 rounded-full",
                                                  t.hasStock
                                                    ? "bg-semantic-green"
                                                    : "bg-semantic-rose",
                                                )}
                                              />
                                              {t.hasStock ? "พร้อมขาย" : "สต็อกหมด"}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-site-dim flex items-center gap-2 bg-site-surface border border-site-border-soft rounded-xl px-4 py-3">
                              <span className="inline-block w-3 h-3 rounded-full border-2 border-site-dim border-t-transparent animate-spin" />
                              กำลังโหลดราคาประเภทย่อย…
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* footer / pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-site-border-soft text-[11px] text-site-dim">
        <span>
          แสดง{" "}
          <b className="font-mono text-site-muted">{products.length}</b> รายการ
          จากทั้งหมด{" "}
          <b className="font-mono text-site-muted">{pagination.total}</b>
        </span>
        <div className="flex items-center gap-1">
          <button
            className="min-w-[28px] h-7 px-2 rounded-lg border border-site-border bg-site-raised text-site-muted font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:text-site-text transition-colors"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            ‹
          </button>
          <span className="px-2 font-mono">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            className="min-w-[28px] h-7 px-2 rounded-lg border border-site-border bg-site-raised text-site-muted font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:text-site-text transition-colors"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
