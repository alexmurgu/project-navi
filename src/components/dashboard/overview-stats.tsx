import React from "react";
import { cn } from "@/lib/utils";

interface OverviewStatsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  formatCurrency: (amount: number) => string;
}

export function OverviewStats({
  totalIncome,
  totalExpense,
  balance,
  formatCurrency,
}: OverviewStatsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-3 mb-10">
      <div className="rounded-2xl bg-secondary/20 p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/40">
          Income
        </p>
        <p className="mt-2 text-3xl font-black tracking-tight text-emerald-600">
          {formatCurrency(totalIncome)}
        </p>
      </div>
      <div className="rounded-2xl bg-secondary/20 p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/40">
          Expenses
        </p>
        <p className="mt-2 text-3xl font-black tracking-tight text-rose-600">
          {formatCurrency(totalExpense)}
        </p>
      </div>
      <div className="rounded-2xl bg-secondary/20 p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/40">
          Balance
        </p>
        <p
          className={cn(
            "mt-2 text-3xl font-black tracking-tight",
            balance >= 0 ? "text-foreground" : "text-rose-600",
          )}
        >
          {formatCurrency(balance)}
        </p>
      </div>
    </section>
  );
}
