import { useEffect, useRef } from "react";

/**
 * Resets a sheet's form when the sheet opens or when it switches to editing a
 * different item — and at no other time.
 *
 * Sheets used to reset on any change to props like `availableCategories` or
 * `savingsAccounts`. Those arrays get a new identity on every background
 * refetch, which silently wiped whatever the user was typing.
 */
export function useSheetFormReset(open: boolean, itemKey: unknown, reset: () => void) {
  const resetRef = useRef(reset);
  resetRef.current = reset;

  useEffect(() => {
    if (open) resetRef.current();
  }, [open, itemKey]);
}
