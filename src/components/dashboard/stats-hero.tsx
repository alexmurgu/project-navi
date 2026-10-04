import React from "react";
import { MonthSelector } from "@/components/month-selector";
import { type MonthProjections } from "@/lib/projections";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";

interface StatsHeroProps {
  balance: number;
  monthlyExp: number;
  income: number;
  formatCurrency: (amount: number) => string;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  projections?: MonthProjections;
}

export function StatsHero({
  balance,
  monthlyExp,
  income,
  formatCurrency,
  selectedDate,
  onDateChange,
  projections,
}: StatsHeroProps) {
  const isCurrentMonth = projections?.isCurrentMonth ?? false;
  const isFutureMonth = projections?.isFutureMonth ?? false;
  const isDeficit = (projections?.projectedEOMBalance ?? 0) < 0;

  return (
    <section className="bg-navi-dark pt-[calc(env(safe-area-inset-top,0px)+64px)] pb-16 px-6 md:px-12 flex flex-col gap-8 relative overflow-hidden text-white">
      <div className="flex items-center justify-between relative z-10 w-full">
        {isFutureMonth ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-display font-medium uppercase tracking-[0.2em]">
            <Sparkles className="size-3 text-navi-teal" />
            <span>Projected Month</span>
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-1 self-end">
          <MonthSelector selectedDate={selectedDate} onDateChange={onDateChange} align="end" />
        </div>
      </div>

      <div className="space-y-3 relative z-10 text-center md:text-left">
        <p className="text-[11px] font-display font-medium uppercase tracking-[0.25em] opacity-45">
          {isFutureMonth ? "Projected End of Month Balance" : "Available Balance"}
        </p>
        <h1 className="text-[56px] sm:text-[72px] md:text-[104px] font-display font-medium leading-[0.9] tracking-[-0.04em]">
          {formatCurrency(isFutureMonth && projections ? projections.projectedEOMBalance : balance)}
        </h1>

        {isCurrentMonth && projections && (
          <div className="pt-1">
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] font-display font-medium transition-colors ${
                isDeficit
                  ? "bg-rose-500/10 border-rose-500/25 text-rose-300"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              }`}
            >
              {isDeficit ? (
                <TrendingDown className="size-3.5 text-rose-400 shrink-0" />
              ) : (
                <TrendingUp className="size-3.5 text-emerald-400 shrink-0" />
              )}
              <span>
                Projected Month End:{" "}
                <strong className={`font-semibold ${isDeficit ? "text-rose-100" : "text-white"}`}>
                  {formatCurrency(projections.projectedEOMBalance)}
                </strong>
                {isDeficit && (
                  <span className="opacity-70 text-[10px] ml-1.5 font-normal tracking-wide">
                    (Deficit risk)
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between px-1 pt-4 border-t border-white/10 relative z-10 gap-4">
        {/* Expenses Block */}
        <div className="space-y-1 text-left min-w-0 flex-1">
          <p className="text-[10px] font-display font-medium uppercase tracking-[0.2em] opacity-40">
            {isFutureMonth ? "Projected Expenses" : "Expenses (Monthly)"}
          </p>
          <p className="text-[28px] sm:text-[36px] md:text-[44px] font-display font-medium tracking-tight truncate">
            {formatCurrency(
              isFutureMonth && projections ? projections.projectedExpenses : monthlyExp,
            )}
          </p>
          {isCurrentMonth && projections && projections.projectedExpenses > monthlyExp && (
            <div className="flex flex-col gap-0.5 text-[11px] font-sans">
              <span className="text-white/55 font-medium tracking-wide">
                ~{formatCurrency(projections.projectedExpenses)} projected
              </span>
              <span className="text-white/35 text-[10px]">
                ~{formatCurrency(projections.remainingExpenses)} left to spend
              </span>
            </div>
          )}
        </div>

        <div className="self-stretch w-px bg-white/10 shrink-0 mx-2" />

        {/* Income Block */}
        <div className="space-y-1 text-right flex flex-col items-end min-w-0 flex-1">
          <p className="text-[10px] font-display font-medium uppercase tracking-[0.2em] opacity-40">
            {isFutureMonth ? "Projected Income" : "Income (Monthly)"}
          </p>
          <p className="text-[28px] sm:text-[36px] md:text-[44px] font-display font-medium tracking-tight truncate">
            {formatCurrency(isFutureMonth && projections ? projections.projectedIncome : income)}
          </p>
          {isCurrentMonth && projections && (
            <div className="flex flex-col items-end gap-1 text-[11px] font-sans">
              {projections.projectedIncome > income && (
                <span className="text-white/55 font-medium tracking-wide">
                  ~{formatCurrency(projections.projectedIncome)} projected
                </span>
              )}
              {projections.upcomingIncomes.length > 0 && (
                <div className="flex flex-col items-end gap-0.5 mt-0.5">
                  {projections.upcomingIncomes.map((u) => (
                    <span
                      key={u.id}
                      className="inline-flex items-center gap-1 text-[10px] font-sans text-navi-teal/95 font-medium bg-navi-teal/10 border border-navi-teal/20 px-2.5 py-0.5 rounded-full"
                    >
                      +{formatCurrency(u.expectedAmount)} expected ~day {u.expectedDay} (
                      {u.name.replace(/salary/i, "").trim() || "Salary"})
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
