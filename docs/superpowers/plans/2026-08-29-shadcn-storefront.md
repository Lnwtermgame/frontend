# shadcn/ui Storefront Adoption — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hand-rolled storefront interactive primitives (carousel, dialogs, sheet, select, tabs, dropdown, badge, skeleton) with shadcn/ui themed to the existing dark/teal tokens — fixing the hero corner-clip bug class at fractional DPRs.

**Architecture:** shadcn copies Radix-based components into `src/components/ui` and themes them via CSS variables; we map `--background/--primary/--ring/...` onto the existing `site.*` palette so visuals stay identical. Migration is per-phase with both component sets coexisting; hand-rolled files are deleted only after their last storefront call site moves.

**Tech Stack:** Next.js 16, React 19, Tailwind v3, Radix UI, Embla Carousel (via shadcn Carousel), cva + tailwind-merge (already present).

**Spec:** `docs/superpowers/specs/2026-08-29-shadcn-adoption-design.md`

## Global Constraints

- Dark-only theme: shadcn variables are set on `:root` (no `.dark` toggling).
- Visual identity frozen: colors/fonts/layout come from existing tokens; no redesign.
- Tailwind stays v3 (hsl-var pattern; no v4 upgrade).
- Admin routes keep current components (out of scope).
- react-hot-toast stays.
- Every task must end green: `npm run typecheck` (0 errors), `npm run lint` (0 new errors), `npm run check:i18n` (all keys exist), `curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/th` → 200.
- i18n: any new user-facing string needs keys in all 9 files in `messages/` (run `node scripts/check-i18n-keys.js`).
- Commits: one per task, conventional commits (`feat:`/`fix:`/`chore:`).

---

### Task 1: Foundation — install deps, token mapping, verify no visual change

**Files:**
- Modify: `package.json` (deps via npm)
- Modify: `src/app/globals.css` (append shadcn variable block)
- Modify: `tailwind.config.js` (shadcn color entries, radius, animate plugin)
- Overwrite: `components.json`
- Create: `src/lib/utils.ts` — **already exists** (cn helper). Verify only.

**Interfaces:**
- Produces: shadcn CSS variables (`--background`, `--primary`, `--ring`, `--radius`, …) and tailwind color tokens (`bg-background`, `text-primary`, `border-border`, …) that all later tasks consume.

- [ ] **Step 1: Install runtime deps**

```bash
npm install tailwindcss-animate @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-checkbox embla-carousel-react embla-carousel-autoplay --no-audit --no-fund
```

Expected: installs into the hoisted root `node_modules` (workspace), no errors.

- [ ] **Step 2: Overwrite `components.json`** (file exists from old scaffolding — replace wholesale)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/lib/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 3: Append shadcn variables to `src/app/globals.css`** (inside `:root`, after the `-rgb` mirrors)

```css
  /* shadcn/ui variables — mapped onto the site palette (dark-only).
     HSL triplets computed from the hex tokens above. */
  --background: 210 10% 7%;        /* #111315 site-bg  */
  --foreground: 160 15% 96%;       /* #f3f6f5 site-text */
  --primary: 177 47% 58%;          /* #63c7c2 site-accent */
  --primary-foreground: 210 10% 7%;
  --secondary: 210 11% 15%;        /* #22262a site-raised */
  --secondary-foreground: 160 15% 96%;
  --muted: 210 11% 15%;
  --muted-foreground: 175 6% 67%;  /* #a4afae site-muted */
  --accent: 210 11% 15%;
  --accent-foreground: 160 15% 96%;
  --destructive: 354 66% 69%;      /* #e47c86 status-danger */
  --destructive-foreground: 210 10% 7%;
  --border: 207 13% 17%;           /* #252b30 site-border-soft */
  --input: 207 13% 17%;
  --ring: 177 47% 58%;
  --card: 210 11% 11%;             /* #191c1f site-surface */
  --card-foreground: 160 15% 96%;
  --popover: 210 11% 11%;
  --popover-foreground: 160 15% 96%;
  --radius: 0.5rem;
```

- [ ] **Step 4: Wire `tailwind.config.js`**

At the top of the file add the plugin import; in `module.exports` add `darkMode: ["class"]`, extend `colors` with the shadcn set, `borderRadius`, and `keyframes`/`animation`:

```js
const animate = require("tailwindcss-animate");
```

```js
  plugins: [animate],
```

Inside `theme.extend` add:

```js
      colors: {
        // …existing site/status/semantic entries stay untouched…
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        // …existing 4/6/8/12 entries stay…
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
```

- [ ] **Step 5: Verify nothing changed visually**

```bash
npm run typecheck && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/th
```

Expected: `0` errors, `200`. Open `/th` — identical to before.

- [ ] **Step 6: Commit**

```bash
git add package.json components.json src/app/globals.css tailwind.config.js package-lock.json ../package-lock.json 2>/dev/null; git add -u; git commit -m "feat(ui): shadcn foundation — tokens mapped to site palette"
```

---

### Task 2: Hotfix — per-slide self-clipping (ships before Embla)

**Files:**
- Modify: `src/app/globals.css` (add `.hero-slide` class)
- Modify: `src/app/[locale]/page.tsx` (slide div className)

**Interfaces:**
- Consumes: existing hero track structure.
- Produces: corner leak gone at any DPR; replaced entirely by Task 3.

- [ ] **Step 1: Add to `globals.css` `@layer components`**

```css
  /* Per-slide self-clip: a transformed child can escape an ancestor's
     rounded overflow on fractional DPRs, but a layer cannot escape its own
     clip-path. 7px = 8px frame radius minus 1px border (concentric). */
  .hero-slide {
    clip-path: inset(0 round 7px);
  }
```

- [ ] **Step 2: Add the class to each slide div in `page.tsx`**

```tsx
              <div
                key={slide.id}
                className="hero-slide relative h-[300px] w-full flex-[0_0_100%] md:h-[380px]"
              >
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/th
```

Expected: `0`, `200`. On the user's DPR-1.25 machine: no corner bleed (hard-refresh). Accepted trade-off: during the 500 ms slide transition the inner edges of both slides show 7px rounding — removed in Task 3.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css "src/app/[locale]/page.tsx"
git commit -m "fix(hero): per-slide clip-path stops corner leak on fractional DPRs"
```

---

### Task 3: Phase 1 — hero carousel → shadcn Carousel (Embla)

**Files:**
- Create: `src/components/ui/carousel.tsx` via CLI (canonical shadcn component)
- Modify: `src/app/[locale]/page.tsx` (hero section)
- Modify: `src/app/globals.css` (delete `.hero-clip`, keep `.hero-scrim`/`.hero-fade-bottom`/`.hero-slide` unused → delete `.hero-slide` too)

**Interfaces:**
- Consumes: `@/components/ui/carousel` exports `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`, type `CarouselApi`.
- Produces: hero uses Embla (swipe, loop, autoplay); `.hero-clip` deleted.

- [ ] **Step 1: Add the carousel component**

```bash
npx shadcn@latest add carousel --yes --overwrite
```

Expected: creates `src/components/ui/carousel.tsx` (canonical embla wrapper). If the CLI pulls v4-flavored utilities (e.g. `outline-none` → `outline-hidden`), replace any v4-only class with the v3 equivalent (`outline-none`) before committing.

- [ ] **Step 2: Rewire the hero in `page.tsx`**

Imports:

```tsx
import useEmblaCarousel from "embla-carousel-react"; // not needed directly — use shadcn wrapper
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
```

Replace the hero `<section>` internals (keep the section frame classes minus `overflow-hidden`/`hero-clip`; keep mouse/touch pause handlers). Core wiring:

```tsx
      <section
        className="relative rounded-8 border border-site-border-soft bg-site-deep"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        <Carousel
          className="w-full"
          opts={{ loop: true }}
          plugins={[Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true })]}
          setApi={setCarouselApi}
        >
          <CarouselContent className="m-0">
            {heroSlides.map((slide) => (
              <CarouselItem key={slide.id} className="relative h-[300px] md:h-[380px]">
                {/* …existing img + .hero-scrim + .hero-fade-bottom + content block, unchanged… */}
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* arrows + dots driven by carouselApi — keep existing markup/classes */}
      </section>
```

State:

```tsx
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);
```

Arrows: `carouselApi?.scrollPrev()` / `carouselApi?.scrollNext()`. Dots: `carouselApi?.scrollTo(i)`. Delete the `setHeroPaused`-driven `setInterval` effect and the old track `translateX` style. Note: `stopOnMouseEnter` replaces the pause-on-hover effect; keep `onTouchStart/End` handlers only if autoplay restart behavior requires them — with `stopOnInteraction: false` embla resumes itself, so delete the touch handlers.

- [ ] **Step 3: Delete the hacks**

Remove `.hero-clip` and `.hero-slide` blocks from `globals.css` (keep `.hero-scrim`, `.hero-fade-bottom`). Remove `heroPaused` state if unused.

- [ ] **Step 4: Verify**

```bash
npm run typecheck && npm run lint --silent 2>&1 | grep -c "  error  " ; npm run check:i18n 2>&1 | tail -1
```

Expected: `0` errors, lint errors count `0`, i18n green. Browser: corners clean at DPR 1.25 (user hard-refresh), swipe works on touch, arrow keys work, autoplay advances every 6 s and pauses while hovered.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/carousel.tsx "src/app/[locale]/page.tsx" src/app/globals.css
git commit -m "feat(hero): migrate carousel to shadcn/Embla — fixes corner clip + adds swipe"
```

---

### Task 4: Phase 2 — overlays → Radix Dialog

**Files:**
- Create: `src/components/ui/dialog.tsx`, `src/components/ui/sheet.tsx` (canonical shadcn, via `npx shadcn@latest add dialog sheet --yes --overwrite`)
- Modify: `src/app/[locale]/games/[gameId]/page.tsx` (confirm modal, payment modal)
- Modify: `src/components/layout/LanguageSwitcher.tsx` (mobile portal modal → Dialog)
- Modify: `src/components/products/*` call sites that render `<Sheet>` (package picker keeps API)
- Delete: `src/lib/hooks/use-focus-trap.ts`

**Interfaces:**
- Consumes: shadcn `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `Sheet`, `SheetContent` (`side="bottom"`).
- Produces: `Sheet` keeps its existing prop API (`isOpen`, `onClose`, `title`, `side`, `className`) so `<Sheet>` call sites don't change.

- [ ] **Step 1: Add components**

```bash
npx shadcn@latest add dialog sheet --yes --overwrite
```

- [ ] **Step 2: Convert the confirm-order modal** — replace the hand-rolled `fixed inset-0 … ` overlay + panel with:

```tsx
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0">
          {/* existing header row (icon + title + close moves to DialogContent's X — keep custom header, remove old close button) */}
          {/* existing two-column body, unchanged */}
        </DialogContent>
      </Dialog>
```

Remove `showConfirmModal` Escape/scroll-lock effect and `useFocusTrap(confirmDialogRef, …)` (Radix handles both). Keep the payment reset effects.

- [ ] **Step 3: Convert the payment-selection modal** the same way (`<Dialog open={isPaymentSelectOpen} onOpenChange={setIsPaymentSelectOpen}>`, `className="max-w-5xl"`), delete `paymentDialogRef` + its effect.

- [ ] **Step 4: Rewrite `Sheet.tsx` internals to Radix** keeping the public API:

```tsx
"use client";
import * as React from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  side?: "left" | "right" | "bottom";
  className?: string;
}

export function Sheet({ isOpen, onClose, children, title, side = "bottom", className }: SheetProps) {
  const t = useTranslations();
  const titleId = React.useId();
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/60" />
        <DialogPrimitive.Content
          aria-labelledby={title ? titleId : undefined}
          className={cn(
            "fixed z-[70] flex flex-col overflow-hidden border-site-border bg-site-surface focus:outline-none",
            side === "bottom" && "bottom-0 left-0 right-0 max-h-[90vh] rounded-t-12 border-t",
            side === "left" && "top-0 bottom-0 left-0 w-[85vw] max-w-sm border-r",
            side === "right" && "top-0 bottom-0 right-0 w-[85vw] max-w-sm border-l",
            className,
          )}
        >
          <DialogPrimitive.Title id={titleId} className="sr-only">{title}</DialogPrimitive.Title>
          {/* existing header row + scrollable body, unchanged */}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
```

- [ ] **Step 5: LanguageSwitcher mobile modal** → `<Dialog open={isOpen} onOpenChange={setIsOpen}>` with `DialogContent className="max-w-sm p-5"` wrapping the existing grid; delete the `createPortal`/`AnimatePresence` block.

- [ ] **Step 6: Delete the hand-rolled trap**

```bash
git rm src/lib/hooks/use-focus-trap.ts
```

(gameId page: remove `useFocusTrap` import + both call lines; the refs go too.)

- [ ] **Step 7: Verify**

Same green trio + browser: open each modal → Tab cycles inside, Escape closes, focus returns to the trigger; payment modal opens above confirm modal; mobile sheet slides from bottom.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(ui): migrate overlays to Radix Dialog — modals, sheet, language switcher"
```

---

### Task 5: Phase 3 — forms (Select, Checkbox, Input restyle)

**Files:**
- Create: `src/components/ui/select.tsx`, `src/components/ui/checkbox.tsx`, `src/components/ui/label.tsx` via `npx shadcn@latest add select checkbox label --yes --overwrite`
- Modify: `src/app/[locale]/games/[gameId]/page.tsx` (dynamic fields + payment selects, terms checkbox)
- Modify: `src/components/ui/Input.tsx` (restyle internals to shadcn tokens, keep API)

**Interfaces:**
- Produces: shadcn `Select` (value/onOpenChange composition), `Checkbox` (checked/onCheckedChange), `Label`. `ui/Input.tsx` keeps its existing props (`label`, `error`, …) — internals restyled only.

- [ ] **Step 1: Add components**

```bash
npx shadcn@latest add select checkbox label --yes --overwrite
```

- [ ] **Step 2: Migrate dynamic field `select` in `gameId/page.tsx`**

Replace the `<Select label=… options=… value=… onChange=…>` usage for `field.type === "select"` with:

```tsx
<Select
  value={fieldValues[field.name] || ""}
  onValueChange={(value) => handleFieldChange(field.name, value)}
>
  <SelectTrigger className="w-full" aria-label={translateLabel(field.label)}>
    <SelectValue placeholder={t("choose_placeholder", { field: translateLabel(field.label) })} />
  </SelectTrigger>
  <SelectContent>
    {field.options?.map((opt) => (
      <SelectItem key={opt.value} value={opt.value} disabled={/* keep existing availability rule if any */ false}>
        {opt.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

Keep the existing label row (bold text + required `*`) above the trigger. Payment-modal radio list stays a radio list (Radix RadioGroup is Task-6 optional — do not change here).

- [ ] **Step 3: Terms checkbox**

```tsx
<Checkbox
  id="terms"
  checked={termsAccepted}
  onCheckedChange={(v) => setTermsAccepted(v === true)}
  className="mt-0.5"
/>
<Label htmlFor="terms" className="text-[10px] font-medium text-site-muted leading-tight">
  {/* existing rich label with links, unchanged */}
</Label>
```

- [ ] **Step 4: Restyle `ui/Input.tsx` internals** to shadcn token classes (`border-input bg-background ring-offset-background focus-visible:ring-2 focus-visible:ring-ring …`) keeping its props and call sites untouched.

- [ ] **Step 5: Verify + commit**

Green trio + browser: choose a product with a select field → open select (keyboard navigable), TrueMoney minimum rule still visible per item, terms checkbox gates the confirm button.

```bash
git add -A && git commit -m "feat(ui): shadcn Select/Checkbox in purchase flow — restyle Input on tokens"
```

---

### Task 6: Phase 4 — tabs, dropdown, badge, skeleton

**Files:**
- Create: `src/components/ui/tabs.tsx`, `src/components/ui/dropdown-menu.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/skeleton.tsx` via `npx shadcn@latest add tabs dropdown-menu badge skeleton --yes --overwrite`
- Modify: `src/app/[locale]/games/[gameId]/page.tsx` (tab bar → shadcn Tabs)
- Modify: `src/components/layout/MainNav.tsx` (user dropdown → shadcn DropdownMenu)
- Modify: `src/components/ui/Badge.tsx` → thin adapter over shadcn Badge keeping variants `success|info|neutral|danger` (call sites unchanged)
- Modify: `src/components/ui/Skeleton.tsx` → re-export shadcn Skeleton (keep named exports `SkeletonHero`, `SkeletonOfferCard`, …)

**Interfaces:**
- Produces: `Badge` keeps `variant` prop values used across ~100 call sites; `Skeleton` keeps its named export API.

- [ ] **Step 1: Add components**

```bash
npx shadcn@latest add tabs dropdown-menu badge skeleton --yes --overwrite
```

- [ ] **Step 2: Game page tabs → shadcn Tabs** (`value`/`onValueChange` with `activeTab`, keep both tab triggers' labels/icons; mobile always-info behavior: render the info content under both tabs on mobile as today, i.e. keep the existing conditional classes inside `TabsContent`).

- [ ] **Step 3: MainNav user menu → DropdownMenu** (trigger = existing avatar chip button with `asChild`; items: admin/account/credits/orders/logout with existing icons/labels; keep `onClick` close behavior via `onSelect`).

- [ ] **Step 4: Badge adapter**

```tsx
import { Badge as ShadcnBadge } from "./badge";
import { cn } from "@/lib/utils";

const variantClass: Record<string, string> = {
  success: "border-status-success/40 bg-status-success/15 text-status-success",
  info: "border-status-info/40 bg-status-info/15 text-status-info",
  neutral: "border-site-border bg-site-raised text-site-muted",
  danger: "border-status-danger/40 bg-status-danger/15 text-status-danger",
};

export function Badge({ variant = "neutral", className, ...props }) {
  return <ShadcnBadge variant="outline" className={cn(variantClass[variant], className)} {...props} />;
}
```

- [ ] **Step 5: Verify + commit** — green trio; browser: tabs switch on the product page, user dropdown opens/closes with keyboard, badges render with their tint colors (now real, thanks to the RGB mirrors).

```bash
git add -A && git commit -m "feat(ui): shadcn Tabs/DropdownMenu/Badge/Skeleton across storefront"
```

---

### Task 7: Phase 5 — sweep, delete dead code, docs

**Files:**
- Delete: storefront-dead hand-rolled files confirmed by grep (candidates: `src/components/search/SearchBar.tsx`, `src/components/search/SmartSearchBar.tsx` — verify zero imports first; old select internals)
- Modify: `.impeccable.md` (Technical Stack + component conventions), this plan's status

- [ ] **Step 1: Verify no storefront imports of replaced internals remain**

```bash
grep -rn "use-focus-trap\|useCart\|cart-context" src --include="*.tsx" --include="*.ts"
grep -rn "from \"@/components/ui/Select\"" src --include="*.tsx" | grep -v admin
```

Expected: no storefront hits (admin hits stay).

- [ ] **Step 2: Delete confirmed-dead files** (only with zero imports; list each in the commit message).

- [ ] **Step 3: Update `.impeccable.md`** — Technical Stack gains: "Components: shadcn/ui (Radix + Embla), themed via shadcn CSS variables mapped to site tokens."

- [ ] **Step 4: Full verification + commit**

```bash
npm run typecheck && npm run check:i18n
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/th
git add -A && git commit -m "chore(ui): sweep dead primitives, document shadcn adoption"
```

---

## Out of scope (recorded)

- Admin surfaces, Tailwind v4, toast migration, CJK font stacks.
