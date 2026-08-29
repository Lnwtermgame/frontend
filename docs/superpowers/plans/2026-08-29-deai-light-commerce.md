# De-AI Light Commerce Reskin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flip the storefront from muted dark teal to a SEAGM-style light commerce theme (white cards, brand red, navy band) and remove the six AI signature patterns — admin stays dark via a scoped token override.

**Architecture:** One disciplined token layer (`--site-*` hex + `-rgb` mirrors + shadcn HSL vars) drives every storefront surface, so Task 1 re-skins the site in one commit; admin re-declares the old dark values under `.admin-dark` (Task 2); the remaining tasks are surgical component passes (sublabels, solid chips, trust strip, shadows, hero, docs).

**Tech Stack:** Next.js 16, Tailwind v3, shadcn/ui (already migrated), lucide-react.

**Spec:** `docs/superpowers/specs/2026-08-29-deai-light-commerce-design.md`

## Global Constraints

- Storefront flips to light; **admin must remain visually identical (dark)** after Task 2.
- No layout/structure/route/function changes. No icon library swap. No font changes.
- White-on-red passes AA-Large only: red fills carry white text ≥13px semibold, never small body text.
- Solid chip fills use the darker 700-series shades (green-700/info blue-700/red-700/amber-700) so white text passes AA **normal** at chip sizes (10–13px).
- Every task ends green: `npm run typecheck` 0 errors; `npm run lint` 0 new errors; `npm run check:i18n` green; `curl` 200 on `/th`, `/th/games`, `/th/dashboard/account`, `/th/admin/payments`.
- Commit only files inside `services/frontend`; never touch the stray `nul` file; never start/stop servers (dev server on :8000).
- Rule: never bare `text-muted` — use `text-muted-foreground`.
- One conventional commit per task.

---

### Task 1: Token flip — light commerce palette

**Files:**
- Modify: `src/app/globals.css` (the `:root` block only)

**Interfaces:**
- Produces: light values for every `--site-*`, `--site-*-rgb`, shadcn `--*` variable; `color-scheme: light`; red selection tint. Consumed by everything.

- [ ] **Step 1: Replace the token block** — inside `:root`, change `color-scheme: dark` → `light` and replace values (comments included):

```css
:root {
  color-scheme: light;
  --site-bg: #f4f5f7;
  --site-deep: #232a35;
  --site-surface: #ffffff;
  --site-raised: #f8f9fb;
  --site-border: #e6e8ec;
  --site-border-soft: #eef0f3;
  --site-accent: #e5262c;
  --site-accent-hover: #c81f24;
  --site-selection-bg: rgba(229, 38, 44, 0.16);
  --site-text: #1f2937;
  --site-muted: #5b6472;
  --site-dim: #8b93a1;
  --status-info: #2563eb;
  --status-success: #16a34a;
  --status-warning: #d97706;
  --status-danger: #dc2626;

  /* RGB channel mirrors for Tailwind alpha modifiers — keep in sync. */
  --site-bg-rgb: 244 245 247;
  --site-deep-rgb: 35 42 53;
  --site-surface-rgb: 255 255 255;
  --site-raised-rgb: 248 249 251;
  --site-border-rgb: 230 232 236;
  --site-border-soft-rgb: 238 240 243;
  --site-accent-rgb: 229 38 44;
  --site-accent-hover-rgb: 200 31 36;
  --site-text-rgb: 31 41 55;
  --site-muted-rgb: 91 100 114;
  --site-dim-rgb: 139 147 161;
  --status-info-rgb: 37 99 235;
  --status-success-rgb: 22 163 74;
  --status-warning-rgb: 217 119 6;
  --status-danger-rgb: 220 38 38;

  /* shadcn/ui variables — mapped onto the light palette (HSL of the hex above). */
  --background: 220 16% 96%;        /* #f4f5f7 */
  --foreground: 215 28% 17%;        /* #1f2937 */
  --primary: 358 79% 52%;           /* #e5262c */
  --primary-foreground: 0 0% 100%;
  --secondary: 220 27% 98%;         /* #f8f9fb */
  --secondary-foreground: 215 28% 17%;
  --muted: 220 27% 98%;
  --muted-foreground: 217 11% 40%;  /* #5b6472 */
  --accent: 220 27% 98%;
  --accent-foreground: 215 28% 17%;
  --destructive: 0 72% 51%;         /* #dc2626 */
  --destructive-foreground: 0 0% 100%;
  --border: 220 13% 91%;            /* #e6e8ec */
  --input: 220 13% 91%;
  --ring: 358 79% 52%;
  --card: 0 0% 100%;
  --card-foreground: 215 28% 17%;
  --popover: 0 0% 100%;
  --popover-foreground: 215 28% 17%;
  --radius: 0.5rem;
}
```

- [ ] **Step 2: Verify the flip is complete with zero component edits**

```bash
npm run typecheck
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/th
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/th/games
```

Expected: 0 errors; both 200. In the browser `/th` renders light (page bg #f4f5f7, cards white). Admin pages will ALSO flip light at this point — expected; Task 2 restores them. Do not "fix" admin here.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(theme): flip storefront tokens to light commerce palette (brand red)"
```

---

### Task 2: Admin dark scoping

**Files:**
- Modify: `src/app/globals.css` (append `.admin-dark` block after `:root`)
- Modify: `src/components/admin/AdminShell.tsx` (add the class to its outermost element)

**Interfaces:**
- Produces: `.admin-dark` re-declares the complete DARK token set; admin tree keeps the pre-flip look. Nothing outside `.admin-dark` is affected.

- [ ] **Step 1: Append the dark override block** to `globals.css` (values are the pre-flip dark palette, verbatim):

```css
/* Admin stays dark: the storefront flipped to light, admin re-declares the
   previous dark values scoped to its shell. Keep in sync with :root shape. */
.admin-dark {
  color-scheme: dark;
  --site-bg: #111315;
  --site-deep: #0d0f10;
  --site-surface: #191c1f;
  --site-raised: #22262a;
  --site-border: #30363b;
  --site-border-soft: #252b30;
  --site-accent: #63c7c2;
  --site-accent-hover: #7bd7d1;
  --site-selection-bg: rgba(99, 199, 194, 0.28);
  --site-text: #f3f6f5;
  --site-muted: #a4afae;
  --site-dim: #74807f;
  --status-info: #70a7e8;
  --status-success: #63c995;
  --status-warning: #e5b566;
  --status-danger: #e47c86;
  --site-bg-rgb: 17 19 21;
  --site-deep-rgb: 13 15 16;
  --site-surface-rgb: 25 28 31;
  --site-raised-rgb: 34 38 42;
  --site-border-rgb: 48 54 59;
  --site-border-soft-rgb: 37 43 48;
  --site-accent-rgb: 99 199 194;
  --site-accent-hover-rgb: 123 215 209;
  --site-text-rgb: 243 246 245;
  --site-muted-rgb: 164 175 174;
  --site-dim-rgb: 116 128 127;
  --status-info-rgb: 112 167 232;
  --status-success-rgb: 99 201 149;
  --status-warning-rgb: 229 181 102;
  --status-danger-rgb: 228 124 134;
  --background: 210 10% 7%;
  --foreground: 160 15% 96%;
  --primary: 177 47% 58%;
  --primary-foreground: 210 10% 7%;
  --secondary: 210 11% 15%;
  --secondary-foreground: 160 15% 96%;
  --muted: 210 11% 15%;
  --muted-foreground: 175 6% 67%;
  --accent: 210 11% 15%;
  --accent-foreground: 160 15% 96%;
  --destructive: 354 66% 69%;
  --destructive-foreground: 210 10% 7%;
  --border: 207 13% 17%;
  --input: 207 13% 17%;
  --ring: 177 47% 58%;
  --card: 210 11% 11%;
  --card-foreground: 160 15% 96%;
  --popover: 210 11% 11%;
  --popover-foreground: 160 15% 96%;
  min-height: 100vh;
  background-color: var(--site-bg);
  color: var(--site-text);
}
```

- [ ] **Step 2: Apply the class in `AdminShell.tsx`** — read the file, add `admin-dark` to the outermost rendered element's className (merge with existing classes; keep all current classes).

- [ ] **Step 3: Verify admin is dark again, storefront unaffected**

```bash
npm run typecheck
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/th/admin/payments
```

Expected: 0 errors; 200. DOM check (browser console): `getComputedStyle(document.querySelector('.admin-dark')).backgroundColor` → `rgb(17, 19, 21)`; `/th` body bg still `rgb(244, 245, 247)`.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/components/admin/AdminShell.tsx
git commit -m "feat(theme): scope admin shell to the dark palette (.admin-dark)"
```

---

### Task 3: Remove section sublabels (the mono-caps AI eyebrow)

**Files:**
- Modify: `src/components/ui/SectionHeader.tsx`
- Modify: all storefront call sites passing `sublabel` (grep first)

**Interfaces:**
- Produces: `SectionHeader({ title, actionHref, actionLabel, level })` — `sublabel` prop REMOVED from the interface (typecheck forces every call site clean). Admin's own headers (AdminPageHeader) are untouched.

- [ ] **Step 1: Grep call sites** — `grep -rn "sublabel=" src --include="*.tsx"` (expect ~20: page.tsx, PanelCard, gameId, catalog, news, support…). PanelCard forwards `sublabel` — remove the forward too.

- [ ] **Step 2: Simplify the component** — delete the `sublabel` prop from the interface, the destructure, and the eyebrow `<p>`; adjust the wrapper so the title stands alone:

```tsx
export function SectionHeader({
  title,
  actionHref,
  actionLabel,
  level = 2,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
  level?: 1 | 2;
}) {
  const Title = level === 1 ? "h1" : "h2";
  return (
    <div className="flex items-end justify-between mb-4">
      <Title
        className={
          level === 1
            ? "text-xl md:text-2xl font-extrabold text-site-text leading-tight"
            : "text-base md:text-lg font-bold text-site-text leading-tight"
        }
      >
        {title}
      </Title>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="text-[12px] text-site-accent hover:text-site-accent-hover transition-colors flex items-center gap-0.5 font-semibold"
        >
          {actionLabel} <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Remove every `sublabel` prop pass** found in Step 1 (delete the prop lines; PanelCard drops the prop from interface + forward).

- [ ] **Step 4: Verify + commit**

```bash
npm run typecheck && npm run check:i18n
grep -rn "sublabel" src --include="*.tsx" | wc -l   # expect 0
```

```bash
git add -A -- src && git commit -m "feat(deai): drop mono-caps section sublabels storefront-wide"
```

---

### Task 4: Solid chips (kill the translucent tint pills)

**Files:**
- Modify: `src/components/ui/Badge.tsx` (variant map → solid fills)
- Modify: `src/components/ui/GameTile.tsx`, `OfferCard.tsx`, `CouponCard.tsx`
- Modify: `src/components/products/PackageOption.tsx` (popular chip)

**Interfaces:**
- Badge keeps its API (`variant` + className). Chip fills use Tailwind 700-series defaults so white text passes AA normal at 10–13px.

- [ ] **Step 1: Badge variant map → solids**

```tsx
const variantClass: Record<string, string> = {
  success: "border-transparent bg-green-700 text-white",
  info: "border-transparent bg-blue-700 text-white",
  warning: "border-transparent bg-amber-700 text-white",
  danger: "border-transparent bg-red-700 text-white",
  neutral: "border-site-border bg-site-raised text-site-text",
};
```

- [ ] **Step 2: GameTile** — instant badge: `<Badge variant="success">` (now solid green) with `<Zap size={10} className="fill-current" />`; timed badge stays `variant="neutral"` (light gray solid). No other change.

- [ ] **Step 3: OfferCard** — promo badge `<Badge variant="success">` → switch to `variant="danger"` (solid red promo tag; label is `t("promotion_badge")`). Discount number keeps `text-status-danger font-bold tabular-nums`.

- [ ] **Step 4: CouponCard** — `%` number `text-site-accent` (red on white card); claimed state keeps `variant="success"` (now solid green + white). OFF label `text-site-accent font-semibold`.

- [ ] **Step 5: PackageOption popular chip** — keep `<Badge variant="danger">` (now solid red, Flame `fill-current`, white text — still ≥11px semibold per AA-Large for red-700? red-700 #b91c1c with white = 5.9:1 → AA normal, fine at 9px).

- [ ] **Step 6: Verify + commit** — browser: badges render solid with white text; no `bg-accent/10`-style translucency on storefront chips (`grep -rn "accent/10\|accent/15" src/components --include="*.tsx"` → only hero pill if still tinted; convert hero pill to solid in Task 5).

```bash
npm run typecheck && git add -A -- src && git commit -m "feat(deai): solid commerce chips replace translucent tint pills"
```

---

### Task 5: Trust strip, hero, card elevation

**Files:**
- Modify: `src/components/ui/TrustStrip.tsx`
- Modify: `src/components/ui/GameTile.tsx`, `OfferCard.tsx` (hover lift)
- Modify: `src/app/globals.css` (`.site-card` shadow)
- Modify: `src/app/[locale]/page.tsx` (hero pill solid)

**Interfaces:** none (visual only).

- [ ] **Step 1: `.site-card`** gains elevation: `@apply bg-site-surface border border-site-border-soft rounded-8 shadow-sm;`

- [ ] **Step 2: Hover lift** on clickable cards — GameTile image wrapper and OfferCard root: add `transition-all duration-200 hover:shadow-md hover:-translate-y-0.5` (GameTile applies to the tile wrapper div; keep `aspect-square`).

- [ ] **Step 3: TrustStrip** — replace the gray outline icons with filled colored circles (white glyph on solid brand circle):

```tsx
const circleColor: Record<string, string> = {
  shield: "bg-blue-700",
  zap: "bg-green-600",
  award: "bg-amber-500",
  headphones: "bg-site-deep",
};
// per item:
<div className={`w-9 h-9 rounded-full ${circleColor[key] ?? "bg-site-deep"} text-white flex items-center justify-center shrink-0`}>
  <item.icon size={18} strokeWidth={2.5} />
</div>
```

(The component receives items as `{icon, title, desc}` — derive `key` by mapping the icon component back, or change the strip to accept a `tone` field: extend `TrustItem` with optional `tone: "shield" | "zap" | "award" | "headphones"` and default per-position from the home page passes. Choose the `tone` field; update the home page's trustIconMap to pass it.)

- [ ] **Step 4: Hero pill** in `page.tsx`: badge pill → `bg-site-accent text-white border-transparent` (drop the `/15`/`/40` translucency).

- [ ] **Step 5: Verify + commit** — browser: cards lift on hover, trust strip shows colored circles, hero pill solid red; `/th/admin` still dark.

```bash
npm run typecheck && git add -A -- src && git commit -m "feat(deai): trust strip circles, solid hero pill, card elevation"
```

---

### Task 6: Docs + sweep

**Files:**
- Modify: `.impeccable.md` (Aesthetic Direction section)
- Modify: this plan's status / spec addendum (optional)

- [ ] **Step 1: Rewrite `.impeccable.md` Aesthetic Direction** to state: light commerce (#f4f5f7 page / white cards + shadow-sm), brand red #e5262c (AA-Large white text only), navy band #232a35 for header/footer, solid 700-series chips, no mono-caps eyebrows, lucide reserved for functional markers; admin is dark via `.admin-dark`.

- [ ] **Step 2: Full gates + sweep**

```bash
npm run typecheck && npm run lint --silent 2>&1 | grep -c "  error  "
npm run check:i18n
curl -s -o /dev/null -w "%{http_code} " http://localhost:8000/th; curl -s -o /dev/null -w "%{http_code} " http://localhost:8000/th/games; curl -s -o /dev/null -w "%{http_code} " http://localhost:8000/th/dashboard/account; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/th/admin/payments
```

Expected: 0 / 0 / green / `200 200 200 200`.

- [ ] **Step 3: Commit**

```bash
git add .impeccable.md && git commit -m "docs: light commerce theme recorded in design context"
```
