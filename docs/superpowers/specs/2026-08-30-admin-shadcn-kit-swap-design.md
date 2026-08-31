# Admin shadcn Adoption (Kit Swap) — Spec + Plan

**Date:** 2026-08-30
**Branch:** `feat/shadcn-storefront`
**Status:** Design approved (user chose API-preserving kit swap)

## Goal

Rewrite the internals of the admin component kit (`src/components/admin/*`) to
shadcn/Radix while preserving each component's public API — all 26 admin pages
upgrade at once with zero page-level edits. Admin stays dark (global tokens).

## Rules

- Public API of every kit component unchanged (props/events/exports).
- Dark theme via the existing global tokens + shadcn vars (already mapped).
- No new page files; deps: add `@radix-ui/react-alert-dialog` only.
- No TanStack/react-hook-form this round.
- Gates per task: typecheck 0, lint 0 new errors, i18n green,
  `/th/admin/payments` 200.

## Tasks

### Task A — Overlay + form primitives
- ConfirmDialog → shadcn AlertDialog (confirm/cancel semantics preserved).
- FormModal, ExportProductsModal → shadcn Dialog (title/footer/close preserved;
  inner form fields restyled to shadcn Input/Label/Textarea; selects → shadcn
  Select where the current markup is a raw `<select>`).
- FilterBar inputs/selects → shadcn Select/Input (API preserved).

### Task B — Table + micro primitives
- DataTable → shadcn Table markup (keep existing data/sort/pagination logic).
- Pagination → shadcn-styled buttons (API preserved).
- StatusBadge → shadcn Badge base with the admin variant map.
- AIGenerateButton/AIGenerateAllButton/StatCard/EmptyState → light restyle on
  shadcn button/card primitives (API preserved).

### Task C — Sweep + verify
- Grep admin tree for leftover raw overlays (`fixed inset-0` modals).
- Update `.impeccable.md` (admin section).
- Full gates + curl every key admin route.

## Acceptance

- All 26 admin pages render dark, unchanged layout, upgraded interactive
  primitives.
- Zero page-level (admin page) edits required by the kit swap.
