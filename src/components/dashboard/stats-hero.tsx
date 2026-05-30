import React from "react";
import { MonthSelector } from "@/components/month-selector";

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
  return (
    <section className="bg-navi-dark pt-[calc(env(safe-area-inset-top,0px)+64px)] pb-20 px-6 md:px-12 flex flex-col gap-10 relative overflow-hidden text-white">
      <div className="flex items-center gap-1 relative z-10 self-center md:self-end">
        <MonthSelector selectedDate={selectedDate} onDateChange={onDateChange} align="end" />
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
