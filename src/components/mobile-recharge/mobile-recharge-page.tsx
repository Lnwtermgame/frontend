"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/routing";
import { usePaymentMethods, useProducts } from "@/lib/query/hooks";
import { startBuyFlow } from "@/lib/buy-flow";
import { ApiError } from "@/lib/api/client";
import { PackageGrid } from "@/components/product/package-grid";
import { ConfirmOrderDialog } from "@/components/product/confirm-order-dialog";
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
import type { Product, ProductTypePublic } from "@/lib/api/products";

/**
 * หน้าเติมเงินโทรศัพท์แบบ wizard 4 ขั้น (SEAGM-style)
 * ประเทศ → เบอร์ผู้รับ → ผู้ให้บริการ → นิยาม จบในหน้าเดียว
 *
 * State ทั้งหมดอยู่ที่หน้านี้ ตัว step components เป็น controlled (value + onChange)
 * เปลี่ยนขั้นบน = reset ขั้นล่าง (เหมือน SEAGM)
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
  /** ขั้นที่กำลังขยายแก้ไข (null = ขั้นปัจจุบันสูงสุดที่ยังไม่เสร็จ) */
  const [editingStep, setEditingStep] = useState<number | null>(null);

  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);
  const stepRefs = [step1Ref, step2Ref, step3Ref, step4Ref] as const;

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

  // ขั้นที่ถือว่า "เปิด" ถัดไป (logic เดียวกับที่ทดสอบใน wizard-state.test.ts)
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

  const goToStep = (step: 1 | 2 | 3 | 4) => {
    setEditingStep(step);
    const ref = stepRefs[step - 1].current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      ref?.scrollIntoView({
        block: "center",
        behavior: reduceMotion ? "auto" : "smooth",
      });
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

  const activeTypes = (operator?.types ?? []).filter((ty) => ty.isActive);

  /** แสดงขั้นแบบย่อ (เสร็จแล้วและไม่ได้กำลังแก้ไข) หรือขยายเต็ม */
  const renderStep = (
    n: 1 | 2 | 3 | 4,
    ref: React.RefObject<HTMLDivElement | null>,
    title: string,
    done: boolean,
    open: boolean,
    collapsedValue: string | null,
    children: React.ReactNode,
  ) => {
    const collapsed = done && editingStep !== n;
    const expanded = editingStep === n || (!done && open);
    return (
      <div
        ref={ref}
        className={`rounded-[14px] border border-border/60 bg-card p-5 transition-opacity ${
          open || done ? "" : "pointer-events-none opacity-50"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-bold">
            <span className="num mr-2 inline-grid size-[22px] place-items-center rounded-[7px] bg-primary/10 text-[11.5px] font-bold text-primary">
              {n}
            </span>
            {title}
          </h2>
          {collapsed && collapsedValue ? (
            <button
              type="button"
              onClick={() => setEditingStep(n)}
              className="max-w-[55%] truncate text-right text-[12.5px] font-medium text-primary underline-offset-4 hover:underline"
            >
              {collapsedValue}
            </button>
          ) : null}
        </div>
        {expanded ? <div className="mt-3.5">{children}</div> : null}
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-[22px] font-extrabold tracking-tight">{t("heroTitle")}</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">{t("heroSubtitle")}</p>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4">
          {renderStep(
            1,
            step1Ref,
            t("stepCountry"),
            Boolean(country),
            true,
            country ? `${country.flag} ${country.code}` : null,
            <CountrySelect
              countries={availableCountries.map(({ operatorCount: _n, ...c }) => c)}
              value={countryCode}
              onChange={(code) => {
                dispatch({ type: "pickCountry", code });
                setPhoneError(false);
                setEditingStep(null);
              }}
            />,
          )}

          {renderStep(
            2,
            step2Ref,
            t("stepPhone"),
            phoneOk,
            step2Open,
            country && phone ? `+${country.callingCode} ${phone}` : null,
            country ? (
              <PhoneInput
                country={country}
                value={phone}
                onChange={(v) => {
                  // reset ขั้นล่างเมื่อเบอร์เสีย อยู่ใน reducer (setPhone) — spec §5.6
                  dispatch({ type: "setPhone", phone: v });
                  setPhoneError(false);
                }}
                invalidHighlight={phoneError}
              />
            ) : null,
          )}

          {renderStep(
            3,
            step3Ref,
            t("stepOperator"),
            Boolean(operator),
            step3Open,
            operator?.name ?? null,
            <OperatorList
              operators={operators}
              selectedId={operator?.id ?? null}
              onSelect={(op) => {
                dispatch({ type: "pickOperator", operator: op });
                setEditingStep(null);
              }}
            />,
          )}

          {renderStep(
            4,
            step4Ref,
            t("stepDenomination"),
            Boolean(selectedType),
            step4Open,
            selectedType?.name ?? null,
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
          onGoToStep={goToStep}
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
