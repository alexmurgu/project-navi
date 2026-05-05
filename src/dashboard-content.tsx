import React, { useMemo, useEffect } from "react";
import {
  format,
  isToday,
  isYesterday,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isAfter,
} from "date-fns";
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
  addSavingsAccount,
  updateSavingsAccount,
  deleteSavingsAccount,
  addTransfer,
  deleteTransfer,
  addCreditCard,
  updateCreditCard,
  deleteCreditCard,
} from "./actions";
import { TransactionSheet } from "@/components/transaction-sheet";
import { StatsHero } from "@/components/dashboard/stats-hero";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { SavingsSection } from "@/components/dashboard/savings-section";
import { TransferSheet } from "@/components/transfer-sheet";
import { SavingsAccountSheet } from "@/components/savings-account-sheet";
import { CreditCardSheet } from "@/components/credit-card-sheet";
import { CreditCardsSection } from "@/components/dashboard/credit-cards-section";

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
  isTransfer?: boolean;
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
    savingsAccounts: any[];
    transfers: any[];
    creditCards: any[];
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
    selectedDate: new Date(),
    savingsSheetOpen: false,
    transferSheetOpen: false,
    editingSavingsAccount: null,
    creditCardSheetOpen: false,
    editingCreditCard: null,
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

  const addSavingsAccountMutation = useMutation({
    mutationFn: (d: any) => addSavingsAccount({ data: d }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      dispatch({ savingsSheetOpen: false });
    },
  });

  const updateSavingsAccountMutation = useMutation({
    mutationFn: (d: any) => updateSavingsAccount({ data: d }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      dispatch({ savingsSheetOpen: false });
    },
  });

  const deleteSavingsAccountMutation = useMutation({
    mutationFn: (id: string) => deleteSavingsAccount({ data: id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      dispatch({ savingsSheetOpen: false });
    },
  });
  const addTransferMutation = useMutation({
    mutationFn: (d: any) => addTransfer({ data: d }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      dispatch({ transferSheetOpen: false });
    },
  });

  const addCreditCardMutation = useMutation({
    mutationFn: (d: any) => addCreditCard({ data: d }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      dispatch({ creditCardSheetOpen: false });
    },
  });

  const updateCreditCardMutation = useMutation({
    mutationFn: (d: any) => updateCreditCard({ data: d }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      dispatch({ creditCardSheetOpen: false });
    },
  });

  const deleteCreditCardMutation = useMutation({
    mutationFn: (id: string) => deleteCreditCard({ data: id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      dispatch({ creditCardSheetOpen: false });
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
    const paidIncomes = data.incomes.filter((i) => !(i as any).isTransfer);
    const allPaidExpenses = data.expenses.filter((e) => (e as any).status !== "pending");
    const mainPaidExpenses = allPaidExpenses.filter(
      (e) => (e as any).accountType !== "credit" && !(e as any).isTransfer,
    );

    const start = startOfMonth(state.selectedDate);
    const end = endOfMonth(state.selectedDate);

    const monthlyIncome = paidIncomes
      .filter((i) => isWithinInterval(new Date(i.date), { start, end }))
      .reduce((acc, curr) => acc + curr.amount, 0);

    const monthlyExp = allPaidExpenses
      .filter((e) => isWithinInterval(new Date(e.date), { start, end }))
      .filter((e) => !(e as any).isTransfer)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalIncomeToDate = paidIncomes
      .filter((i) => !isAfter(new Date(i.date), end))
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalMainExpToDate = mainPaidExpenses
      .filter((e) => !isAfter(new Date(e.date), end))
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalTransfersToDate = data.transfers
      .filter((t) => !isAfter(new Date(t.date), end))
      .reduce((acc, t) => {
        let net = acc;
        if (t.fromType === "main") net -= t.amount;
        if (t.toType === "main") net += t.amount;
        return net;
      }, 0);

    const totalSavings = data.savingsAccounts.reduce((acc, sa) => acc + sa.currentBalance, 0);

    return {
      income: monthlyIncome,
      monthlyExp,
      balance: totalIncomeToDate - totalMainExpToDate + totalTransfersToDate,
      totalSavings,
    };
  }, [data, state.selectedDate]);

  const groupedRecentActivity = useMemo(() => {
    const start = startOfMonth(state.selectedDate);
    const end = endOfMonth(state.selectedDate);

    const filtered = allItems.filter((item) =>
      isWithinInterval(new Date(item.date), { start, end }),
    );

    const sorted = [...filtered]
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
  }, [allItems, state.selectedDate]);

  const currentMonthCategoryData = useMemo(() => {
    const start = startOfMonth(state.selectedDate);
    const end = endOfMonth(state.selectedDate);
    const map = new Map<string, { amount: number; count: number }>();

    data.expenses
      .filter(
        (exp) =>
          (exp as any).status !== "pending" &&
          isWithinInterval(new Date(exp.date), { start, end }) &&
          !(exp as any).isTransfer,
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
  }, [data.expenses, state.selectedDate]);

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

    const handleQuickAddTransfer = () => {
      dispatch({
        editingItem: null,
        transferSheetOpen: true,
      });
    };

    const handleQuickAddCreditCard = () => {
      dispatch({
        editingCreditCard: null,
        creditCardSheetOpen: true,
      });
    };

    window.addEventListener("open-quick-add-expense", handleQuickAddExpense);
    window.addEventListener("open-quick-add-income", handleQuickAddIncome);
    window.addEventListener("open-quick-add-transfer", handleQuickAddTransfer);
    window.addEventListener("open-add-credit-card", handleQuickAddCreditCard);
    return () => {
      window.removeEventListener("open-quick-add-expense", handleQuickAddExpense);
      window.removeEventListener("open-quick-add-income", handleQuickAddIncome);
      window.removeEventListener("open-quick-add-transfer", handleQuickAddTransfer);
      window.removeEventListener("open-add-credit-card", handleQuickAddCreditCard);
    };
  }, []);

  return (
    <div className="w-full min-h-screen flex flex-col bg-white antialiased">
      <StatsHero
        balance={stats.balance}
        monthlyExp={stats.monthlyExp}
        income={stats.income}
        formatCurrency={formatCurrency}
        selectedDate={state.selectedDate}
        onDateChange={(date) => dispatch({ selectedDate: date })}
      />

      <div className="p-6 md:p-12 space-y-16">
        <div className="space-y-6">
          <SavingsSection
            accounts={data.savingsAccounts}
            onEditAccount={(sa) => navigate({ to: "/accounts/$accountId", params: { accountId: sa.id } })}
            formatCurrency={formatCurrency}
          />
          <CreditCardsSection
            cards={data.creditCards}
            onEditCard={(cc) => navigate({ to: "/accounts/$accountId", params: { accountId: cc.id } })}
            formatCurrency={formatCurrency}
          />
        </div>
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
        creditCards={data.creditCards}
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
        onDelete={(id) => {
          if (state.editingItem?.isTransfer) {
            return deleteTransfer({ data: id }).then(() =>
              queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
            );
          }
          return deleteExpense({ data: id }).then(() =>
            queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
          );
        }}
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
        onDelete={(id) => {
          if (state.editingItem?.isTransfer) {
            return deleteTransfer({ data: id }).then(() =>
              queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
            );
          }
          return deleteIncome({ data: id }).then(() =>
            queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
          );
        }}
        saving={addIncomeMutation.isPending || updateIncomeMutation.isPending}
      />

      <SavingsAccountSheet
        open={state.savingsSheetOpen}
        onOpenChange={(open) => dispatch({ savingsSheetOpen: open })}
        editingItem={state.editingSavingsAccount}
        onSubmit={(d) => {
          if (state.editingSavingsAccount) {
            updateSavingsAccountMutation.mutate(d);
          } else {
            addSavingsAccountMutation.mutate(d);
          }
        }}
        onDelete={(id) => deleteSavingsAccountMutation.mutate(id)}
        saving={addSavingsAccountMutation.isPending || updateSavingsAccountMutation.isPending}
      />

      <TransferSheet
        open={state.transferSheetOpen}
        onOpenChange={(open) => dispatch({ transferSheetOpen: open })}
        users={data.users}
        savingsAccounts={data.savingsAccounts}
        creditCards={data.creditCards}
        availableBalance={stats.balance}
        onSubmit={(d) => addTransferMutation.mutate(d)}
        saving={addTransferMutation.isPending}
      />

      <CreditCardSheet
        open={state.creditCardSheetOpen}
        onOpenChange={(open) => dispatch({ creditCardSheetOpen: open })}
        editingItem={state.editingCreditCard}
        onSubmit={(d) => {
          if (state.editingCreditCard) {
            updateCreditCardMutation.mutate(d);
          } else {
            addCreditCardMutation.mutate(d);
          }
        }}
        onDelete={(id) => deleteCreditCardMutation.mutate(id)}
        saving={addCreditCardMutation.isPending || updateCreditCardMutation.isPending}
      />
    </div>
  );
}
