import { useEffect, useRef } from "react";

/**
 * System back button / gesture integration for modals and sheets.
 *
 * Each open sheet owns one history entry. Pressing back pops that entry and
 * closes the top-most sheet instead of leaving the page; closing a sheet from
 * the UI removes its entry again so history never fills up with stale entries.
 *
 * All sheets share a single module-level stack and `popstate` listener. That
 * matters because `history.back()` is asynchronous: when one sheet closes and
 * another opens in the same tick (e.g. "Add" chooser -> "New expense"), the
 * new sheet's entry is pushed only after the pending back navigation has
 * landed, so the stale `popstate` can never close the sheet that just opened.
 */

interface SheetEntry {
  id: number;
  close: () => void;
}

const HISTORY_KEY = "__naviSheet";
/** Safety net in case a `popstate` we are waiting for never arrives. */
const PENDING_BACK_TIMEOUT_MS = 400;

const stack: SheetEntry[] = [];
const queuedPushes: SheetEntry[] = [];
let pendingBacks = 0;
let pendingBackTimer: ReturnType<typeof setTimeout> | undefined;
let listening = false;
let nextId = 1;

function currentSheetId(): number | undefined {
  return window.history.state?.[HISTORY_KEY];
}

function pushEntry(entry: SheetEntry) {
  try {
    // Preserve the router's own state keys so TanStack Router keeps working.
    window.history.pushState(
      { ...window.history.state, [HISTORY_KEY]: entry.id },
      "",
      window.location.href,
    );
    stack.push(entry);
  } catch {
    // Browser refused pushState: the sheet still works, just without back support.
  }
}

function flushQueuedPushes() {
  while (queuedPushes.length > 0) {
    pushEntry(queuedPushes.shift()!);
  }
}

function settlePendingBack() {
  pendingBacks = Math.max(0, pendingBacks - 1);
  if (pendingBacks === 0) {
    clearTimeout(pendingBackTimer);
    flushQueuedPushes();
  }
}

function handlePopState() {
  if (pendingBacks > 0) {
    // This pop was triggered by us closing a sheet programmatically.
    settlePendingBack();
    return;
  }
  // User pressed back: close the top-most sheet whose entry was just popped.
  const top = stack.pop();
  top?.close();
}

function ensureListener() {
  if (listening) return;
  window.addEventListener("popstate", handlePopState);
  listening = true;
}

function openSheet(entry: SheetEntry) {
  ensureListener();
  if (pendingBacks > 0) {
    queuedPushes.push(entry);
  } else {
    pushEntry(entry);
  }
}

function closeSheet(id: number) {
  const queuedIndex = queuedPushes.findIndex((e) => e.id === id);
  if (queuedIndex !== -1) {
    queuedPushes.splice(queuedIndex, 1);
    return;
  }

  const index = stack.findIndex((e) => e.id === id);
  if (index === -1) return; // Already popped by the back button.
  stack.splice(index, 1);

  // Only rewind history if our entry is the current one; otherwise the user has
  // navigated elsewhere and going back would undo that navigation.
  if (currentSheetId() !== id) return;

  pendingBacks += 1;
  clearTimeout(pendingBackTimer);
  pendingBackTimer = setTimeout(() => {
    pendingBacks = 0;
    flushQueuedPushes();
  }, PENDING_BACK_TIMEOUT_MS);
  window.history.back();
}

export function useSheetHistory(open: boolean, onOpenChange: (open: boolean) => void) {
  // Keep the latest callback without re-running the effect: callers usually
  // pass inline arrows, and re-running on every render used to close sheets.
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    const id = nextId++;
    openSheet({ id, close: () => onOpenChangeRef.current(false) });

    return () => closeSheet(id);
  }, [open]);
}
