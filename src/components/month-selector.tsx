import React from "react";
import {
  format,
  setMonth,
  setYear,
  getYear,
  getMonth,
  addYears,
  subYears,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MonthSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  variant?: "label" | "icon";
  className?: string;
  align?: "start" | "center" | "end";
}

export function MonthSelector({
  selectedDate,
  onDateChange,
  variant = "label",
  className,
  align = "end",
}: MonthSelectorProps) {
  const [viewDate, setViewDate] = React.useState(selectedDate);

  // Sync viewDate when selectedDate changes from outside
  React.useEffect(() => {
    setViewDate(selectedDate);
  }, [selectedDate]);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <Popover>
      <PopoverTrigger
        render={
          variant === "label" ? (
            <button
              className={cn(
                "flex items-center gap-2 bg-white/5 w-fit rounded-full px-6 py-2 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all active:scale-95",
                className,
              )}
            >
              <span className="text-[10px] font-display font-black uppercase tracking-[0.2em] select-none text-white">
                {format(selectedDate, "MMMM yyyy")}
              </span>
              <ChevronDown size={12} className="opacity-40 text-white" />
            </button>
          ) : (
            <button
              className={cn(
                "size-14 rounded-xl bg-secondary/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shadow-inner",
                className,
              )}
            >
              <Calendar className="size-6" />
            </button>
          )
        }
      />
      <PopoverContent
        align={align}
        className="w-64 p-4 bg-navi-dark border-white/10 text-white shadow-3xl rounded-2xl z-200"
      >
        <div className="flex items-center justify-between mb-4 px-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewDate(subYears(viewDate, 1));
            }}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft size={16} className="opacity-50" />
          </button>
          <span className="text-xs font-black uppercase tracking-widest">
            {format(viewDate, "yyyy")}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewDate(addYears(viewDate, 1));
            }}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronRight size={16} className="opacity-50" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map((m, i) => {
            const isSelected =
              getMonth(selectedDate) === i && getYear(selectedDate) === getYear(viewDate);
            return (
              <button
                key={m}
                onClick={(e) => {
                  e.stopPropagation();
                  const newDate = setMonth(setYear(selectedDate, getYear(viewDate)), i);
                  onDateChange(newDate);
                }}
                className={cn(
                  "py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                  isSelected
                    ? "bg-white text-navi-dark"
                    : "hover:bg-white/10 text-white/60 hover:text-white",
                )}
              >
                {m}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function filterTransactionsByMonth<T extends { date: string | Date }>(
  transactions: T[],
  selectedDate: Date,
): T[] {
  const start = startOfMonth(selectedDate);
  const end = endOfMonth(selectedDate);

  return transactions.filter((item) => {
    const itemDate = new Date(item.date);
    return isWithinInterval(itemDate, { start, end });
  });
}
