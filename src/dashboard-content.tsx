import React, { useState, useMemo, useEffect } from "react";
import { User as UserIcon } from "lucide-react";
import { format, isToday, isYesterday, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { useNavigate } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import {
  CategoryIcon,
  getCategoryConfig,
  type CategoryConfig,
  withAlpha,
} from "@/lib/category-visuals";
import { TransactionSheet } from "@/components/transaction-sheet";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  addExpense,
  updateExpense,
  deleteExpense,
  addIncome,
  updateIncome,
  deleteIncome,
} from "./actions";

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
}
interface PageProps {
  data: {
    user: User;
    users: { id: string; name: string }[];
    expenses: Omit<Transaction, "type">[];
    incomes: Omit<Transaction, "type">[];
    expenseCategories: string[];
    incomeCategories: string[];
    categoryConfigs: CategoryConfig[];
  };
}

const formatCurrency = (amountCents: number) => {
  return (amountCents / 100).toLocaleString("en-IE", { style: "currency", currency: "EUR" });
};

export function DashboardContent({ data }: PageProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false);
  const [incomeSheetOpen, setIncomeSheetOpen] = useState(false);
  const [availableExpenseCategories, setAvailableExpenseCategories] = useState<string[]>(
    data.expenseCategories,
  );
  const [availableIncomeCategories, setAvailableIncomeCategories] = useState<string[]>(
    data.incomeCategories,
  );
  const [selectedUserId, setSelectedUserId] = useState<string>("family");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [incomeCategory, setIncomeCategory] = useState("");
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);

  useEffect(() => {
    const handleQuickAddExpense = () => {
      setEditingItem(null);
      setExpenseSheetOpen(true);
    };
    const handleQuickAddIncome = () => {
      setEditingItem(null);
      setIncomeSheetOpen(true);
    };
    const pendingQuickAdd = sessionStorage.getItem("pendingQuickAdd");
    if (pendingQuickAdd === "expense") {
      setEditingItem(null);
      setExpenseSheetOpen(true);
      sessionStorage.removeItem("pendingQuickAdd");
    } else if (pendingQuickAdd === "income") {
      setEditingItem(null);
      setIncomeSheetOpen(true);
      sessionStorage.removeItem("pendingQuickAdd");
    }
    window.addEventListener("open-quick-add-expense", handleQuickAddExpense);
    window.addEventListener("open-quick-add-income", handleQuickAddIncome);
    return () => {
      window.removeEventListener("open-quick-add-expense", handleQuickAddExpense);
      window.removeEventListener("open-quick-add-income", handleQuickAddIncome);
    };
  }, []);

  const addExpenseMutation = useMutation({
    mutationFn: (d: any) => addExpense({ data: d }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["dashboard"], type: "active" });
      setExpenseSheetOpen(false);
    },
  });
  const updateExpenseMutation = useMutation({
    mutationFn: (d: any) => updateExpense({ data: d }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["dashboard"], type: "active" });
      setExpenseSheetOpen(false);
    },
  });
  const addIncomeMutation = useMutation({
    mutationFn: (d: any) => addIncome({ data: d }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["dashboard"], type: "active" });
      setIncomeSheetOpen(false);
    },
  });
  const updateIncomeMutation = useMutation({
    mutationFn: (d: any) => updateIncome({ data: d }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["dashboard"], type: "active" });
      setIncomeSheetOpen(false);
    },
  });

  const allItems = useMemo(
    () => [
      ...data.expenses.map((e) => ({ ...e, type: "expense" as const })),
      ...data.incomes.map((i) => ({ ...i, type: "income" as const, isMonthly: false })),
    ],
    [data.expenses, data.incomes],
  ) as Transaction[];

  const stats = useMemo(() => {
    const totalIncome = data.incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExp = data.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const monthlyExp = data.expenses
      .filter((e) => isWithinInterval(new Date(e.date), { start, end }))
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { income: totalIncome, expense: totalExp, monthlyExp, balance: totalIncome - totalExp };
  }, [data]);

  const groupedRecentActivity = useMemo(() => {
    const sorted = [...allItems]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    const groups: { title: string; items: Transaction[] }[] = [];
    sorted.forEach((item) => {
      let title = format(new Date(item.date), "MMM dd, yyyy");
      if (isToday(new Date(item.date))) title = "Today";
      else if (isYesterday(new Date(item.date))) title = "Yesterday";
      const existing = groups.find((g) => g.title === title);
      if (existing) existing.items.push(item);
      else groups.push({ title, items: [item] });
    });
    return groups;
  }, [allItems]);

  const currentMonthCategoryData = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const map = new Map<string, { amount: number; count: number }>();

    data.expenses
      .filter((exp) => isWithinInterval(new Date(exp.date), { start, end }))
      .forEach((exp) => {
        const current = map.get(exp.category) || { amount: 0, count: 0 };
        map.set(exp.category, {
          amount: current.amount + exp.amount,
          count: current.count + 1,
        });
      });

    const items = Array.from(map.entries())
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => b.amount - a.amount);

    const total = items.reduce((acc, item) => acc + item.amount, 0);

    return { items, total };
  }, [data.expenses]);

  const categoryConfigMap = useMemo(() => {
    const map: Record<string, CategoryConfig> = {};
    data.categoryConfigs.forEach((config) => {
      map[config.name] = config;
    });
    return map;
  }, [data.categoryConfigs]);

  const handleEdit = (item: Transaction) => {
    setEditingItem(item);
    setSelectedUserId(item.userId || "family");
    if (item.type === "expense") {
      setExpenseCategory(item.category);
      setExpenseSheetOpen(true);
    } else {
      setIncomeCategory(item.category);
      setIncomeSheetOpen(true);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-background antialiased">
      {/* High-Impact Hero Section - Full bleed everywhere */}
      <section className="wallet-hero-gradient pt-10 pb-16 px-6 md:px-12 flex flex-col gap-14 relative overflow-hidden text-white shadow-xl">
        <div className="absolute top-0 right-0 size-96 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />

        <div className="space-y-4 relative z-10 text-center md:text-left">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60">
            Available Balance
          </p>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none">
            {formatCurrency(stats.balance)}
          </h1>
        </div>

        <div className="flex items-center justify-between px-2 relative z-10">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50">
              Expenses (Monthly)
            </p>
            <p className="text-3xl md:text-5xl font-black tracking-tight">
              {formatCurrency(stats.monthlyExp)}
            </p>
          </div>
          <div className="h-16 w-1.5 bg-white/20 rounded-full" />
          <div className="space-y-1 text-right">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50">
              Income (Total)
            </p>
            <p className="text-3xl md:text-5xl font-black tracking-tight">
              {formatCurrency(stats.income)}
            </p>
          </div>
        </div>
      </section>

      <div className="p-6 md:p-12 space-y-12">
        <section className="space-y-3">
          <div className="space-y-3">
            {currentMonthCategoryData.items.length === 0 ? (
              <div className="rounded-2xl border border-muted/10 bg-secondary/20 px-5 py-6 text-sm text-muted-foreground">
                No expenses recorded for this month yet.
              </div>
            ) : (
              currentMonthCategoryData.items.map((item) => {
                const config = getCategoryConfig(categoryConfigMap, item.name);
                const color = config?.color || "#14B8A6";
                const bgColor = withAlpha(color, 0.05);
                const share = currentMonthCategoryData.total
                  ? Math.max(4, (item.amount / currentMonthCategoryData.total) * 100)
                  : 0;

                return (
                  <button
                    type="button"
                    key={item.name}
                    className="relative flex w-full flex-col p-4 rounded-xl transition-all border border-transparent hover:border-muted/10 shadow-sm md:shadow-none group overflow-hidden text-left cursor-pointer"
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${withAlpha(color, 0.22)} 0%, ${withAlpha(
                        color,
                        0.22,
                      )} ${share}%, ${bgColor} ${share}%, ${bgColor} 100%)`,
                    }}
                    onClick={() =>
                      navigate({ to: "/categories/$category", params: { category: item.name } })
                    }
                  >
                    <div className="relative z-10 flex items-center justify-between gap-4 min-w-0">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="size-11 rounded-lg flex items-center justify-center transition-transform group-hover:-rotate-6 shrink-0">
                          <CategoryIcon
                            category={item.name}
                            config={config}
                            kind="expense"
                            className="size-6"
                            color={color}
                          />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold text-sm tracking-tight text-foreground truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-30">
                              {item.count} {item.count === 1 ? "transaction" : "transactions"}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                              {Math.round((item.amount / currentMonthCategoryData.total) * 100) ||
                                0}
                              % of month
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-sm tracking-tight text-foreground">
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Recent Transactions List */}
        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-black tracking-tight italic uppercase">Recent Activity</h3>
            <button
              onClick={() => navigate({ to: "/expenses" })}
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-10">
            {groupedRecentActivity.map((group) => (
              <div key={group.title} className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40 ml-2">
                  {group.title}
                </h4>
                <div className="space-y-2">
                  {group.items.map((tx) => {
                    const config = getCategoryConfig(categoryConfigMap, tx.category);
                    const color = config?.color || (tx.type === "expense" ? "#F43F5E" : "#10B981");
                    const bgColor = withAlpha(color, 0.05);
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer group border border-transparent hover:border-muted/10 shadow-sm md:shadow-none"
                        style={{ backgroundColor: bgColor }}
                        onClick={() => handleEdit(tx)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="size-12 rounded-lg flex items-center justify-center transition-transform group-hover:-rotate-6">
                            <CategoryIcon
                              category={tx.category}
                              config={config}
                              kind={tx.type}
                              className="size-6"
                              color={color}
                            />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-bold text-sm tracking-tight text-foreground">
                              {tx.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-30">
                                {tx.category}
                              </p>
                              <div className="flex items-center gap-1 text-[8px] font-black uppercase text-muted-foreground/40 bg-muted/5 px-1.5 py-0.5 rounded">
                                <UserIcon className="size-2 opacity-50" />
                                <span>{tx.userName || "Family"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              "font-black text-sm tracking-tight",
                              tx.type === "expense" ? "text-rose-600" : "text-emerald-600",
                            )}
                          >
                            {tx.type === "expense" ? "-" : "+"}
                            {formatCurrency(tx.amount)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <TransactionSheet
        mode="expense"
        open={expenseSheetOpen}
        onOpenChange={setExpenseSheetOpen}
        editingItem={editingItem?.type === "expense" ? editingItem : null}
        users={data.users}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        category={expenseCategory}
        setCategory={setExpenseCategory}
        availableCategories={availableExpenseCategories}
        setAvailableCategories={setAvailableExpenseCategories}
        onSubmit={(d) => {
          const payload = {
            ...d,
            userId: d.userId,
            isMonthly: d.isMonthly ?? false,
          };
          if (editingItem?.type === "expense") {
            updateExpenseMutation.mutate(payload);
          } else {
            addExpenseMutation.mutate(payload);
          }
        }}
        onDelete={(id) =>
          deleteExpense({ data: id }).then(() =>
            queryClient.refetchQueries({ queryKey: ["dashboard"], type: "active" }),
          )
        }
        saving={addExpenseMutation.isPending || updateExpenseMutation.isPending}
      />

      <TransactionSheet
        mode="income"
        open={incomeSheetOpen}
        onOpenChange={setIncomeSheetOpen}
        editingItem={editingItem?.type === "income" ? editingItem : null}
        users={data.users}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        category={incomeCategory}
        setCategory={setIncomeCategory}
        availableCategories={availableIncomeCategories}
        setAvailableCategories={setAvailableIncomeCategories}
        onSubmit={(d) => {
          if (editingItem?.type === "income") {
            updateIncomeMutation.mutate(d);
          } else {
            addIncomeMutation.mutate(d);
          }
        }}
        onDelete={(id) =>
          deleteIncome({ data: id }).then(() =>
            queryClient.refetchQueries({ queryKey: ["dashboard"], type: "active" }),
          )
        }
        saving={addIncomeMutation.isPending || updateIncomeMutation.isPending}
      />
    </div>
  );
}
