"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/routing";
import { usePaymentMethods, useProducts } from "@/lib/query/hooks";
import { startBuyFlow } from "@/lib/buy-flow";
import { ApiError } from "@/lib/api/client";
import { ConfirmOrderDialog } from "@/components/product/confirm-order-dialog";
import { PackageGrid } from "@/components/product/package-grid";
import { CountrySelect } from "./country-select";
import { PhoneInput } from "./phone-input";
import { OperatorList } from "./operator-list";
import { RechargeOrderSummary } from "./recharge-order-summary";
import {
  buildPlayerInfo,
  groupOperatorsByCountry,
  isPhoneValid,
} from "@/lib/mobile-recharge";
import {
  initialWizardState,
  reduceWizard,
  stepOpen,
} from "@/lib/wizard-state";
import { MOBILE_COUNTRIES, countryByCode, type CountryMeta } from "@/lib/mobile-countries";
import { useAuthStore } from "@/stores/auth";

/**
 * หน้าเติมเงินโทรศัพท์ — SEAGM-style (spec §5)
 * ทุกขั้นเรียงเป็น section ต่อเนื่องบนหน้าเดียว: ประเทศ → เบอร์ → ค่าย → นิยาม
 * ขั้นถัดไปไขได้เมื่อขั้นก่อนหน้าเสร็จ (reducer กัน reset ขั้นล่างเมื่อแก้ขั้นบน)
 */
export function MobileRechargePage() {
  const t = useTranslations("mobileRecharge");
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = Boolean(user);

  const products = useProducts({ limit: 100 });

  const [wizard, dispatch] = useReducer(reduceWizard, initialWizardState);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [buying, setBuying] = useState(false);

  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);
  const stepRefs = { 2: step2Ref, 3: step3Ref, 4: step4Ref } as const;

  const groups = useMemo(() => groupOperatorsByCountry(products.data ?? []), [products.data]);
  const availableCountries = useMemo(
    () =>
      MOBILE_COUNTRIES.filter((c) => groups.has(c.code)).map((c) => ({
        ...c,
        operatorCount: groups.get(c.code)?.length ?? 0,
      })),
    [groups],
  );
  const { countryCode, phone, operator, selectedType } = wizard;
  const country: CountryMeta | null = countryByCode(countryCode) ?? null;
  const operators = country ? groups.get(country.code) ?? [] : [];
  const phoneOk = isPhoneValid(phone);

  const open = stepOpen(wizard);
  const step2Open = open.step2;
  const step3Open = open.step3;
  const step4Open = open.step4;

  // Deep link: /mobile-recharge?operator=<slug>&country=<CODE>
  const operatorParam = searchParams.get("operator");
  const countryParam = searchParams.get("country");
  const appliedDeepLink = useRef(false);
  useEffect(() => {
    if (appliedDeepLink.current || !products.isSuccess) return;
    appliedDeepLink.current = true;
    dispatch({
      type: "applyDeepLink",
      products: products.data ?? [],
      params: { operator: operatorParam, country: countryParam },
    });
  }, [products.isSuccess, products.data, operatorParam, countryParam]);

  const goToStep = (step: 2 | 3 | 4) => {
    const ref = stepRefs[step].current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      ref?.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    });
  };

  const methods = usePaymentMethods(isAuthenticated);

  const handleBuyAttempt = () => {
    setBuyError(null);
    if (!isAuthenticated) {
      const current = window.location.pathname;
      window.location.href = `/login?redirect=${encodeURIComponent(current)}`;
      return;
    }
    setConfirmOpen(true);
  };

  const handleBuy = async () => {
    if (!country || !operator || !selectedType) return;
    setBuying(true);
    try {
      const result = await startBuyFlow(
        {
          playerInfo: buildPlayerInfo(phone, country.callingCode),
          quantity: 1,
          paymentOptionCode: methods.data?.[0]?.code,
          paymentMethod: methods.data?.[0]?.method ?? "PROMPTPAY",
        },
        { productId: operator.id, productTypeId: selectedType.id },
      );
      setConfirmOpen(false);
      if (result.outcome === "qr") {
        router.push(
          `/payments/pending?orderId=${result.orderId}&referenceNo=${result.referenceNo}`,
        );
      }
    } catch (err) {
      const info = err instanceof ApiError ? err.infoCode : undefined;
      if (info === "20133" || info === "20093") {
        setPhoneError(true);
        setBuyError(t("errorPhoneInvalid"));
        goToStep(2);
      } else if (info === "20114") {
        setBuyError(t("errorOperatorMismatch"));
      } else {
        setBuyError(
          err instanceof Error && err.message !== "NO_PAYMENT_LINK"
            ? err.message
            : t("errorOrderFailed"),
        );
      }
      setConfirmOpen(false);
    } finally {
      setBuying(false);
    }
  };

  if (products.isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <Skeleton className="h-8 w-2/3 rounded-lg" />
        <Skeleton className="mt-2 h-4 w-1/2 rounded-md" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-11 rounded-[10px]" />
            <Skeleton className="h-11 rounded-[10px]" />
            <Skeleton className="h-11 rounded-[10px]" />
            <Skeleton className="h-24 rounded-[10px]" />
          </div>
          <Skeleton className="h-96 rounded-[14px]" />
        </div>
      </div>
    );
  }

  if (products.isError) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
        <p className="font-semibold" role="alert">{t("loadError")}</p>
      </div>
    );
  }

  // ไม่มีสินค้า MOBILE_RECHARGE เลย (เช่น SEAGM sync ยังไม่ได้ข้อมูล) —
  // wizard ว่างจะดูเหมือนพังทั้งหน้า แสดง empty state ชัดเจนแทน
  if (availableCountries.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-[22px] font-extrabold tracking-tight">{t("heroTitle")}</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">{t("heroSubtitle")}</p>
        <div className="mt-10 flex flex-col items-center gap-3 rounded-[14px] border border-border/60 bg-card px-6 py-16 text-center">
          <span aria-hidden className="text-4xl">📵</span>
          <p className="text-[15px] font-semibold">{t("noService")}</p>
          <p className="max-w-md text-[13px] text-muted-foreground">{t("noServiceHint")}</p>
          <a
            href="/"
            className="mt-3 inline-flex h-10 items-center rounded-[10px] bg-primary px-5 text-[13.5px] font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("backToHome")}
          </a>
        </div>
      </div>
    );
  }

  const activeTypes = (operator?.types ?? []).filter((ty) => ty.isActive);

  /** Section หัวข้อ + เนื้อหา — ขั้นที่ยังไม่เปิดจางลงแต่ยังโชว์โครง (SEAGM ทำแบบนี้) */
  const section = (
    step: 2 | 3 | 4,
    ref: React.RefObject<HTMLDivElement | null>,
    title: string,
    isOpen: boolean,
    children: React.ReactNode,
  ) => (
    <div
      ref={ref}
      className={`transition-opacity ${isOpen ? "" : "pointer-events-none opacity-50"}`}
    >
      <h2 className="text-[13px] font-bold">{title}</h2>
      {isOpen ? <div className="mt-2.5">{children}</div> : null}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-[22px] font-extrabold tracking-tight">{t("heroTitle")}</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">{t("heroSubtitle")}</p>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-[13px] font-bold">{t("stepCountry")}</h2>
            <div className="mt-2.5">
              <CountrySelect
                countries={availableCountries.map(({ operatorCount: _n, ...c }) => c)}
                value={countryCode}
                onChange={(code) => {
                  dispatch({ type: "pickCountry", code });
                  setPhoneError(false);
                }}
              />
            </div>
          </div>

          {section(
            2,
            step2Ref,
            t("stepPhone"),
            step2Open,
            country ? (
              <PhoneInput
                country={country}
                value={phone}
                onChange={(v) => {
                  dispatch({ type: "setPhone", phone: v });
                  setPhoneError(false);
                }}
                invalidHighlight={phoneError}
              />
            ) : null,
          )}

          {section(
            3,
            step3Ref,
            t("stepOperator"),
            step3Open,
            <OperatorList
              operators={operators}
              selectedId={operator?.id ?? null}
              onSelect={(op) => {
                dispatch({ type: "pickOperator", operator: op });
                requestAnimationFrame(() => goToStep(4));
              }}
            />,
          )}

          {section(
            4,
            step4Ref,
            t("stepDenomination"),
            step4Open,
            activeTypes.length ? (
              <PackageGrid
                types={activeTypes}
                selectedId={selectedType?.id ?? null}
                onSelect={(ty) => dispatch({ type: "pickType", selectedType: ty })}
              />
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("noDenominations")}
              </p>
            ),
          )}
        </div>

        <RechargeOrderSummary
          state={{ country, phone, operator, selectedType }}
          buying={buying}
          buyError={buyError}
          phoneInvalid={phoneError}
          onBuyAttempt={handleBuyAttempt}
          onGoToStep={(n) => (n === 1 ? undefined : goToStep(n as 2 | 3 | 4))}
        />
      </div>

      {/* กันแถบสรุปตรึงขอบล่างทับเนื้อหาท้ายหน้า (เฉพาะเมื่อเลือกนิยามแล้ว) */}
      {selectedType ? (
        <div aria-hidden className="h-[calc(84px+env(safe-area-inset-bottom))] lg:hidden" />
      ) : null}

      <ConfirmOrderDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        packageName={selectedType?.name ?? operator?.name ?? ""}
        quantity={1}
        total={selectedType?.displayPrice ?? 0}
        buying={buying}
        onConfirm={() => void handleBuy()}
      />
    </div>
  );
}
