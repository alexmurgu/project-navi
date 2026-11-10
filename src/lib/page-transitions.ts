import type { createRouter } from "@tanstack/react-router";

type ViewTransitionOptions = Exclude<
  NonNullable<Parameters<typeof createRouter>[0]["defaultViewTransition"]>,
  boolean
>;

/**
 * iOS-style navigation motion, decided in one place.
 *
 * - Switching between bottom-nav tabs is instant, like a native tab bar.
 * - Going deeper (tab -> member, category, account, settings subpage) is a
 *   "push": the new page slides in from the right over the old one.
 * - Going back up via an in-app link is a "pop": the page slides away right.
 * - History traversals (iOS edge-swipe back, browser back/forward, closing a
 *   sheet) never animate. iOS already animates the swipe itself, and a second
 *   slide on top of it would play twice.
 *
 * The motion itself lives in globals.css under `:active-view-transition-type`.
 */

const TAB_ROOTS = new Set(["/", "/incomes", "/expenses", "/settings"]);
const NEVER_ANIMATE = new Set(["/login"]);

/**
 * Set by a popstate, consumed by the very next navigation decision. It also
 * expires, so a popstate that never produces a navigation (e.g. closing a
 * sheet) can't suppress a later, unrelated push.
 */
const HISTORY_POP_WINDOW_MS = 1000;
let pendingHistoryPopAt: number | null = null;
let tracking = false;

/** How deep a page sits: tabs are level 1, everything reached from them deeper. */
function depth(pathname: string) {
  if (TAB_ROOTS.has(pathname)) return 1;
  return Math.max(2, pathname.split("/").filter(Boolean).length);
}

/**
 * Remember history traversals. Must be called before the router is created:
 * listeners on window fire in registration order, and the router starts its
 * navigation from its own popstate listener.
 */
export function trackHistoryPops() {
  if (tracking || typeof window === "undefined") return;
  tracking = true;
  window.addEventListener(
    "popstate",
    () => {
      pendingHistoryPopAt = performance.now();
    },
    { capture: true },
  );
}

export const pageTransitions: ViewTransitionOptions = {
  types: ({ fromLocation, toLocation, pathChanged }) => {
    const fromHistory =
      pendingHistoryPopAt !== null &&
      performance.now() - pendingHistoryPopAt < HISTORY_POP_WINDOW_MS;
    pendingHistoryPopAt = null;
    if (fromHistory || !fromLocation || !pathChanged) return false;

    const from = fromLocation.pathname;
    const to = toLocation.pathname;
    if (NEVER_ANIMATE.has(from) || NEVER_ANIMATE.has(to)) return false;

    const fromDepth = depth(from);
    const toDepth = depth(to);
    if (toDepth > fromDepth) return ["push"];
    if (toDepth < fromDepth) return ["pop"];
    return false;
  },
};
