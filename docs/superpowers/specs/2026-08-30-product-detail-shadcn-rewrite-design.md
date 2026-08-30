# Product Detail — shadcn Rewrite (SEAGM Polish) — Design

**Date:** 2026-08-30
**Status:** Approved (user approved in session)
**Scope:** `services/frontend` — `src/app/[locale]/games/[gameId]/page.tsx` and new
`src/components/product-detail/*`. No backend, admin, or other-page changes.

## Context

The storefront was migrated to shadcn/Radix (spec 2026-08-29) except the product
detail page: a v2 shadcn+SEAGM version (30e28c1/36eb26e) was reverted (8482d09)
because it rendered the package selector twice on desktop (left column grid AND
right column radiogroup). The page is now a ~1,940-line monolith on the legacy
kit (hand-rolled motion modals, `legacy-select`, `ui/Input`).

Decision (user-approved 2026-08-30): **rewrite the page from scratch** on the
shadcn kit with SEAGM-style polish, fixing the duplicate-selector defect by
construction (exactly one selector render site per viewport).

## Goals

- Professional, consistent look: same token identity (`site.*`), shadcn primitives.
- SEAGM social proof: real rating/review count, sold count, refund-policy link.
- Quantity stepper wired into pricing and the order.
- Sold-out package states from `hasStock`.
- Single package selector; keyboard-accessible (PackageOption is a real button).
- Split the monolith into focused components; page file orchestrates only.

## Non-Goals

- No backend changes; no admin changes; no other storefront page changes.
- No toast migration (react-hot-toast stays).
- No new user-facing copy without i18n keys in all 9 locale files.

## Architecture

New directory `src/components/product-detail/`:

| Unit | Responsibility |
|---|---|
| `ProductHero.tsx` | Cover image, logo tile, title, region Badge w/ CountryFlag, developer line, social-proof row (Star rating from `product.averageRating`, `reviewCount`, `sold_count` from `salesCount`, refund-policy link), favorite + share buttons |
| `PackageSelector.tsx` | The ONE selector: desktop `role=radiogroup` grid of `PackageOption` (size lg); mobile selected-package row that opens the existing `Sheet` containing the same options (size sm). Props: options, selectedId, onSelect |
| `OrderSummary.tsx` | Sticky right column: login notice (guest), dynamic fields (shadcn `Input`/`Select` + `Label`), quantity stepper (Minus/Plus, min 1 max 99), price breakdown (subtotal = price×qty; fee = surchargePercent%×subtotal + flatFee; total), buy CTA, auto-delivery hint. Props: option, fields, values, quantity, priceSummary, auth state, callbacks |
| `ConfirmOrderDialog.tsx` | shadcn `Dialog`: product/account info grid, no-refund warning, payment method row + change button, terms `Checkbox` gating confirm, confirm/cancel. Props: open, onClose, verificationStatus, priceSummary, termsAccepted, onConfirm, isBuying |
| `PaymentMethodDialog.tsx` | shadcn `Dialog`: payment option radio cards with per-item disabled (TrueMoney < 20฿) + reason, transaction summary, confirm/close. Props: open, onClose, options, selected, onSelect, priceSummary |
| `ProductInfoPanel.tsx` | shadcn `Tabs` ("topup" / "info"): topup tab hosts `PackageSelector` + mobile recharge phone input; info tab hosts description (`ProductDescription`) + developer/publisher/release/platforms cards |
| `RelatedProducts.tsx` | Related-by-developer + similar products grids using `SectionHeader` + existing `GameTile` |

`page.tsx` keeps: data fetch (`productApi`), state (selection, quantity, field
values, payment options, modals), purchase flow handlers, favorites, SEO
effects. Target ≤ ~500 lines.

Loading state: `Skeleton` blocks (hero + grid + summary) instead of spinner.
Empty states: `EmptyState` for no packages / no similar products.

## Behavior contract (preserved from current page)

- Payment methods load only when authenticated; default PromptPay.
- TrueMoney minimum 20฿: per-item disabled in dialog; auto-fallback with toast
  if selected method becomes unavailable after quantity/price change.
- Guest: fields enabled; login gate at buy click (`/login?redirect=...`).
- Required-field validation with translated labels (`FIELD_LABEL_MAP`).
- Mobile recharge route phone normalization + 9-digit validation.
- Order create: `orderApi.createOrder` with `quantity` (now from stepper),
  `playerInfo`, `paymentMethod`, `paymentOptionCode`.
- Payment flow: `createIntent` → form-HTML safe parse (DOMParser, no raw
  innerHTML) → redirectUrl → qrCodeUrl sessionStorage + `/payments/pending`.
- Error mapping: player-verification (20133/20093), phone-region (20114).
- Favorites toggle w/ ALREADY_EXISTS handling; share copies URL.
- Sold out: `hasStock === false` → PackageOption `soldOut`, not selectable;
  initial selection = first in-stock popular else first in-stock.

## Quantity pricing

`subtotal = option.price × quantity`; `fee = subtotal × pct + flat`;
`total = subtotal + fee`. Stepper stays enabled for guests; the login gate is
at buy click only.

## i18n

Existing keys cover the feature set (`quantity_label`, `sold_count`,
`out_of_stock` landed 2026-08-30 in all 9 locales; rating/refund keys exist
from v2 era — verify with `npm run check:i18n`). Any missing key → add to all
9 locale files in the same change.

## SEO

Keep `ProductJsonLd` and the client `document.title` + meta description effect.

## Verification

1. `npm run typecheck`, `npm run lint`, `npm run check:i18n` — green.
2. Browser smoke at `/th/games/identity-v-idv-global-top-up-direct-global-776`:
   - package select (mouse + keyboard), exactly one selector visible on desktop
   - quantity stepper updates subtotal/fee/total correctly
   - guest buy → login redirect; logged-in buy → confirm dialog → terms gate →
     payment dialog → createIntent path
   - dialogs: Escape closes, focus trapped/restored, scroll locked
   - mobile viewport: Sheet picker works; summary row reflects selection
3. No console errors; no visual regression on tokens/fonts.

## Risks

- Rewrite regressions in purchase flow → mitigated by behavior contract above +
  smoke test of the full buy path.
- Nested dialogs (payment dialog opened from confirm dialog) → Radix supports;
  verify z-order vs Toaster (z-50).
