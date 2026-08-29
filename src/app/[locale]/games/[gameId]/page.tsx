"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/use-auth";
import { orderApi } from "@/lib/services/order-api";
import { paymentApi, PaymentMethodOption } from "@/lib/services/payment-api";
import {
  ChevronLeft,
  ShoppingCart,
  Heart,
  Share2,
  Package,
  Award,
  Clock,
  Calendar,
  Smartphone,
  Info,
  DollarSign,
  AlertCircle,
  Check,
  AlertTriangle,
  X,
  User,
  ShieldAlert,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import ProductDescription from "@/components/products/ProductDescription";
import { PackageOption, type PackageOptionData } from "@/components/products/PackageOption";
import { formatTHB } from "@/lib/format";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { CountryFlag, getCountryFlagCode } from "@/components/ui/country-flag";
import {
  productApi,
  Product,
  ProductType,
  SeagmField,
} from "@/lib/services/product-api";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Grid } from "@/components/ui/Grid";
import { Sheet } from "@/components/ui/Sheet";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslations } from "next-intl";

// Game details interface matching the UI expectations
interface GameDetails {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  mainImage: string;
  coverImage?: string;
  category: string;
  developer?: string;
  publisher?: string;
  releaseDate?: string;
  platforms: string[];
  screenshots?: string[];
  topUpOptions: TopUpOption[];
  relatedGames: string[];
  features?: string[];
  mode?: "directtopup" | "card";
  // Product table fields
  shortDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isFeatured?: boolean;
  isBestseller?: boolean;
  salesCount?: number;
  viewCount?: number;
}

interface TopUpOption {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  isPopular?: boolean;
  fields?: SeagmField[];
}

// Helper function to transform Product to GameDetails
function transformProductToGameDetails(
  product: Product,
  productTypes: ProductType[],
): GameDetails {
  // Map product types to topUpOptions (if available)
  const topUpOptions: TopUpOption[] = productTypes.map(
    (type: ProductType) => ({
      id: type.id,
      title: type.name,
      price: type.displayPrice,
      originalPrice: type.originPrice || type.displayPrice,
      fields: type.fields,
    }),
  );

  // Use game_details from Product table if available
  const gameDetails = product.gameDetails;

  return {
    id: product.id,
    title: product.name,
    description:
      product.shortDescription ||
      product.description ||
      `Top up ${product.name} instantly.`,
    longDescription:
      product.description ||
      `${product.name} offers a convenient way to purchase in-game currency and items.`,
    mainImage:
      product.imageUrl ||
      "/images/placeholder-game.svg",
    coverImage: product.coverImageUrl,
    category:
      product.category?.name ||
      (product.productType === "DIRECT_TOPUP" ? "Direct Top Up" : "Gift Card"),
    developer: gameDetails?.developer || product.category?.name || "Unknown",
    publisher: gameDetails?.publisher || "Unknown",
    platforms: gameDetails?.platforms?.length
      ? gameDetails.platforms
      : ["iOS", "Android"],
    screenshots: product.images?.map((img) => img.url) || [],
    topUpOptions: topUpOptions.length > 0 ? topUpOptions : [],
    relatedGames: [],
    features: ["Instant Delivery", "Secure Payment", "24/7 Support"],
    mode: product.productType === "DIRECT_TOPUP" ? "directtopup" : "card",
    // Product table fields
    shortDescription: product.shortDescription,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    metaKeywords: product.metaKeywords,
    isFeatured: product.isFeatured,
    isBestseller: product.isBestseller,
    salesCount: product.salesCount,
    viewCount: product.viewCount,
  };
}

export default function GameDetailsPage() {
  const t = useTranslations("ProductDetail");
  const tCommon = useTranslations("Common");
  const params = useParams<{
    gameId?: string;
    cardId?: string;
    slug?: string;
  }>();
  const isCardRoute = typeof params.cardId === "string";
  const isMobileRechargeRoute =
    typeof params.slug === "string" && typeof params.gameId !== "string";
  const productSlug =
    typeof params.gameId === "string"
      ? params.gameId
      : typeof params.cardId === "string"
        ? params.cardId
        : typeof params.slug === "string"
          ? params.slug
          : null;
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAuth();
  const [game, setGame] = useState<GameDetails | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("topup");
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [paymentOptions, setPaymentOptions] = useState<PaymentMethodOption[]>(
    [],
  );
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<
    string | null
  >(null);
  const [isPaymentSelectOpen, setIsPaymentSelectOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    supported: boolean;
    productName: string;
    optionName: string;
    playerInfo: Record<string, string>;
    price?: number;
  } | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [mobilePhoneNumber, setMobilePhoneNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [similarGames, setSimilarGames] = useState<Product[]>([]);
  const [relatedGamesByDev, setRelatedGamesByDev] = useState<Product[]>([]);
  const [isBuying, setIsBuying] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const confirmDialogRef = useRef<HTMLDivElement>(null);
  const paymentDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(confirmDialogRef, showConfirmModal);
  useFocusTrap(paymentDialogRef, isPaymentSelectOpen);

  // Confirmation modal: escape-key close + body scroll lock + initial focus
  useEffect(() => {
    if (!showConfirmModal) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowConfirmModal(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmDialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [showConfirmModal]);

  // Payment selection modal: escape-key close + body scroll lock + initial focus
  useEffect(() => {
    if (!isPaymentSelectOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsPaymentSelectOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    paymentDialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isPaymentSelectOpen]);

  // Field label translation map
  const FIELD_LABEL_MAP: Record<string, string> = {
    "Player ID": "Player ID",
    "User ID": "User ID",
    "Server ID": "Server ID",
    "Zone ID": "Zone ID",
    "Role Name": "Role Name",
    "Character Name": "Character Name",
    "Character ID": "Character ID",
    Region: "Region",
    Email: "Email",
    Phone: "Phone",
    "Riot ID": "Riot ID",
    Tag: "Tag",
  };

  const translateLabel = (label: string) => {
    return FIELD_LABEL_MAP[label] || label;
  };

  const backHref = isCardRoute
    ? "/card"
    : isMobileRechargeRoute
      ? "/mobile-recharge"
      : "/games";
  const backLabel = t("back");
  const optionsTabLabel = t("topup_options");
  const infoTabLabel = t("game_info");
  const purchaseTitle = t("purchase_summary");

  const selectedTopUp = useMemo(() => {
    if (!selectedOption || !game) return null;
    return game.topUpOptions.find((opt) => opt.id === selectedOption) || null;
  }, [selectedOption, game]);

  const priceSummary = useMemo(() => {
    const base = selectedTopUp?.price || 0;
    if (!selectedPaymentOption) return { base, fee: 0, total: base };
    const opt = paymentOptions.find((o) => o.code === selectedPaymentOption);
    if (!opt) return { base, fee: 0, total: base };
    const percent = Number(opt.surchargePercent || 0) / 100;
    const flat = Number(opt.flatFee || 0);
    const fee = base * percent + flat;
    return {
      base,
      fee,
      total: base + fee,
      label: opt.label,
      method: opt.method,
    };
  }, [selectedPaymentOption, paymentOptions, selectedTopUp]);

  // TrueWallet minimum amount constraint ( FeelFreePay requirement )
  const TRUEMONEY_MIN_AMOUNT = 20;

  // Check if a payment method is available for the current amount
  const isPaymentMethodAvailable = (method: string, totalAmount: number) => {
    if (method === "TRUEMONEY" && totalAmount < TRUEMONEY_MIN_AMOUNT) {
      return false;
    }
    return true;
  };

  // Get unavailable reason for display
  const getPaymentMethodUnavailableReason = (method: string, totalAmount: number) => {
    if (method === "TRUEMONEY" && totalAmount < TRUEMONEY_MIN_AMOUNT) {
      return t("error.truemoney_minimum", { amount: TRUEMONEY_MIN_AMOUNT });
    }
    return null;
  };

  const copyText = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error(t("copy_link_failed"));
    }
  };

  // Fetch payment methods (PromptPay default)
  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      setPaymentOptions([]);
      setSelectedPaymentOption(null);
      return;
    }

    const loadMethods = async () => {
      try {
        const res = await paymentApi.getMethods();
        if (res.success) {
          setPaymentOptions(res.data);
          setSelectedPaymentOption((prev) => {
            if (prev || res.data.length === 0) return prev;
            const defaultPromptpay =
              res.data.find((m) => m.method === "PROMPTPAY") || res.data[0];
            return defaultPromptpay.code;
          });
        }
      } catch (err) {
        console.error("Load payment methods failed", err);
      }
    };

    loadMethods();
  }, [isInitialized, isAuthenticated]);

  // Reset selected payment option if it becomes unavailable (e.g., TrueWallet below minimum)
  useEffect(() => {
    if (!selectedPaymentOption || paymentOptions.length === 0) return;

    const selectedOpt = paymentOptions.find((o) => o.code === selectedPaymentOption);
    if (!selectedOpt) return;

    const totalAmount = priceSummary.total;
    if (!isPaymentMethodAvailable(selectedOpt.method, totalAmount)) {
      // Find an available alternative (prefer PromptPay)
      const alternative = paymentOptions.find(
        (o) => isPaymentMethodAvailable(o.method, totalAmount)
      );
      if (alternative) {
        setSelectedPaymentOption(alternative.code);
        toast(
          t("error.truemoney_minimum", { amount: TRUEMONEY_MIN_AMOUNT })
        );
      } else {
        setSelectedPaymentOption(null);
      }
    }
  }, [priceSummary.total, selectedPaymentOption, paymentOptions]);

  const buildPlayerInfo = (): Record<string, string> => {
    const info = { ...fieldValues };

    if (isMobileRechargeRoute) {
      const phoneCandidate =
        mobilePhoneNumber ||
        info.Phone ||
        info.phone ||
        info["User ID"] ||
        info["userId"] ||
        "";
      const normalizedPhone = phoneCandidate.trim();

      if (normalizedPhone) {
        info.Phone = normalizedPhone;
        info.phone = normalizedPhone;
        info["User ID"] = normalizedPhone;
      }
    }

    return info;
  };

  const getNormalizedMobilePhone = (): string =>
    (
      mobilePhoneNumber ||
      fieldValues.Phone ||
      fieldValues.phone ||
      fieldValues["User ID"] ||
      ""
    ).trim();

  const handleBuyNow = async () => {
    if (!product || !selectedOption) {
      toast.error(t("error.select_option"));
      return;
    }

    // Check if user is logged in before allowing purchase
    if (!isAuthenticated) {
      toast.error(t("error.login_required"), { duration: 3000 });
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Check if selected payment method is available for the current amount
    if (selectedPaymentOption) {
      const selectedOpt = paymentOptions.find((o) => o.code === selectedPaymentOption);
      if (selectedOpt && !isPaymentMethodAvailable(selectedOpt.method, priceSummary.total)) {
        const reason = getPaymentMethodUnavailableReason(selectedOpt.method, priceSummary.total);
        toast.error(reason || t("error.payment_method_unavailable"));
        return;
      }
    }

    // Check if all required fields are filled
    const selectedProductType = productTypes.find(
      (pt) => pt.id === selectedOption,
    );

    if (isMobileRechargeRoute) {
      const normalizedPhone = getNormalizedMobilePhone();

      if (!normalizedPhone) {
        toast.error(t("error.enter_phone"));
        return;
      }

      if (normalizedPhone.length < 9) {
        toast.error(t("error.invalid_phone"));
        return;
      }
    }

    if (selectedProductType?.fields) {
      const requiredFields = selectedProductType.fields.filter(
        (f) => f.required !== false,
      );
      const missingFields = requiredFields.filter(
        (f) => !fieldValues[f.name] || fieldValues[f.name].trim() === "",
      );
      if (missingFields.length > 0) {
        toast.error(
          t("error.fill_all_fields", {
            fields: missingFields
              .map((f) => translateLabel(f.label))
              .join(", "),
          }),
        );
        return;
      }
    }

    setShowConfirmModal(true);
    setTermsAccepted(false); // Reset acceptance state when opening
    setVerificationStatus({
      supported: true,
      productName: game?.title || product?.name || "",
      optionName: selectedTopUp?.title || "",
      playerInfo: buildPlayerInfo(),
      price: selectedTopUp?.price || priceSummary.total,
    });
  };

  const startPaymentFlow = async (
    orderId: string,
    paymentOptionCode?: string,
  ): Promise<boolean> => {
    try {
      // Use createIntent for all payment types (QR, LinePay, TrueMoney)
      const res = await paymentApi.createIntent(orderId, paymentOptionCode);
      if (!res.success) {
        toast.error(t("error.payment_failed"));
        return false;
      }

      const { qrCodeUrl, paymentFormHtml, redirectUrl, referenceNo } = res.data;

      // Handle redirect payments (LinePay, TrueMoney)
      // Backend returns HTML form that auto-submits to payment page
      if (paymentFormHtml) {
        // Safely parse payment form HTML — avoid raw innerHTML XSS
        const parser = new DOMParser();
        const doc = parser.parseFromString(paymentFormHtml, "text/html");
        const parsedForm = doc.querySelector("form");
        if (!parsedForm) {
          toast.error(t("error.payment_failed"));
          return false;
        }

        // Reconstruct form with only safe attributes (action, method, hidden inputs)
        const form = document.createElement("form");
        form.method = parsedForm.getAttribute("method") || "POST";
        form.action = parsedForm.getAttribute("action") || "";
        parsedForm.querySelectorAll('input[type="hidden"]').forEach((input) => {
          const safeInput = document.createElement("input");
          safeInput.type = "hidden";
          safeInput.name = input.getAttribute("name") || "";
          safeInput.value = input.getAttribute("value") || "";
          form.appendChild(safeInput);
        });
        document.body.appendChild(form);
        form.submit();
        return true;
      }

      // Handle direct redirect URL
      if (redirectUrl) {
        window.open(redirectUrl, "_blank");
        return true;
      }

      // Handle QR URL directly inline without popup
      if (qrCodeUrl) {
        // Store QR data in sessionStorage (too large for URL params - causes HTTP 431)
        sessionStorage.setItem(`qr_${orderId}`, qrCodeUrl);
        router.push(
          `/payments/pending?orderId=${orderId}&referenceNo=${referenceNo}`,
        );
        return true;
      }

      toast.error(t("error.no_payment_link"));
      return false;
    } catch (err) {
      console.error("Payment flow error", err);
      toast.error(t("error.payment_error"));
      return false;
    }
  };

  // Create order after confirmation
  const createOrder = async () => {
    if (!product || !selectedOption) return;

    try {
      setIsBuying(true);
      toast.loading(tCommon("loading"));

      const playerInfo = buildPlayerInfo();
      const paymentOptionCode = selectedPaymentOption || undefined;

      // Map the selected option code to its base payment method category
      const selectedOptionObj = paymentOptions.find(
        (opt) => opt.code === selectedPaymentOption
      );
      const paymentMethod = selectedOptionObj ? selectedOptionObj.method : "PROMPTPAY";

      const response = await orderApi.createOrder({
        items: [
          {
            productId: product.id,
            productTypeId: selectedOption,
            quantity: 1,
            playerInfo,
          },
        ],
        paymentMethod,
        paymentOptionCode,
      });

      toast.dismiss();

      if (response.success) {
        toast.success(t("error.order_success_redirect"));
        setShowConfirmModal(false);
        setIsPaymentSelectOpen(false);
        await startPaymentFlow(response.data.id, paymentOptionCode);
      } else {
        toast.error(response.message || tCommon("error_occurred"));
      }
    } catch (err: any) {
      toast.dismiss();
      console.error("Create order error:", err);

      const errorMessage = err?.response?.data?.error?.message || "";
      const errorCode =
        err?.response?.data?.error?.details?.infoCode ||
        err?.response?.data?.error?.infoCode;

      if (
        errorMessage.includes("Player verification failed") ||
        errorCode === 20133 ||
        errorCode === 20093
      ) {
        toast.error(
          t("error.player_id_invalid", {
            defaultMessage:
              "User ID or Zone ID is invalid. Please check your game account.",
          }),
          { duration: 5000 },
        );
      } else if (
        errorCode === 20114 ||
        /phone number.*region.*match/i.test(errorMessage)
      ) {
        toast.error(
          t("error.phone_region_mismatch", {
            defaultMessage:
              "Phone number does not match the selected region. Please check your number or selection.",
          }),
          { duration: 5000 },
        );
      } else {
        toast.error(errorMessage || tCommon("error_occurred"), {
          duration: 5000,
        });
      }
    } finally {
      setIsBuying(false);
    }
  };

  // Handle share/copy link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success(t("copy_link_success"));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(t("copy_link_failed"));
    }
  };

  // Handle field value changes
  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
    if (
      isMobileRechargeRoute &&
      ["phone", "Phone", "User ID"].includes(fieldName)
    ) {
      setMobilePhoneNumber(value);
    }
  };

  // Handle favorite toggle
  const handleToggleFavorite = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      toast.error(t("error.login_required"), { duration: 3000 });
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    try {
      if (isFavorite && favoriteId) {
        await productApi.removeFavorite(favoriteId);
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        try {
          await productApi.addFavorite(product.id);
          setIsFavorite(true);
          const favId = await productApi.findFavoriteId(product.id);
          setFavoriteId(favId);
        } catch (addErr: any) {
          if (addErr?.response?.data?.error?.code === "ALREADY_EXISTS") {
            setIsFavorite(true);
            const favId = await productApi.findFavoriteId(product.id);
            setFavoriteId(favId);
          } else {
            throw addErr;
          }
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const isValidDatabaseId = (id: string): boolean => {
    const cuidPattern = /^c[a-z0-9]{24,}$/i;
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return cuidPattern.test(id) || uuidPattern.test(id);
  };

  // Load game details
  useEffect(() => {
    if (typeof productSlug !== "string") return;

    const fetchGameDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        let productResponse;
        if (isValidDatabaseId(productSlug)) {
          productResponse = await productApi.getProductById(productSlug);
        } else {
          productResponse = await productApi.getProductBySlug(productSlug);
        }

        if (!productResponse.success || !productResponse.data) {
          throw new Error("Product not found");
        }

        const productData = productResponse.data;
        const productTypeNormalized =
          (productData.productType as string | undefined) || "DIRECT_TOPUP";
        setProduct(productData);

        let typesData: ProductType[] = [];
        if (productData.types && productData.types.length > 0) {
          typesData = productData.types;
        }

        setProductTypes(typesData);
        const gameData = transformProductToGameDetails(productData, typesData);
        setGame(gameData);

        if (gameData.topUpOptions.length > 0) {
          const popularOption = gameData.topUpOptions.find(
            (option) => option.isPopular,
          );
          setSelectedOption(
            popularOption ? popularOption.id : gameData.topUpOptions[0].id,
          );
        }

        try {
          const allGamesResponse = await productApi.getProducts({
            isActive: true,
            limit: 50,
          });

          if (allGamesResponse.success) {
            const otherGames = allGamesResponse.data.filter((p) => {
              const pType =
                (p.productType as string | undefined) || "DIRECT_TOPUP";
              return p.id !== productData.id && pType === productTypeNormalized;
            });
            setSimilarGames(otherGames.slice(0, 5));

            const currentGameDetails = productData.gameDetails;
            const currentDev = currentGameDetails?.developer;
            const currentPub = currentGameDetails?.publisher;

            if (currentDev || currentPub) {
              const related = allGamesResponse.data.filter((p) => {
                if (p.id === productData.id) return false;
                const pDetails = p.gameDetails;
                return (
                  (currentDev && pDetails?.developer === currentDev) ||
                  (currentPub && pDetails?.publisher === currentPub)
                );
              });
              setRelatedGamesByDev(related.slice(0, 4));
            }
          }
        } catch {
          // Ignore recommendations errors
        }
      } catch (err) {
        console.error("Error fetching game:", err);
        setError(productApi.getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchGameDetails();
  }, [productSlug]);

  useEffect(() => {
    if (!product?.id || !isAuthenticated) {
      setIsFavorite(false);
      setFavoriteId(null);
      return;
    }

    let cancelled = false;
    const checkFavorite = async () => {
      try {
        const isFav = await productApi.checkIsFavorite(product.id);
        if (cancelled) return;
        setIsFavorite(isFav);
        if (isFav) {
          const favId = await productApi.findFavoriteId(product.id);
          if (!cancelled) setFavoriteId(favId);
        } else {
          setFavoriteId(null);
        }
      } catch {
        if (!cancelled) {
          setIsFavorite(false);
          setFavoriteId(null);
        }
      }
    };
    checkFavorite();
    return () => {
      cancelled = true;
    };
  }, [product?.id, isAuthenticated]);

  // Client-side document title + meta description for SEO
  // IMPORTANT: This hook must be BEFORE any early returns to satisfy Rules of Hooks
  useEffect(() => {
    if (!game) return;
    const metaTitle = game.metaTitle || game.title;
    document.title = `${metaTitle} | Lnwtermgame`;

    const metaDesc =
      game.metaDescription || game.shortDescription || game.description;
    let descTag = document.querySelector('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement("meta");
      descTag.setAttribute("name", "description");
      document.head.appendChild(descTag);
    }
    descTag.setAttribute("content", metaDesc);
  }, [game]);

  /* ------------------------------------------------------------------ */
  /*  LOADING STATE                                                      */
  /* ------------------------------------------------------------------ */
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-24" />
        <div className="grid md:grid-cols-[1fr_380px] gap-4 items-start">
          <div className="site-card p-5 space-y-4">
            <Skeleton className="w-full aspect-video rounded-8" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="site-card p-5 space-y-4">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  ERROR / NOT FOUND                                                  */
  /* ------------------------------------------------------------------ */
  if (error || !game) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          message={t("error.not_found")}
          description={error || t("error.not_found_desc")}
        />
        <div className="flex justify-center mt-4">
          <Link href={backHref}>
            <Button variant="outline">
              <ChevronLeft size={18} className="mr-2" />
              {backLabel}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href={backHref}
          className="text-site-muted hover:text-site-text transition-colors inline-flex items-center font-medium text-sm"
        >
          <ChevronLeft size={18} className="mr-1" />
          {backLabel}
        </Link>
      </div>

      {/* ── Two-column hero/top layout ── */}
      <div className="grid md:grid-cols-[1fr_380px] gap-4 items-start mb-8">
        {/* LEFT CARD – cover, title, badges, description */}
        <div className="site-card p-5 space-y-4">
          {/* Cover image */}
          <div className="relative w-full overflow-hidden rounded-8 border border-site-border-soft">
            <Image
              src={
                game.coverImage ||
                (game.screenshots && game.screenshots.length > 0
                  ? game.screenshots[0]
                  : game.mainImage)
              }
              alt={game.title}
              width={800}
              height={400}
              className="w-full h-auto object-cover"
              sizes="(max-width: 768px) 100vw, 700px"
            />
          </div>

          {/* Title row with favourite/share actions */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-site-text leading-tight">
                {game.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="neutral" className="gap-1.5">
                  {getCountryFlagCode(game.category) && (
                    <CountryFlag
                      code={getCountryFlagCode(game.category)}
                      size="S"
                    />
                  )}
                  {game.category}
                </Badge>
              </div>

              <p className="text-[13px] text-site-muted mt-2">
                {t("by_developer", {
                  developer: game.publisher || game.developer || t("unknown"),
                })}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleFavorite}
                className={`w-9 h-9 ${isFavorite ? "text-status-danger border-status-danger/30 bg-status-danger/10" : "text-site-muted"}`}
              >
                <Heart size={18} className={isFavorite ? "fill-current" : ""} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className={`w-9 h-9 ${copied ? "text-status-success border-status-success/30 bg-status-success/10" : "text-site-muted"}`}
              >
                {copied ? <Check size={18} /> : <Share2 size={18} />}
              </Button>
            </div>
          </div>

          {/* Short description */}
          <p className="text-[13px] text-site-muted leading-relaxed">
            {game.shortDescription || game.description}
          </p>
        </div>

        {/* RIGHT CARD – package selection, price, CTA (sticky on desktop) */}
        <div className="site-card p-5 md:sticky md:top-20 space-y-5">
          <h3 className="text-base font-bold text-site-text uppercase">
            {purchaseTitle}
          </h3>

          {/* Mobile trigger to open options sheet */}
          <div className="md:hidden">
            {(() => {
              const selected = game.topUpOptions.find(
                (opt) => opt.id === selectedOption,
              );
              return (
                <div
                  onClick={() => setIsOptionsModalOpen(true)}
                  className="bg-site-raised border border-site-border-soft p-3 flex items-center justify-between cursor-pointer rounded-6 transition-colors hover:border-site-border"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-medium text-site-dim uppercase block mb-0.5">
                      {t("selected_package_label")}
                    </span>
                    <h4 className="text-site-text font-bold text-sm leading-tight truncate">
                      {selected?.title || t("select_package")}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    {selected && (
                      <span className="text-site-text font-bold text-lg">
                        {formatTHB(Number(selected.price || 0))}
                      </span>
                    )}
                    <ChevronRight size={18} className="text-site-muted" />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Desktop package selector */}
          <div className="hidden md:block space-y-4">
            <p className="text-site-dim font-bold text-xs uppercase">
              {t("select_package")}
            </p>

            {game.topUpOptions.length === 0 ? (
              <EmptyState
                icon={AlertCircle}
                message={t("no_options")}
                description={t("no_options_desc")}
              />
            ) : (
              <div role="radiogroup" aria-label={t("select_package")}>
                <Grid cols={2} md={2} gap={3}>
                  {game.topUpOptions.map((option: PackageOptionData) => (
                    <PackageOption
                      key={option.id}
                      option={option}
                      selected={selectedOption === option.id}
                      onSelect={setSelectedOption}
                      popularLabel={t("popular_badge")}
                      size="sm"
                    />
                  ))}
                </Grid>
              </div>
            )}
          </div>

          {/* Mobile options sheet */}
          <Sheet
            isOpen={isOptionsModalOpen}
            onClose={() => setIsOptionsModalOpen(false)}
            title={t("select_package")}
          >
            <div
              role="radiogroup"
              aria-label={t("select_package")}
              className="grid grid-cols-2 gap-3 pb-8"
            >
              {game.topUpOptions.map((option: PackageOptionData) => (
                <PackageOption
                  key={option.id}
                  option={option}
                  selected={selectedOption === option.id}
                  onSelect={(id) => {
                    setSelectedOption(id);
                    setIsOptionsModalOpen(false);
                  }}
                  popularLabel={t("popular_badge")}
                  size="md"
                />
              ))}
            </div>
          </Sheet>

          {/* Dynamic fields & extra inputs */}
          {selectedOption &&
            (() => {
              const option = game.topUpOptions.find(
                (opt: any) => opt.id === selectedOption,
              );
              if (!option) return null;

              return (
                <div className="space-y-4">
                  {!isAuthenticated && (
                    <div className="bg-status-warning/15 border border-status-warning/30 p-3 text-sm flex items-center gap-2 rounded-6">
                      <AlertTriangle
                        size={16}
                        className="text-status-warning flex-shrink-0"
                      />
                      <span className="text-status-warning font-medium">
                        {t("login_required_notice")}
                      </span>
                    </div>
                  )}

                  {isMobileRechargeRoute &&
                    !(option.fields || []).some((field) =>
                      /phone|user id/i.test(`${field.name} ${field.label}`),
                    ) && (
                      <Input
                        label={t("mobile_number_label")}
                        type="tel"
                        value={mobilePhoneNumber}
                        onChange={(e) => setMobilePhoneNumber(e.target.value)}
                        placeholder={t("mobile_number_placeholder")}
                      />
                    )}

                  {option.fields && option.fields.length > 0 && (
                    <div className="space-y-3">
                      {option.fields.map((field) => (
                        <div key={field.name}>
                          {field.type === "select" ? (
                            <Select
                              label={
                                <span className="font-bold">
                                  {translateLabel(field.label)}{" "}
                                  {field.required && (
                                    <span className="text-status-danger">*</span>
                                  )}
                                </span>
                              }
                              options={
                                field.options?.map((opt) => ({
                                  label: opt.label,
                                  value: opt.value,
                                })) || []
                              }
                              value={fieldValues[field.name] || ""}
                              onChange={(value) =>
                                handleFieldChange(field.name, value)
                              }
                              placeholder={t("choose_placeholder", {
                                field: translateLabel(field.label),
                              })}
                            />
                          ) : (
                            <Input
                              label={`${translateLabel(field.label)} ${field.required ? "*" : ""}`}
                              type="text"
                              value={fieldValues[field.name] || ""}
                              onChange={(e) =>
                                handleFieldChange(field.name, e.target.value)
                              }
                              placeholder={
                                field.placeholder ||
                                t("enter_placeholder", {
                                  field: translateLabel(field.label),
                                })
                              }
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected package summary */}
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-site-muted flex-shrink-0 pt-0.5 font-medium text-sm">
                      {t("selected_package_label")}
                    </span>
                    <div className="text-right min-w-0">
                      <span className="text-site-text font-bold block leading-tight break-words text-sm">
                        {option.title}
                      </span>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="py-3 border-y border-site-border-soft space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-site-muted font-medium text-sm">
                        {t("price_label")}
                      </span>
                      {option.originalPrice > option.price ? (
                        <div className="flex items-center gap-2">
                          <span className="line-through text-site-dim text-xs">
                            {formatTHB(Number(option.originalPrice || 0))}
                          </span>
                          <span className="text-site-text font-bold text-lg">
                            {formatTHB(Number(option.price || 0))}
                          </span>
                        </div>
                      ) : (
                        <span className="text-site-text font-bold text-lg">
                          {formatTHB(Number(option.price || 0))}
                        </span>
                      )}
                    </div>

                    {option.originalPrice > option.price && (
                      <div className="flex justify-between items-center">
                        <span className="text-site-muted font-medium text-sm">
                          {t("savings_label")}
                        </span>
                        <Badge variant="success">
                          -฿{(
                            Number(option.originalPrice || 0) -
                            Number(option.price || 0)
                          ).toFixed(2)}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={handleBuyNow}
                    disabled={isBuying}
                    isLoading={isBuying}
                    size="full"
                    className="font-bold"
                  >
                    {!isBuying && (
                      <>
                        <ShoppingCart
                          size={18}
                          className="mr-2"
                          aria-hidden="true"
                        />
                        {isAuthenticated
                          ? t("buy_now_button")
                          : t("login_to_buy_button")}
                      </>
                    )}
                  </Button>

                  <div className="bg-site-accent/5 border border-site-accent/20 p-3 text-sm rounded-6">
                    <div className="flex items-center">
                      <Clock
                        size={16}
                        className="text-site-accent mr-2 flex-shrink-0"
                      />
                      <span className="text-site-accent/90 font-medium">
                        {t("auto_delivery_hint")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
        </div>
      </div>

      {/* ── Tabs section (topup options expanded + game info) ── */}
      <div className="site-card overflow-hidden mb-8">
        {/* Tab bar */}
        <div role="tablist" className="flex border-b border-site-border-soft overflow-x-auto scrollbar-hide">
          <button
            role="tab"
            aria-selected={activeTab === "topup"}
            onClick={() => setActiveTab("topup")}
            className={`py-3.5 px-6 text-sm font-semibold items-center whitespace-nowrap flex-shrink-0 transition-colors border-b-2 ${activeTab === "topup"
              ? "text-site-text border-site-accent"
              : "text-site-muted border-transparent hover:text-site-text"
              } hidden md:flex`}
          >
            <DollarSign size={18} className="mr-2" />
            {optionsTabLabel}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "info"}
            onClick={() => setActiveTab("info")}
            className={`py-3.5 px-6 text-sm font-semibold items-center whitespace-nowrap flex-shrink-0 transition-colors border-b-2 ${activeTab === "info"
              ? "text-site-text border-site-accent"
              : "text-site-muted border-transparent hover:text-site-text"
              } hidden md:flex`}
          >
            <Info size={18} className="mr-2" />
            {infoTabLabel}
          </button>

          {/* Mobile always shows info tab label */}
          <div className="md:hidden py-3.5 px-6 text-sm font-semibold flex items-center w-full text-site-text border-b-2 border-site-accent">
            <Info size={18} className="mr-2" />
            {infoTabLabel}
          </div>
        </div>

        <div role="tabpanel" className="p-5 md:p-8">
          {/* Desktop-only expanded top-up grid (in-tab view) */}
          <div
            className={activeTab === "topup" ? "hidden md:block" : "hidden"}
          >
            <div className="space-y-6">
              <div className="hidden md:flex items-center justify-between">
                <p className="text-site-dim font-bold text-sm uppercase">
                  {t("select_package")}
                </p>
              </div>

              {game.topUpOptions.length === 0 ? (
                <EmptyState
                  icon={AlertCircle}
                  message={t("no_options")}
                  description={t("no_options_desc")}
                />
              ) : (
                <div role="radiogroup" aria-label={t("select_package")} className="hidden md:block">
                  <Grid cols={2} md={3} gap={3} className="md:gap-4">
                    {game.topUpOptions.map((option: PackageOptionData) => (
                      <PackageOption
                        key={option.id}
                        option={option}
                        selected={selectedOption === option.id}
                        onSelect={setSelectedOption}
                        popularLabel={t("popular_badge")}
                        size="lg"
                      />
                    ))}
                  </Grid>
                </div>
              )}
            </div>
          </div>

          {/* Info tab content */}
          <div
            className={activeTab === "info" ? "block" : "block md:hidden"}
          >
            <div className="space-y-6">
              <div>
                <SectionHeader
                  title={t("about_product", { name: game.title })}
                />
                <ProductDescription
                  description={game.longDescription || game.description}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-site-surface border border-site-border-soft p-4 rounded-8">
                  <h4 className="text-site-muted font-medium mb-2 flex items-center text-xs uppercase tracking-wider">
                    <Package className="mr-2" size={16} />
                    {t("developer")}
                  </h4>
                  <p className="text-site-text font-medium">
                    {game.developer || t("unknown")}
                  </p>
                </div>

                <div className="bg-site-surface border border-site-border-soft p-4 rounded-8">
                  <h4 className="text-site-muted font-medium mb-2 flex items-center text-xs uppercase tracking-wider">
                    <Award className="mr-2" size={16} />
                    {t("publisher")}
                  </h4>
                  <p className="text-site-text font-medium">
                    {game.publisher || t("unknown")}
                  </p>
                </div>

                {game.releaseDate && (
                  <div className="bg-site-surface border border-site-border-soft p-4 rounded-8">
                    <h4 className="text-site-muted font-medium mb-2 flex items-center text-xs uppercase tracking-wider">
                      <Calendar className="mr-2" size={16} />
                      {t("release_date")}
                    </h4>
                    <p className="text-site-text font-medium">
                      {new Date(game.releaseDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="bg-site-surface border border-site-border-soft p-4 rounded-8">
                  <h4 className="text-site-muted font-medium mb-2 flex items-center text-xs uppercase tracking-wider">
                    <Smartphone className="mr-2" size={16} />
                    {t("platforms")}
                  </h4>
                  <p className="text-site-text font-medium">
                    {game.platforms.join(", ")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Related products (by developer/publisher) ── */}
      {relatedGamesByDev.length > 0 && (
        <section className="mb-10">
          <SectionHeader
            title={t("related_products")}
            sublabel={t("related_products_sublabel")}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedGamesByDev.map((relatedGame) => (
              <Link
                href={`/games/${relatedGame.slug}`}
                key={relatedGame.id}
                className="group"
              >
                <div className="aspect-square rounded-8 overflow-hidden bg-site-raised border border-site-border-soft transition-colors hover:border-site-border">
                  <img
                    src={
                      relatedGame.imageUrl ||
                      "/images/placeholder-game.svg"
                    }
                    alt={relatedGame.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[13px] text-center font-bold line-clamp-2 text-site-text group-hover:text-site-accent transition-colors mt-2">
                  {relatedGame.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Similar products ── */}
      <section className="mt-8 mb-10">
        <SectionHeader
          title={t("similar_products")}
          sublabel={t("similar_products_sublabel")}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {similarGames.length > 0 ? (
            similarGames.map((similarGame) => (
              <Link
                href={`/games/${similarGame.slug}`}
                key={similarGame.id}
                className="group"
              >
                <div className="aspect-square rounded-8 overflow-hidden bg-site-raised border border-site-border-soft transition-colors hover:border-site-border">
                  <img
                    src={
                      similarGame.imageUrl ||
                      "/images/placeholder-game.svg"
                    }
                    alt={similarGame.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[13px] text-center font-bold line-clamp-2 text-site-text group-hover:text-site-accent transition-colors mt-2">
                  {similarGame.name}
                </p>
              </Link>
            ))
          ) : (
            <EmptyState
              icon={AlertCircle}
              message={t("no_similar_found")}
            />
          )}
        </div>
      </section>

      {/* ── Confirmation Modal ── */}
      {showConfirmModal && verificationStatus && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            ref={confirmDialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("confirm_order_title")}
            tabIndex={-1}
            className="bg-site-surface border border-site-border w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col rounded-8 focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`border-b border-site-border p-3 sm:p-4 flex items-center justify-between flex-shrink-0 ${!verificationStatus.supported ? "bg-status-danger/10" : "bg-site-accent/10"}`}
            >
              <div className="flex items-center gap-2">
                {!verificationStatus.supported ? (
                  <ShieldAlert size={22} className="text-status-danger" />
                ) : (
                  <Check size={22} className="text-site-accent" />
                )}
                <h2 className="text-base sm:text-lg font-bold text-site-text uppercase">
                  {!verificationStatus.supported
                    ? t("unverified_account_warning")
                    : t("confirm_order_title")}
                </h2>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 hover:bg-site-raised rounded-6 transition-colors text-site-text"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!verificationStatus.supported && (
                <div className="bg-status-danger/10 border-b border-status-danger/30 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      size={18}
                      className="text-status-danger mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-status-danger text-sm">
                        {t("unverified_account_warning")}
                      </p>
                      <p className="text-xs text-status-danger/80 mt-0.5 font-medium">
                        {t("verify_info_hint")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="p-4 sm:p-5 space-y-4 border-b lg:border-b-0 lg:border-r border-site-border">
                  <div className="bg-site-raised border border-site-border-soft p-3 sm:p-4 rounded-8">
                    <h3 className="font-bold text-site-text text-sm mb-3 flex items-center gap-1.5 uppercase">
                      <Package size={16} className="text-site-accent" />
                      {t("product_details_title")}
                    </h3>
                    <div className="space-y-2 text-sm font-medium tabular-nums">
                      <div className="flex justify-between items-center">
                        <span className="text-site-muted">{t("product_label")}</span>
                        <span className="text-site-text text-right max-w-[60%]">
                          {verificationStatus.productName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-site-muted">{t("package_label")}</span>
                        <span className="text-site-text">
                          {verificationStatus.optionName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {Object.keys(verificationStatus.playerInfo).length > 0 && (
                    <div className="bg-site-raised border border-site-border-soft p-3 sm:p-4 rounded-8">
                      <h3 className="font-bold text-site-text text-sm mb-2 flex items-center gap-1.5 uppercase">
                        <User size={16} className="text-site-accent" />
                        {t("account_info_title")}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(verificationStatus.playerInfo).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="bg-site-deep p-2 border border-site-border-soft rounded-6"
                            >
                              <span className="text-[10px] text-site-dim block uppercase font-semibold">
                                {key}
                              </span>
                              <span className="font-mono font-bold text-site-text text-sm truncate block mt-0.5">
                                {value}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-status-danger/10 border border-status-danger/30 p-3 rounded-8">
                    <div className="flex items-start gap-2">
                      <AlertCircle
                        size={16}
                        className="text-status-danger mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <p className="font-bold text-status-danger text-xs">
                          {t("no_refund_warning_title")}
                        </p>
                        <p className="text-xs text-status-danger/80 mt-0.5 leading-relaxed font-medium">
                          {t("no_refund_warning_desc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-4 bg-site-raised">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-site-muted font-bold uppercase">
                      {t("payment_method_label")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-site-text text-sm">
                        {priceSummary.label || t("select_method")}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsPaymentSelectOpen(true)}
                        className="text-[10px] py-1 px-2 h-auto font-semibold uppercase"
                      >
                        {t("change_button")}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-site-surface border border-site-border-soft p-4 rounded-8">
                    <div className="space-y-2 text-sm font-medium tabular-nums">
                      <div className="flex justify-between text-site-muted">
                        <span>{t("subtotal_label")}</span>
                        <span className="text-site-text">
                          {formatTHB(Number(priceSummary.base || verificationStatus.price || 0))}
                        </span>
                      </div>
                      <div className="flex justify-between text-site-muted">
                        <span>{t("fee_label")}</span>
                        <span className="text-site-text">
                          +{formatTHB(Number(priceSummary.fee || 0))}
                        </span>
                      </div>
                      <div className="border-t border-site-border-soft pt-2 mt-2">
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-site-text">
                            {t("total_label")}
                          </span>
                          <span className="text-2xl sm:text-3xl font-extrabold text-site-accent">
                            {formatTHB(Number(priceSummary.total || verificationStatus.price || 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-status-info/10 border border-status-info/30 p-2.5 text-[10px] text-status-info flex items-start gap-2 font-medium uppercase rounded-8">
                    <ShieldCheck size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{t("secure_payment_notice")}</span>
                  </div>

                  <div className="pt-4 border-t border-site-border-soft">
                    <div className="mb-4">
                      <label className="flex items-start gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-site-border bg-site-deep accent-site-accent flex-shrink-0 cursor-pointer"
                        />
                        <span className="text-[10px] text-site-muted group-hover:text-site-text transition-colors leading-tight font-medium">
                          {t("terms_agreement_prefix")}{" "}
                          <Link
                            href="/terms"
                            target="_blank"
                            className="text-site-accent hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t("terms_label")}
                          </Link>
                          ,{" "}
                          <Link
                            href="/privacy"
                            target="_blank"
                            className="text-site-accent hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t("privacy_label")}
                          </Link>{" "}
                          <span className="text-site-dim">·</span>{" "}
                          <Link
                            href="/refund"
                            target="_blank"
                            className="text-site-accent hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t("refund_label")}
                          </Link>
                        </span>
                      </label>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={createOrder}
                        disabled={isBuying || !termsAccepted}
                        isLoading={isBuying}
                        className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-bold uppercase"
                      >
                        {!isBuying && <Check size={20} className="mr-2" />}
                        {t("confirm_button")}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => setShowConfirmModal(false)}
                        disabled={isBuying}
                        className="sm:w-auto w-full h-12 sm:h-14 px-6 sm:px-8 font-bold uppercase"
                      >
                        {t("cancel_button")}
                      </Button>
                    </div>

                    <p className="text-center text-[10px] text-site-dim mt-3 font-medium uppercase">
                      {t("confirm_hint")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Selection Modal ── */}
      {isPaymentSelectOpen && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setIsPaymentSelectOpen(false)}
        >
          <div
            ref={paymentDialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("payment_selection_title")}
            tabIndex={-1}
            className="bg-site-surface w-full max-w-5xl border border-site-border p-4 sm:p-6 rounded-8 focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-3 mb-5">
              <div>
                <h3 className="text-2xl font-bold text-site-text uppercase">
                  {t("payment_selection_title")}
                </h3>
                <p className="text-sm text-site-muted mt-1 font-medium">
                  {t("payment_selection_desc")}
                </p>
              </div>
              <button
                onClick={() => setIsPaymentSelectOpen(false)}
                className="p-2 hover:bg-site-raised rounded-6 transition-colors text-site-text"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[58vh] overflow-y-auto pr-1">
                {paymentOptions.map((opt: PaymentMethodOption) => {
                  const isActive = selectedPaymentOption === opt.code;
                  const totalAmount = priceSummary.total;
                  const isAvailable = isPaymentMethodAvailable(opt.method, totalAmount);
                  const unavailableReason = getPaymentMethodUnavailableReason(opt.method, totalAmount);

                  return (
                    <label
                      key={opt.code}
                      className={`border p-4 flex flex-col gap-3 transition-colors rounded-8 ${isActive
                        ? "bg-site-accent/10 border-site-accent"
                        : "bg-site-surface border-site-border-soft hover:border-site-border"
                        } ${!isAvailable
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                        }`}
                      onClick={() => {
                        if (isAvailable) {
                          setSelectedPaymentOption(opt.code);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            name="paymentOptionModal"
                            value={opt.code}
                            checked={isActive}
                            onChange={() =>
                              isAvailable && setSelectedPaymentOption(opt.code)
                            }
                            disabled={!isAvailable}
                            className="mt-1 accent-site-accent disabled:cursor-not-allowed bg-site-deep border-site-border"
                          />
                          <div>
                            <div className="text-site-text font-bold text-base flex items-center gap-2">
                              {opt.label}
                              {!isAvailable && (
                                <Badge variant="danger" className="text-[10px]">
                                  {t("min_amount_badge", { amount: TRUEMONEY_MIN_AMOUNT })}
                                </Badge>
                              )}
                            </div>
                            <div className="text-[10px] text-site-muted mt-1 font-medium">
                              {t("gateway_label", { name: opt.gateway.name })}
                            </div>
                            {unavailableReason && (
                              <div className="text-[10px] text-status-danger mt-1 font-medium">
                                {unavailableReason}
                              </div>
                            )}
                          </div>
                        </div>
                        {isActive && isAvailable && (
                          <Check size={16} className="text-site-accent" />
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] uppercase border border-site-border-soft px-2 py-0.5 bg-site-deep text-site-muted font-bold rounded-4 ${!isAvailable ? "opacity-50" : ""}`}>
                          {opt.method}
                        </span>
                      </div>

                      <div className="border-t border-site-border-soft pt-2 text-[10px] text-site-muted space-y-1 font-medium">
                        <div className="flex justify-between">
                          <span>{t("fee_percent_label")}</span>
                          <span className="text-site-text">
                            {Number(opt.surchargePercent || 0).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("flat_fee_label")}</span>
                          <span className="text-site-text">{formatTHB(Number(opt.flatFee || 0))}</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="border border-site-border-soft p-4 bg-site-raised rounded-8 h-fit space-y-4">
                <h4 className="text-lg font-bold text-site-text uppercase">
                  {t("transaction_summary_title")}
                </h4>

                <div className="space-y-2 text-sm font-medium tabular-nums">
                  <div className="flex justify-between text-site-muted">
                    <span>{t("product_label")}</span>
                    <span className="text-site-text max-w-[55%] text-right truncate">
                      {game?.title || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between text-site-muted">
                    <span>{t("package_label")}</span>
                    <span className="text-site-text max-w-[55%] text-right truncate">
                      {selectedTopUp?.title || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between text-site-muted">
                    <span>{t("subtotal_label")}</span>
                    <span className="text-site-text">{formatTHB(Number(priceSummary.base || 0))}</span>
                  </div>
                  <div className="flex justify-between text-site-muted">
                    <span>{t("fee_label")}</span>
                    <span className="text-site-text">{formatTHB(Number(priceSummary.fee || 0))}</span>
                  </div>
                </div>

                <div className="border-t border-site-border-soft pt-3 flex justify-between items-end font-bold">
                  <span className="text-sm text-site-muted uppercase">
                    {t("total_label")}
                  </span>
                  <span className="text-2xl font-extrabold text-site-accent">
                    {formatTHB(Number(priceSummary.total || 0))}
                  </span>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    onClick={() => setIsPaymentSelectOpen(false)}
                    disabled={!selectedPaymentOption}
                    fullWidth
                    className="font-bold uppercase"
                  >
                    {t("confirm_selection_button")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsPaymentSelectOpen(false)}
                    fullWidth
                    className="font-bold uppercase"
                  >
                    {t("close_window_button")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
