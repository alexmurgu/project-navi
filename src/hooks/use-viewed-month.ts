import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  formatMonthParam,
  getSavedMonth,
  isValidMonthString,
  parseMonthParam,
  saveMonth,
} from "@/lib/month-param";

export function useViewedMonth(fallbackDate?: Date) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { month?: string } | undefined;
  const monthParam = search?.month;

  const selectedDate = useMemo(() => {
    if (isValidMonthString(monthParam)) {
      return parseMonthParam(monthParam);
    }
    const saved = getSavedMonth();
    if (saved) {
      return parseMonthParam(saved);
    }
    return fallbackDate ?? new Date();
  }, [monthParam, fallbackDate]);

  useEffect(() => {
    if (isValidMonthString(monthParam)) {
      saveMonth(monthParam);
    } else {
      const saved = getSavedMonth();
      const target = saved || formatMonthParam(selectedDate);
      saveMonth(target);
      navigate({
        search: (prev: any) => ({ ...prev, month: target }),
        replace: true,
      });
    }
  }, [monthParam, navigate, selectedDate]);

  const setSelectedDate = useCallback(
    (newDate: Date) => {
      const monthStr = formatMonthParam(newDate);
      saveMonth(monthStr);
      navigate({
        search: (prev: any) => ({ ...prev, month: monthStr }),
        replace: true,
      });
    },
    [navigate],
  );

  return [selectedDate, setSelectedDate] as const;
}
