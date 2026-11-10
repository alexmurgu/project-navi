import React from "react";
import { format } from "date-fns";
import { withAlpha, type CategoryConfig } from "@/lib/category-visuals";
import { cn } from "@/lib/utils";
import { CategoryMark } from "@/components/icon-mark";

interface Transaction {
  id: string;
  date: string | Date;
  description: string;
  amount: number;
  category: string;
  userName: string;
  type: "expense" | "income";
  status?: "pending" | "paid";
}

interface OverviewTransactionListProps {
  transactions: Transaction[];
  categoryConfigMap: Record<string, CategoryConfig>;
  formatCurrency: (amount: number) => string;
}

export function OverviewTransactionList({
  transactions,
  categoryConfigMap,
  formatCurrency,
}: OverviewTransactionListProps) {
  return (
    <section className="space-y-4 mt-12">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-lg font-black tracking-tight italic uppercase">Transactions</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/40">
          {transactions.length} total
        </p>
      </div>
      <div className="space-y-2">
        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-muted/10 bg-secondary/20 px-5 py-6 text-sm text-muted-foreground">
            No transactions found for this view.
          </div>
        ) : (
          transactions.map((item) => {
            const config = categoryConfigMap[item.category];
            const color = config?.color || (item.type === "expense" ? "#F43F5E" : "#10B981");
            const bgColor = withAlpha(color, 0.05);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl border border-transparent shadow-sm"
                style={{ backgroundColor: bgColor }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <CategoryMark
                    category={item.category}
                    config={config}
                    kind={item.type}
                    color={color}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm tracking-tight truncate">
                        {item.description}
                      </p>
                      {item.status === "pending" && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 text-[8px] font-black uppercase tracking-widest shrink-0">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>{format(new Date(item.date), "MMM dd, yyyy")}</span>
                      <span>•</span>
                      <span>{item.userName || "Family Wide"}</span>
                    </div>
                  </div>
                </div>
                <p
                  className={cn(
                    "font-black text-sm tracking-tight shrink-0",
                    item.status === "pending"
                      ? "text-muted-foreground opacity-40"
                      : item.type === "expense"
                        ? "text-rose-600"
                        : "text-emerald-600",
                  )}
                >
                  {item.type === "expense" ? "-" : "+"}
                  {formatCurrency(item.amount)}
                </p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
