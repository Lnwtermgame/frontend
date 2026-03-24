"use client";

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "@/lib/framer-exports";
import {
    X,
    Download,
    FileJson,
    FileSpreadsheet,
    CheckSquare,
    Square,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import type { AdminProduct, AdminProductType } from "@/lib/services/product-api";

// --- Field groups ---

interface ExportFieldGroup {
    key: string;
    label: string;
    fields: { key: string; label: string }[];
}

const EXPORT_FIELD_GROUPS: ExportFieldGroup[] = [
    {
        key: "basic",
        label: "ข้อมูลพื้นฐาน",
        fields: [
            { key: "id", label: "ID" },
            { key: "name", label: "ชื่อสินค้า" },
            { key: "slug", label: "Slug" },
            { key: "description", label: "รายละเอียด" },
            { key: "shortDescription", label: "รายละเอียดสั้น" },
        ],
    },
    {
        key: "category",
        label: "หมวดหมู่ & ประเภท",
        fields: [
            { key: "categoryName", label: "หมวดหมู่" },
            { key: "productType", label: "ประเภทสินค้า" },
        ],
    },
    {
        key: "status",
        label: "สถานะ",
        fields: [
            { key: "isActive", label: "เปิดขาย" },
            { key: "isFeatured", label: "สินค้าแนะนำ" },
            { key: "isBestseller", label: "สินค้าขายดี" },
        ],
    },
    {
        key: "images",
        label: "รูปภาพ",
        fields: [
            { key: "imageUrl", label: "Logo URL" },
            { key: "coverImageUrl", label: "Cover URL" },
        ],
    },
    {
        key: "pricing",
        label: "ราคา / ต้นทุน (แต่ละ Type)",
        fields: [
            { key: "typeName", label: "ชื่อ Type" },
            { key: "unitPrice", label: "Unit Price (ต้นทุน)" },
            { key: "originPrice", label: "Origin Price (SEAGM)" },
            { key: "sellingPrice", label: "Selling Price (ราคาขาย)" },
            { key: "displayPrice", label: "Display Price" },
            { key: "discountRate", label: "ส่วนลด (%)" },
            { key: "currency", label: "สกุลเงิน" },
            { key: "hasStock", label: "มีสต๊อก" },
        ],
    },
    {
        key: "seo",
        label: "SEO",
        fields: [
            { key: "metaTitle", label: "Meta Title" },
            { key: "metaDescription", label: "Meta Description" },
            { key: "metaKeywords", label: "Meta Keywords" },
        ],
    },
    {
        key: "gameDetails",
        label: "Game Details",
        fields: [
            { key: "developer", label: "Developer" },
            { key: "publisher", label: "Publisher" },
            { key: "platforms", label: "Platforms" },
            { key: "region", label: "Region" },
        ],
    },
    {
        key: "stats",
        label: "สถิติ",
        fields: [
            { key: "salesCount", label: "ยอดขาย" },
            { key: "viewCount", label: "ยอดดู" },
            { key: "averageRating", label: "คะแนนเฉลี่ย" },
            { key: "reviewCount", label: "จำนวนรีวิว" },
        ],
    },
    {
        key: "timestamps",
        label: "วันที่",
        fields: [
            { key: "createdAt", label: "วันที่สร้าง" },
            { key: "updatedAt", label: "วันที่อัปเดต" },
        ],
    },
    {
        key: "seagm",
        label: "SEAGM IDs",
        fields: [
            { key: "seagmProductId", label: "SEAGM Product ID" },
            { key: "seagmId", label: "SEAGM Numeric ID" },
        ],
    },
];

const ALL_FIELD_KEYS = EXPORT_FIELD_GROUPS.flatMap((g) =>
    g.fields.map((f) => f.key),
);

const PRICING_FIELD_KEYS = new Set(
    EXPORT_FIELD_GROUPS.find((g) => g.key === "pricing")!.fields.map(
        (f) => f.key,
    ),
);

type ExportFormat = "csv" | "json";

// --- Helpers ---

function getProductFieldValue(
    product: AdminProduct,
    fieldKey: string,
): string {
    switch (fieldKey) {
        case "id":
            return product.id;
        case "name":
            return product.name;
        case "slug":
            return product.slug;
        case "description":
            return product.description || "";
        case "shortDescription":
            return product.shortDescription || "";
        case "categoryName":
            return product.category?.name || "";
        case "productType":
            return product.productType;
        case "isActive":
            return product.isActive ? "ใช่" : "ไม่";
        case "isFeatured":
            return product.isFeatured ? "ใช่" : "ไม่";
        case "isBestseller":
            return product.isBestseller ? "ใช่" : "ไม่";
        case "imageUrl":
            return product.imageUrl || "";
        case "coverImageUrl":
            return product.coverImageUrl || "";
        case "metaTitle":
            return product.metaTitle || "";
        case "metaDescription":
            return product.metaDescription || "";
        case "metaKeywords":
            return product.metaKeywords || "";
        case "developer":
            return product.gameDetails?.developer || "";
        case "publisher":
            return product.gameDetails?.publisher || "";
        case "platforms":
            return product.gameDetails?.platforms?.join(", ") || "";
        case "region":
            return product.gameDetails?.region || "";
        case "salesCount":
            return String(product.salesCount ?? "");
        case "viewCount":
            return String(product.viewCount ?? "");
        case "averageRating":
            return String(product.averageRating ?? "");
        case "reviewCount":
            return String(product.reviewCount ?? "");
        case "createdAt":
            return product.createdAt;
        case "updatedAt":
            return product.updatedAt;
        case "seagmProductId":
            return product.seagmProductId || "";
        case "seagmId":
            return String(product.seagmId ?? "");
        default:
            return "";
    }
}

function getTypeFieldValue(type: AdminProductType, fieldKey: string): string {
    switch (fieldKey) {
        case "typeName":
            return type.name;
        case "unitPrice":
            return String(type.unitPrice ?? "");
        case "originPrice":
            return String(type.originPrice ?? "");
        case "sellingPrice":
            return String(type.sellingPrice ?? "");
        case "displayPrice":
            return String(type.displayPrice ?? "");
        case "discountRate":
            return String(type.discountRate ?? "");
        case "currency":
            return type.currency;
        case "hasStock":
            return type.hasStock ? "ใช่" : "ไม่";
        default:
            return "";
    }
}

function escapeCsvCell(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function downloadFile(content: string, filename: string, mimeType: string) {
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- Component ---

interface ExportProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: AdminProduct[];
    filteredProducts: AdminProduct[];
}

export default function ExportProductsModal({
    isOpen,
    onClose,
    products,
    filteredProducts,
}: ExportProductsModalProps) {
    const [format, setFormat] = useState<ExportFormat>("csv");
    const [selectedFields, setSelectedFields] = useState<Set<string>>(
        () => new Set(ALL_FIELD_KEYS),
    );
    const [exportScope, setExportScope] = useState<"all" | "filtered">("all");
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
        new Set(),
    );

    const toggleField = useCallback((fieldKey: string) => {
        setSelectedFields((prev) => {
            const next = new Set(prev);
            if (next.has(fieldKey)) {
                next.delete(fieldKey);
            } else {
                next.add(fieldKey);
            }
            return next;
        });
    }, []);

    const toggleGroup = useCallback(
        (group: ExportFieldGroup) => {
            const groupKeys = group.fields.map((f) => f.key);
            const allSelected = groupKeys.every((k) => selectedFields.has(k));
            setSelectedFields((prev) => {
                const next = new Set(prev);
                groupKeys.forEach((k) => {
                    if (allSelected) {
                        next.delete(k);
                    } else {
                        next.add(k);
                    }
                });
                return next;
            });
        },
        [selectedFields],
    );

    const selectAll = useCallback(() => {
        setSelectedFields(new Set(ALL_FIELD_KEYS));
    }, []);

    const deselectAll = useCallback(() => {
        setSelectedFields(new Set());
    }, []);

    const toggleCollapse = useCallback((groupKey: string) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupKey)) {
                next.delete(groupKey);
            } else {
                next.add(groupKey);
            }
            return next;
        });
    }, []);

    const dataSource = exportScope === "all" ? products : filteredProducts;

    const hasPricingFields = Array.from(selectedFields).some((k) =>
        PRICING_FIELD_KEYS.has(k),
    );
    const nonPricingFields = Array.from(selectedFields).filter(
        (k) => !PRICING_FIELD_KEYS.has(k),
    );
    const pricingFields = Array.from(selectedFields).filter((k) =>
        PRICING_FIELD_KEYS.has(k),
    );

    const getFieldLabel = (key: string) => {
        for (const g of EXPORT_FIELD_GROUPS) {
            const f = g.fields.find((f) => f.key === key);
            if (f) return f.label;
        }
        return key;
    };

    const handleExport = useCallback(() => {
        if (selectedFields.size === 0) {
            toast.error("กรุณาเลือกอย่างน้อย 1 ฟิลด์");
            return;
        }
        if (dataSource.length === 0) {
            toast.error("ไม่มีข้อมูลสินค้าสำหรับ export");
            return;
        }

        const timestamp = new Date().toISOString().slice(0, 10);

        if (format === "json") {
            exportJSON(timestamp);
        } else {
            exportCSV(timestamp);
        }

        toast.success(
            `Export สำเร็จ! (${dataSource.length} สินค้า, ${format.toUpperCase()})`,
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFields, dataSource, format]);

    const exportJSON = (timestamp: string) => {
        const data = dataSource.map((product) => {
            const row: Record<string, any> = {};
            nonPricingFields.forEach((key) => {
                row[key] = getProductFieldValue(product, key);
            });
            if (hasPricingFields && product.seagmTypes?.length) {
                row.types = product.seagmTypes.map((t) => {
                    const typeRow: Record<string, any> = {};
                    pricingFields.forEach((key) => {
                        typeRow[key] = getTypeFieldValue(t, key);
                    });
                    return typeRow;
                });
            }
            return row;
        });
        const content = JSON.stringify(data, null, 2);
        downloadFile(
            content,
            `products_export_${timestamp}.json`,
            "application/json",
        );
    };

    const exportCSV = (timestamp: string) => {
        const headers = [
            ...nonPricingFields.map(getFieldLabel),
            ...(hasPricingFields ? pricingFields.map(getFieldLabel) : []),
        ];

        const rows: string[][] = [];

        dataSource.forEach((product) => {
            const baseValues = nonPricingFields.map((key) =>
                getProductFieldValue(product, key),
            );

            if (hasPricingFields && product.seagmTypes?.length) {
                // One row per type (flatten)
                product.seagmTypes.forEach((t) => {
                    const typeValues = pricingFields.map((key) =>
                        getTypeFieldValue(t, key),
                    );
                    rows.push([...baseValues, ...typeValues]);
                });
            } else {
                // Single row
                const emptyPricing = hasPricingFields
                    ? pricingFields.map(() => "")
                    : [];
                rows.push([...baseValues, ...emptyPricing]);
            }
        });

        const csvLines = [
            headers.map(escapeCsvCell).join(","),
            ...rows.map((row) => row.map(escapeCsvCell).join(",")),
        ];
        const content = csvLines.join("\n");
        downloadFile(content, `products_export_${timestamp}.csv`, "text/csv");
    };

    if (!isOpen || typeof window === "undefined") return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#212328] border border-site-border/30 rounded-[16px] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-lg"
            >
                {/* Header */}
                <div className="p-4 border-b-[3px] border-black bg-site-accent flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Export ข้อมูลสินค้า
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 bg-[#212328] border-[2px] border-black hover:bg-[#1A1C1E] transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[65vh] space-y-4">
                    {/* Format / Scope Row */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Format */}
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                รูปแบบไฟล์
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFormat("csv")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-black text-sm font-medium transition-colors ${format === "csv"
                                        ? "bg-site-accent text-white"
                                        : "bg-[#212328] text-white hover:bg-[#1A1C1E]"
                                        }`}
                                    style={{ boxShadow: "2px 2px 0 0 #000" }}
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                    CSV
                                </button>
                                <button
                                    onClick={() => setFormat("json")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-black text-sm font-medium transition-colors ${format === "json"
                                        ? "bg-site-accent text-white"
                                        : "bg-[#212328] text-white hover:bg-[#1A1C1E]"
                                        }`}
                                    style={{ boxShadow: "2px 2px 0 0 #000" }}
                                >
                                    <FileJson className="h-4 w-4" />
                                    JSON
                                </button>
                            </div>
                        </div>

                        {/* Scope */}
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                ขอบเขตข้อมูล
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setExportScope("all")}
                                    className={`px-3 py-1.5 border-[2px] border-black text-sm font-medium transition-colors ${exportScope === "all"
                                        ? "bg-black text-white"
                                        : "bg-[#212328] text-white hover:bg-[#1A1C1E]"
                                        }`}
                                    style={{ boxShadow: "2px 2px 0 0 #000" }}
                                >
                                    ทั้งหมด ({products.length})
                                </button>
                                <button
                                    onClick={() => setExportScope("filtered")}
                                    className={`px-3 py-1.5 border-[2px] border-black text-sm font-medium transition-colors ${exportScope === "filtered"
                                        ? "bg-black text-white"
                                        : "bg-[#212328] text-white hover:bg-[#1A1C1E]"
                                        }`}
                                    style={{ boxShadow: "2px 2px 0 0 #000" }}
                                >
                                    ที่กรอง ({filteredProducts.length})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick toggles */}
                    <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
                        <span className="text-xs font-bold text-gray-600">
                            เลือกฟิลด์:
                        </span>
                        <button
                            onClick={selectAll}
                            className="text-xs text-site-accent hover:text-white font-medium underline"
                        >
                            เลือกทั้งหมด
                        </button>
                        <button
                            onClick={deselectAll}
                            className="text-xs text-red-500 hover:text-red-400 font-medium underline"
                        >
                            ยกเลิกทั้งหมด
                        </button>
                        <span className="ml-auto text-xs text-gray-400">
                            {selectedFields.size}/{ALL_FIELD_KEYS.length} ฟิลด์
                        </span>
                    </div>

                    {/* Field groups */}
                    <div className="space-y-1">
                        {EXPORT_FIELD_GROUPS.map((group) => {
                            const groupKeys = group.fields.map((f) => f.key);
                            const allSelected = groupKeys.every((k) =>
                                selectedFields.has(k),
                            );
                            const someSelected =
                                !allSelected && groupKeys.some((k) => selectedFields.has(k));
                            const isCollapsed = collapsedGroups.has(group.key);

                            return (
                                <div
                                    key={group.key}
                                    className="border border-gray-200 bg-[#181A1D]"
                                >
                                    {/* Group header */}
                                    <div className="flex items-center gap-2 px-3 py-2">
                                        <button
                                            onClick={() => toggleGroup(group)}
                                            className="flex items-center"
                                        >
                                            {allSelected ? (
                                                <CheckSquare className="h-4 w-4 text-site-accent" />
                                            ) : someSelected ? (
                                                <div className="relative">
                                                    <Square className="h-4 w-4 text-gray-400" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-2 h-2 bg-site-accent/70" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <Square className="h-4 w-4 text-gray-400" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => toggleCollapse(group.key)}
                                            className="flex-1 flex items-center justify-between"
                                        >
                                            <span className="text-xs font-bold text-gray-700">
                                                {group.label}
                                            </span>
                                            {isCollapsed ? (
                                                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                                            ) : (
                                                <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Fields */}
                                    {!isCollapsed && (
                                        <div className="px-3 pb-2 flex flex-wrap gap-x-4 gap-y-1">
                                            {group.fields.map((field) => (
                                                <label
                                                    key={field.key}
                                                    className="flex items-center gap-1.5 cursor-pointer group"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedFields.has(field.key)}
                                                        onChange={() => toggleField(field.key)}
                                                        className="accent-[#4ecdc4] w-3.5 h-3.5"
                                                    />
                                                    <span className="text-xs text-gray-600 group-hover:text-white transition-colors">
                                                        {field.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* CSV note */}
                    {format === "csv" && hasPricingFields && (
                        <div className="text-[11px] text-gray-500 bg-yellow-50 border border-yellow-200 px-3 py-2">
                            💡 CSV: สินค้าที่มีหลาย Type จะถูก flatten เป็นหลายแถว (1 แถว ต่อ
                            1 Type)
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t-[3px] border-black bg-[#181A1D] flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                        {dataSource.length} สินค้า •{" "}
                        {format === "csv" ? "CSV" : "JSON"}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-1.5 text-sm font-medium border-[2px] border-black bg-[#212328] text-white hover:bg-[#1A1C1E] transition-colors"
                            style={{ boxShadow: "2px 2px 0 0 #000" }}
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={selectedFields.size === 0}
                            className="px-4 py-1.5 text-sm font-bold border-[2px] border-black bg-site-accent text-white hover:bg-[#3dbdb5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            style={{ boxShadow: "2px 2px 0 0 #000" }}
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body,
    );
}
