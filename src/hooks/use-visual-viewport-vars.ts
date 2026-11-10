import { useEffect } from "react";

/**
 * Publishes the on-screen keyboard geometry as CSS variables on <html>:
 *
 * - `--vv-height`: height of the visible area (viewport minus keyboard).
 * - `--keyboard-inset`: distance from the layout viewport's bottom edge to the
 *   visible area's bottom edge, i.e. how much of fixed bottom UI is covered.
 * - `--vv-offset-top`: how far iOS has panned the visible area down.
 * - `data-keyboard-open` attribute while an on-screen keyboard is showing.
 *
 * iOS overlays the keyboard on top of the page without resizing the layout
 * viewport, so `bottom: 0` / `dvh` sheets end up hidden behind it. Bottom
 * sheets consume these in globals.css to keep their content above it.
 */
const KEYBOARD_MIN_HEIGHT = 120;

export function useVisualViewportVars() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const root = document.documentElement;
    let frame = 0;

    const apply = () => {
      frame = 0;
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.setProperty("--vv-height", `${vv.height}px`);
      root.style.setProperty("--keyboard-inset", `${inset}px`);
      root.style.setProperty("--vv-offset-top", `${vv.offsetTop}px`);
      // Small insets come from browser chrome, not a keyboard.
      root.toggleAttribute("data-keyboard-open", inset > KEYBOARD_MIN_HEIGHT);

      // Once the sheet has shrunk, keep the field being typed into visible.
      if (inset > 0) {
        const active = document.activeElement;
        if (active instanceof HTMLElement && active.closest('[data-slot="sheet-content"]')) {
          active.scrollIntoView({ block: "nearest" });
        }
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    apply();
    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);

    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener("resize", schedule);
      vv.removeEventListener("scroll", schedule);
      root.style.removeProperty("--vv-height");
      root.style.removeProperty("--keyboard-inset");
      root.style.removeProperty("--vv-offset-top");
      root.removeAttribute("data-keyboard-open");
    };
  }, []);
}
