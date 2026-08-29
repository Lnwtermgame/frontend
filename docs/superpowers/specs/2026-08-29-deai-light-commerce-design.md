# De-AI Reskin — Light Commerce + Brand Red — Design

**Date:** 2026-08-29
**Status:** Approved in session (direction + palette + de-AI moves); spec review pending
**Branch:** `feat/light-commerce-reskin` (stacked on `feat/shadcn-storefront`)
**Scope:** Storefront surfaces of `services/frontend`. Admin stays dark (scoped override).

## Context

The user's diagnosis: the site "looks AI-generated, not a production site like SEAGM."
The five confirmed AI tells, in order of visibility:

1. **Muted teal on near-black** (#63c7c2 on #111315) — the calm desaturated dark
   theme every AI produces. Real commerce brands use a loud, saturated brand
   color on light surfaces.
2. **Mono-tone surfaces** — dark gray cards on darker gray with hairline
   borders, uniform 8px radius, no elevation. SEAGM: white cards floating on a
   light gray page with real shadows.
3. **Thin outline lucide icons at 10–16px inside translucent tint pills**
   (`bg-accent/10`) repeated across trust strip, game tiles, badges.
4. **Uppercase letter-spaced sublabels** under every section heading
   ("AVAILABLE COUPONS") — the mono-caps eyebrow AI tell. SEAGM uses plain
   bold headings.
5. **Flat gray text hierarchy** and uniform spacing everywhere.

The token system is disciplined (`site.*`/`status.*` + `-rgb` mirrors + shadcn
variables mapped to them), so flipping the palette re-skins the whole
storefront at once. Component-level tells need a targeted pass.

## Goals

- Storefront reads as a real Thai game-top-up commerce site (SEAGM register:
  light page, white cards with shadows, saturated brand red, dark navy
  header/footer band, solid promo chips).
- Remove the six AI signature patterns (below).
- No layout/structure/function changes; the shadcn migration just landed is
  untouched except theming values.

## Non-Goals

- Admin stays dark (it shares the global tokens today — requires the scoped
  override task below; its internal look does not change).
- No font changes (Noto Sans Thai stays), no icon library swap (lucide stays —
  only its usage patterns change), no new components, no route changes.

## Palette (approved)

| Token | Old (dark) | New (light commerce) |
|---|---|---|
| `--site-bg` | #111315 | #f4f5f7 |
| `--site-surface` | #191c1f | #ffffff |
| `--site-raised` | #22262a | #ffffff (differentiated by shadow, not fill) |
| `--site-deep` | #0d0f10 | #232a35 (navy band: header/footer) |
| `--site-accent` | #63c7c2 | #e5262c (hover #c81f24) |
| `--site-text` | #f3f6f5 | #1f2937 |
| `--site-muted` | #a4afae | #5b6472 |
| `--site-dim` | #74807f | #8b93a1 |
| `--site-border` | #30363b | #e6e8ec |
| `--site-border-soft` | #252b30 | #eef0f3 |
| `--status-info` | #70a7e8 | #2563eb |
| `--status-success` | #63c995 | #16a34a |
| `--status-warning` | #e5b566 | #d97706 |
| `--status-danger` | #e47c86 | #dc2626 |

All `-rgb` mirrors and the shadcn variable block (`--background`, `--primary`,
`--muted-foreground`, `--border`, `--ring`, `--card`, …) update in the same
commit so both class namespaces stay in sync. `color-scheme: dark` → `light`.
Selection tint flips to red-based. WCAG: white on #e5262c passes AA-Large only
— button labels are ≥13px semibold (ok); small text on red is forbidden.

## The six de-AI moves

1. **Delete section sublabels** storefront-wide: remove the `sublabel` prop
   usage/eyebrow row from SectionHeader rendering (keep prop optional for
   admin, hidden on storefront) — SEAGM-style plain bold headings.
2. **Tint pills → solid chips**: GameTile status badge (solid green "เติมทันที"
   / solid gray "30-60 นาที"), OfferCard promo tag + discount (solid red),
   CouponCard claim state (solid), popular Flame badge (solid red).
3. **Trust strip**: filled circular colored icons (green/navy/orange) instead
   of gray outline icons; no pill borders.
4. **Card elevation**: `site-card` gains `shadow-sm`, hover-capable cards
   (`GameTile`, `OfferCard`, news cards) get `hover:shadow-md` +
   `hover:-translate-y-0.5` transition; borders soften to the new light border.
5. **Hero**: scrim flips to a white left-shelf (`color-mix` with new bg makes
   this automatic), promo pill solid red; dots/arrows re-token automatically —
   verify arrow contrast on light art.
6. **Lucide usage discipline**: no outline icons inside chips/badges except
   functional markers; status icons use `fill` variants where they exist
   (Flame already does); sizes stay 10–16px only inside chips.

## Required tasks (implementation order)

1. **Token flip** (`globals.css`): palette + `-rgb` mirrors + shadcn vars +
   `color-scheme` + selection; verify /th renders light with zero component
   edits.
2. **Admin dark scoping**: re-declare the entire dark token set (incl. mirrors
   + shadcn vars) under a `.admin-dark` class applied by `AdminShell`'s root
   (and admin layout wrappers) so 29 admin files keep the dark look unchanged.
3. **SectionHeader sublabel removal** (storefront) — delete prop passes at all
   storefront call sites.
4. **Solid chips pass**: Badge variants become solid fills with white text
   (success/danger) and solid neutral; GameTile/OfferCard/CouponCard/package
   "popular" chip updates.
5. **Trust strip + hero + card shadows** pass.
6. **Docs**: `.impeccable.md` aesthetic section rewritten (light commerce,
   brand red, chips, shadows); this spec gains an addendum of what landed.

## Acceptance criteria (each task, plus final)

- `npm run typecheck` 0 errors; `npm run lint` 0 new errors;
  `npm run check:i18n` green; `/th`, `/th/games`, `/th/dashboard/account`,
  `/th/admin` (dark intact) all 200.
- Storefront pages visually light; admin visually unchanged (dark).
- Human pass on the owner's DPR-1.25 screen: hero corners clean, chips legible,
  white-on-red CTAs readable.
- No new user-facing copy (no i18n changes except removing sublabel keys from
  usage — keys may remain in message files).

## Risks

- **Admin coupling** (confirmed: 29 files share tokens) — mitigated by task 2;
  verify with a screenshot-equivalent DOM check on /th/admin after task 1+2.
- **Hardcoded darks**: hero fade uses `color-mix` with `--site-bg` (auto-
  flips); Toaster already uses tokens; flag-icons unaffected. Any remaining
  hardcoded dark hex found during the pass gets tokenized.
- **White-on-red contrast**: AA-Large only — audit red surfaces during the
  chips pass; small text switches to dark-on-light-red or white ≥13px semibold.
- **Selection/scrollbar** styling keyed to dark values — re-token.
