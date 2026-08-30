# Hero Carousel Rework (Legacy Landing) — Spec

**Date:** 2026-08-30
**Branch:** `feat/shadcn-storefront` (stacked history)
**Status:** Design approved in session (user chose "Carousel โปรโมชัน" + CTA fallback rule)

## Goal

Rebuild the legacy landing page's hand-rolled hero (translateX track — source of the
fractional-DPR corner-leak saga) on the shadcn/Embla Carousel already installed on this
branch, keeping the era-dark visual identity and admin-configurable slides.

## Decisions (user-approved)

1. **Archetype:** promotion image carousel (SEAGM register), rebuilt on Embla.
2. **Corner architecture (root-cause lesson):** the embla viewport clips square
   (off-slide content only); **each slide card carries its own rounded-16px +
   overflow-hidden** — the radius is baked into the moving layer, nothing clips it from
   outside, no stacked AA edges.
3. **Autoplay:** embla-carousel-autoplay, delay 6s, `stopOnInteraction: false`,
   `stopOnMouseEnter: true`.
4. **CTA fallback (user-approved):** slide links pass through an allowlist of real
   route prefixes (`/games`, `/card`, `/mobile-recharge`, `/news`, `/support`) — anything
   else (e.g. the current `/promotions/1`, `/promotions/2`) falls back to `/games`.
   Default slides link `/games` with the local placeholder art.
5. **Visual identity (era dark):** slide bg #16181A, full-bleed artwork, left gradient
   scrim (`#16181A` solid → transparent), white title, `text-gray-200` subtitle, teal
   `site-accent` highlight + CTA. No diagonal panel, no heavy drop shadows, no
   per-slide `bgRight` tint (retired — imperceptible darks).
6. **Admin slides stay the content source** (settings.heroSlides + defaults fallback);
   a `reInit` effect guards against pre-layout measurement (same pattern as the v2 page).

## Non-Goals

- No route/page creation (promotions pages stay nonexistent; admin fixes links in settings).
- No changes outside `src/app/[locale]/page.tsx` hero block (plus spec/plan docs).
- No icon library or font changes.

## Acceptance

- typecheck/lint/i18n green; `/th` 200.
- Corners clean at any DPR (slide self-rounded; embla viewport square-clips overflow).
- Swipe (touch), arrow keys, dots, arrows, autoplay-with-hover-pause all functional.
- Slide CTA never 404s from default data.

## Risks

- Embla init before layout settles → mitigated with reInit effect (api + slides length + rAF).
- rAF unavailable in the automation browser → animation must be confirmed by the human owner.
