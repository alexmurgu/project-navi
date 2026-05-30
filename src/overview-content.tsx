import React, { useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TransactionCard } from "@/components/transaction-card";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

import { getCategoryConfig, type CategoryConfig } from "@/lib/category-visuals";
import { MonthSelector, filterTransactionsByMonth } from "@/components/month-selector";
import { Link } from "@tanstack/react-router";

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

  const memberExpensesTotal = useMemo(() => {
    return currentMonthExpensesByCategory.reduce((acc, curr) => acc + curr.amount, 0);
  }, [currentMonthExpensesByCategory]);

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
    <div className="w-full min-h-screen flex flex-col bg-white antialiased">
      {/* High-Impact Header */}
      <section className="bg-navi-dark pt-[calc(env(safe-area-inset-top,0px)+64px)] pb-16 px-6 md:px-12 flex flex-col gap-10 relative overflow-hidden text-white">
        <div className="space-y-4 relative z-10">
          <p className="text-[12px] font-display font-medium uppercase tracking-[0.25em] opacity-50">
            {subtitle}
          </p>
          <h1 className="text-[48px] md:text-[64px] font-display font-medium leading-[0.9] tracking-[-0.04em] uppercase italic">
            {title}
          </h1>
        </div>

        {/* Integrated Premium Stats Grid inside the Dark Header */}
        <div className="grid grid-cols-3 gap-6 relative z-10 pt-8 border-t border-white/10">
          <div className="space-y-2">
            <p className="text-[10px] font-display font-medium uppercase tracking-[0.2em] opacity-40">
              Income (Monthly)
            </p>
            <p className="text-xl md:text-[32px] font-display font-medium leading-none text-navi-teal">
              {formatCurrency(stats.totalIncome)}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-display font-medium uppercase tracking-[0.2em] opacity-40">
              Expenses (Monthly)
            </p>
            <p className="text-xl md:text-[32px] font-display font-medium leading-none text-navi-danger">
              {formatCurrency(stats.totalExpense)}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-display font-medium uppercase tracking-[0.2em] opacity-40">
              Net Balance
            </p>
            <p
              className={`text-xl md:text-[32px] font-display font-medium leading-none ${stats.balance >= 0 ? "text-white" : "text-navi-danger"}`}
            >
              {formatCurrency(stats.balance)}
            </p>
          </div>
        </div>
      </section>

      <div className="p-6 md:p-12 max-w-5xl space-y-16">
        {mode.type === "member" ? (
          <section className="space-y-8">
            <div className="flex items-center gap-4 px-2">
              <div className="h-1.5 w-8 bg-navi-blue rounded-full" />
              <h3 className="text-[20px] font-display font-medium uppercase tracking-widest text-navi-dark/40">
                Current Month Breakdown
              </h3>
            </div>
            <div className="grid gap-2">
              {currentMonthExpensesByCategory.length === 0 ? (
                <div className="rounded-premium border border-dashed border-navi-border/20 bg-transparent px-8 py-10 text-[10px] text-navi-dark/30 font-display font-medium uppercase tracking-[0.2em] text-center">
                  No expenses recorded for this month yet.
                </div>
              ) : (
                currentMonthExpensesByCategory.map((item) => {
                  const config = getCategoryConfig(categoryConfigMap, item.name);
                  const color = config?.color || "#494fdf";
                  const share = memberExpensesTotal ? (item.amount / memberExpensesTotal) * 100 : 0;

                  return (
                    <Link
                      key={item.name}
                      to="/categories/$category"
                      params={{ category: item.name }}
                      className="group cursor-pointer flex flex-col gap-2 py-3 px-1 hover:opacity-60 transition-all text-left w-full focus-visible:outline-none"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="size-1.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex flex-col gap-0.5">
                            <h4 className="font-display font-medium text-[10px] text-navi-dark/60 uppercase tracking-[0.2em] truncate">
                              {item.name}
                            </h4>
                            <p className="text-[8px] font-display font-medium uppercase tracking-widest text-navi-dark/20">
                              {item.count} {item.count === 1 ? "txn" : "txns"} • {Math.round(share)}
                              %
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
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </section>
        ) : (
          <section className="space-y-8">
            <div className="flex items-center gap-4 px-2">
              <div className="h-1.5 w-8 bg-navi-gray/30 rounded-full" />
              <h3 className="text-[20px] font-display font-medium uppercase tracking-widest text-navi-dark/40">
                {categoryLabel}
              </h3>
            </div>
            <div className="navi-card p-6 space-y-6 border-none bg-navi-surface">
              {categoryMemberExpenseSummary.length === 0 ? (
                <div className="text-xs font-sans font-medium uppercase tracking-widest text-navi-gray/40">
                  No member spending found for this category.
                </div>
              ) : (
                <>
                  <div className="h-4 overflow-hidden rounded-full bg-white/70 flex">
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
                  <div className="flex flex-wrap gap-x-6 gap-y-3">
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
                          className="flex items-center gap-2 text-[10px] font-sans font-medium uppercase tracking-widest text-navi-gray/60"
                        >
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: palette[index % palette.length] }}
                          />
                          <span>{item.label}</span>
                          <span className="opacity-40">·</span>
                          <span className="font-bold text-navi-dark">{share}%</span>
                          <span className="opacity-40">·</span>
                          <span className="font-bold text-navi-dark">
                            {formatCurrency(item.amount)}
                          </span>
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
        <div className="flex gap-3 pt-4">
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

        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="h-1.5 w-8 bg-navi-blue rounded-full" />
              <h3 className="text-[20px] font-display font-medium uppercase tracking-widest text-navi-dark/40">
                Transactions
              </h3>
            </div>
            <p className="text-[10px] font-sans font-medium uppercase tracking-[0.24em] text-navi-gray/40">
              {filteredTransactions.length} total
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {filteredTransactions.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-navi-border/30 bg-navi-surface px-5 py-12 text-center text-xs font-sans font-medium uppercase tracking-widest text-navi-gray/40">
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
    </div>
  );
}
