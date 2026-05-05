import React from "react";
import { type CategoryConfig } from "@/lib/category-visuals";
import { getCategoryConfig } from "@/lib/category-visuals";

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
    <section className="space-y-4">
      <div className="grid gap-2">
        {items.length === 0 ? (
          <div className="rounded-premium border border-dashed border-navi-border/20 bg-transparent px-8 py-10 text-[10px] text-navi-dark/30 font-display font-medium uppercase tracking-[0.2em] text-center">
            No expenses recorded for this month yet.
          </div>
        ) : (
          <>
            {(showAll ? items : items.slice(0, 3)).map((item) => {
              const config = getCategoryConfig(categoryConfigMap, item.name);
              const color = config?.color || "#494fdf";
              const share = total ? (item.amount / total) * 100 : 0;

              return (
                <button
                  type="button"
                  key={item.name}
                  className="group cursor-pointer flex flex-col gap-2 py-3 px-1 hover:opacity-60 transition-all text-left w-full focus-visible:outline-none"
                  onClick={() => onCategoryClick(item.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
                      <div className="flex flex-col gap-0.5">
                        <h4 className="font-display font-medium text-[10px] text-navi-dark/30 uppercase tracking-[0.2em] truncate">
                          {item.name}
                        </h4>
                        <p className="text-[8px] font-display font-medium uppercase tracking-widest text-navi-dark/20">
                          {item.count} {item.count === 1 ? "txn" : "txns"} • {Math.round(share)}%
                        </p>
                      </div>
                    </div>
                    <p className="text-[14px] font-display font-medium text-navi-dark/80 tracking-tight">
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                  
                  <div className="h-[3px] w-full bg-navi-dark/4 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                      style={{ 
                        width: `${share}%`,
                        backgroundColor: color
                      }}
                    />
                  </div>
                </button>
              );
            })}
            {items.length > 3 && (
              <div className="pt-2 flex justify-center">
                <button 
                  onClick={onToggleShowAll}
                  className="text-[9px] font-display font-medium uppercase tracking-[0.2em] text-navi-dark/40 hover:text-navi-dark/60 transition-colors py-2 px-4"
                >
                  {showAll ? "Show less" : `Show ${items.length - 3} more categories`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
