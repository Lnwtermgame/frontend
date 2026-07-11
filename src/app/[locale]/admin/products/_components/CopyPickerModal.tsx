"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, ImageIcon, Search, X } from "lucide-react";
import { motion } from "@/lib/framer-exports";
import toast from "react-hot-toast";
import type { AdminProduct } from "@/lib/services/product-api";

interface CopyPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (productId: string) => void;
  products: AdminProduct[];
  /** Product currently being edited (excluded from the picker). */
  excludeProductId?: string;
  /** Which image to copy. */
  target: "logo" | "cover";
}

export function CopyPickerModal({
  open,
  onClose,
  onSelect,
  products,
  excludeProductId,
  target,
}: CopyPickerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copyPickerSearch, setCopyPickerSearch] = useState("");

  useEffect(() => setMounted(true), []);

  // Reset search each time the picker opens.
  useEffect(() => {
    if (open) setCopyPickerSearch("");
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const candidates = products
    .filter((p) => p.id !== excludeProductId)
    .filter((p) => {
      if (!copyPickerSearch.trim()) return true;
      const q = copyPickerSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q)
      );
    });

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80]"
        onClick={() => onClose()}
      />
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="pointer-events-auto bg-site-surface border border-site-border rounded-12 w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Picker Header */}
          <div className="p-4 border-b border-site-border-soft flex items-center justify-between shrink-0">
            <h3 className="text-[15px] font-bold text-site-text tracking-wide flex items-center gap-2.5">
              <div className="p-1.5 bg-site-accent/10 rounded-lg">
                <Copy className="h-4 w-4 text-site-accent" />
              </div>
              คัดลอกรูปภาพจากสินค้าอื่น
              <span className="text-[12px] font-bold text-site-dim bg-site-raised px-2 py-0.5 rounded-md ml-1 border border-site-border">
                {target === "logo" ? "โลโก้สินค้า" : "หน้าปก"}
              </span>
            </h3>
            <button
              onClick={onClose}
              className="p-2 bg-site-raised border border-site-border rounded-lg hover:bg-site-surface hover:text-site-text transition-all text-site-dim"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-site-border-soft bg-site-raised shrink-0">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-site-dim" />
              <input
                type="text"
                value={copyPickerSearch}
                onChange={(e) => setCopyPickerSearch(e.target.value)}
                placeholder="ค้นหาชื่อเกม หรือ คีย์เวิร์ด เพื่อคัดลอกรูป..."
                className="w-full bg-site-surface border border-site-border rounded-lg pl-11 pr-4 py-3 text-site-text text-[13px] font-medium focus:ring-1 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="p-4 overflow-y-auto flex-1 min-h-[300px]">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {candidates.map((p) => {
                const imgSrc =
                  target === "logo" ? p.imageUrl : p.coverImageUrl;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (!imgSrc) {
                        toast.error(
                          `สินค้า "${p.name}" ไม่มี${
                            target === "logo" ? "โลโก้" : "รูปปก"
                          }`,
                        );
                        return;
                      }
                      onSelect(p.id);
                      toast.success(`เลือกรูปภาพสำเร็จ!`);
                    }}
                    className="group flex flex-col items-center gap-2 p-2 rounded-xl border border-site-border bg-site-raised hover:border-site-accent/30 hover:bg-site-raised transition-all cursor-pointer text-left"
                  >
                    <div className="w-full aspect-square rounded-lg bg-site-raised border border-site-border overflow-hidden flex items-center justify-center relative">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-110 group-hover:opacity-80 transition-all duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1.5 text-site-dim opacity-50">
                          <ImageIcon className="w-6 h-6" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            No Image
                          </span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      {imgSrc && (
                        <div className="absolute inset-0 bg-site-accent/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-site-accent text-white rounded-full p-1.5 shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                            <Copy className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-site-dim text-center leading-tight line-clamp-2 w-full group-hover:text-site-accent transition-colors">
                      {p.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Empty state */}
            {candidates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-site-dim">
                <Search className="w-10 h-10 mb-4 opacity-30" />
                <h4 className="text-[14px] font-bold text-site-text mb-1">
                  ไม่พบผลลัพธ์
                </h4>
                <p className="text-[13px] text-site-dim">
                  ลองค้นหาด้วยคำอื่นสำหรับ &quot;{copyPickerSearch}&quot;
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>,
    document.body,
  );
}
