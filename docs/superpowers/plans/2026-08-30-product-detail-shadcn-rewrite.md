# Product Detail shadcn Rewrite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the product detail page on the shadcn kit with SEAGM polish (real rating/sold count, quantity stepper, sold-out states), fixing the duplicate package selector that caused the original revert.

**Architecture:** Split the ~1,940-line monolith into 7 focused components under `src/components/product-detail/`; `page.tsx` keeps data fetch, state, and purchase-flow handlers. Source material for markup: the reverted v2 page in git history (`36eb26e`), adapted per task below.

**Tech Stack:** Next.js 16, React 19, Tailwind v3 (`site.*` tokens), shadcn/Radix (Dialog, Select, Tabs, Checkbox, Label), existing `Sheet`, `PackageOption`, `Badge`, `Skeleton`, `EmptyState`, `SectionHeader`, `GameTile`, `next-intl` (9 locales), react-hot-toast.

**Spec:** `docs/superpowers/specs/2026-08-30-product-detail-shadcn-rewrite-design.md`

**Testing discipline (per spec):** no unit-test runner exists in this repo; verification = `npm run typecheck` after every task, `npm run lint` + `npm run check:i18n` before smoke, and a full browser smoke at the end. Run all commands from `services/frontend`.

**Shared source material:** at the start, extract the v2 page once:

```bash
cd services/frontend
git show '36eb26e:src/app/[locale]/games/[gameId]/page.tsx' > /tmp/v2page.tsx
```

All "copy from V2 line X–Y" references below mean that file. The current (post-revert) page at `src/app/[locale]/games/[gameId]/page.tsx` is the source for business logic handlers (fetch, buy, payment flow, favorites) — carry them forward in Task 9.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/components/product-detail/types.ts` | Shared types: `GameDetails`, `TopUpOption`, `PriceSummary`, `VerificationStatus` |
| `src/components/product-detail/ProductHero.tsx` | Left hero card: cover, logo, title, region badge, social proof, favorite/share |
| `src/components/product-detail/PackageSelector.tsx` | Desktop package grid (`PackageOption` radiogroup) + `PackageSheet` export (mobile bottom Sheet) |
| `src/components/product-detail/OrderSummary.tsx` | Sticky right card: mobile trigger, dynamic fields, quantity stepper, price breakdown, CTA |
| `src/components/product-detail/ConfirmOrderDialog.tsx` | shadcn Dialog: order review, terms checkbox, confirm |
| `src/components/product-detail/PaymentMethodDialog.tsx` | shadcn Dialog: payment option cards, transaction summary |
| `src/components/product-detail/ProductInfoPanel.tsx` | shadcn Tabs: topup tab hosts `PackageSelector`; info tab hosts description + meta cards |
| `src/components/product-detail/RelatedProducts.tsx` | Related-by-developer + similar grids via `SectionHeader` + `GameTile` |
| `src/app/[locale]/games/[gameId]/page.tsx` | Rewrite: orchestration, state, handlers, SEO, skeleton loading |

---

### Task 1: Shared types

**Files:**
- Create: `src/components/product-detail/types.ts`

- [ ] **Step 1: Create types.ts**

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/components/product-detail/types.ts
git commit -m "feat(product-detail): shared types for page rewrite"
```

---

### Task 2: ProductHero

**Files:**
- Create: `src/components/product-detail/ProductHero.tsx`
- Source: V2 lines 944–1043 (LEFT CARD)

- [ ] **Step 1: Create ProductHero.tsx**

Props interface:

```ts
"use client";

import Image from "next/image";
import { Heart, Share2, Check, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CountryFlag, getCountryFlagCode } from "@/components/ui/country-flag";
import type { GameDetails } from "./types";

export function ProductHero({
  game,
  isFavorite,
  copied,
  onToggleFavorite,
  onCopyLink,
}: {
  game: GameDetails;
  isFavorite: boolean;
  copied: boolean;
  onToggleFavorite: () => void;
  onCopyLink: () => void;
}) {
  const t = useTranslations("ProductDetail");
  // ... body below
}
```

Body: copy V2 lines 944–1043 verbatim (the `{/* LEFT CARD … */}` div), with these adaptations:
- Replace state references with props: `isFavorite`, `copied`, `handleToggleFavorite` → `onToggleFavorite`, `handleCopyLink` → `onCopyLink`.
- Keep the social-proof block (V2 981–1037) exactly: Star rating row rendered only when `typeof game.rating === "number" && game.ratingCount > 0`, sold count row only when `typeof game.soldCount === "number" && game.soldCount > 0` using `t("sold_count", { count: game.soldCount })`, and the refund-policy `Link` (from `@/i18n/routing`) with `t("refund_policy_link")` if that key exists in `messages/en.json` — check with `node -e "console.log(!!require('./messages/en.json').ProductDetail.refund_policy_link)"`; if the key is missing, use the existing key `t("refund_label")` from the `ProductDetail` namespace instead (verify likewise) and note the substitution in the commit message.
- `t` and `tCommon` come from the component's own `useTranslations` calls.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/product-detail/ProductHero.tsx
git commit -m "feat(product-detail): ProductHero with SEAGM social-proof row"
```

---

### Task 3: PackageSelector + PackageSheet

**Files:**
- Create: `src/components/product-detail/PackageSelector.tsx`
- Source: V2 lines 1083–1138 (desktop selector + mobile sheet)

- [ ] **Step 1: Create PackageSelector.tsx**

```ts
"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { PackageOption, type PackageOptionData } from "@/components/products/PackageOption";
import { Grid } from "@/components/ui/Grid";
import { Sheet } from "@/components/ui/Sheet";
import { EmptyState } from "@/components/ui/EmptyState";
import type { TopUpOption } from "./types";

export function PackageSelector({
  options,
  selectedId,
  onSelect,
}: {
  options: TopUpOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("ProductDetail");

  if (options.length === 0) {
    return (
      <EmptyState
        icon={AlertCircle}
        message={t("no_options")}
        description={t("no_options_desc")}
      />
    );
  }

  return (
    <div className="hidden md:block space-y-4">
      <p className="text-site-dim font-bold text-xs uppercase">
        {t("select_package")}
      </p>
      <div role="radiogroup" aria-label={t("select_package")}>
        <Grid cols={2} md={3} gap={3}>
          {options.map((option) => (
            <PackageOption
              key={option.id}
              option={option}
              selected={selectedId === option.id}
              onSelect={onSelect}
              popularLabel={t("popular_badge")}
              soldOut={option.hasStock === false}
              soldOutLabel={t("out_of_stock")}
              size="lg"
            />
          ))}
        </Grid>
      </div>
    </div>
  );
}

export function PackageSheet({
  open,
  onOpenChange,
  options,
  selectedId,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: TopUpOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("ProductDetail");
  return (
    <Sheet
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={t("select_package")}
    >
      <div
        role="radiogroup"
        aria-label={t("select_package")}
        className="grid grid-cols-2 gap-3 pb-8"
      >
        {options.map((option) => (
          <PackageOption
            key={option.id}
            option={option}
            selected={selectedId === option.id}
            onSelect={(id) => {
              onSelect(id);
              onOpenChange(false);
            }}
            popularLabel={t("popular_badge")}
            soldOut={option.hasStock === false}
            soldOutLabel={t("out_of_stock")}
            size="sm"
          />
        ))}
      </div>
    </Sheet>
  );
}
```

Notes:
- `PackageOption` already implements radio semantics, focus ring, popular badge, and sold-out state — do not re-implement.
- This is the ONLY desktop grid render site; the Sheet is the ONLY mobile picker. They are mutually exclusive per viewport (grid `hidden md:block`; Sheet opened only from the `md:hidden` trigger in OrderSummary).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/product-detail/PackageSelector.tsx
git commit -m "feat(product-detail): PackageSelector + PackageSheet (single selector per viewport)"
```

---

### Task 4: OrderSummary

**Files:**
- Create: `src/components/product-detail/OrderSummary.tsx`
- Source: V2 lines 1045–1355, EXCLUDING the desktop selector block (1083–1112)

- [ ] **Step 1: Create OrderSummary.tsx**

Props interface:

```ts
"use client";

import { Minus, Plus, ShoppingCart, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatTHB } from "@/lib/format";
import type { SeagmField } from "@/lib/services/product-api";
import type { PriceSummary, TopUpOption } from "./types";

export function OrderSummary({
  option,
  isAuthenticated,
  fieldValues,
  onFieldChange,
  translateLabel,
  isMobileRechargeRoute,
  mobilePhoneNumber,
  onMobilePhoneChange,
  quantity,
  onQuantityChange,
  priceSummary,
  isBuying,
  onBuy,
  onOpenPackages,
}: {
  option: TopUpOption | null;
  isAuthenticated: boolean;
  fieldValues: Record<string, string>;
  onFieldChange: (name: string, value: string) => void;
  translateLabel: (label: string) => string;
  isMobileRechargeRoute: boolean;
  mobilePhoneNumber: string;
  onMobilePhoneChange: (value: string) => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  priceSummary: PriceSummary;
  isBuying: boolean;
  onBuy: () => void;
  onOpenPackages: () => void;
}) {
  const t = useTranslations("ProductDetail");
  // ... body below
}
```

Body: copy V2 1045–1355 minus 1083–1112, with these adaptations:
- Wrapper stays `site-card p-5 md:sticky md:top-20 space-y-5`.
- Mobile trigger (V2 1051–1081): `onClick={() => onOpenPackages()}`.
- Dynamic fields (V2 1140–1237): keep shadcn `Select`/`Input`; fields stay enabled for guests (no `disabled={!isAuthenticated}` — login gates at buy click per spec).
- Quantity stepper (V2 1250–1278): wire to props — `onClick={() => onQuantityChange(Math.max(1, quantity - 1))}` / `Math.min(10, quantity + 1)`, `disabled={quantity <= 1}` / `disabled={quantity >= 10}`, aria-label from `t("quantity_label")`.
- Price breakdown (V2 1280–1316): replace per-line `option.price * quantity` math with `priceSummary`: subtotal row `formatTHB(priceSummary.subtotal)`, fee row `formatTHB(priceSummary.fee)`, total row `formatTHB(priceSummary.total)`; keep the original-price strikethrough on the selected-package row.
- CTA (V2 1317–1355): `onClick={onBuy}`, `disabled={isBuying}`, label `t("buy_now_button")` / `t("login_to_buy_button")` by `isAuthenticated`; keep guest login notice (`login_required_notice`) and auto-delivery hint (`auto_delivery_hint`) blocks from V2 if present in that range, else copy them from the current page (lines 1289–1299 and 1433–1443 of current `page.tsx`).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/product-detail/OrderSummary.tsx
git commit -m "feat(product-detail): OrderSummary with quantity stepper and qty-aware pricing"
```

---

### Task 5: ConfirmOrderDialog

**Files:**
- Create: `src/components/product-detail/ConfirmOrderDialog.tsx`
- Source: V2 lines 1502–1746

- [ ] **Step 1: Create ConfirmOrderDialog.tsx**

Props interface:

```ts
"use client";

import { Link } from "@/i18n/routing";
import { Check, ShieldAlert, AlertCircle, Package, User, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatTHB } from "@/lib/format";
import type { PriceSummary } from "./types";

export function ConfirmOrderDialog({
  open,
  onClose,
  verificationStatus,
  priceSummary,
  termsAccepted,
  onTermsChange,
  isBuying,
  onConfirm,
  onChangePayment,
}: {
  open: boolean;
  onClose: () => void;
  verificationStatus: {
    supported: boolean;
    productName: string;
    optionName: string;
    playerInfo: Record<string, string>;
  } | null;
  priceSummary: PriceSummary;
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
  isBuying: boolean;
  onConfirm: () => void;
  onChangePayment: () => void;
}) {
  const t = useTranslations("ProductDetail");
  // ... body below
}
```

Body: copy V2 1502–1746, adapting:
- `open`/`onOpenChange={(o) => !o && onClose()}` on `Dialog`; drop any framer `AnimatePresence`/`motion` wrappers (Radix handles mount animation; keep V2's Dialog usage as-is).
- Terms `<input type="checkbox">` (if V2 still uses raw input) → shadcn `Checkbox` + `Label` (id `terms-agreement`), checked=`termsAccepted`, onCheckedChange=`onTermsChange`.
- Terms links use `Link` from `@/i18n/routing` with existing keys (`terms_label`, `privacy_label`, `refund_label`).
- Payment "change" button → `onChangePayment`.
- Confirm button `disabled={isBuying || !termsAccepted}`, `onClick={onConfirm}`.
- Totals read from `priceSummary` (`subtotal`/`fee`/`total`).
- Add `DialogDescription` (sr-only or visible `t("confirm_order_desc")` if the key exists; otherwise `aria-describedby={undefined}` on DialogContent — follow the pattern in `src/components/ui/Sheet.tsx`).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/product-detail/ConfirmOrderDialog.tsx
git commit -m "feat(product-detail): ConfirmOrderDialog on Radix Dialog with shadcn Checkbox"
```

---

### Task 6: PaymentMethodDialog

**Files:**
- Create: `src/components/product-detail/PaymentMethodDialog.tsx`
- Source: V2 lines 1748–1904

- [ ] **Step 1: Create PaymentMethodDialog.tsx**

Props interface:

```ts
"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { formatTHB } from "@/lib/format";
import type { PaymentMethodOption } from "@/lib/services/payment-api";
import type { PriceSummary } from "./types";

export function PaymentMethodDialog({
  open,
  onOpenChange,
  options,
  selectedCode,
  onSelect,
  priceSummary,
  productTitle,
  optionTitle,
  isMethodAvailable,
  unavailableReason,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: PaymentMethodOption[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
  priceSummary: PriceSummary;
  productTitle: string;
  optionTitle: string;
  isMethodAvailable: (method: string, totalAmount: number) => boolean;
  unavailableReason: (method: string, totalAmount: number) => string | null;
  onConfirm: () => void;
}) {
  const t = useTranslations("ProductDetail");
  // ... body below
}
```

Body: copy V2 1748–1904, adapting:
- Availability checks call the injected `isMethodAvailable` / `unavailableReason` (page owns the TrueMoney 20฿ rule).
- Radio cards keep per-item disabled + reason text; selecting calls `onSelect(opt.code)`.
- Summary column uses `priceSummary`; confirm button calls `onConfirm` (page closes the dialog); close button = `onOpenChange(false)`.
- `aria-describedby={undefined}` on DialogContent (same pattern as Sheet).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/product-detail/PaymentMethodDialog.tsx
git commit -m "feat(product-detail): PaymentMethodDialog on Radix Dialog"
```

---

### Task 7: ProductInfoPanel + RelatedProducts

**Files:**
- Create: `src/components/product-detail/ProductInfoPanel.tsx`
- Create: `src/components/product-detail/RelatedProducts.tsx`
- Source: V2 lines 1356–1427 (tabs), 1429–1500 (related/similar)

- [ ] **Step 1: Create ProductInfoPanel.tsx**

```ts
"use client";

import { DollarSign, Info, Package, Award, Calendar, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProductDescription } from "@/components/products/ProductDescription";
import { PackageSelector } from "./PackageSelector";
import type { GameDetails, TopUpOption } from "./types";

export function ProductInfoPanel({
  game,
  options,
  selectedId,
  onSelect,
}: {
  game: GameDetails;
  options: TopUpOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("ProductDetail");
  // ... body below
}
```

Body: copy V2 1356–1427 with ONE structural change — the topup `TabsContent` (V2 1389–1420) must contain ONLY `<PackageSelector options={options} selectedId={selectedId} onSelect={onSelect} />` (delete the duplicated inline radiogrid at V2 1388–1420 — that duplication is the bug that caused the original revert). Keep:
- Mobile `md:hidden` info block (V2 1358–1364) rendering the same `infoContent` variable.
- Desktop `TabsList`/`TabsTrigger` pair (V2 1365–1387).
- `infoContent` = description (`ProductDescription` with `game.longDescription || game.description`) + the developer/publisher/releaseDate/platforms card grid (copy from current page lines 1136–1189 if V2's info tab references a shared `infoContent` defined elsewhere in the file).

- [ ] **Step 2: Create RelatedProducts.tsx**

```ts
"use client";

import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GameTile } from "@/components/ui/GameTile";
import type { Product } from "@/lib/services/product-api";

export function RelatedProducts({
  related,
  similar,
}: {
  related: Product[];
  similar: Product[];
}) {
  const t = useTranslations("ProductDetail");
  return (
    <>
      {related.length > 0 && (
        <section className="mb-10">
          <SectionHeader title={t("related_products")} sublabel={t("related_products_sublabel")} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p) => (
              <GameTile
                key={p.id}
                slug={p.slug || p.id}
                name={p.name}
                image={p.imageUrl || `/images/placeholder-game.svg`}
                instant={(p.productType as string | undefined) === "DIRECT_TOPUP" || !(p.productType as string | undefined)}
              />
            ))}
          </div>
        </section>
      )}
      <section className="mt-16 mb-10">
        <SectionHeader title={t("similar_products")} sublabel={t("similar_products_sublabel")} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {similar.map((p) => (
            <GameTile
              key={p.id}
              slug={p.slug || p.id}
              name={p.name}
              image={p.imageUrl || `/images/placeholder-game.svg`}
              instant={(p.productType as string | undefined) === "DIRECT_TOPUP" || !(p.productType as string | undefined)}
            />
          ))}
        </div>
      </section>
    </>
  );
}
```

(If `related.length === 0` and `similar.length === 0`, the similar section renders an `EmptyState` with `t("no_similar_found")` instead of the grid.)

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/product-detail/ProductInfoPanel.tsx src/components/product-detail/RelatedProducts.tsx
git commit -m "feat(product-detail): ProductInfoPanel tabs + RelatedProducts grids"
```

---

### Task 8: i18n key parity

**Files:**
- Possibly modify: `messages/{en,th,zh,ms,ko,ja,hi,fr,es}.json`

- [ ] **Step 1: Run the i18n checker against current keys**

Run: `npm run check:i18n`
Expected: PASS with existing keys (`quantity_label`, `sold_count`, `out_of_stock`, `popular_badge`, `no_options`, …).

- [ ] **Step 2: Add any missing keys**

If Task 2–7 introduced keys not present in `messages/en.json` (e.g. `refund_policy_link`, `confirm_order_desc`), add them to ALL 9 locale files under `ProductDetail` with proper translations (th first, then en/zh/ms/ko/ja/hi/fr/es). Re-run `npm run check:i18n` until green.

- [ ] **Step 3: Commit (only if changes were needed)**

```bash
git add messages/*.json
git commit -m "feat(i18n): product detail rewrite key parity (9 locales)"
```

---

### Task 9: Rewrite page.tsx

**Files:**
- Modify (rewrite): `src/app/[locale]/games/[gameId]/page.tsx`

- [ ] **Step 1: Keep logic, replace render**

Rewrite the file keeping from the CURRENT page: `FIELD_LABEL_MAP`/`translateLabel`, route detection (`isCardRoute`/`isMobileRechargeRoute`), `useEffect` fetch block (with the `transformProductToGameDetails` changes below), favorites effect, payment-methods effect, TrueMoney availability helpers, `handleBuyNow`, `startPaymentFlow`, `createOrder`, `handleCopyLink`, `handleFieldChange`, `handleToggleFavorite`, SEO title/meta effect, `ProductJsonLd` usage.

Changes to logic:

1. Import shared types from `@/components/product-detail/types` (delete local `GameDetails`/`TopUpOption`); in `transformProductToGameDetails` map `hasStock: type.hasStock !== false`, `rating: product.averageRating`, `ratingCount: product.reviewCount`, `soldCount: product.salesCount`, `mainImage: product.imageUrl || "/images/placeholder-game.svg"` (drop placehold.co URLs).
2. Add `const [quantity, setQuantity] = useState(1);` and reset to 1 when `selectedOption` changes.
3. Quantity-aware price summary (fixes the v2 total bug):

```ts
const priceSummary = useMemo(() => {
  const subtotal = (selectedTopUp?.price || 0) * quantity;
  if (!selectedPaymentOption) return { subtotal, fee: 0, total: subtotal };
  const opt = paymentOptions.find((o) => o.code === selectedPaymentOption);
  if (!opt) return { subtotal, fee: 0, total: subtotal };
  const fee = subtotal * (Number(opt.surchargePercent || 0) / 100) + Number(opt.flatFee || 0);
  return { subtotal, fee, total: subtotal + fee, label: opt.label, method: opt.method };
}, [selectedPaymentOption, paymentOptions, selectedTopUp, quantity]);
```

4. Sold-out-aware initial selection in the fetch effect:

```ts
const inStock = gameData.topUpOptions.filter((o) => o.hasStock !== false);
const popular = inStock.find((o) => o.isPopular);
setSelectedOption((popular || inStock[0])?.id ?? null);
```

5. `createOrder` already sends `quantity` — keep, now driven by state.

- [ ] **Step 2: Compose the render**

Replace the entire JSX return with this composition (loading/error states included):

```tsx
if (loading) {
  return (
    <div className="page-container space-y-6">
      <SkeletonHero />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-64 w-full rounded-8" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-96 w-full rounded-8" />
        </div>
      </div>
    </div>
  );
}

if (error || !game) {
  return (
    <div className="page-container">
      <EmptyState icon={AlertCircle} message={t("error.not_found")} description={error || t("error.not_found_desc")} />
      <div className="flex justify-center">
        <Link href={backHref}>
          <Button variant="outline"><ChevronLeft size={18} className="mr-2" />{backLabel}</Button>
        </Link>
      </div>
    </div>
  );
}

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

    <div className="mb-6">
      <Link href={backHref} className="text-site-muted hover:text-site-text transition-colors inline-flex items-center font-medium">
        <ChevronLeft size={18} className="mr-1" />
        {backLabel}
      </Link>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      <div className="lg:col-span-2">
        <ProductHero
          game={game}
          isFavorite={isFavorite}
          copied={copied}
          onToggleFavorite={handleToggleFavorite}
          onCopyLink={handleCopyLink}
        />
      </div>
      <div>
        <OrderSummary
          option={selectedTopUp}
          isAuthenticated={isAuthenticated}
          fieldValues={fieldValues}
          onFieldChange={handleFieldChange}
          translateLabel={translateLabel}
          isMobileRechargeRoute={isMobileRechargeRoute}
          mobilePhoneNumber={mobilePhoneNumber}
          onMobilePhoneChange={setMobilePhoneNumber}
          quantity={quantity}
          onQuantityChange={setQuantity}
          priceSummary={priceSummary}
          isBuying={isBuying}
          onBuy={handleBuyNow}
          onOpenPackages={() => setIsOptionsModalOpen(true)}
        />
      </div>
    </div>

    <ProductInfoPanel
      game={game}
      options={game.topUpOptions}
      selectedId={selectedOption}
      onSelect={setSelectedOption}
    />

    <RelatedProducts related={relatedGamesByDev} similar={similarGames} />

    <PackageSheet
      open={isOptionsModalOpen}
      onOpenChange={setIsOptionsModalOpen}
      options={game.topUpOptions}
      selectedId={selectedOption}
      onSelect={setSelectedOption}
    />

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
      onSelect={setSelectedPaymentOption}
      priceSummary={priceSummary}
      productTitle={game.title}
      optionTitle={selectedTopUp?.title || ""}
      isMethodAvailable={isPaymentMethodAvailable}
      unavailableReason={getPaymentMethodUnavailableReason}
      onConfirm={() => setIsPaymentSelectOpen(false)}
    />
  </div>
);
```

Imports to drop: `motion`/`AnimatePresence`, `legacy-select`, `ui/Sheet`, framer usage, `Card`/`Grid`/`CardContent` if unused after rewrite. Imports to add: the six new components + `Skeleton`, `SkeletonHero`, `EmptyState`.

- [ ] **Step 3: Typecheck + lint + i18n**

Run: `npm run typecheck && npm run lint && npm run check:i18n`
Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/\[locale\]/games/\[gameId\]/page.tsx
git commit -m "feat(product): rewrite detail page on shadcn components (SEAGM polish, single selector)"
```

---

### Task 10: Browser smoke test

**Files:** none (verification only)

- [ ] **Step 1: Desktop smoke**

Dev server should already be running at `http://localhost:8000` (if not: `npm run dev` in background). Open `http://localhost:8000/th/games/identity-v-idv-global-top-up-direct-global-776` and verify:
- Hero renders cover + title + region badge; no console errors.
- Exactly ONE package selector visible on desktop (the grid inside the topup tab); no second grid in the right column.
- Package click selects (accent border + check icon); keyboard Tab reaches cards and Enter selects.
- Quantity stepper: + sets 2, price breakdown subtotal = 2 × package price; fee/total update; − at 1 disabled.
- Buy while logged out → toast + redirect to `/login?redirect=...`.
- Logged in: fill User ID + server, buy → ConfirmOrderDialog opens; confirm disabled until terms Checkbox checked; "change" opens PaymentMethodDialog; Escape closes dialogs; focus returns.

- [ ] **Step 2: Mobile smoke**

Resize to 390×844 (or browser device mode):
- Tab bar hidden; info block visible; summary shows selected-package row.
- Tapping the row opens the bottom Sheet; selecting closes it and updates summary + price.
- Sticky summary and CTA reachable.

- [ ] **Step 3: Fix any findings, re-run checks, commit fixes**

```bash
git commit -m "fix(product-detail): smoke-test findings"
```

(Only if fixes were needed.)

---

### Task 11: Bump submodule in parent repo

**Files:**
- Modify: `services/frontend` gitlink (parent repo root)

- [ ] **Step 1: Commit the pointer bump**

From the parent repo root (`D:\Users\Administrator\Documents\Github\gametopup`):

```bash
git add services/frontend
git commit -m "chore: bump frontend submodule — product detail shadcn rewrite (SEAGM polish)"
```

- [ ] **Step 2: Final status check**

Run: `git status` in both repos.
Expected: clean trees (except the known-untracked `nul` artifact in the submodule).
