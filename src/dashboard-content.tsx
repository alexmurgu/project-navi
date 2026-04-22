import React, { useState, useMemo, useEffect } from "react";
import { User as UserIcon, Check } from "lucide-react";
import { format, isToday, isYesterday, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { useNavigate } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import {
  CategoryIcon,
  getCategoryConfig,
  type CategoryConfig,
  withAlpha,
} from "@/lib/category-visuals";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  addExpense,
  updateExpense,
  deleteExpense,
  addIncome,
  updateIncome,
  deleteIncome,
  updateTransactionStatus,
} from "./actions";
import { TransactionSheet } from "@/components/transaction-sheet";
import { Button } from "./components/ui/button";

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
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [availableExpenseCategories, setAvailableExpenseCategories] = useState<string[]>(
    data.expenseCategories,
  );
  const [availableIncomeCategories, setAvailableIncomeCategories] = useState<string[]>(
    data.incomeCategories,
  );

  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("family");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [incomeCategory, setIncomeCategory] = useState("");

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

  const updateStatusMutation = useMutation({
    mutationFn: (d: { id: string; type: "expense" | "income"; status: "pending" | "paid" }) =>
      updateTransactionStatus({ data: d }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["dashboard"], type: "active" });
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
    const paidIncomes = data.incomes.filter((i) => (i as any).status !== "pending");
    const paidExpenses = data.expenses.filter((e) => (e as any).status !== "pending");

    const totalIncome = paidIncomes.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExp = paidExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const monthlyExp = paidExpenses
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
      .filter(
        (exp) =>
          (exp as any).status !== "pending" && isWithinInterval(new Date(exp.date), { start, end }),
      )
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

  useEffect(() => {
    const handleQuickAddExpense = () => {
      setEditingItem(null);
      setSelectedUserId("family");
      setExpenseCategory("");
      setExpenseSheetOpen(true);
    };
    const handleQuickAddIncome = () => {
      setEditingItem(null);
      setSelectedUserId("family");
      setIncomeCategory("");
      setIncomeSheetOpen(true);
    };

    window.addEventListener("open-quick-add-expense", handleQuickAddExpense);
    window.addEventListener("open-quick-add-income", handleQuickAddIncome);
    return () => {
      window.removeEventListener("open-quick-add-expense", handleQuickAddExpense);
      window.removeEventListener("open-quick-add-income", handleQuickAddIncome);
    };
  }, []);

  return (
    <div className="w-full min-h-screen flex flex-col bg-white antialiased">
      {/* High-Impact Hero Section */}
      <section className="bg-navi-dark pt-16 pb-20 px-6 md:px-12 flex flex-col gap-16 relative overflow-hidden text-white">
        <div className="space-y-6 relative z-10 text-center md:text-left">
          <p className="text-[12px] font-display font-medium uppercase tracking-[0.25em] opacity-50">
            Available Balance
          </p>
          <h1 className="text-[64px] md:text-[120px] font-display font-medium leading-[0.9] tracking-[-0.04em]">
            {formatCurrency(stats.balance)}
          </h1>
        </div>

        <div className="flex items-center justify-between px-2 relative z-10">
          <div className="space-y-2">
            <p className="text-[10px] font-display font-medium uppercase tracking-[0.2em] opacity-40">
              Expenses (Monthly)
            </p>
            <p className="text-[32px] md:text-[48px] font-display font-medium tracking-tight">
              {formatCurrency(stats.monthlyExp)}
            </p>
          </div>
          <div className="h-16 w-[1px] bg-white/10" />
          <div className="space-y-2 text-right">
            <p className="text-[10px] font-display font-medium uppercase tracking-[0.2em] opacity-40">
              Income (Total)
            </p>
            <p className="text-[32px] md:text-[48px] font-display font-medium tracking-tight">
              {formatCurrency(stats.income)}
            </p>
          </div>
        </div>
      </section>

      <div className="p-6 md:p-12 space-y-16">
        <section className="space-y-6">
          <h3 className="text-[20px] font-display font-medium uppercase tracking-widest text-navi-dark/40 ml-2">
            Monthly Breakdown
          </h3>
          <div className="grid gap-4">
            {currentMonthCategoryData.items.length === 0 ? (
              <div className="rounded-[20px] border border-navi-border/30 bg-navi-surface px-8 py-10 text-sm text-navi-gray font-medium uppercase tracking-widest text-center">
                No expenses recorded for this month yet.
              </div>
            ) : (
              <>
                {(showAllCategories
                  ? currentMonthCategoryData.items
                  : currentMonthCategoryData.items.slice(0, 3)
                ).map((item) => {
                  const config = getCategoryConfig(categoryConfigMap, item.name);
                  const color = config?.color || "#494fdf";
                  const share = currentMonthCategoryData.total
                    ? Math.max(2, (item.amount / currentMonthCategoryData.total) * 100)
                    : 0;

                  return (
                    <button
                      type="button"
                      key={item.name}
                      className="relative flex items-center justify-between p-5 rounded-[20px] transition-all border border-transparent active:scale-[0.99] group overflow-hidden text-left bg-navi-surface cursor-pointer w-full"
                      style={{ backgroundColor: withAlpha(color, 0.05) }}
                      onClick={() =>
                        navigate({ to: "/categories/$category", params: { category: item.name } })
                      }
                    >
                      {/* Integrated Progress Bar as Background Overlay */}
                      <div
                        className="absolute inset-y-0 left-0 transition-all duration-1000 ease-out"
                        style={{ width: `${share}%`, backgroundColor: color, opacity: 0.1 }}
                      />

                      {/* Large Watermark Icon */}
                      <div className="absolute -left-4 top-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none transition-transform duration-700">
                        <CategoryIcon
                          category={item.name}
                          config={config}
                          kind="expense"
                          className="size-24 -rotate-12"
                          color={color}
                          strokeWidth={1}
                        />
                      </div>

                      <div className="relative z-10 pl-16 flex-1 min-w-0">
                        <p className="font-display font-medium text-[16px] text-navi-dark truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-3">
                          <p className="text-[10px] font-display font-medium uppercase tracking-widest text-navi-gray">
                            {item.count} {item.count === 1 ? "txn" : "txns"}
                          </p>
                          <div className="size-1 rounded-full bg-navi-border/50" />
                          <p className="text-[10px] font-display font-medium uppercase tracking-widest text-navi-gray">
                            {Math.round((item.amount / currentMonthCategoryData.total) * 100) || 0}%
                            share
                          </p>
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
                {currentMonthCategoryData.items.length > 3 && (
                  <div className="pt-2 flex justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowAllCategories(!showAllCategories)}
                      className="px-8"
                    >
                      {showAllCategories
                        ? "Show less"
                        : `Show ${currentMonthCategoryData.items.length - 3} more categories`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Recent Transactions List */}
        <section className="space-y-10">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[20px] font-display font-medium uppercase tracking-widest text-navi-dark/40">
              Recent Activity
            </h3>
            <Button
              variant="link"
              size="xs"
              onClick={() => navigate({ to: "/expenses" })}
              className="p-0 h-auto"
            >
              View All
            </Button>
          </div>

          <div className="space-y-12">
            {groupedRecentActivity.map((group) => (
              <div key={group.title} className="space-y-6 px-2">
                <h4 className="text-[11px] font-display font-medium uppercase tracking-[0.25em] text-navi-gray/60 ml-2">
                  {group.title}
                </h4>
                <div className="grid gap-4">
                  {group.items.map((tx) => {
                    const config = getCategoryConfig(categoryConfigMap, tx.category);
                    const color = config?.color || "#494fdf";

                    return (
                      <div
                        key={tx.id}
                        className="relative flex items-center justify-between p-5 rounded-[20px] transition-all cursor-pointer border border-transparent active:scale-[0.99] group overflow-hidden"
                        style={{ backgroundColor: withAlpha(color, 0.05) }}
                        onClick={() => handleEdit(tx)}
                      >
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 opacity-[0.12] pointer-events-none transition-transform duration-700">
                          <CategoryIcon
                            category={tx.category}
                            config={config}
                            kind={tx.type}
                            className="size-24 -rotate-12"
                            color={color}
                            strokeWidth={1}
                          />
                        </div>

                        <div className="flex items-center gap-5 flex-1 min-w-0 relative z-10 pl-16">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <p className="font-display font-medium text-[16px] text-navi-dark truncate">
                                {tx.description}
                              </p>
                              {tx.status === "pending" && (
                                <span className="px-2 py-0.5 rounded-full bg-navi-warning/10 text-navi-warning text-[9px] font-display font-medium uppercase tracking-widest">
                                  Pending
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-display font-medium uppercase tracking-widest text-navi-gray/60">
                              <p>{tx.category}</p>
                              <div className="size-1 rounded-full bg-navi-border/50" />
                              <div className="flex items-center gap-1.5">
                                <UserIcon className="size-2.5 opacity-40" strokeWidth={1} />
                                <span>{tx.userName || "Family"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4 shrink-0 relative z-10">
                          <div>
                            <p
                              className={cn(
                                "font-display font-medium text-[18px]",
                                tx.status === "pending"
                                  ? "text-navi-gray/40"
                                  : tx.type === "expense"
                                    ? "text-navi-dark"
                                    : "text-navi-teal",
                              )}
                            >
                              {tx.type === "expense" ? "-" : "+"}
                              {formatCurrency(tx.amount)}
                            </p>
                          </div>
                          {tx.status === "pending" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatusMutation.mutate({
                                  id: tx.id,
                                  type: tx.type,
                                  status: "paid",
                                });
                              }}
                              className="size-10 rounded-full bg-navi-teal text-white flex items-center justify-center hover:opacity-90 transition-all"
                            >
                              <Check className="size-5" strokeWidth={1} />
                            </button>
                          )}
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
        categoryConfigs={data.categoryConfigs}
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
        categoryConfigs={data.categoryConfigs}
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
