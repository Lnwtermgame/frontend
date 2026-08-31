import type { SeagmField } from "@/lib/services/product-api";

export interface TopUpOption {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  hasStock?: boolean;
  isPopular?: boolean;
  fields?: SeagmField[];
}

export interface GameDetails {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  shortDescription?: string;
  mainImage: string;
  coverImage?: string;
  category: string;
  developer?: string;
  publisher?: string;
  releaseDate?: string;
  platforms: string[];
  rating?: number;
  ratingCount?: number;
  soldCount?: number;
  screenshots?: string[];
  topUpOptions: TopUpOption[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface PriceSummary {
  subtotal: number;
  fee: number;
  total: number;
  label?: string;
  method?: string;
}

export interface VerificationStatus {
  supported: boolean;
  productName: string;
  optionName: string;
  playerInfo: Record<string, string>;
  price?: number;
}
