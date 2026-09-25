/**
 * Responsive audit — measures every public route at the four Hallmark
 * non-negotiable widths (320 / 375 / 414 / 768) and reports four classes of
 * failure that a screenshot review misses.
 *
 *   overflow   body.scrollWidth > viewport. This is the honest check: `html`
 *              carries `overflow-x: clip`, which clamps html.scrollWidth to the
 *              viewport and always reads clean, while the real damage still
 *              happens. Content spills and gets silently cut off.
 *   leaks      elements past the viewport with no clipping/scrolling ancestor,
 *              i.e. width genuinely escaping the page box.
 *   tapTargets interactive elements under 44px tall (WCAG 2.5.8).
 *   tinyText   leaf text under 12px.
 *
 * Usage:
 *   node scripts/responsive-audit.mjs                     # all routes
 *   node scripts/responsive-audit.mjs /th/mobile-recharge  # one route
 *
 * NOTE — product-backed pages need live API data. The backend rate-limits
 * (HTTP 429) after a few hundred requests in a short window; when that happens
 * the catalog renders its empty state and the measurements are VACUOUS (an
 * empty grid cannot overflow). If a run reports implausibly clean results,
 * check for 429s before trusting it:
 *   page.on("response", r => r.url().includes("/api/products") && console.log(r.status()))
 * The script prints a warning when it detects no rendered product content.
 *
 * Requires the dev server running (npm run dev → :8100) and playwright
 * available. Playwright is NOT a project dependency — install it in a scratch
 * dir and run the file from there, e.g.
 *   npm --prefix "$TEMP/resp-scan" install playwright
 *   cp scripts/responsive-audit.mjs "$TEMP/resp-scan/" && node "$TEMP/resp-scan/responsive-audit.mjs"
 */

import { chromium } from "playwright";

const BASE = process.env.AUDIT_BASE ?? "http://localhost:8100";
const WIDTHS = [320, 375, 414, 768];

const ROUTES = [
  "/th",
  "/th/games",
  "/th/card",
  "/th/mobile-recharge",
  "/th/news",
  "/th/support",
  "/th/support/faq",
  "/th/support/contact",
  "/th/support/tickets",
  "/th/login",
  "/th/register",
  "/th/forgot-password",
  "/th/dashboard",
  "/th/dashboard/orders",
  "/th/dashboard/account",
  "/th/dashboard/coupons",
  "/th/dashboard/notifications",
  "/th/dashboard/credits",
  "/th/dashboard/favorite",
  "/th/dashboard/invoice",
  // mobile-recharge is state-dependent: the order-summary card holds different
  // operator names per country, and long ones are what pin the layout.
  "/th/mobile-recharge?country=TH",
  "/th/mobile-recharge?country=PH",
];

const PROBE = () => {
  const vw = document.documentElement.clientWidth;

  const escapesPage = (el) => {
    const b = el.getBoundingClientRect();
    if (b.width <= 0 || b.height <= 0) return false;
    if (b.right <= vw + 1) return false;
    if (getComputedStyle(el).position === "fixed") return false;
    let p = el.parentElement;
    while (p && p !== document.documentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === "hidden" || ox === "clip" || ox === "auto" || ox === "scroll") return false;
      p = p.parentElement;
    }
    return true;
  };

  const leaks = [];
  for (const el of document.querySelectorAll("main *, header *, footer *")) {
    if (!escapesPage(el)) continue;
    leaks.push({
      cls: String(el.className).slice(0, 56),
      right: Math.round(el.getBoundingClientRect().right),
    });
  }

  const tapTargets = [];
  for (const el of document.querySelectorAll("main a, main button, main input, main select, footer a")) {
    const b = el.getBoundingClientRect();
    if (b.width <= 0 || b.height <= 0) continue;
    if (b.height >= 44) continue;
    tapTargets.push({
      text: el.textContent.replace(/\s+/g, " ").trim().slice(0, 22) || "(icon)",
      h: Math.round(b.height),
      w: Math.round(b.width),
      cls: String(el.className).slice(0, 34),
    });
  }

  const tinyText = [];
  for (const el of document.querySelectorAll("main p, main span, main li, footer span")) {
    if (!el.textContent.trim() || el.children.length) continue;
    const b = el.getBoundingClientRect();
    if (b.width <= 0) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs >= 12) continue;
    tinyText.push({
      text: el.textContent.replace(/\s+/g, " ").trim().slice(0, 22),
      fs,
      cls: String(el.className).slice(0, 34),
    });
  }

  const dedupe = (rows, key) => [...new Map(rows.map((r) => [key(r), r])).values()];

  return {
    vw,
    body: document.body.scrollWidth,
    overflows: document.body.scrollWidth > vw + 1,
    // Count of product-ish cards actually mounted — used by the caller to detect
    // a vacuous run (empty grid = nothing to overflow = false pass).
    renderedItems:
      document.querySelectorAll('[role="radio"], article, [data-product-tile]').length +
      document.querySelectorAll("main a[href*='/games/'], main a[href*='/card/']").length,
    leaks: dedupe(leaks, (l) => l.cls).slice(0, 4),
    tapTargets: dedupe(tapTargets, (t) => t.cls + t.h).slice(0, 8),
    tinyText: dedupe(tinyText, (t) => t.cls + t.fs).slice(0, 6),
  };
};

const only = process.argv[2];
const routes = only ? [only] : ROUTES;

const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
const failures = [];
const vacuous = [];

// A 429 from the product API makes catalog pages render their empty state, and an
// empty grid cannot overflow — so a "clean" run would be a false pass. Track it.
const rateLimited = new Set();
page.on("response", (r) => {
  if (r.url().includes("/api/products") && r.status() === 429) rateLimited.add(r.status());
});

for (const route of routes) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 40_000 });
    } catch {
      console.log(`ERR  ${route} @${width} — navigation failed`);
      continue;
    }
    await page.waitForTimeout(600);
    const r = await page.evaluate(PROBE);

    // Only flag a genuinely empty catalog: product routes that rendered NO
    // cards and NO product links. (`/th/card` lists cards as <a> tiles, not
    // radios, so a link count is part of the signal.)
    if (r.renderedItems === 0 && /\/games$|\/card$|mobile-recharge/.test(route)) {
      vacuous.push(route);
    }

    const bad = r.overflows || r.leaks.length > 0;
    if (!bad) continue;

    failures.push({ route, width, ...r });
    const delta = r.body - r.vw;
    console.log(
      `FAIL ${route.padEnd(42)} @${String(width).padStart(4)}  body=${r.body}  +${delta}px`,
    );
    if (r.leaks.length) console.log(`       leak: ${JSON.stringify(r.leaks)}`);
  }
}

await browser.close();

console.log("");
if (failures.length === 0) {
  console.log(`clean — no overflow across ${routes.length} routes x ${WIDTHS.length} widths`);
} else {
  console.log(`${failures.length} failing route/width combinations`);
}

if (vacuous.length) {
  console.log("");
  console.log(`⚠ ${vacuous.length} measurements had an EMPTY product grid — not trustworthy:`);
  console.log(`  ${[...new Set(vacuous)].join(", ")}`);
  if (rateLimited.size) {
    console.log("  Cause: product API returned HTTP 429 (rate limited). Wait and re-run.");
  }
}

process.exit(failures.length ? 1 : 0);
