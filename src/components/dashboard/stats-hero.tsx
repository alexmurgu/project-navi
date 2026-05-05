import React from "react";
import { format, setMonth, setYear, getYear, getMonth, addYears, subYears } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface StatsHeroProps {
  balance: number;
  monthlyExp: number;
  income: number;
  formatCurrency: (amount: number) => string;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function StatsHero({
  balance,
  monthlyExp,
  income,
  formatCurrency,
  selectedDate,
  onDateChange,
}: StatsHeroProps) {
  const [viewDate, setViewDate] = React.useState(selectedDate);

  // Sync viewDate when selectedDate changes from outside (if ever)
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
    <section className="bg-navi-dark pt-16 pb-20 px-6 md:px-12 flex flex-col gap-10 relative overflow-hidden text-white">
      <div className="flex items-center gap-1 relative z-10 self-center md:self-end">
        <Popover>
          <PopoverTrigger
            render={
              <button className="flex items-center gap-2 bg-white/5 w-fit rounded-full px-6 py-2 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all active:scale-95">
                <span className="text-[10px] font-display font-black uppercase tracking-[0.2em] select-none">
                  {format(selectedDate, "MMMM yyyy")}
                </span>
                <ChevronDown size={12} className="opacity-40" />
              </button>
            }
          />
          <PopoverContent
            align="end"
            className="w-64 p-4 bg-navi-dark border-white/10 text-white shadow-3xl rounded-2xl"
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <button
                onClick={() => setViewDate(subYears(viewDate, 1))}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronLeft size={16} className="opacity-50" />
              </button>
              <span className="text-xs font-black uppercase tracking-widest">
                {format(viewDate, "yyyy")}
              </span>
              <button
                onClick={() => setViewDate(addYears(viewDate, 1))}
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
                    onClick={() => {
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
      </div>

      <div className="space-y-6 relative z-10 text-center md:text-left">
        <p className="text-[12px] font-display font-medium uppercase tracking-[0.25em] opacity-50">
          Available Balance
        </p>
        <h1 className="text-[64px] md:text-[120px] font-display font-medium leading-[0.9] tracking-[-0.04em]">
          {formatCurrency(balance)}
        </h1>
      </div>

      <div className="flex items-center justify-between px-2 relative z-10">
        <div className="space-y-2">
          <p className="text-[10px] font-display font-medium uppercase tracking-[0.2em] opacity-40">
            Expenses (Monthly)
          </p>
          <p className="text-[32px] md:text-[48px] font-display font-medium tracking-tight">
            {formatCurrency(monthlyExp)}
          </p>
        </div>
        <div className="h-16 w-px bg-white/10" />
        <div className="space-y-2 text-right">
          <p className="text-[10px] font-display font-medium uppercase tracking-[0.2em] opacity-40">
            Income (Monthly)
          </p>
          <p className="text-[32px] md:text-[48px] font-display font-medium tracking-tight">
            {formatCurrency(income)}
          </p>
        </div>
      </div>
    </section>
  );
}
