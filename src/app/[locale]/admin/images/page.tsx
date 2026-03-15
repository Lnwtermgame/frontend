"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import {
    Upload,
    Trash2,
    Copy,
    Search,
    Grid,
    List,
    ImageIcon,
    FileText,
    Loader2,
    X,
    Check,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Link2,
    Eye,
    FolderOpen,
    HardDrive,
} from "lucide-react";
import {
    listFiles,
    uploadFileRaw,
    deleteImageFromStorage,
    processImageUrl,
    StorageFile,
    ListFilesResponse,
} from "@/lib/services/storage-api";
import { useAuth } from "@/lib/hooks/use-auth";
import toast from "react-hot-toast";

const PAGE_SIZES = [48, 96, 200];
const DEFAULT_PAGE_SIZE = 48;

/** Build Appwrite thumbnail URL (server-side resize — fast & lightweight) */
function getThumbnailUrl(viewUrl: string, width = 120, height = 120): string {
    return viewUrl.replace("/view?", `/preview?width=${width}&height=${height}&quality=60&`);
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function isImageMime(mime: string): boolean {
    return mime.startsWith("image/");
}

export default function AdminImagesPage() {
    const { isAdmin, isInitialized, isSessionChecked } = useAuth();
    const [files, setFiles] = useState<StorageFile[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [urlInput, setUrlInput] = useState("");
    const [folderInput, setFolderInput] = useState("products");
    const [isDeleting, setIsDeleting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const totalPages = Math.ceil(total / pageSize);

    const loadFiles = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await listFiles(pageSize, page * pageSize, search || undefined);
            setFiles(data.files);
            setTotal(data.total);
        } catch (error) {
            console.error("Failed to load files:", error);
            toast.error("ไม่สามารถโหลดรายการไฟล์ได้");
        } finally {
            setIsLoading(false);
        }
    }, [page, pageSize, search]);

    useEffect(() => {
        if (!isInitialized || !isSessionChecked || !isAdmin) return;
        loadFiles();
    }, [loadFiles, isInitialized, isSessionChecked, isAdmin]);

    const handleSearch = () => {
        setSearch(searchInput);
        setPage(0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
    };

    const handleCopyUrl = async (file: StorageFile) => {
        try {
            await navigator.clipboard.writeText(file.url);
            setCopiedId(file.id);
            toast.success("คัดลอกลิงก์แล้ว!");
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            toast.error("ไม่สามารถคัดลอกได้");
        }
    };

    const handleDelete = async (file: StorageFile) => {
        if (!confirm(`ลบไฟล์ "${file.name}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`)) return;

        try {
            await deleteImageFromStorage(file.id);
            toast.success("ลบไฟล์สำเร็จ");
            loadFiles();
            setSelectedFiles((prev) => {
                const next = new Set(prev);
                next.delete(file.id);
                return next;
            });
        } catch {
            toast.error("ไม่สามารถลบไฟล์ได้");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedFiles.size === 0) return;
        if (!confirm(`ลบไฟล์ ${selectedFiles.size} ไฟล์ที่เลือก? การกระทำนี้ไม่สามารถย้อนกลับได้`)) return;

        setIsDeleting(true);
        let deleted = 0;
        for (const fileId of selectedFiles) {
            try {
                await deleteImageFromStorage(fileId);
                deleted++;
            } catch {
                /* continue */
            }
        }
        toast.success(`ลบไฟล์ ${deleted}/${selectedFiles.size} สำเร็จ`);
        setSelectedFiles(new Set());
        setIsDeleting(false);
        loadFiles();
    };

    const handleFileUpload = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;
        setIsUploading(true);
        let uploaded = 0;

        for (let i = 0; i < fileList.length; i++) {
            try {
                await uploadFileRaw(fileList[i], folderInput);
                uploaded++;
            } catch (error) {
                console.error(`Upload failed for ${fileList[i].name}:`, error);
            }
        }

        toast.success(`อัปโหลด ${uploaded}/${fileList.length} ไฟล์สำเร็จ`);
        setIsUploading(false);
        loadFiles();
    };

    const handleUrlUpload = async () => {
        if (!urlInput.trim()) return;
        setIsUploading(true);
        try {
            const result = await processImageUrl(urlInput, folderInput);
            if (result) {
                setUrlInput("");
                loadFiles();
            }
        } catch {
            toast.error("อัปโหลดจาก URL ล้มเหลว");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
    };

    const toggleSelect = (fileId: string) => {
        setSelectedFiles((prev) => {
            const next = new Set(prev);
            if (next.has(fileId)) next.delete(fileId);
            else next.add(fileId);
            return next;
        });
    };

    const selectAll = () => {
        if (selectedFiles.size === files.length) setSelectedFiles(new Set());
        else setSelectedFiles(new Set(files.map((f) => f.id)));
    };

    return (
        <AdminLayout title="จัดการรูปภาพ">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center">
                        <span className="w-1.5 h-6 bg-brutal-blue mr-2"></span>
                        <div>
                            <h1 className="text-2xl font-bold text-black flex items-center gap-2">
                                <HardDrive className="w-6 h-6" />
                                จัดการรูปภาพ Storage
                            </h1>
                            <p className="text-gray-600 mt-1">
                                จัดการไฟล์ทั้งหมดใน Appwrite Storage — อัปโหลด ลบ คัดลอกลิงก์
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div
                            className="bg-white border-[2px] border-black px-4 py-2 flex items-center gap-2 text-sm font-medium"
                            style={{ boxShadow: "2px 2px 0 0 #000" }}
                        >
                            <FolderOpen className="w-4 h-4 text-brutal-blue" />
                            {total} ไฟล์
                        </div>
                    </div>
                </div>

                {/* Upload Section */}
                <motion.div
                    className="bg-white border-[3px] border-black p-6"
                    style={{ boxShadow: "4px 4px 0 0 #000" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        อัปโหลดไฟล์
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Drag & Drop Zone */}
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative border-[3px] border-dashed cursor-pointer transition-all p-8 flex flex-col items-center justify-center text-center ${isDragging
                                ? "border-brutal-blue bg-blue-50"
                                : "border-gray-300 bg-gray-50 hover:border-black hover:bg-gray-100"
                                }`}
                        >
                            {isUploading ? (
                                <Loader2 className="w-10 h-10 text-brutal-blue animate-spin mb-2" />
                            ) : (
                                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                            )}
                            <p className="text-sm font-medium text-black">
                                {isDragging ? "วางไฟล์ที่นี่!" : "ลาก & วางไฟล์ หรือคลิกเพื่อเลือก"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">รองรับหลายไฟล์พร้อมกัน</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e.target.files)}
                            />
                        </div>

                        {/* URL Upload + Folder */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-1">โฟลเดอร์</label>
                                <select
                                    value={folderInput}
                                    onChange={(e) => setFolderInput(e.target.value)}
                                    className="w-full bg-white border-[2px] border-black px-3 py-2 text-sm cursor-pointer"
                                >
                                    <option value="products">products</option>
                                    <option value="covers">covers</option>
                                    <option value="news">news</option>
                                    <option value="cms">cms</option>
                                    <option value="misc">misc</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-1">อัปโหลดจาก URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        placeholder="https://example.com/image.png"
                                        className="flex-1 bg-gray-50 border-[2px] border-black px-3 py-2 text-sm focus:ring-2 focus:ring-brutal-blue/50 outline-none"
                                        onKeyDown={(e) => e.key === "Enter" && handleUrlUpload()}
                                    />
                                    <button
                                        onClick={handleUrlUpload}
                                        disabled={!urlInput.trim() || isUploading}
                                        className="px-4 py-2 bg-brutal-blue text-white border-[2px] border-black font-medium text-sm hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                        style={{ boxShadow: "2px 2px 0 0 #000" }}
                                    >
                                        {isUploading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Link2 className="w-4 h-4" />
                                        )}
                                        ดึงรูป
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Search & Controls */}
                <motion.div
                    className="bg-white border-[3px] border-black p-4"
                    style={{ boxShadow: "4px 4px 0 0 #000" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="ค้นหาชื่อไฟล์..."
                                className="w-full bg-gray-50 border-[2px] border-black pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-brutal-blue/50 outline-none"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2 bg-black text-white border-[2px] border-black font-medium text-sm hover:bg-gray-800 transition-all"
                            style={{ boxShadow: "2px 2px 0 0 #000" }}
                        >
                            ค้นหา
                        </button>

                        {/* View Toggle */}
                        <div className="flex border-[2px] border-black">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-2 transition-colors ${viewMode === "grid"
                                    ? "bg-black text-white"
                                    : "bg-white text-black hover:bg-gray-100"
                                    }`}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-2 border-l-[2px] border-black transition-colors ${viewMode === "list"
                                    ? "bg-black text-white"
                                    : "bg-white text-black hover:bg-gray-100"
                                    }`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={loadFiles}
                            disabled={isLoading}
                            className="p-2 bg-white border-[2px] border-black hover:bg-gray-100 transition-colors disabled:opacity-50"
                            style={{ boxShadow: "2px 2px 0 0 #000" }}
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                        </button>
                    </div>

                    {/* Bulk Actions */}
                    {selectedFiles.size > 0 && (
                        <div className="mt-3 pt-3 border-t-[2px] border-gray-200 flex items-center gap-3">
                            <span className="text-sm font-medium text-black">
                                เลือก {selectedFiles.size} ไฟล์
                            </span>
                            <button
                                onClick={handleBulkDelete}
                                disabled={isDeleting}
                                className="px-3 py-1 bg-red-500 text-white border-[2px] border-black text-xs font-medium hover:bg-red-600 transition-all flex items-center gap-1 disabled:opacity-50"
                                style={{ boxShadow: "1px 1px 0 0 #000" }}
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Trash2 className="w-3 h-3" />
                                )}
                                ลบที่เลือก
                            </button>
                            <button
                                onClick={() => setSelectedFiles(new Set())}
                                className="px-3 py-1 bg-white text-black border-[2px] border-black text-xs font-medium hover:bg-gray-100 transition-all"
                            >
                                ยกเลิก
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* File Grid / List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-brutal-blue animate-spin" />
                            <span className="ml-3 text-gray-600">กำลังโหลด...</span>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="bg-white border-[3px] border-black p-12 text-center" style={{ boxShadow: "4px 4px 0 0 #000" }}>
                            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-lg font-bold text-black">ไม่พบไฟล์</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {search ? "ลองเปลี่ยนคำค้นหา" : "ยังไม่มีไฟล์ใน Storage"}
                            </p>
                        </div>
                    ) : viewMode === "grid" ? (
                        /* Grid View */
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className={`bg-white border-[2px] transition-all group relative ${selectedFiles.has(file.id)
                                        ? "border-brutal-blue ring-2 ring-brutal-blue/30"
                                        : "border-black hover:border-brutal-blue"
                                        }`}
                                    style={{ boxShadow: "1px 1px 0 0 #000" }}
                                >
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => toggleSelect(file.id)}
                                        className={`absolute top-1 left-1 z-10 w-4 h-4 border-[1.5px] border-black flex items-center justify-center transition-all ${selectedFiles.has(file.id)
                                            ? "bg-brutal-blue text-white"
                                            : "bg-white/80 opacity-0 group-hover:opacity-100"
                                            }`}
                                    >
                                        {selectedFiles.has(file.id) && <Check className="w-2.5 h-2.5" />}
                                    </button>

                                    {/* Preview */}
                                    <div
                                        className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer"
                                        onClick={() => setPreviewFile(file)}
                                    >
                                        {isImageMime(file.mimeType) ? (
                                            <img
                                                src={getThumbnailUrl(file.url)}
                                                alt={file.name}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        ) : (
                                            <FileText className="w-8 h-8 text-gray-400" />
                                        )}
                                    </div>

                                    {/* Info + Actions (compact) */}
                                    <div className="px-1.5 py-1">
                                        <p className="text-[10px] font-medium text-black truncate" title={file.name}>
                                            {file.name}
                                        </p>
                                        <p className="text-[10px] text-gray-500">{formatFileSize(file.size)}</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex border-t border-gray-200">
                                        <button
                                            onClick={() => handleCopyUrl(file)}
                                            className="flex-1 p-1 text-center hover:bg-brutal-blue hover:text-white transition-colors flex items-center justify-center"
                                            title="คัดลอกลิงก์"
                                        >
                                            {copiedId === file.id ? (
                                                <Check className="w-3 h-3 text-green-600" />
                                            ) : (
                                                <Copy className="w-3 h-3" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file)}
                                            className="flex-1 p-1 text-center border-l border-gray-200 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                                            title="ลบ"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* List View */
                        <div
                            className="bg-white border-[3px] border-black overflow-hidden"
                            style={{ boxShadow: "4px 4px 0 0 #000" }}
                        >
                            {/* Select All Header */}
                            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-100 border-b-[2px] border-black text-xs font-bold text-gray-600 uppercase">
                                <div className="col-span-1 flex items-center">
                                    <button
                                        onClick={selectAll}
                                        className={`w-4 h-4 border-[2px] border-black flex items-center justify-center ${selectedFiles.size === files.length && files.length > 0
                                            ? "bg-brutal-blue text-white"
                                            : "bg-white"
                                            }`}
                                    >
                                        {selectedFiles.size === files.length && files.length > 0 && (
                                            <Check className="w-2.5 h-2.5" />
                                        )}
                                    </button>
                                </div>
                                <div className="col-span-1">Preview</div>
                                <div className="col-span-4">ชื่อไฟล์</div>
                                <div className="col-span-1">ขนาด</div>
                                <div className="col-span-1">ประเภท</div>
                                <div className="col-span-2">วันที่สร้าง</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>

                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors ${selectedFiles.has(file.id) ? "bg-blue-50" : ""
                                        }`}
                                >
                                    <div className="col-span-1 flex items-center">
                                        <button
                                            onClick={() => toggleSelect(file.id)}
                                            className={`w-4 h-4 border-[2px] border-black flex items-center justify-center ${selectedFiles.has(file.id) ? "bg-brutal-blue text-white" : "bg-white"
                                                }`}
                                        >
                                            {selectedFiles.has(file.id) && <Check className="w-2.5 h-2.5" />}
                                        </button>
                                    </div>
                                    <div className="col-span-1">
                                        <div className="w-10 h-10 border-[2px] border-black bg-gray-100 overflow-hidden flex items-center justify-center">
                                            {isImageMime(file.mimeType) ? (
                                                <img
                                                    src={getThumbnailUrl(file.url, 80, 80)}
                                                    alt={file.name}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            ) : (
                                                <FileText className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-span-4">
                                        <p className="text-sm font-medium text-black truncate" title={file.name}>
                                            {file.name}
                                        </p>
                                    </div>
                                    <div className="col-span-1 text-xs text-gray-600">
                                        {formatFileSize(file.size)}
                                    </div>
                                    <div className="col-span-1 text-xs text-gray-500 truncate" title={file.mimeType}>
                                        {file.mimeType.split("/")[1]}
                                    </div>
                                    <div className="col-span-2 text-xs text-gray-500">
                                        {formatDate(file.createdAt)}
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-1">
                                        <button
                                            onClick={() => handleCopyUrl(file)}
                                            className="p-1.5 bg-white border-[2px] border-black hover:bg-brutal-blue hover:text-white transition-all"
                                            title="คัดลอกลิงก์"
                                            style={{ boxShadow: "1px 1px 0 0 #000" }}
                                        >
                                            {copiedId === file.id ? (
                                                <Check className="w-3 h-3 text-green-600" />
                                            ) : (
                                                <Copy className="w-3 h-3" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setPreviewFile(file)}
                                            className="p-1.5 bg-white border-[2px] border-black hover:bg-gray-100 transition-all"
                                            title="ดูตัวอย่าง"
                                            style={{ boxShadow: "1px 1px 0 0 #000" }}
                                        >
                                            <Eye className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file)}
                                            className="p-1.5 bg-white border-[2px] border-black hover:bg-red-500 hover:text-white transition-all"
                                            title="ลบ"
                                            style={{ boxShadow: "1px 1px 0 0 #000" }}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="px-3 py-1 text-xs bg-white border-[2px] border-black text-black hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                            style={{ boxShadow: "1px 1px 0 0 #000" }}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-black">
                            หน้า {page + 1} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="px-3 py-1 text-xs bg-white border-[2px] border-black text-black hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                            style={{ boxShadow: "1px 1px 0 0 #000" }}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        <span className="text-xs text-gray-500 ml-2">แสดง</span>
                        <select
                            value={pageSize}
                            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                            className="text-xs bg-white border-[2px] border-black px-2 py-1 cursor-pointer"
                        >
                            {PAGE_SIZES.map((s) => (
                                <option key={s} value={s}>{s} ต่อหน้า</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Preview Modal */}
                <AnimatePresence>
                    {previewFile && (
                        <div
                            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4"
                            onClick={() => setPreviewFile(null)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white border-[3px] border-black w-full max-w-3xl overflow-hidden"
                                style={{ boxShadow: "4px 4px 0 0 #000" }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="p-4 border-b-[3px] border-black bg-brutal-blue flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 truncate">
                                        <Eye className="w-5 h-5 flex-shrink-0" />
                                        <span className="truncate">{previewFile.name}</span>
                                    </h3>
                                    <button
                                        onClick={() => setPreviewFile(null)}
                                        className="p-2 bg-white border-[2px] border-black hover:bg-gray-100 transition-colors flex-shrink-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Modal Content */}
                                <div className="p-6">
                                    {/* Preview Image */}
                                    {isImageMime(previewFile.mimeType) ? (
                                        <div className="bg-gray-100 border-[2px] border-black flex items-center justify-center max-h-[50vh] overflow-hidden mb-4">
                                            <img
                                                src={previewFile.url}
                                                alt={previewFile.name}
                                                className="max-w-full max-h-[50vh] object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-gray-100 border-[2px] border-black flex items-center justify-center py-12 mb-4">
                                            <FileText className="w-16 h-16 text-gray-400" />
                                        </div>
                                    )}

                                    {/* File Info */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <div className="bg-gray-50 border-[2px] border-black p-3">
                                            <p className="text-xs text-gray-500 font-bold">ขนาด</p>
                                            <p className="font-medium text-black">{formatFileSize(previewFile.size)}</p>
                                        </div>
                                        <div className="bg-gray-50 border-[2px] border-black p-3">
                                            <p className="text-xs text-gray-500 font-bold">ประเภท</p>
                                            <p className="font-medium text-black">{previewFile.mimeType}</p>
                                        </div>
                                        <div className="bg-gray-50 border-[2px] border-black p-3">
                                            <p className="text-xs text-gray-500 font-bold">สร้างเมื่อ</p>
                                            <p className="font-medium text-black">{formatDate(previewFile.createdAt)}</p>
                                        </div>
                                        <div className="bg-gray-50 border-[2px] border-black p-3">
                                            <p className="text-xs text-gray-500 font-bold">ID</p>
                                            <p className="font-medium text-black truncate" title={previewFile.id}>{previewFile.id}</p>
                                        </div>
                                    </div>

                                    {/* URL */}
                                    <div className="mt-4 bg-gray-50 border-[2px] border-black p-3">
                                        <p className="text-xs text-gray-500 font-bold mb-1">URL</p>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={previewFile.url}
                                                className="flex-1 text-xs bg-white border border-gray-300 px-2 py-1.5 text-gray-700"
                                                onClick={(e) => (e.target as HTMLInputElement).select()}
                                            />
                                            <button
                                                onClick={() => handleCopyUrl(previewFile)}
                                                className="px-3 py-1.5 bg-brutal-blue text-white border-[2px] border-black text-xs font-medium hover:bg-blue-600 transition-all flex items-center gap-1"
                                                style={{ boxShadow: "1px 1px 0 0 #000" }}
                                            >
                                                {copiedId === previewFile.id ? (
                                                    <>
                                                        <Check className="w-3 h-3" /> คัดลอกแล้ว
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3 h-3" /> คัดลอก
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="p-4 border-t-[3px] border-black bg-gray-50 flex justify-between">
                                    <button
                                        onClick={() => handleDelete(previewFile)}
                                        className="px-4 py-2 bg-red-500 text-white border-[2px] border-black text-sm font-medium hover:bg-red-600 transition-all flex items-center gap-1"
                                        style={{ boxShadow: "2px 2px 0 0 #000" }}
                                    >
                                        <Trash2 className="w-4 h-4" /> ลบไฟล์
                                    </button>
                                    <button
                                        onClick={() => setPreviewFile(null)}
                                        className="px-4 py-2 bg-white text-black border-[2px] border-black text-sm font-medium hover:bg-gray-100 transition-all"
                                    >
                                        ปิด
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </AdminLayout>
    );
}
