import { describe, expect, it } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonRegion } from "@/components/ui/skeleton-region";
import { SkeletonList } from "./list-skeletons";

// vitest include เฉพาะ *.test.ts → ใช้ createElement แทน JSX
function render(node: ReactNode): HTMLElement {
  const html = renderToStaticMarkup(
    createElement(NextIntlClientProvider, {
      locale: "th",
      messages: { common: { loading: "กำลังโหลด" } },
      children: node,
    }),
  );
  const host = document.createElement("div");
  host.innerHTML = html;
  return host;
}

describe("Skeleton", () => {
  it("ซ่อนจาก screen reader และมี data-slot ให้ region ปิด animation ซ้อน", () => {
    const el = render(createElement(Skeleton, { className: "h-4 w-10" })).firstElementChild!;
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.getAttribute("data-slot")).toBe("skeleton");
    expect(el.className).toContain("skeleton");
    expect(el.className).toContain("h-4 w-10");
  });
});

describe("SkeletonRegion", () => {
  it("ประกาศสถานะโหลดครั้งเดียวด้วย role=status + aria-busy", () => {
    const host = render(createElement(SkeletonRegion, { children: createElement(Skeleton) }));
    const region = host.querySelector('[role="status"]')!;
    expect(region).not.toBeNull();
    expect(region.getAttribute("aria-busy")).toBe("true");
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(region.querySelector(".sr-only")?.textContent).toBe("กำลังโหลด");
    expect(host.querySelectorAll('[role="status"]')).toHaveLength(1);
  });

  it("ใช้ label ที่ส่งมาแทนข้อความ default", () => {
    const host = render(
      createElement(SkeletonRegion, { label: "กำลังค้นหา", children: createElement(Skeleton) }),
    );
    expect(host.querySelector(".sr-only")?.textContent).toBe("กำลังค้นหา");
  });
});

describe("SkeletonList", () => {
  it("ทำซ้ำตาม count ภายใน region เดียว พร้อม layout class ของ list จริง", () => {
    const host = render(
      createElement(SkeletonList, {
        count: 3,
        className: "space-y-2.5",
        children: (i: number) => createElement(Skeleton, { className: `row-${i}` }),
      }),
    );
    const region = host.querySelector('[role="status"]')!;
    expect(region.className).toContain("space-y-2.5");
    expect(region.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
    expect(region.querySelector(".row-2")).not.toBeNull();
  });
});
