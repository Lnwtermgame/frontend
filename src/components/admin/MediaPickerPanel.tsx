"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import {
    Search,
    Image,
    Youtube,
    ImagePlus,
    X,
    Loader2,
    RefreshCw,
    Check,
} from "lucide-react";
import type { DDGImageResult } from "@/lib/services/ai-api";

interface MediaPickerPanelProps {
    images: DDGImageResult[];
    videos: { videoId: string; title: string; url: string }[];
    isSearching: boolean;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    onSearch: () => void;
    onSetCoverImage: (url: string) => void;
    onInsertImage: (url: string, alt: string) => void;
    onInsertVideo: (videoId: string, title: string) => void;
    currentCoverImage?: string;
}

export default function MediaPickerPanel({
    images,
    videos,
    isSearching,
    searchQuery,
    onSearchQueryChange,
    onSearch,
    onSetCoverImage,
    onInsertImage,
    onInsertVideo,
    currentCoverImage,
}: MediaPickerPanelProps) {
    const [activeTab, setActiveTab] = useState<"images" | "videos">("images");
    const [insertedImages, setInsertedImages] = useState<Set<string>>(new Set());
    const [insertedVideos, setInsertedVideos] = useState<Set<string>>(new Set());
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

    const hasContent = images.length > 0 || videos.length > 0;

    if (!hasContent && !isSearching) return null;

    const handleInsertImage = (url: string, alt: string) => {
        onInsertImage(url, alt);
        setInsertedImages((prev) => new Set(prev).add(url));
    };

    const handleInsertVideo = (videoId: string, title: string) => {
        onInsertVideo(videoId, title);
        setInsertedVideos((prev) => new Set(prev).add(videoId));
    };

    const handleImageError = (url: string) => {
        setFailedImages((prev) => new Set(prev).add(url));
    };

    const validImages = images.filter((img) => !failedImages.has(img.image));

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-site-raised border border-site-border/30 rounded-[12px] overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-site-border/30">
                <div className="flex items-center gap-2">
                    <ImagePlus className="w-4 h-4 text-site-accent" />
                    <span className="text-sm font-medium text-white">
                        สื่อประกอบบทความ
                    </span>
                    <span className="text-[10px] text-gray-500">
                        ({validImages.length} รูป, {videos.length} วิดีโอ)
                    </span>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab("images")}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${activeTab === "images"
                                ? "bg-site-accent/20 text-site-accent border border-site-accent/30"
                                : "text-gray-400 hover:text-white hover:bg-site-raised"
                            }`}
                    >
                        <Image className="w-3 h-3 inline mr-1" />
                        รูปภาพ ({validImages.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("videos")}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${activeTab === "videos"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "text-gray-400 hover:text-white hover:bg-site-raised"
                            }`}
                    >
                        <Youtube className="w-3 h-3 inline mr-1" />
                        YouTube ({videos.length})
                    </button>
                </div>
            </div>

            {/* Search bar */}
            <div className="p-3 border-b border-site-border/20">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 w-3 h-3" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchQueryChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    onSearch();
                                }
                            }}
                            placeholder="ค้นหารูปภาพ / วิดีโอ..."
                            className="w-full py-1.5 pl-7 pr-3 bg-site-raised border border-site-border/30 rounded-lg text-white text-xs placeholder-gray-500 focus:outline-none focus:border-site-accent/50"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={onSearch}
                        disabled={isSearching || !searchQuery.trim()}
                        className="px-3 py-1.5 bg-site-accent/10 text-site-accent border border-site-accent/30 rounded-lg text-xs font-medium hover:bg-site-accent/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                        {isSearching ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <RefreshCw className="w-3 h-3" />
                        )}
                        ค้นหา
                    </button>
                </div>
            </div>

            {/* Loading state */}
            {isSearching && (
                <div className="py-8 flex flex-col items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-site-accent mb-2" />
                    <p className="text-xs text-gray-400">กำลังค้นหาสื่อ...</p>
                </div>
            )}

            {/* Content */}
            {!isSearching && (
                <div className="p-3">
                    <AnimatePresence mode="wait">
                        {/* Images tab */}
                        {activeTab === "images" && (
                            <motion.div
                                key="images"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {validImages.length === 0 ? (
                                    <div className="py-6 text-center">
                                        <Image className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                                        <p className="text-xs text-gray-500">
                                            ไม่พบรูปภาพ ลองค้นหาด้วยคำอื่น
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                        {validImages.map((img, idx) => {
                                            const isCover = currentCoverImage === img.image;
                                            const isInserted = insertedImages.has(img.image);
                                            return (
                                                <div
                                                    key={`img-${idx}`}
                                                    className={`group relative rounded-lg overflow-hidden border transition-all ${isCover
                                                            ? "border-green-500/50 ring-1 ring-green-500/30"
                                                            : "border-site-border/20 hover:border-site-accent/30"
                                                        }`}
                                                >
                                                    {/* Thumbnail */}
                                                    <div className="aspect-video bg-site-raised">
                                                        <img
                                                            src={img.thumbnail || img.image}
                                                            alt={img.title || `Image ${idx + 1}`}
                                                            className="w-full h-full object-cover"
                                                            loading="lazy"
                                                            onError={() => handleImageError(img.image)}
                                                        />
                                                    </div>

                                                    {/* Overlay badges */}
                                                    {isCover && (
                                                        <div className="absolute top-1 left-1 bg-green-500/90 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
                                                            ✓ รูปปก
                                                        </div>
                                                    )}
                                                    {isInserted && !isCover && (
                                                        <div className="absolute top-1 left-1 bg-site-accent/90 text-white text-[9px] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                                                            <Check className="w-2.5 h-2.5" />
                                                            แทรกแล้ว
                                                        </div>
                                                    )}

                                                    {/* Hover actions */}
                                                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => onSetCoverImage(img.image)}
                                                            className="w-full py-1 text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors"
                                                        >
                                                            📷 ใช้เป็นรูปปก
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleInsertImage(
                                                                    img.image,
                                                                    img.title || "image"
                                                                )
                                                            }
                                                            className="w-full py-1 text-[10px] font-medium bg-site-accent/20 text-site-accent border border-site-accent/30 rounded hover:bg-site-accent/30 transition-colors"
                                                        >
                                                            📝 แทรกในเนื้อหา
                                                        </button>
                                                    </div>

                                                    {/* Title */}
                                                    <div className="p-1">
                                                        <p className="text-[9px] text-gray-500 truncate">
                                                            {img.title || img.source || `Image ${idx + 1}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Videos tab */}
                        {activeTab === "videos" && (
                            <motion.div
                                key="videos"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {videos.length === 0 ? (
                                    <div className="py-6 text-center">
                                        <Youtube className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                                        <p className="text-xs text-gray-500">
                                            ไม่พบวิดีโอ YouTube ลองค้นหาด้วยคำอื่น
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {videos.map((video, idx) => {
                                            const isInserted = insertedVideos.has(video.videoId);
                                            return (
                                                <div
                                                    key={`vid-${idx}`}
                                                    className={`group relative rounded-lg overflow-hidden border transition-all ${isInserted
                                                            ? "border-red-500/30 ring-1 ring-red-500/20"
                                                            : "border-site-border/20 hover:border-red-500/30"
                                                        }`}
                                                >
                                                    {/* YouTube thumbnail */}
                                                    <div className="aspect-video bg-site-raised relative">
                                                        <img
                                                            src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                                                            alt={video.title}
                                                            className="w-full h-full object-cover"
                                                            loading="lazy"
                                                        />
                                                        {/* Play icon overlay */}
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            <div className="w-8 h-8 bg-red-600/90 rounded-full flex items-center justify-center">
                                                                <svg
                                                                    viewBox="0 0 24 24"
                                                                    className="w-4 h-4 text-white ml-0.5"
                                                                    fill="currentColor"
                                                                >
                                                                    <path d="M8 5v14l11-7z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Inserted badge */}
                                                    {isInserted && (
                                                        <div className="absolute top-1 left-1 bg-red-500/90 text-white text-[9px] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                                                            <Check className="w-2.5 h-2.5" />
                                                            แทรกแล้ว
                                                        </div>
                                                    )}

                                                    {/* Hover actions */}
                                                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleInsertVideo(video.videoId, video.title)
                                                            }
                                                            className="w-full py-1.5 text-[10px] font-medium bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors"
                                                        >
                                                            📝 แทรกในเนื้อหา
                                                        </button>
                                                        <a
                                                            href={video.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-full py-1.5 text-[10px] font-medium text-center bg-site-raised text-gray-300 border border-site-border/30 rounded hover:bg-[#2a2d33] transition-colors"
                                                        >
                                                            🔗 ดูบน YouTube
                                                        </a>
                                                    </div>

                                                    {/* Title */}
                                                    <div className="p-1.5">
                                                        <p className="text-[10px] text-gray-400 line-clamp-2 leading-tight">
                                                            {video.title || `Video ${idx + 1}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
}
