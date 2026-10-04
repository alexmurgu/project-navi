import { useEffect, useRef } from "react";

/**
 * Android system back button / gesture integration for modals and sheets.
 * Pushes a history entry when the modal opens so that pressing back closes the modal
 * rather than navigating away from the current page.
 */
export function useSheetHistory(
  open: boolean,
  onOpenChange: (open: boolean) => void,
  sheetId: string = "sheet",
) {
  const isPushedRef = useRef(false);
  const isPoppingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      if (isPushedRef.current) {
        isPushedRef.current = false;
        isPoppingRef.current = true;
        onOpenChange(false);
        // Reset flag after microtask to allow subsequent state changes
        setTimeout(() => {
          isPoppingRef.current = false;
        }, 50);
      }
    };

    if (open && !isPushedRef.current) {
      try {
        window.history.pushState({ modalId: sheetId }, "", window.location.href);
        isPushedRef.current = true;
        window.addEventListener("popstate", handlePopState);
      } catch {
        // Silently ignore if browser restricts pushState
      }
    } else if (!open && isPushedRef.current && !isPoppingRef.current) {
      isPushedRef.current = false;
      window.removeEventListener("popstate", handlePopState);
      try {
        if (window.history.state?.modalId === sheetId) {
          window.history.back();
        }
      } catch {
        // Silently ignore if back navigation is restricted
      }
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (isPushedRef.current && !isPoppingRef.current) {
        isPushedRef.current = false;
        try {
          if (window.history.state?.modalId === sheetId) {
            window.history.back();
          }
        } catch {
          // Silently ignore
        }
      }
    };
  }, [open, onOpenChange, sheetId]);
}
