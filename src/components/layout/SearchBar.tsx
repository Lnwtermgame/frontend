"use client";

import { SmartSearchBar } from "@/components/search/SmartSearchBar";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  variant?: "header" | "sidebar" | "full";
  placeholder?: string;
}

export default function SearchBar({
  variant = "header",
  placeholder = "ค้นหาเกม...",
}: SearchBarProps) {
  const router = useRouter();

  const handleSearch = (query: string) => {
    router.push(`/games?search=${encodeURIComponent(query)}`);
  };

  // Apply different styles based on variant
  const className =
    variant === "sidebar"
      ? "w-full"
      : variant === "full"
        ? "w-full max-w-3xl mx-auto"
        : "w-full";

  return (
    <SmartSearchBar
      placeholder={placeholder}
      className={className}
      onSearch={handleSearch}
      maxResults={5}
    />
  );
}
