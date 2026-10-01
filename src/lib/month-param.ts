import { format, parse, isValid } from "date-fns";

export interface MonthSearchParams {
  month?: string;
}

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const STORAGE_KEY = "navi_selected_month";

export function isValidMonthString(val?: string | null): val is string {
  return typeof val === "string" && MONTH_REGEX.test(val);
}

export function validateMonthSearch(search: Record<string, unknown>): MonthSearchParams {
  const month = typeof search.month === "string" ? search.month : undefined;
  if (isValidMonthString(month)) {
    return { month };
  }
  return {};
}

export function formatMonthParam(date: Date): string {
  return format(date, "yyyy-MM");
}

export function parseMonthParam(monthStr?: string | null): Date {
  if (isValidMonthString(monthStr)) {
    const parsed = parse(monthStr, "yyyy-MM", new Date());
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return new Date();
}

export function getSavedMonth(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (isValidMonthString(val)) {
      return val;
    }
  } catch {
    // Ignore storage access errors
  }
  return null;
}

export function saveMonth(month: string) {
  if (typeof window === "undefined") return;
  try {
    if (isValidMonthString(month)) {
      localStorage.setItem(STORAGE_KEY, month);
    }
  } catch {
    // Ignore storage access errors
  }
}
