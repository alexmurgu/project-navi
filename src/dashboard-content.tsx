import React, { useMemo, useEffect } from "react";
import {} from "lucide-react";
import { format, isToday, isYesterday, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { useNavigate } from "@tanstack/react-router";

import { type CategoryConfig } from "@/lib/category-visuals";
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
import { StatsHero } from "@/components/dashboard/stats-hero";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { RecentActivity } from "@/components/dashboard/recent-activity";

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

  const [state, dispatch] = React.useReducer((s: any, a: any) => ({ ...s, ...a }), {
    expenseSheetOpen: false,
    incomeSheetOpen: false,
    showAllCategories: false,
    editingItem: null,
    selectedUserId: "family",
    expenseCategory: "",
    incomeCategory: "",
  });

  const availableExpenseCategories = data.expenseCategories;
  const availableIncomeCategories = data.incomeCategories;

  const addExpenseMutation = useMutation({
    mutationFn: (d: any) => addExpense({ data: d }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      dispatch({ expenseSheetOpen: false });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: (d: any) => updateExpense({ data: d }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      dispatch({ expenseSheetOpen: false });
    },
  });

  const addIncomeMutation = useMutation({
    mutationFn: (d: any) => addIncome({ data: d }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      dispatch({ incomeSheetOpen: false });
    },
  });

  const updateIncomeMutation = useMutation({
    mutationFn: (d: any) => updateIncome({ data: d }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      dispatch({ incomeSheetOpen: false });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (d: { id: string; type: "expense" | "income"; status: "pending" | "paid" }) =>
      updateTransactionStatus({ data: d }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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

    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const monthlyIncome = paidIncomes
      .filter((i) => isWithinInterval(new Date(i.date), { start, end }))
      .reduce((acc, curr) => acc + curr.amount, 0);

    const monthlyExp = paidExpenses
      .filter((e) => isWithinInterval(new Date(e.date), { start, end }))
      .reduce((acc, curr) => acc + curr.amount, 0);

    return {
      income: monthlyIncome,
      monthlyExp,
      balance: monthlyIncome - monthlyExp,
    };
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
    const updates: any = {
      editingItem: item,
      selectedUserId: item.userId || "family",
    };
    if (item.type === "expense") {
      updates.expenseCategory = item.category;
      updates.expenseSheetOpen = true;
    } else {
      updates.incomeCategory = item.category;
      updates.incomeSheetOpen = true;
    }
    dispatch(updates);
  };

  useEffect(() => {
    const handleQuickAddExpense = () => {
      dispatch({
        editingItem: null,
        selectedUserId: "family",
        expenseCategory: "",
        expenseSheetOpen: true,
      });
    };
    const handleQuickAddIncome = () => {
      dispatch({
        editingItem: null,
        selectedUserId: "family",
        incomeCategory: "",
        incomeSheetOpen: true,
      });
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
      <StatsHero
        balance={stats.balance}
        monthlyExp={stats.monthlyExp}
        income={stats.income}
        formatCurrency={formatCurrency}
      />

      <div className="p-6 md:p-12 space-y-16">
        <CategoryBreakdown
          items={currentMonthCategoryData.items}
          total={currentMonthCategoryData.total}
          categoryConfigMap={categoryConfigMap}
          showAll={state.showAllCategories}
          onToggleShowAll={() => dispatch({ showAllCategories: !state.showAllCategories })}
          onCategoryClick={(name) =>
            navigate({ to: "/categories/$category", params: { category: name } })
          }
          formatCurrency={formatCurrency}
        />

        <RecentActivity
          groups={groupedRecentActivity}
          categoryConfigMap={categoryConfigMap}
          onEdit={handleEdit}
          onStatusUpdate={(id, type, status) => updateStatusMutation.mutate({ id, type, status })}
          onViewAll={() => navigate({ to: "/expenses" })}
          formatCurrency={formatCurrency}
        />
      </div>

      <TransactionSheet
        mode="expense"
        open={state.expenseSheetOpen}
        onOpenChange={(open) => dispatch({ expenseSheetOpen: open })}
        editingItem={state.editingItem?.type === "expense" ? state.editingItem : null}
        users={data.users}
        selectedUserId={state.selectedUserId}
        setSelectedUserId={(val) => dispatch({ selectedUserId: val })}
        category={state.expenseCategory}
        setCategory={(val) => dispatch({ expenseCategory: val })}
        availableCategories={availableExpenseCategories}
        setAvailableCategories={() => {}} // No-op, managed by dashboard refetch
        categoryConfigs={data.categoryConfigs}
        onSubmit={(d) => {
          const payload = {
            ...d,
            userId: d.userId,
            isMonthly: d.isMonthly ?? false,
          };
          if (state.editingItem?.type === "expense") {
            updateExpenseMutation.mutate(payload);
          } else {
            addExpenseMutation.mutate(payload);
          }
        }}
        onDelete={(id) =>
          deleteExpense({ data: id }).then(() =>
            queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
          )
        }
        saving={addExpenseMutation.isPending || updateExpenseMutation.isPending}
      />

      <TransactionSheet
        mode="income"
        open={state.incomeSheetOpen}
        onOpenChange={(open) => dispatch({ incomeSheetOpen: open })}
        editingItem={state.editingItem?.type === "income" ? state.editingItem : null}
        users={data.users}
        selectedUserId={state.selectedUserId}
        setSelectedUserId={(val) => dispatch({ selectedUserId: val })}
        category={state.incomeCategory}
        setCategory={(val) => dispatch({ incomeCategory: val })}
        availableCategories={availableIncomeCategories}
        setAvailableCategories={() => {}} // No-op, managed by dashboard refetch
        categoryConfigs={data.categoryConfigs}
        onSubmit={(d) => {
          if (state.editingItem?.type === "income") {
            updateIncomeMutation.mutate(d);
          } else {
            addIncomeMutation.mutate(d);
          }
        }}
        onDelete={(id) =>
          deleteIncome({ data: id }).then(() =>
            queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
          )
        }
        saving={addIncomeMutation.isPending || updateIncomeMutation.isPending}
      />
    </div>
  );
}
