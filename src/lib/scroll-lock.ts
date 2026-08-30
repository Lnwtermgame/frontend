"use client";

import { useEffect } from "react";

/**
 * Compensated body scroll lock for hand-rolled overlays.
 *
 * Radix dialogs/Selects get this from react-remove-scroll automatically;
 * custom drawers/modals that toggle body overflow themselves must use this
 * helper so the scrollbar's removal is margin-compensated and the page
 * doesn't shift while the overlay is open.
 */
export function lockBodyScroll(): () => void {
  if (typeof document === "undefined") return () => {};
  const body = document.body;
  const gap = window.innerWidth - document.documentElement.clientWidth;
  const prevOverflow = body.style.overflow;
  const prevMarginRight = body.style.marginRight;

  body.style.overflow = "hidden";
  if (gap > 0) body.style.marginRight = `${gap}px`;

  return () => {
    body.style.overflow = prevOverflow;
    body.style.marginRight = prevMarginRight;
  };
}

/**
 * Single policy for every body scroll lock (Radix dialogs/Selects via
 * react-remove-scroll set <body data-scroll-locked>; lockBodyScroll above
 * manages its own). Inline !important beats every author rule, so the
 * behaviour no longer depends on stylesheet cascade order:
 *
 * - non-modal locks (Select menus): keep the page scrollbar and scrolling
 *   — opening a dropdown must not flicker;
 * - modal locks (dialog / alertdialog): hide overflow and compensate the
 *   removed scrollbar with an equivalent margin so nothing shifts.
 */
export function ScrollLockManager() {
  useEffect(() => {
    const body = document.body;
    let lastKnownGap = 0;

    const modalOpen = () =>
      !!document.querySelector(
        '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]',
      );

    const apply = () => {
      if (!body.hasAttribute("data-scroll-locked")) {
        const gap = window.innerWidth - document.documentElement.clientWidth;
        if (gap > 0) lastKnownGap = gap;
        body.style.removeProperty("overflow");
        body.style.removeProperty("margin-right");
        return;
      }
      if (modalOpen()) {
        body.style.setProperty("overflow", "hidden", "important");
        body.style.setProperty("margin-right", `${lastKnownGap}px`, "important");
      } else {
        body.style.setProperty("overflow", "visible", "important");
        body.style.setProperty("margin-right", "0px", "important");
      }
    };

    apply();

    const observer = new MutationObserver(apply);
    observer.observe(body, { attributes: true, attributeFilter: ["data-scroll-locked"] });
    // A dialog can open on top of an existing non-modal lock (Select →
    // payment flow), upgrading the lock to modal behaviour.
    observer.observe(document.documentElement, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      body.style.removeProperty("overflow");
      body.style.removeProperty("margin-right");
    };
  }, []);

  return null;
}
