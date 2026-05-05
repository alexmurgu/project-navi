import React, { useMemo, useState } from "react";
import { TransactionCard } from "@/components/transaction-card";
import { type CategoryConfig } from "@/lib/category-visuals";
import { ArrowRightLeft, Settings2, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { MonthSelector, filterTransactionsByMonth } from "@/components/month-selector";

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
  const [tableSearch, setTableSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

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

    let filtered = accountTransactions;

    if (tableSearch) {
      const search = tableSearch.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.description.toLowerCase().includes(search) ||
          item.category.toLowerCase().includes(search),
      );
    }

    filtered = filterTransactionsByMonth(filtered, selectedDate);

    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [account.id, account.type, data, tableSearch, selectedDate]);

  return (
    <div className="w-full min-h-screen flex flex-col bg-background antialiased p-6 md:p-12 pb-32">
      {/* Dynamic Header */}
      <div className="flex items-start justify-between pt-4 mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-2 rounded-full" style={{ backgroundColor: account.color }} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">
              {account.type === "credit" ? "Credit Card" : "Savings Account"}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground uppercase italic truncate max-w-[250px] md:max-w-none">
            {account.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={account.type === "credit" ? "/settings/credit-cards" : "/settings"}
            className="size-12 md:size-14 rounded-2xl bg-secondary/20 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all active:scale-95"
          >
            <Settings2 className="size-5 md:size-6" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* Account Stats */}
      <section className="grid gap-4 md:grid-cols-2 mb-10">
        <div className="rounded-2xl bg-secondary/20 p-6 flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/40">
            Available Funds
          </p>
          <p className="mt-2 text-3xl md:text-4xl font-black tracking-tight text-foreground">
            {formatCurrency(
              account.type === "credit" ? -account.currentBalance : account.currentBalance,
            )}
          </p>
        </div>

        {(account.limit || account.targetAmount) && (
          <div className="rounded-2xl bg-secondary/20 p-6 flex flex-col justify-center">
            <div className="flex items-end justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/40">
                {account.type === "credit" ? "Limit Progress" : "Goal Progress"}
              </p>
              <span className="text-xl font-black tracking-tight text-foreground/80">
                {((account.currentBalance / (account.limit || account.targetAmount || 1)) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-secondary/30 rounded-full overflow-hidden w-full">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  backgroundColor: account.color,
                  width: `${Math.min(
                    100,
                    (account.currentBalance / (account.limit || account.targetAmount || 1)) * 100,
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Modern Search/Filter */}
      <div className="flex gap-3 mb-10 mt-12">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground opacity-30 group-focus-within:opacity-100 transition-opacity" />
          <Input
            placeholder="Search within this view..."
            className="h-14 pl-14 rounded-xl bg-secondary/30 border-none shadow-inner text-base font-bold placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
          />
        </div>
        <MonthSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          variant="icon"
          align="end"
        />
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
