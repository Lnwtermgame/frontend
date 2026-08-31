# Order Summary — "Soft Receipt" (direction B)

Date: 2026-08-31 · Scope: `src/components/product-detail/OrderSummary.tsx` (+ one i18n key)
Chosen from three mocked directions (A Dense Market / B Soft Receipt / C Step Rail) — user picked B.

## Goal

Make the sticky purchase card match the slim package rows and the softened
theme: quieter structure, receipt-like scanning, one tinted total moment.

## Structure (top → bottom)

1. **Header row** — existing h3 `purchase_summary` on the left; new compact
   pill on the right: Zap icon + `auto_delivery_short` (green tint:
   status-success/10 bg, /25 border, rounded-full). The old bottom
   auto-delivery box is removed; the full `auto_delivery_hint` sentence
   becomes a small centered dim footer under the CTA.
2. **Guest notice** — unchanged warning block.
3. **Fields** — same components/props; inputs and the server select get the
   filled treatment locally via className: `bg-site-raised` fill, transparent
   border, `rounded-10`; focus → accent border + `bg-site-deep`. Global
   `Input`/`Select` styles are untouched.
4. **Dashed divider** — `border-t border-dashed border-site-border`.
5. **Line rows** — label (muted) left / value right:
   selected package, quantity with a rounded-full stepper
   (`bg-site-deep`, round buttons).
6. **Dashed divider.**
7. **Tinted total box** — `bg-site-accent/10 border-site-accent/20 rounded-10`,
   inner small rows (subtotal, fee/discount lines when present), then the
   grand total: bold accent `text-xl`.
8. **CTA** — existing Button, full width, `rounded-12 h-[46px]` + soft accent
   glow `shadow-[0_10px_26px_-10px_rgba(99,199,194,0.55)]`.
9. **Footer** — `auto_delivery_hint`, centered, `text-[11px] text-site-dim`.

## i18n

New key `ProductDetail.auto_delivery_short` added to all 9 locales
(th ส่งอัตโนมัติ · en Instant delivery · zh 自动发货 · ja 自動発送 ·
ko 자동 배송 · ms Penghantaran automatik · hi ऑटो डिलीवरी ·
es Entrega automática · fr Livraison automatique). All other text reuses
existing keys.

## Non-goals

No changes to PurchaseForm, dialogs, global Input/Select, or tokens.
Behavior (validation, buy flow, sticky) unchanged.
