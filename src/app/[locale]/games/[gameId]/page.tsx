"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/lib/hooks/use-auth";
import { orderApi } from "@/lib/services/order-api";
import { paymentApi, PaymentMethodOption } from "@/lib/services/payment-api";
import { ChevronLeft, AlertCircle, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import {
  productApi,
  Product,
  ProductType,
} from "@/lib/services/product-api";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { GameDetails, TopUpOption, PriceSummary, VerificationStatus } from "@/components/product-detail/types";
import { ProductHero } from "@/components/product-detail/ProductHero";
import { OrderSummary } from "@/components/product-detail/OrderSummary";
import { ConfirmOrderDialog } from "@/components/product-detail/ConfirmOrderDialog";
import { PaymentMethodDialog } from "@/components/product-detail/PaymentMethodDialog";
import { PackageSelector } from "@/components/product-detail/PackageSelector";
import { ProductInfoPanel } from "@/components/product-detail/ProductInfoPanel";
import { RelatedProducts } from "@/components/product-detail/RelatedProducts";

// Helper function to transform Product to GameDetails
function transformProductToGameDetails(
  product: Product,
  productTypes: ProductType[],
): GameDetails {
  const topUpOptions: TopUpOption[] = productTypes.map((type) => ({
    id: type.id,
    title: type.name,
    price: type.displayPrice,
    originalPrice: type.originPrice || type.displayPrice,
    hasStock: type.hasStock !== false,
    fields: type.fields,
  }));

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
    shortDescription: product.shortDescription,
    mainImage: product.imageUrl || "/images/placeholder-game.svg",
    coverImage: product.coverImageUrl,
    category:
      product.category?.name ||
      (product.productType === "DIRECT_TOPUP" ? "Direct Top Up" : "Gift Card"),
    developer: product.gameDetails?.developer || product.category?.name || "Unknown",
    publisher: product.gameDetails?.publisher || "Unknown",
    platforms: product.gameDetails?.platforms?.length
      ? product.gameDetails.platforms
      : ["iOS", "Android"],
    rating: product.averageRating,
    ratingCount: product.reviewCount,
    soldCount: product.salesCount,
    screenshots: product.images?.map((img) => img.url) || [],
    topUpOptions: topUpOptions.length > 0 ? topUpOptions : [],
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
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
  const { isAuthenticated, isInitialized } = useAuth();
  const [game, setGame] = useState<GameDetails | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [paymentOptions, setPaymentOptions] = useState<PaymentMethodOption[]>([]);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<string | null>(null);
  const [isPaymentSelectOpen, setIsPaymentSelectOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [mobilePhoneNumber, setMobilePhoneNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [similarGames, setSimilarGames] = useState<Product[]>([]);
  const [relatedGamesByDev, setRelatedGamesByDev] = useState<Product[]>([]);
  const [isBuying, setIsBuying] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [quantity, setQuantity] = useState(1);

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

  const selectedTopUp = useMemo(() => {
    if (!selectedOption || !game) return null;
    return game.topUpOptions.find((opt) => opt.id === selectedOption) || null;
  }, [selectedOption, game]);

  // Reset quantity when selected option changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedOption]);

  // Quantity-aware price summary
  const priceSummary = useMemo((): PriceSummary => {
    const subtotal = (selectedTopUp?.price || 0) * quantity;
    if (!selectedPaymentOption) return { subtotal, fee: 0, total: subtotal };
    const opt = paymentOptions.find((o) => o.code === selectedPaymentOption);
    if (!opt) return { subtotal, fee: 0, total: subtotal };
    const fee = subtotal * (Number(opt.surchargePercent || 0) / 100) + Number(opt.flatFee || 0);
    return { subtotal, fee, total: subtotal + fee, label: opt.label, method: opt.method };
  }, [selectedPaymentOption, paymentOptions, selectedTopUp, quantity]);

  // TrueWallet minimum amount constraint (FeelFreePay requirement)
  const TRUEMONEY_MIN_AMOUNT = 20;

  const isPaymentMethodAvailable = (method: string, totalAmount: number) => {
    if (method === "TRUEMONEY" && totalAmount < TRUEMONEY_MIN_AMOUNT) {
      return false;
    }
    return true;
  };

  const getPaymentMethodUnavailableReason = (method: string, totalAmount: number) => {
    if (method === "TRUEMONEY" && totalAmount < TRUEMONEY_MIN_AMOUNT) {
      return t("error.truemoney_minimum", { amount: TRUEMONEY_MIN_AMOUNT });
    }
    return null;
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

  // Reset selected payment option if it becomes unavailable
  useEffect(() => {
    if (!selectedPaymentOption || paymentOptions.length === 0) return;

    const selectedOpt = paymentOptions.find((o) => o.code === selectedPaymentOption);
    if (!selectedOpt) return;

    const totalAmount = priceSummary.total;
    if (!isPaymentMethodAvailable(selectedOpt.method, totalAmount)) {
      const alternative = paymentOptions.find(
        (o) => isPaymentMethodAvailable(o.method, totalAmount),
      );
      if (alternative) {
        setSelectedPaymentOption(alternative.code);
        toast(t("error.truemoney_minimum", { amount: TRUEMONEY_MIN_AMOUNT }));
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

    if (!isAuthenticated) {
      toast.error(t("error.login_required"), { duration: 3000 });
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (selectedPaymentOption) {
      const selectedOpt = paymentOptions.find((o) => o.code === selectedPaymentOption);
      if (selectedOpt && !isPaymentMethodAvailable(selectedOpt.method, priceSummary.total)) {
        const reason = getPaymentMethodUnavailableReason(selectedOpt.method, priceSummary.total);
        toast.error(reason || t("error.payment_method_unavailable"));
        return;
      }
    }

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
    setTermsAccepted(false);
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
      const res = await paymentApi.createIntent(orderId, paymentOptionCode);
      if (!res.success) {
        toast.error(t("error.payment_failed"));
        return false;
      }

      const { qrCodeUrl, paymentFormHtml, redirectUrl, referenceNo } = res.data;

      if (paymentFormHtml) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(paymentFormHtml, "text/html");
        const parsedForm = doc.querySelector("form");
        if (!parsedForm) {
          toast.error(t("error.payment_failed"));
          return false;
        }

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

      if (redirectUrl) {
        window.open(redirectUrl, "_blank");
        return true;
      }

      if (qrCodeUrl) {
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

  const createOrder = async () => {
    if (!product || !selectedOption) return;

    try {
      setIsBuying(true);
      toast.loading(tCommon("loading"));

      const playerInfo = buildPlayerInfo();
      const paymentOptionCode = selectedPaymentOption || undefined;

      const selectedOptionObj = paymentOptions.find(
        (opt) => opt.code === selectedPaymentOption,
      );
      const paymentMethod = selectedOptionObj ? selectedOptionObj.method : "PROMPTPAY";

      const response = await orderApi.createOrder({
        items: [
          {
            productId: product.id,
            productTypeId: selectedOption,
            quantity,
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success(t("copy_link_success"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copy_link_failed"));
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
    if (
      isMobileRechargeRoute &&
      ["phone", "Phone", "User ID"].includes(fieldName)
    ) {
      setMobilePhoneNumber(value);
    }
  };

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

        // Sold-out-aware initial selection
        if (gameData.topUpOptions.length > 0) {
          const inStock = gameData.topUpOptions.filter((o) => o.hasStock !== false);
          const popular = inStock.find((o) => o.isPopular);
          setSelectedOption((popular || inStock[0])?.id ?? null);
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

  // Favorites effect
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

  // Compute price range for JSON-LD
  const priceLow = game?.topUpOptions?.length
    ? Math.min(...game.topUpOptions.map((o) => o.price))
    : undefined;
  const priceHigh = game?.topUpOptions?.length
    ? Math.max(...game.topUpOptions.map((o) => o.price))
    : undefined;

  // --- Loading state ---
  if (loading) {
    return (
      <div className="page-container space-y-8">
        {/* Compact header skeleton */}
        <div className="site-card p-4 sm:p-5 flex items-center gap-4">
          <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-8 shrink-0" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full rounded-8" />
          </div>
          <div>
            <Skeleton className="h-96 w-full rounded-8" />
          </div>
        </div>
      </div>
    );
  }

  // --- Error / not-found state ---
  if (error || !game) {
    return (
      <div className="page-container bg-transparent flex flex-col items-center justify-center min-h-[50vh]">
        <EmptyState
          icon={AlertCircle}
          message={t("error.not_found")}
          description={error || t("error.not_found_desc")}
        />
        <Link href={backHref} className="mt-6">
          <Button variant="outline" className="border-site-border text-site-text hover:bg-site-border">
            <ChevronLeft size={18} className="mr-1" />
            {backLabel}
          </Button>
        </Link>
      </div>
    );
  }

  // --- Success state ---
  return (
    <div className="page-container bg-transparent">
      {game && product && (
        <ProductJsonLd
          name={game.title}
          description={game.metaDescription || game.shortDescription || game.description}
          image={game.mainImage}
          slug={product.slug || product.id}
          priceLow={priceLow}
          priceHigh={priceHigh}
          category={game.category}
          rating={game.rating ?? 0}
          ratingCount={game.ratingCount ?? 0}
        />
      )}

      <div className="mb-4">
        <Link
          href={backHref}
          className="text-site-muted hover:text-site-text transition-colors inline-flex items-center font-medium"
        >
          <ChevronLeft size={18} className="mr-1" />
          {backLabel}
        </Link>
      </div>

      {/* Compact product header — SEAGM-style */}
      <ProductHero
        game={game}
        isFavorite={isFavorite}
        copied={copied}
        onToggleFavorite={handleToggleFavorite}
        onCopyLink={handleCopyLink}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
        {/* Package selection */}
        <div className="lg:col-span-2">
          <div className="site-card p-5 md:p-6 space-y-6">
            <div className="flex items-center gap-2 text-sm font-bold text-site-text uppercase tracking-wide">
              <DollarSign size={16} className="text-site-accent" aria-hidden="true" />
              {t("topup_options")}
            </div>
            <PackageSelector
              options={game.topUpOptions}
              selectedId={selectedOption}
              onSelect={(id) => setSelectedOption(id)}
            />
          </div>
        </div>

        {/* Sticky order summary: player info + totals + buy */}
        <div>
          <OrderSummary
            option={selectedTopUp}
            isAuthenticated={isAuthenticated}
            fieldValues={fieldValues}
            onFieldChange={handleFieldChange}
            translateLabel={translateLabel}
            isMobileRechargeRoute={isMobileRechargeRoute}
            mobilePhoneNumber={mobilePhoneNumber}
            onMobilePhoneChange={(v) => setMobilePhoneNumber(v)}
            quantity={quantity}
            onQuantityChange={(q) => setQuantity(q)}
            priceSummary={priceSummary}
            isBuying={isBuying}
            onBuy={handleBuyNow}
          />
        </div>
      </div>

      <ProductInfoPanel game={game} />

      <RelatedProducts related={relatedGamesByDev} similar={similarGames} />

      <ConfirmOrderDialog
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        verificationStatus={verificationStatus}
        priceSummary={priceSummary}
        termsAccepted={termsAccepted}
        onTermsChange={setTermsAccepted}
        isBuying={isBuying}
        onConfirm={createOrder}
        onChangePayment={() => {
          setShowConfirmModal(false);
          setIsPaymentSelectOpen(true);
        }}
      />

      <PaymentMethodDialog
        open={isPaymentSelectOpen}
        onOpenChange={setIsPaymentSelectOpen}
        options={paymentOptions}
        selectedCode={selectedPaymentOption}
        onSelect={(code) => setSelectedPaymentOption(code)}
        priceSummary={priceSummary}
        productTitle={game.title}
        optionTitle={selectedTopUp?.title || ""}
        isMethodAvailable={isPaymentMethodAvailable}
        unavailableReason={getPaymentMethodUnavailableReason}
        onConfirm={() => setIsPaymentSelectOpen(false)}
      />
    </div>
  );
}
