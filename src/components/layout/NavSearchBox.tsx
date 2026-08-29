"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Loader2, X, Gamepad2, Smartphone, CreditCard } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { productApi, Product } from "@/lib/services/product-api";
import { useTranslations } from "next-intl";
import { useOnClickOutside } from "@/lib/hooks/use-on-click-outside";

export function NavSearchBox() {
    const t = useTranslations();
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useOnClickOutside(containerRef as React.RefObject<HTMLDivElement>, () => setIsOpen(false));

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const response = await productApi.getProducts({
                    isActive: true,
                    limit: 50,
                });
                if (response.success) {
                    setProducts(response.data);
                }
            } catch (error) {
                console.error("Failed to load products for search", error);
            } finally {
                setLoading(false);
            }
        };

        // Only fetch once when opened for the first time
        if (isOpen && products.length === 0 && !loading) {
            fetchProducts();
        }
    }, [isOpen, products.length, loading]);

    const filteredProducts = useMemo(() => {
        if (!query.trim()) return products;
        const lowerQuery = query.toLowerCase();
        return products.filter((p) =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.category?.name.toLowerCase().includes(lowerQuery)
        );
    }, [products, query]);

    // Derived lists
    const popularGames = useMemo(() => {
        return filteredProducts
            .filter((p) => p.productType === "DIRECT_TOPUP" || p.productType === "CARD")
            .slice(0, 8);
    }, [filteredProducts]);

    const gameProducts = useMemo(() => {
        return filteredProducts.filter((p) => p.productType === "DIRECT_TOPUP" || p.productType === "CARD");
    }, [filteredProducts]);

    const mobileProducts = useMemo(() => {
        return filteredProducts.filter((p) => p.productType === "MOBILE_RECHARGE");
    }, [filteredProducts]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/games?search=${encodeURIComponent(query)}`);
            setIsOpen(false);
        }
    };

    const clearQuery = () => {
        setQuery("");
        inputRef.current?.focus();
    };

    const renderProductImage = (product: Product, size: "sm" | "md" = "md") => {
        const sizeClasses = size === "md" ? "w-10 h-10 rounded-8" : "w-8 h-8 rounded-6";

        if (product.imageUrl || product.images?.[0]?.url) {
            return (
                <div className={`${sizeClasses} bg-site-bg overflow-hidden flex-shrink-0 border border-site-border-soft`}>
                    <img
                        src={product.imageUrl || product.images?.[0]?.url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                            if (e.currentTarget.nextElementSibling) {
                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = "flex";
                            }
                        }}
                    />
                    <div className="w-full h-full hidden items-center justify-center bg-site-surface text-site-dim font-bold text-xs">
                        {product.name.charAt(0).toUpperCase()}
                    </div>
                </div>
            );
        }

        return (
            <div className={`${sizeClasses} bg-site-surface flex items-center justify-center flex-shrink-0 border border-site-border-soft text-site-dim font-bold text-xs`}>
                {product.name.charAt(0).toUpperCase()}
            </div>
        );
    };

    return (
        <div className="relative flex-1 max-w-[500px]" ref={containerRef}>
            <form onSubmit={handleSearch} className="relative group w-full">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={t("Header.search_placeholder") || "Search for games, cards..."}
                    className="bg-site-surface border border-site-border-soft focus:border-site-accent/60 outline-none text-site-text text-[13px] pl-10 pr-9 py-2.5 w-[220px] xl:w-[280px] focus:w-full rounded-8 transition-all duration-300 placeholder:text-site-dim"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onClick={() => setIsOpen(true)}
                />
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-site-dim group-focus-within:text-site-accent transition-colors" />

                {query && (
                    <button
                        type="button"
                        onClick={clearQuery}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-site-dim hover:text-site-text"
                    >
                        <X size={14} />
                    </button>
                )}
            </form>

            {/* Expanded Dropdown Window */}
            {isOpen && (
                <div className="absolute top-[calc(100%+12px)] right-0 w-[760px] max-w-[calc(100vw-32px)] bg-site-surface/95 border border-site-border rounded-8 overflow-hidden z-[100] hidden md:flex max-h-[480px]">

                    {loading ? (
                        <div className="w-full flex items-center justify-center p-12">
                            <Loader2 className="w-8 h-8 text-site-accent animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Left Column: Popular Games */}
                            <div className="w-[55%] p-5 border-r border-site-border-soft bg-site-bg flex flex-col">
                                <h3 className="text-site-dim font-bold text-[11px] mb-4 uppercase tracking-[0.1em] flex items-center gap-2">
                                    <Gamepad2 size={14} className="text-site-accent" /> Popular Games
                                </h3>

                                <div className="flex-1 overflow-y-auto pr-2 pb-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                                    {popularGames.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 pb-2">
                                            {popularGames.map((game) => (
                                                <Link
                                                    href={`/games/${game.slug || game.id}`}
                                                    key={game.id}
                                                    onClick={() => setIsOpen(false)}
                                                    className="flex items-center gap-3 p-2 rounded-8 hover:bg-site-raised transition-all duration-200 group border border-transparent hover:border-site-border-soft"
                                                >
                                                    {renderProductImage(game, "md")}
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-site-text text-[12px] font-bold line-clamp-1 group-hover:text-site-accent transition-colors">
                                                            {game.name}
                                                        </span>
                                                        {game.category?.name && (
                                                            <span className="text-site-dim text-[10px] truncate">{game.category.name}</span>
                                                        )}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-site-muted text-sm py-4">No popular games found.</p>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: ALL Results */}
                            <div className="w-[45%] bg-site-bg p-5 flex flex-col">
                                <div className="flex-1 overflow-y-auto pr-3 space-y-5 pb-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-site-border hover:[&::-webkit-scrollbar-thumb]:bg-site-muted [&::-webkit-scrollbar-thumb]:rounded-full">

                                    {/* Games & Cards Section */}
                                    {gameProducts.length > 0 && (
                                        <div>
                                            <h3 className="text-site-dim font-bold text-[11px] mb-3 uppercase tracking-[0.1em] flex items-center gap-2 sticky top-0 bg-site-bg/95 py-1 z-10">
                                                <CreditCard size={14} className="text-status-info" /> Games & Cards
                                            </h3>
                                            <div className="space-y-1">
                                                {gameProducts.map((game) => (
                                                    <Link
                                                        href={`/games/${game.slug || game.id}`}
                                                        key={game.id}
                                                        onClick={() => setIsOpen(false)}
                                                        className="flex items-center gap-3 p-2 rounded-8 hover:bg-site-raised transition-colors group"
                                                    >
                                                        {renderProductImage(game, "sm")}
                                                        <span className="text-site-muted hover:text-site-text text-[12px] font-medium line-clamp-1 group-hover:text-site-text transition-colors">
                                                            {game.name}
                                                        </span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Mobile Topup Section */}
                                    {mobileProducts.length > 0 && (
                                        <div>
                                            <h3 className="text-site-dim font-bold text-[11px] mb-3 uppercase tracking-[0.1em] flex items-center gap-2 sticky top-0 bg-site-bg/95 py-1 z-10">
                                                <Smartphone size={14} className="text-status-success" /> Mobile Recharge
                                            </h3>
                                            <div className="space-y-1">
                                                {mobileProducts.map((mobile) => (
                                                    <Link
                                                        href={`/games/${mobile.slug || mobile.id}`}
                                                        key={mobile.id}
                                                        onClick={() => setIsOpen(false)}
                                                        className="flex items-center gap-3 p-2 rounded-8 hover:bg-site-raised transition-colors group"
                                                    >
                                                        {renderProductImage(mobile, "sm")}
                                                        <span className="text-site-muted hover:text-site-text text-[12px] font-medium line-clamp-1 group-hover:text-site-text transition-colors">
                                                            {mobile.name}
                                                        </span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {gameProducts.length === 0 && mobileProducts.length === 0 && (
                                        <p className="text-site-muted text-sm py-4">No results found for &quot;{query}&quot;.</p>
                                    )}
                                </div>

                                {/* View All Button */}
                                {query && (
                                    <div className="pt-4 mt-auto border-t border-site-border-soft">
                                        <button
                                            type="button"
                                            onClick={() => handleSearch({ preventDefault: () => { } } as any)}
                                            className="w-full py-2 bg-site-accent/10 text-site-accent hover:bg-site-accent hover:text-site-bg transition-colors rounded-6 text-[12px] font-bold"
                                        >
                                            View All Results
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
