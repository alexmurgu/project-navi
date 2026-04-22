import React from "react";
import { CategoryIcon, withAlpha, type CategoryConfig } from "@/lib/category-visuals";
import { getCategoryConfig } from "@/lib/category-visuals";
import { Button } from "@/components/ui/button";

interface CategoryBreakdownProps {
  items: { name: string; amount: number; count: number }[];
  total: number;
  categoryConfigMap: Record<string, CategoryConfig>;
  showAll: boolean;
  onToggleShowAll: () => void;
  onCategoryClick: (name: string) => void;
  formatCurrency: (amount: number) => string;
}

export function CategoryBreakdown({
  items,
  total,
  categoryConfigMap,
  showAll,
  onToggleShowAll,
  onCategoryClick,
  formatCurrency,
}: CategoryBreakdownProps) {
  return (
    <section className="space-y-6">
      <h3 className="text-[20px] font-display font-medium uppercase tracking-widest text-navi-dark/40 ml-2">
        Monthly Breakdown
      </h3>
      <div className="grid gap-4">
        {items.length === 0 ? (
          <div className="rounded-card border border-navi-border/30 bg-navi-surface px-8 py-10 text-sm text-navi-gray font-medium uppercase tracking-widest text-center">
            No expenses recorded for this month yet.
          </div>
        ) : (
          <>
            {(showAll ? items : items.slice(0, 3)).map((item) => {
              const config = getCategoryConfig(categoryConfigMap, item.name);
              const color = config?.color || "#494fdf";
              const share = total ? Math.max(2, (item.amount / total) * 100) : 0;

              return (
                <button
                  type="button"
                  key={item.name}
                  className="relative flex items-center justify-between p-5 rounded-card transition-all border border-transparent active:scale-[0.99] group overflow-hidden text-left bg-navi-surface cursor-pointer w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navi-dark"
                  style={{ backgroundColor: withAlpha(color, 0.05) }}
                  onClick={() => onCategoryClick(item.name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onCategoryClick(item.name);
                    }
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0 transition-all duration-1000 ease-out"
                    style={{ width: `${share}%`, backgroundColor: color, opacity: 0.1 }}
                  />

                  <div className="flex items-center gap-5 flex-1 min-w-0 relative z-10">
                    <div
                      className="size-12 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: withAlpha(color, 0.1), color: color }}
                    >
                      <CategoryIcon
                        category={item.name}
                        config={config}
                        kind="expense"
                        className="size-6"
                        color={color}
                        strokeWidth={1}
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="font-display font-medium text-[16px] text-navi-dark truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-3">
                        <p className="text-[10px] font-display font-medium uppercase tracking-widest text-navi-gray">
                          {item.count} {item.count === 1 ? "txn" : "txns"}
                        </p>
                        <div className="size-1 rounded-full bg-navi-border/50" />
                        <p className="text-[10px] font-display font-medium uppercase tracking-widest text-navi-gray">
                          {Math.round((item.amount / total) * 100) || 0}% share
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 text-right shrink-0">
                    <p className="font-display font-medium text-[18px] text-navi-dark">
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                </button>
              );
            })}
            {items.length > 3 && (
              <div className="pt-2 flex justify-center">
                <Button variant="secondary" size="sm" onClick={onToggleShowAll} className="px-8">
                  {showAll ? "Show less" : `Show ${items.length - 3} more categories`}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
