import React from "react";
import { TransactionCard } from "@/components/transaction-card";
import { Button } from "@/components/ui/button";
import type { CategoryConfig } from "@/lib/category-visuals";

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
}

interface RecentActivityProps {
  groups: { title: string; items: Transaction[] }[];
  categoryConfigMap: Record<string, CategoryConfig>;
  onEdit: (item: Transaction) => void;
  onStatusUpdate: (id: string, type: "expense" | "income", status: "pending" | "paid") => void;
  onViewAll: () => void;
  formatCurrency: (amount: number) => string;
}

export function RecentActivity({
  groups,
  categoryConfigMap,
  onEdit,
  onStatusUpdate,
  onViewAll,
  formatCurrency,
}: RecentActivityProps) {
  return (
    <section className="space-y-10">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[20px] font-display font-medium uppercase tracking-widest text-navi-dark/40">
          Recent Activity
        </h3>
        <Button variant="link" size="xs" onClick={onViewAll} className="p-0 h-auto">
          View All
        </Button>
      </div>

      <div className="space-y-12">
        {groups.map((group) => (
          <div key={group.title} className="space-y-6 px-2">
            <h4 className="text-[11px] font-display font-medium uppercase tracking-[0.25em] text-navi-gray/60 ml-2">
              {group.title}
            </h4>
            <div className="grid gap-4">
              {group.items.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  categoryConfigMap={categoryConfigMap}
                  onClick={() => onEdit(tx)}
                  onStatusUpdate={
                    tx.status === "pending"
                      ? (status) => onStatusUpdate(tx.id, tx.type, status)
                      : undefined
                  }
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
