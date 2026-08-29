# shadcn/ui Adoption (Storefront) — Design

**Date:** 2026-08-29
**Status:** Approved (user approved in session; final spec review pending)
**Scope:** `services/frontend` — storefront surfaces only. Admin is explicitly out of scope for this cycle.

## Context

The storefront is Next.js 16 + React 19 + Tailwind v3 with a bespoke token system
(`site.*` / `status.*` hex vars + `-rgb` mirrors for Tailwind alpha modifiers),
dark-only theme, Noto Sans Thai, 9 locales (th-first). All interactive primitives
(carousel, modals, bottom sheet, select, tabs, dropdown) are hand-rolled. This
produced a class of recurring defects: a carousel whose rounded corners leak on
fractional-DPR displays (DPR 1.25 — survived three fix attempts: overflow+radius,
inner clip viewport, clip-path on the clip layer), a hand-written focus trap,
modals without full dialog semantics until recently, and no touch swipe.

Decision (user-approved): adopt **shadcn/ui** — Radix primitives + Embla carousel,
**keeping the current dark/teal visual identity** — and migrate the storefront to
it in phases. shadcn themes via CSS variables, so our tokens map onto its
standard variables and the look does not change.

## Goals

- Replace hand-rolled interactive primitives with shadcn/Radix equivalents on all
  storefront pages.
- Eliminate the hero carousel corner-clip bug class (Embla viewport pattern).
- Gain professional a11y: focus management, keyboard support, swipe — maintained
  upstream, not by us.
- Zero visual redesign: shadcn components themed to the existing tokens.

## Non-Goals

- No Tailwind v4 upgrade (stay on v3; shadcn works with the hsl-var pattern).
- No admin surfaces (AdminShell keeps its current components this cycle).
- No toast migration (react-hot-toast stays).
- No i18n key or copy changes; existing aria-labels preserved.

## Foundation

1. Run `shadcn init` (Tailwind v3-compatible, style "dark", `components.json`
   already present — regenerate it).
2. Map shadcn CSS variables to existing tokens in `globals.css` (`:root` only —
   dark-only site, no `.dark` class toggling):

   | shadcn var | value |
   |---|---|
   | `--background` / `--foreground` | site-bg / site-text (HSL triplets of #111315 / #f3f6f5) |
   | `--primary` / `--primary-foreground` | site-accent / site-bg |
   | `--secondary` / `--muted` / `--accent` | site-raised / site-raised / site-accent tints |
   | `--destructive` | status-danger |
   | `--border` / `--input` | site-border-soft |
   | `--ring` | site-accent |
   | `--radius` | 0.5rem (8px) |
   | `--popover*` / `--card*` | site-surface pair |

3. Add to `tailwind.config.js` the shadcn color entries (`border`, `input`, `ring`,
   `background`, `foreground`, `primary`, `secondary`, `destructive`, `muted`,
   `accent`, `popover`, `card`) alongside the existing `site.*` / `status.*`
   mappings. Both namespaces coexist; old classes keep working throughout.
4. Install: `tailwindcss-animate`, `@radix-ui/react-slot`, `@radix-ui/react-dialog`,
   `@radix-ui/react-select`, `@radix-ui/react-tabs`, `@radix-ui/react-dropdown-menu`,
   `@radix-ui/react-label`, `@radix-ui/react-checkbox`, `embla-carousel-react`,
   `embla-carousel-autoplay`. (cva, clsx, tailwind-merge, lucide-react already present.)
5. Existing hand-rolled components stay in place until their call sites are
   migrated in a later phase; both sets coexist per phase.

## Phases (each phase ships independently, ordered)

### Phase 0 — Hotfix the hero corner leak
Stopgap before the Embla migration: apply `clip-path: inset(0 round 7px)` to each
slide element itself (self-clipping layers cannot leak regardless of DPR; 7px =
8px frame radius minus the 1px border, concentric radii).
Acceptance: no corner bleed in the user's browser at DPR 1.25.

### Phase 1 — Hero carousel → shadcn Carousel (Embla)
- Replace the hand-rolled `translateX` track with the shadcn Carousel (Embla),
  including `embla-carousel-autoplay` with stop-on-interaction.
- Keep the current slide design inside each embla slide (hero-scrim, badge pill,
  highlight, CTA). Delete the `.hero-clip` hack and the hand-rolled arrows/dots in
  favor of the shadcn Carousel API (custom prev/next + dots wired to `api`).
- Adds touch swipe + keyboard support for free.
- Acceptance: corners clean at DPR 1.25; swipe + arrow keys + autoplay
  pause-on-hover verified; typecheck/lint/i18n green.

### Phase 2 — Overlays → Radix Dialog
- Confirm-order modal and payment-selection modal → shadcn Dialog (labelled,
  `aria-modal`, focus trap and Escape handled by Radix). Delete `useFocusTrap`.
- `Sheet.tsx` (mobile package picker) → shadcn Sheet (Radix Dialog based).
- LanguageSwitcher mobile modal → shadcn Dialog.
- Acceptance: focus is trapped and restored; Escape and overlay close work;
  scroll-lock preserved.

### Phase 3 — Forms
- `Select.tsx` → shadcn Select for product dynamic fields (server/zone/region)
  and payment-option selects. Radix Select supports per-item disabled states, so
  availability rules (e.g. TrueMoney minimum) move from whole-control disabling
  to per-item states; guest input stays enabled (login gates at order time only).
- Terms checkbox → shadcn Checkbox; inputs → shadcn Input where the shadcn
  `Input` replaces `ui/Input.tsx` call sites in storefront pages.

### Phase 4 — Remaining primitives
- Product-detail tabs → shadcn Tabs.
- MainNav user dropdown → shadcn DropdownMenu.
- `Badge.tsx` → shadcn Badge (variant map preserved: success/info/neutral/danger).
- `Skeleton.tsx` → shadcn Skeleton.
- Delete each replaced hand-rolled file only after its last storefront call site
  is migrated (admin still imports some — keep files needed by admin).

### Phase 5 — Sweep and docs
- Grep-verify no storefront imports of replaced primitives remain; update
  `.impeccable.md` (Technical Stack + component conventions) and this spec's
  addendum listing what landed.

## Error handling & testing discipline (every phase)

- `npm run typecheck`, `npm run lint`, `npm run check:i18n` — all green.
- Visual smoke on `/th`, `/th/games`, one product page: layout unchanged, fonts
  unchanged, corner clipping clean at DPR 1.25 (user's machine).
- Overlays: focus trap + restore, Escape, scroll-lock.
- No new user-facing copy without i18n keys in all 9 locale files.

## Risks

- **shadcn + Tailwind v3**: supported via the hsl-var pattern; pin the registry
  output style to avoid v4-flavored utility churn.
- **Radix Select is not a native `<select>`**: product field selects must be
  re-tested (keyboard, mobile sheet inside Dialog nesting).
- **Dialog nesting** (payment modal opened from confirm modal): Radix supports
  nested dialogs; verify z-order against Toaster (z-50).
- **Autoplay + pause-on-hover**: use embla autoplay `stopOnInteraction` +
  `stopOnMouseEnter` to preserve current behavior.

## Success criteria

- Hero renders corner-perfect at DPR 1.25 with swipe support.
- No hand-rolled overlay/carousel/select code remains in storefront paths.
- typecheck/lint/i18n green; no visual regression against the current design.
