"use client";

import { useState } from "react";
import { motion } from "@/lib/framer-exports";
import {
  AdminLayout,
  AdminPageHeader,
  PageContainer,
} from "@/components/admin";
import {
  Tag,
  Calendar,
  Save,
  ChevronLeft,
  X,
  Clock,
  Percent,
  CreditCard,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminPromotionCreate() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    type: "discount",
    code: "",
    discount: "",
    startDate: "",
    endDate: "",
    minPurchase: "",
    maxDiscount: "",
    usageLimit: "",
    description: "",
    isActive: true,
    applyToAll: true,
    selectedGames: [],
  });

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Redirect to promotions list
    router.push("/admin/promotions");
  };

  return (
    <AdminLayout>
      <PageContainer className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Link href="/admin/promotions">
            <Button variant="secondary" size="icon" aria-label="ย้อนกลับ">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <AdminPageHeader title="สร้างโปรโมชั่น" icon={Tag} />
        </div>

        {/* Form Container */}
        <motion.div
          className="bg-site-surface border border-white/5 rounded-2xl overflow-hidden"

          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="p-3 border-b-2 border-white/10 bg-site-surface">
            <h3 className="text-base font-semibold text-white flex items-center">
              <Tag className="mr-2 h-4 w-4 text-site-accent" />
              โปรโมชั่นใหม่
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Promotion Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-medium text-white">
                    ชื่อโปรโมชั่น <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="title"
                    name="title"
                    required
                    size="sm"
                    className="border-site-border bg-site-raised text-white"
                    placeholder="เช่น ลด 30% ฤดูร้อน"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>

                {/* Promotion Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="type" className="text-xs font-medium text-white">
                    ประเภทโปรโมชั่น <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger
                      id="type"
                      className="h-9 rounded-6 border-site-border bg-site-raised text-sm [&>span]:flex [&>span]:items-center [&>span]:gap-2"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount">
                        <Sparkles className="h-4 w-4 text-site-dim" />
                        ส่วนลดปกติ
                      </SelectItem>
                      <SelectItem value="flash">
                        <Sparkles className="h-4 w-4 text-site-dim" />
                        แฟลชเซล
                      </SelectItem>
                      <SelectItem value="cashback">
                        <Sparkles className="h-4 w-4 text-site-dim" />
                        คืนเงิน
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Promotion Code */}
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-xs font-medium text-white">
                    รหัสโปรโมชั่น <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="code"
                    name="code"
                    required
                    size="sm"
                    className="border-site-border bg-site-raised text-white font-mono"
                    placeholder="เช่น SUMMER30"
                    value={formData.code}
                    onChange={handleChange}
                  />
                  <p className="text-[10px] text-gray-400">
                    รหัสตัวพิมพ์ใหญ่-เล็กมีผลและควรไม่ซ้ำกัน
                  </p>
                </div>

                {/* Discount Amount */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="discount"
                    className="text-xs font-medium text-white"
                  >
                    จำนวนส่วนลด <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="discount"
                    name="discount"
                    required
                    size="sm"
                    icon={<Percent className="h-4 w-4 text-gray-400" />}
                    className="border-site-border bg-site-raised text-white"
                    placeholder="เช่น 30"
                    value={formData.discount}
                    onChange={handleChange}
                  />
                </div>

                {/* Min Purchase */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="minPurchase"
                    className="text-xs font-medium text-white"
                  >
                    ยอดซื้อขั้นต่ำ (ไม่บังคับ)
                  </Label>
                  <Input
                    type="text"
                    id="minPurchase"
                    name="minPurchase"
                    size="sm"
                    icon={<CreditCard className="h-4 w-4 text-gray-400" />}
                    className="border-site-border bg-site-raised text-white"
                    placeholder="เช่น 20"
                    value={formData.minPurchase}
                    onChange={handleChange}
                  />
                  <p className="text-[10px] text-gray-400">
                    ยอดซื้อขั้นต่ำที่ต้องการเพื่อใช้โปรโมชั่นนี้
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Date Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="startDate"
                      className="text-xs font-medium text-white"
                    >
                      วันที่เริ่ม <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      id="startDate"
                      name="startDate"
                      required
                      size="sm"
                      icon={<Calendar className="h-4 w-4 text-gray-400" />}
                      className="border-site-border bg-site-raised text-white"
                      value={formData.startDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="endDate"
                      className="text-xs font-medium text-white"
                    >
                      วันที่สิ้นสุด <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      id="endDate"
                      name="endDate"
                      required
                      size="sm"
                      icon={<Calendar className="h-4 w-4 text-gray-400" />}
                      className="border-site-border bg-site-raised text-white"
                      value={formData.endDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Usage Limit */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="usageLimit"
                    className="text-xs font-medium text-white"
                  >
                    จำกัดการใช้ (ไม่บังคับ)
                  </Label>
                  <Input
                    type="number"
                    id="usageLimit"
                    name="usageLimit"
                    size="sm"
                    icon={<Clock className="h-4 w-4 text-gray-400" />}
                    className="border-site-border bg-site-raised text-white"
                    placeholder="เว้นว่างไว้สำหรับไม่จำกัด"
                    value={formData.usageLimit}
                    onChange={handleChange}
                  />
                  <p className="text-[10px] text-gray-400">
                    จำนวนครั้งสูงสุดที่สามารถใช้โปรโมชั่นนี้ได้
                  </p>
                </div>

                {/* Max Discount */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="maxDiscount"
                    className="text-xs font-medium text-white"
                  >
                    ส่วนลดสูงสุด (ไม่บังคับ)
                  </Label>
                  <Input
                    type="text"
                    id="maxDiscount"
                    name="maxDiscount"
                    size="sm"
                    icon={<CreditCard className="h-4 w-4 text-gray-400" />}
                    className="border-site-border bg-site-raised text-white"
                    placeholder="เช่น 50"
                    value={formData.maxDiscount}
                    onChange={handleChange}
                  />
                  <p className="text-[10px] text-gray-400">
                    จำนวนส่วนลดสูงสุดเป็นหน่วยเงิน
                  </p>
                </div>

                {/* Active Status */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked === true })
                    }
                    className="border-site-border"
                  />
                  <Label htmlFor="isActive" className="text-xs font-medium text-white">
                    เปิดใช้งานโปรโมชั่นทันที
                  </Label>
                </div>

                {/* Apply to All */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="applyToAll"
                    name="applyToAll"
                    checked={formData.applyToAll}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, applyToAll: checked === true })
                    }
                    className="border-site-border"
                  />
                  <Label
                    htmlFor="applyToAll"
                    className="text-xs font-medium text-white"
                  >
                    ใช้กับสินค้าและเกมทั้งหมด
                  </Label>
                </div>
              </div>
            </div>

            {/* Description Textarea - Full Width */}
            <div className="mt-4 space-y-1.5">
              <Label
                htmlFor="description"
                className="text-xs font-medium text-white"
              >
                รายละเอียด (ไม่บังคับ)
              </Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                className="bg-site-raised border-site-border text-white text-sm"
                placeholder="อธิบายรายละเอียดโปรโมชั่น..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                asChild
              >
                <Link href="/admin/promotions">
                  <X className="h-4 w-4 mr-2" />
                  ยกเลิก
                </Link>
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="w-full sm:w-auto bg-black text-white border border-white/5 hover:bg-gray-800"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "กำลังสร้าง..." : "สร้างโปรโมชั่น"}
              </Button>
            </div>
          </form>
        </motion.div>
      </PageContainer>
    </AdminLayout>
  );
}
