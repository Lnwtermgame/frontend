"use client";

import { useState } from "react";
import { Copy, ImageIcon, Loader2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { FormModal } from "@/components/admin";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { AdminProduct } from "@/lib/services/product-api";

interface ImageEditModalProps {
  open: boolean;
  onClose: () => void;
  product: AdminProduct | null;
  target: "logo" | "cover";
  onTargetChange: (target: "logo" | "cover") => void;
  /** Controlled image URL (shared with the copy picker). */
  imageUrlInput: string;
  setImageUrlInput: (url: string) => void;
  /**
   * Upload the current URL to storage and persist it to the product.
   * Returns the final stored URL on success, or null on failure.
   */
  onUpload: (url: string) => Promise<string | null>;
  /**
   * Persist the (already-validated) URL to the product. Return true on
   * success so the modal can close.
   */
  onSave: (url: string) => Promise<boolean>;
  /** Open the copy-from-product picker. */
  onOpenCopyPicker: () => void;
}

export function ImageEditModal({
  open,
  onClose,
  product,
  target,
  onTargetChange,
  imageUrlInput,
  setImageUrlInput,
  onUpload,
  onSave,
  onOpenCopyPicker,
}: ImageEditModalProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  const resetTransient = () => {
    setIsUploadingImage(false);
    setIsSavingImage(false);
    setImageError(false);
  };

  const handleClose = () => {
    resetTransient();
    onClose();
  };

  const handleTargetClick = (next: "logo" | "cover") => {
    if (!product) return;
    onTargetChange(next);
    setImageError(false);
    setImageUrlInput(
      next === "logo" ? product.imageUrl || "" : product.coverImageUrl || "",
    );
  };

  const handleUploadClick = async () => {
    if (!imageUrlInput.trim() || !product) return;
    setIsUploadingImage(true);
    try {
      const stored = await onUpload(imageUrlInput);
      if (stored) {
        setImageUrlInput(stored);
        setImageError(false);
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!product) return;
    if (!imageUrlInput.trim()) {
      toast.error("กรุณาใส่ลิงก์รูปภาพ");
      return;
    }
    setIsSavingImage(true);
    try {
      const ok = await onSave(imageUrlInput);
      if (ok) {
        resetTransient();
      }
    } finally {
      setIsSavingImage(false);
    }
  };

  return (
    <FormModal
      open={open && !!product}
      onClose={handleClose}
      title={`เปลี่ยนรูปภาพ${product ? `: ${product.name}` : ""}`}
      onSubmit={handleSubmit}
      submitLabel={isSavingImage ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
      cancelLabel="ยกเลิก"
      loading={isSavingImage}
      size="md"
    >
      <div className="space-y-6">
        {/* Target Selection */}
        <div className="flex gap-1.5 bg-site-raised p-1.5 rounded-xl border border-site-border">
          <button
            type="button"
            onClick={() => handleTargetClick("logo")}
            className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-all ${
              target === "logo"
                ? "bg-site-surface text-site-text ring-1 ring-site-border"
                : "text-site-dim hover:text-site-text hover:bg-site-surface"
            }`}
          >
            โลโก้สินค้า
          </button>
          <button
            type="button"
            onClick={() => handleTargetClick("cover")}
            className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-all ${
              target === "cover"
                ? "bg-site-surface text-site-text ring-1 ring-site-border"
                : "text-site-dim hover:text-site-text hover:bg-site-surface"
            }`}
          >
            หน้าปกสินค้า
          </button>
        </div>

        {/* URL Input */}
        <div className="space-y-3">
          <label className="block text-[13px] font-bold text-site-muted">
            {target === "logo" ? "URL โลโก้สินค้า" : "URL รูปภาพหน้าปก"}
          </label>
          <div className="relative">
            <Input
              type="text"
              value={imageUrlInput}
              onChange={(e) => {
                setImageUrlInput(e.target.value);
                setImageError(false);
              }}
              placeholder="https://example.com/image.jpg"
              className="h-12 rounded-lg bg-site-raised border-site-border pl-4 pr-10 text-[13px]"
            />
            {imageUrlInput && (
              <button
                type="button"
                onClick={() => setImageUrlInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-site-dim hover:text-semantic-rose transition-colors p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-site-dim font-medium">
            {target === "logo"
              ? "ใส่ลิงก์รูปภาพโดยตรง (.jpg, .png, .webp) สำหรับแสดงในหน้ารายการสินค้า"
              : "ใส่ลิงก์รูปแนวนอน (16:9) สำหรับแสดงเป็นแบนเนอร์ในหน้ารายละเอียดสินค้า"}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-11 gap-2 rounded-lg border-site-accent/20 bg-site-accent/10 text-site-accent hover:bg-site-accent/20 hover:text-site-accent text-[13px]"
              onClick={handleUploadClick}
              disabled={
                isUploadingImage ||
                !(typeof imageUrlInput === "string" && imageUrlInput.trim())
              }
            >
              {isUploadingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>บันทึกลง Storage</span>
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              className="flex-1 h-11 gap-2 rounded-lg text-[13px]"
              onClick={onOpenCopyPicker}
            >
              <Copy className="w-4 h-4" />
              <span>คัดลอกจากสินค้าอื่น</span>
            </Button>
          </div>
        </div>

        {/* Preview Area */}
        <div>
          <label className="block text-[13px] font-bold text-site-muted mb-3 flex items-center justify-between">
            {target === "logo" ? "ตัวอย่างโลโก้" : "ตัวอย่างหน้าปก"}
            {imageUrlInput && !imageError && (
              <span className="text-[10px] bg-site-accent/10 text-site-accent px-2 py-0.5 rounded-md border border-site-accent/20">
                Preview Ready
              </span>
            )}
          </label>
          <div
            className={`mx-auto ${
              target === "logo"
                ? "aspect-square max-w-[200px]"
                : "aspect-video max-w-[320px]"
            } border-2 border-dashed ${
              imageUrlInput && !imageError
                ? "border-site-accent/30"
                : "border-site-border"
            } rounded-xl bg-site-surface flex items-center justify-center overflow-hidden relative group/preview transition-colors`}
          >
            {imageUrlInput && !imageError ? (
              <img
                src={imageUrlInput}
                alt="Image Preview"
                className="w-full h-full object-cover transition-transform duration-700 group-hover/preview:scale-110"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="text-center p-6 flex flex-col items-center justify-center gap-3">
                <div className="p-3 bg-site-raised rounded-xl border border-site-border">
                  <ImageIcon className="w-8 h-8 text-site-dim" />
                </div>
                <span className="text-[12px] font-bold text-site-dim block">
                  {imageUrlInput
                    ? "โหลดรูปภาพไม่สำเร็จ (URL ไม่ถูกต้อง)"
                    : "กรุณาระบุ URL รูปภาพด้านบน"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </FormModal>
  );
}
