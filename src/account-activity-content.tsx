import React, { useMemo } from "react";
import { TransactionCard } from "@/components/transaction-card";
import { type CategoryConfig } from "@/lib/category-visuals";
import { ArrowRightLeft, Settings2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface PageProps {
  data: {
    expenses: any[];
    incomes: any[];
    transfers: any[];
    categoryConfigs: CategoryConfig[];
  };
  account: {
    id: string;
    name: string;
    type: "credit" | "savings";
    color: string;
    currentBalance: number;
    limit?: number | null;
    targetAmount?: number | null;
  };
}

const formatCurrency = (amountCents: number) => {
  return (amountCents / 100).toLocaleString("en-IE", { style: "currency", currency: "EUR" });
};

export function AccountActivityContent({ data, account }: PageProps) {
  const categoryConfigMap = useMemo(() => {
    const map: Record<string, CategoryConfig> = {};
    data.categoryConfigs.forEach((config) => {
      map[config.name] = config;
    });
    return map;
  }, [data.categoryConfigs]);

  const activity = useMemo(() => {
    const accountTransactions: any[] = [];

    // Add relevant expenses
    data.expenses
      .filter((e) => !e.isTransfer && e.accountId === account.id)
      .forEach((e) => {
        accountTransactions.push({
          ...e,
          type: "expense",
        });
      });

    // Add relevant incomes
    data.incomes
      .filter((i) => !i.isTransfer && i.accountId === account.id)
      .forEach((i) => {
        accountTransactions.push({
          ...i,
          type: "income",
        });
      });

    // Add relevant transfers
    data.transfers
      .filter((t) => t.fromId === account.id || t.toId === account.id)
      .forEach((t) => {
        const isFrom = t.fromId === account.id;
        accountTransactions.push({
          id: t.id,
          date: t.date,
          description: t.description || (isFrom ? "Transfer Out" : "Transfer In"),
          amount: t.amount,
          category: "Transfer",
          type: isFrom ? "expense" : "income",
          isTransfer: true,
          accountType: account.type === "credit" ? "credit" : "main",
        });
      });

    return accountTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [account.id, data]);

  return (
    <div className="w-full min-h-screen flex flex-col bg-background antialiased p-6 md:p-12 pb-32">
      {/* Hero Section */}
      <div className="mb-12 pt-4">
        <div className="p-8 md:p-12 rounded-[40px] bg-foreground text-background shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-12">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full" style={{ backgroundColor: account.color }} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                    {account.type === "credit" ? "Credit Card" : "Savings Account"}
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-display font-medium tracking-tight uppercase italic">
                  {account.name}
                </h1>
              </div>
              <Link
                to={account.type === "credit" ? "/settings/credit-cards" : "/settings"}
                className="size-14 rounded-2xl bg-background/10 flex items-center justify-center text-background/60 hover:text-background hover:bg-background/20 transition-all active:scale-95"
              >
                <Settings2 className="size-6" strokeWidth={1.5} />
              </Link>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">
                Available Funds
              </p>
              <h2 className="text-4xl md:text-7xl font-display font-medium tracking-tighter italic">
                {formatCurrency(
                  account.type === "credit" ? -account.currentBalance : account.currentBalance,
                )}
              </h2>
            </div>

            {(account.limit || account.targetAmount) && (
              <div className="mt-12 flex items-center gap-4">
                <div className="flex-1 h-1.5 bg-background/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-background/40 rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(
                        100,
                        (account.currentBalance / (account.limit || account.targetAmount || 1)) * 100,
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40 whitespace-nowrap">
                  {((account.currentBalance / (account.limit || account.targetAmount || 1)) * 100).toFixed(0)}%{" "}
                  {account.type === "credit" ? "Limit" : "Target"}
                </span>
              </div>
            )}
          </div>
          <div
            className="absolute -right-10 -bottom-10 size-64 opacity-10 blur-3xl transition-all duration-1000 group-hover:scale-150 group-hover:opacity-20"
            style={{ backgroundColor: account.color }}
          />
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[11px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60">
            Recent Movements
          </h3>
          <p className="text-[10px] font-display font-medium text-navi-gray/40 uppercase tracking-widest">
            {activity.length} Entries
          </p>
        </div>

        {activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-secondary/5 rounded-[40px] border border-dashed border-secondary/20">
            <div className="size-20 rounded-full bg-secondary/10 flex items-center justify-center mb-8">
              <ArrowRightLeft className="size-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-2xl font-black text-foreground/80 mb-3 tracking-tight italic uppercase">
              No Activity
            </h3>
            <p className="text-sm font-bold text-muted-foreground/40 max-w-[300px] leading-relaxed uppercase tracking-widest">
              There are no transactions recorded for this account yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {activity.map((item) => (
              <TransactionCard
                key={item.id}
                transaction={item}
                categoryConfigMap={categoryConfigMap}
                onClick={() => {}}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
