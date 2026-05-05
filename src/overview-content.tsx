import React, { useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TransactionCard } from "@/components/transaction-card";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

import {
  CategoryIcon,
  getCategoryConfig,
  type CategoryConfig,
  withAlpha,
} from "@/lib/category-visuals";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { MonthSelector, filterTransactionsByMonth } from "@/components/month-selector";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Transaction {
  id: string;
  date: string | Date;
  description: string;
  amount: number;
  category: string;
  userId: string | null;
  userName: string;
  type: "expense" | "income";
  isMonthly?: boolean;
  status?: "pending" | "paid";
}

type DashboardData = {
  user: User;
  users: { id: string; name: string }[];
  expenses: Omit<Transaction, "type">[];
  incomes: Omit<Transaction, "type">[];
  expenseCategories: string[];
  incomeCategories: string[];
  categoryConfigs: CategoryConfig[];
};

type OverviewMode = { type: "member"; memberId: string } | { type: "category"; category: string };

type CategoryKind = "expense" | "income";

const formatCurrency = (amountCents: number) =>
  (amountCents / 100).toLocaleString("en-IE", { style: "currency", currency: "EUR" });

export function OverviewContent({ data, mode }: { data: DashboardData; mode: OverviewMode }) {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [tableSearch, setTableSearch] = React.useState("");

  const categoryConfigMap = useMemo(() => {
    const map: Record<string, CategoryConfig> = {};
    data.categoryConfigs.forEach((config) => {
      map[config.name] = config;
    });
    return map;
  }, [data.categoryConfigs]);

  const allItems = useMemo(
    () => [
      ...data.expenses.map((e) => ({ ...e, type: "expense" as const })),
      ...data.incomes.map((i) => ({ ...i, type: "income" as const })),
    ],
    [data.expenses, data.incomes],
  ) as Transaction[];

  const categoryKind = useMemo<CategoryKind | null>(() => {
    if (mode.type !== "category") return null;
    const isExpenseCategory = data.expenseCategories.includes(mode.category);
    const isIncomeCategory = data.incomeCategories.includes(mode.category);

    if (isIncomeCategory && !isExpenseCategory) return "income";
    if (isExpenseCategory && !isIncomeCategory) return "expense";

    const matchingTransactions = allItems.filter((item) => item.category === mode.category);
    const incomeCount = matchingTransactions.filter((item) => item.type === "income").length;
    const expenseCount = matchingTransactions.filter((item) => item.type === "expense").length;
    if (incomeCount > expenseCount) return "income";
    if (expenseCount > incomeCount) return "expense";
    return isIncomeCategory ? "income" : "expense";
  }, [allItems, data.expenseCategories, data.incomeCategories, mode]);

  const selectedMember = useMemo(() => {
    if (mode.type !== "member") return null;
    if (mode.memberId === "family") return { id: "family", name: "Family Wide" };
    return data.users.find((user) => user.id === mode.memberId) || null;
  }, [data.users, mode]);

  const filteredTransactions = useMemo(() => {
    let filtered = allItems;

    if (tableSearch) {
      const search = tableSearch.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.description.toLowerCase().includes(search) ||
          item.category.toLowerCase().includes(search),
      );
    }

    if (mode.type === "member") {
      filtered = filtered.filter((item) =>
        mode.memberId === "family" ? item.userId === null : item.userId === mode.memberId,
      );
    } else {
      filtered = filtered.filter((item) => {
        if (item.category !== mode.category) return false;
        if (!categoryKind) return true;
        return item.type === categoryKind;
      });
    }

    return filterTransactionsByMonth(filtered, selectedDate).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [allItems, categoryKind, mode, selectedDate, tableSearch]);

  const stats = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const paidItems = filteredTransactions.filter((item) => {
      if ((item as any).status === "pending") return false;
      return isWithinInterval(new Date(item.date), { start, end });
    });

    const totalIncome = paidItems
      .filter((item) => item.type === "income")
      .reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = paidItems
      .filter((item) => item.type === "expense")
      .reduce((acc, curr) => acc + curr.amount, 0);
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const currentMonthExpensesByCategory = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const map = new Map<string, { amount: number; count: number }>();

    data.expenses
      .filter((exp) => {
        if ((exp as any).status === "pending") return false;
        const matchesMonth = isWithinInterval(new Date(exp.date), { start, end });
        if (!matchesMonth) return false;
        if (mode.type === "member") {
          return mode.memberId === "family" ? exp.userId === null : exp.userId === mode.memberId;
        }
        return exp.category === mode.category;
      })
      .forEach((exp) => {
        const current = map.get(exp.category) || { amount: 0, count: 0 };
        map.set(exp.category, {
          amount: current.amount + exp.amount,
          count: current.count + 1,
        });
      });

    return Array.from(map.entries())
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => b.amount - a.amount);
  }, [data.expenses, mode]);

  const categoryMemberExpenseSummary = useMemo(() => {
    if (mode.type !== "category") return [];
    const map = new Map<string, { label: string; amount: number; count: number }>();

    const relevantItems =
      categoryKind === "income" ? data.incomes : categoryKind === "expense" ? data.expenses : [];
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    relevantItems
      .filter((item) => {
        if (item.category !== mode.category || (item as any).status === "pending") return false;
        return isWithinInterval(new Date(item.date), { start, end });
      })
      .forEach((item) => {
        const key = item.userId || "family";
        const current = map.get(key) || {
          label: item.userName || "Family Wide",
          amount: 0,
          count: 0,
        };
        map.set(key, {
          label: current.label,
          amount: current.amount + item.amount,
          count: current.count + 1,
        });
      });

    return Array.from(map.entries())
      .map(([memberId, values]) => ({ memberId, ...values }))
      .sort((a, b) => b.amount - a.amount);
  }, [categoryKind, data.expenses, data.incomes, mode, selectedDate]);

  const title =
    mode.type === "member"
      ? selectedMember?.name || "Member overview"
      : mode.category.replaceAll("_", " ");
  const subtitle = mode.type === "member" ? "Member dashboard" : "Category overview";
  const categoryLabel = categoryKind === "income" ? "Income by member" : "Expenses by member";

  return (
    <div className="w-full min-h-screen bg-background antialiased p-6 md:p-12 pb-32">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between pt-4 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground uppercase italic truncate max-w-[250px] md:max-w-none">
            {title}
          </h1>
          <p className="text-[10px] md:text-sm font-black tracking-[0.2em] text-muted-foreground opacity-40 uppercase ml-1">
            {subtitle}
          </p>
        </div>
      </div>

      <OverviewStats
        totalIncome={stats.totalIncome}
        totalExpense={stats.totalExpense}
        balance={stats.balance}
        formatCurrency={formatCurrency}
      />

      {mode.type === "member" ? (
        <section className="mt-12 space-y-4">
          <h2 className="text-lg font-black tracking-tight italic uppercase px-2">
            Current Month Breakdown
          </h2>
          <div className="space-y-2">
            {currentMonthExpensesByCategory.map((item) => {
              const config = getCategoryConfig(categoryConfigMap, item.name);
              const color = config?.color || "#14B8A6";
              return (
                <div key={item.name} className="rounded-xl p-4 bg-secondary/20">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="size-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: withAlpha(color, 0.12) }}
                      >
                        <CategoryIcon
                          category={item.name}
                          config={config}
                          kind="expense"
                          className="size-5"
                          color={color}
                        />
                      </div>
                      <div>
                        <p className="font-bold text-sm tracking-tight">{item.name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                          {item.count} {item.count === 1 ? "transaction" : "transactions"}
                        </p>
                      </div>
                    </div>
                    <p className="font-black text-sm tracking-tight">
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="mt-12 space-y-4">
          <h2 className="text-lg font-black tracking-tight italic uppercase px-2">
            {categoryLabel}
          </h2>
          <div className="rounded-2xl bg-secondary/20 p-5 space-y-4">
            {categoryMemberExpenseSummary.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No member spending found for this category.
              </div>
            ) : (
              <>
                <div className="h-4 overflow-hidden rounded-full bg-white/70 shadow-inner flex">
                  {categoryMemberExpenseSummary.map((item, index) => {
                    const palette =
                      categoryKind === "income"
                        ? ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0", "#D1FAE5"]
                        : ["#2DD4BF", "#F472B6", "#60A5FA", "#F59E0B", "#A78BFA"];
                    const total = categoryMemberExpenseSummary.reduce(
                      (acc, curr) => acc + curr.amount,
                      0,
                    );
                    const width = total ? (item.amount / total) * 100 : 0;
                    return (
                      <div
                        key={item.memberId}
                        className="h-full"
                        title={`${item.label}: ${formatCurrency(item.amount)}`}
                        style={{
                          width: `${width}%`,
                          backgroundColor: palette[index % palette.length],
                        }}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-3">
                  {categoryMemberExpenseSummary.map((item, index) => {
                    const palette =
                      categoryKind === "income"
                        ? ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0", "#D1FAE5"]
                        : ["#2DD4BF", "#F472B6", "#60A5FA", "#F59E0B", "#A78BFA"];
                    const total = categoryMemberExpenseSummary.reduce(
                      (acc, curr) => acc + curr.amount,
                      0,
                    );
                    const share = total ? Math.round((item.amount / total) * 100) : 0;
                    return (
                      <div
                        key={item.memberId}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40"
                      >
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: palette[index % palette.length] }}
                        />
                        <span>{item.label}</span>
                        <span>·</span>
                        <span>{share}%</span>
                        <span>·</span>
                        <span>{formatCurrency(item.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      )}

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

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-black tracking-tight italic uppercase">Transactions</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/40">
            {filteredTransactions.length} total
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {filteredTransactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-muted/20 bg-secondary/5 px-5 py-12 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground/40">
              No transactions found
            </div>
          ) : (
            filteredTransactions.map((item) => (
              <TransactionCard
                key={item.id}
                transaction={item}
                categoryConfigMap={categoryConfigMap}
                onClick={() => {}}
                formatCurrency={formatCurrency}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
