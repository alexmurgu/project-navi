import React from "react";
import { format } from "date-fns";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CategoryIcon,
  getCategoryConfig,
  type CategoryConfig,
  withAlpha,
} from "@/lib/category-visuals";

interface Transaction {
  id: string;
  date: string | Date;
  description: string;
  amount: number;
  category: string;
  userId: string | null;
  userName: string;
  type: "expense" | "income";
  status?: "pending" | "paid";
  accountType?: "main" | "credit";
}

interface TransactionCardProps {
  transaction: Transaction;
  categoryConfigMap: Record<string, CategoryConfig>;
  onClick: () => void;
  onStatusUpdate?: (status: "paid") => void;
  formatCurrency: (amount: number) => string;
}

export function TransactionCard({
  transaction,
  categoryConfigMap,
  onClick,
  onStatusUpdate,
  formatCurrency,
}: TransactionCardProps) {
  const config = getCategoryConfig(categoryConfigMap, transaction.category);
  const color = config?.color || "#494fdf";
  const date = new Date(transaction.date);

  return (
    <div
      onClick={onClick}
      className="navi-card flex items-center p-4 md:p-5 min-w-0"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-center gap-4 md:gap-5 flex-1 min-w-0">
        {/* Category Squircle */}
        <div
          className="size-12 md:size-14 rounded-[18px] flex items-center justify-center shrink-0 border transition-colors"
          style={{
            backgroundColor: withAlpha(color, 0.05),
            borderColor: withAlpha(color, 0.1),
          }}
        >
          <CategoryIcon
            category={transaction.category}
            config={config}
            kind={transaction.type}
            className="size-5 md:size-6"
            color={color}
            strokeWidth={1.2}
          />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center justify-between gap-3">
            <h4 className="flex-1 min-w-0 font-display font-medium text-[16px] md:text-[18px] text-navi-dark truncate">
              {transaction.description}
            </h4>
            <p
              className={cn(
                "font-display font-medium text-[16px] md:text-[20px] shrink-0 text-right whitespace-nowrap",
                transaction.status === "pending" ? "text-navi-gray/40" : "text-navi-dark",
              )}
            >
              {transaction.type === "expense" ? "-" : "+"}
              {formatCurrency(transaction.amount)}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <p className="flex-1 min-w-0 text-[10px] font-sans font-medium uppercase tracking-[0.15em] text-navi-gray/60 truncate">
              {transaction.category} • {format(date, "EEEE, h:mm a")}
            </p>
            {transaction.status === "pending" && transaction.type === "expense" && (
              <span className="px-1.5 py-0.5 rounded-full bg-navi-warning/10 text-navi-warning text-[8px] font-display font-medium uppercase tracking-widest shrink-0">
                Pending
              </span>
            )}
            {transaction.accountType === "credit" && (
              <span className="px-1.5 py-0.5 rounded-full bg-navi-dark/5 text-navi-dark/40 text-[8px] font-display font-medium uppercase tracking-widest shrink-0 border border-navi-dark/10">
                Credit
              </span>
            )}
          </div>
        </div>
      </div>

      {transaction.status === "pending" && transaction.type === "expense" && onStatusUpdate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusUpdate("paid");
          }}
          className="ml-4 size-10 md:size-12 rounded-full bg-navi-teal text-white flex items-center justify-center hover:opacity-90 transition-all shrink-0"
        >
          <Check className="size-5 md:size-6" strokeWidth={1.2} />
        </button>
      )}
    </div>
  );
}
