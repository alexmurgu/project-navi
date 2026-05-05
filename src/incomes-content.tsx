import React, { useMemo, useEffect } from "react";
import { Search, Plus, ChevronDown, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TransactionSheet } from "@/components/transaction-sheet";
import { TransactionCard } from "@/components/transaction-card";
import { type CategoryConfig } from "@/lib/category-visuals";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  addIncome,
  updateIncome,
  deleteIncome,
  updateTransactionStatus,
  addExpense,
  addTransfer,
} from "./actions";
import { TransferSheet } from "@/components/transfer-sheet";
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
interface PageProps {
  data: {
    user: User;
    users: { id: string; name: string }[];
    incomes: Omit<Transaction, "type">[];
    expenses: any[];
    incomeCategories: string[];
    categoryConfigs: CategoryConfig[];
    creditCards: any[];
    savingsAccounts: any[];
  };
}

const INITIAL_PAGE_SIZE = 20;

const formatCurrency = (amountCents: number) => {
  return (amountCents / 100).toLocaleString("en-IE", { style: "currency", currency: "EUR" });
};

export function IncomesContent({ data }: PageProps) {
  const queryClient = useQueryClient();

  const [state, dispatch] = React.useReducer((s: any, a: any) => ({ ...s, ...a }), {
    incomeSheetOpen: false,
    expenseSheetOpen: false,
    selectedUserId: "family",
    incomeCategory: "",
    expenseCategory: "",
    editingItem: null,
    tableSearch: "",
    visibleCount: INITIAL_PAGE_SIZE,
    sortDirection: "desc",
    selectedDate: new Date(),
    transferSheetOpen: false,
  });

  const availableCategories = data.incomeCategories;
  const categoryConfigMap = useMemo(() => {
    const map: Record<string, CategoryConfig> = {};
    data.categoryConfigs.forEach((config) => {
      map[config.name] = config;
    });
    return map;
  }, [data.categoryConfigs]);

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
  const deleteIncomeMutation = useMutation({
    mutationFn: (id: string) => deleteIncome({ data: id }),
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

  const addExpenseMutation = useMutation({
    mutationFn: (d: any) => addExpense({ data: d }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      dispatch({ expenseSheetOpen: false });
    },
  });

  const addTransferMutation = useMutation({
    mutationFn: (d: any) => addTransfer({ data: d }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      dispatch({ transferSheetOpen: false });
    },
  });

  const availableBalance = useMemo(() => {
    const paidIncomes = data.incomes.filter((i) => !(i as any).isTransfer);
    const paidExpenses = data.expenses.filter(
      (e) => (e as any).status !== "pending" && (e as any).accountType !== "credit" && !(e as any).isTransfer,
    );

    const incomeSum = paidIncomes.reduce((acc, curr) => acc + curr.amount, 0);
    const expenseSum = paidExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    return incomeSum - expenseSum;
  }, [data]);

  const filteredHistory = useMemo(() => {
    let filtered = data.incomes.filter((item) => {
      if (state.tableSearch) {
        const search = state.tableSearch.toLowerCase();
        return (
          item.description.toLowerCase().includes(search) ||
          item.category.toLowerCase().includes(search)
        );
      }
      return true;
    });

    filtered = filterTransactionsByMonth(filtered, state.selectedDate);

    return filtered.sort((a, b) => {
      const valA = new Date(a.date).getTime();
      const valB = new Date(b.date).getTime();
      return state.sortDirection === "asc" ? valA - valB : valB - valA;
    });
  }, [data.incomes, state.tableSearch, state.sortDirection, state.selectedDate]);

  const paginatedHistory = useMemo(
    () => filteredHistory.slice(0, state.visibleCount),
    [filteredHistory, state.visibleCount],
  );
  const hasMore = filteredHistory.length > state.visibleCount;

  const handleEdit = (item: any) => {
    const tx = { ...item, type: "income" as const };
    dispatch({
      editingItem: tx,
      selectedUserId: tx.userId || "family",
      incomeCategory: tx.category,
      incomeSheetOpen: true,
    });
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
      dispatch({ transferSheetOpen: true });
    };

    window.addEventListener("open-quick-add-expense", handleQuickAddExpense);
    window.addEventListener("open-quick-add-income", handleQuickAddIncome);
    window.addEventListener("open-quick-add-transfer", handleQuickAddTransfer);
    return () => {
      window.removeEventListener("open-quick-add-expense", handleQuickAddExpense);
      window.removeEventListener("open-quick-add-income", handleQuickAddIncome);
      window.removeEventListener("open-quick-add-transfer", handleQuickAddTransfer);
    };
  }, []);

  return (
    <div className="w-full min-h-screen flex flex-col bg-background antialiased p-6 md:p-12 pb-32">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between pt-4 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground uppercase italic">
            Income
          </h1>
          <p className="text-[10px] md:text-sm font-black tracking-[0.2em] text-muted-foreground opacity-40 uppercase ml-1">
            Income History
          </p>
        </div>
        <button
          onClick={() => {
            dispatch({
              editingItem: null,
              incomeSheetOpen: true,
            });
          }}
          className="hidden size-16 rounded-xl bg-emerald-600 text-white items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all md:flex"
        >
          <Plus className="size-8" />
        </button>
      </div>

      {/* Modern Search/Filter */}
      <div className="flex gap-3 mb-10">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground opacity-30 group-focus-within:opacity-100 transition-opacity" />
          <Input
            placeholder="Search income..."
            className="h-14 pl-14 rounded-xl bg-secondary/30 border-none shadow-inner text-base font-bold placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
            value={state.tableSearch}
            onChange={(e) => dispatch({ tableSearch: e.target.value })}
          />
        </div>
        <MonthSelector
          selectedDate={state.selectedDate}
          onDateChange={(date) => dispatch({ selectedDate: date })}
          variant="icon"
          align="end"
        />
      </div>

      {/* Redesigned List */}
      {filteredHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-secondary/5 rounded-[40px] border border-dashed border-secondary/20">
          <div className="size-20 rounded-full bg-secondary/10 flex items-center justify-center mb-8">
            <Calendar className="size-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-2xl font-black text-foreground/80 mb-3 tracking-tight italic uppercase">
            No Income
          </h3>
          <p className="text-sm font-bold text-muted-foreground/40 max-w-[300px] leading-relaxed uppercase tracking-widest">
            There are no income records for{" "}
            <span className="text-foreground/60 font-black">
              {format(state.selectedDate, "MMMM yyyy")}
            </span>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {paginatedHistory.map((item) => (
            <TransactionCard
              key={item.id}
              transaction={{ ...item, type: "income" }}
              categoryConfigMap={categoryConfigMap}
              onClick={() => handleEdit(item)}
              onStatusUpdate={
                item.status === "pending"
                  ? (status) =>
                      updateStatusMutation.mutate({
                        id: item.id,
                        type: "income",
                        status,
                      })
                  : undefined
              }
              formatCurrency={formatCurrency}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="pt-10 flex justify-center">
          <Button
            variant="ghost"
            onClick={() => dispatch({ visibleCount: state.visibleCount + INITIAL_PAGE_SIZE })}
            className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:text-emerald-600"
          >
            <ChevronDown className="mr-2 h-4 w-4" /> Load More
          </Button>
        </div>
      )}

      <TransactionSheet
        mode="income"
        open={state.incomeSheetOpen}
        onOpenChange={(open) => dispatch({ incomeSheetOpen: open })}
        editingItem={state.editingItem}
        users={data.users}
        selectedUserId={state.selectedUserId}
        setSelectedUserId={(val) => dispatch({ selectedUserId: val })}
        category={state.incomeCategory}
        setCategory={(val) => dispatch({ incomeCategory: val })}
        availableCategories={availableCategories}
        setAvailableCategories={() => {}} // Derived from props
        categoryConfigs={data.categoryConfigs}
        onSubmit={(d) => {
          if (state.editingItem) {
            updateIncomeMutation.mutate(d);
          } else {
            addIncomeMutation.mutate(d);
          }
        }}
        onDelete={(id) => deleteIncomeMutation.mutate(id)}
        saving={addIncomeMutation.isPending || updateIncomeMutation.isPending}
      />

      <TransactionSheet
        mode="expense"
        open={state.expenseSheetOpen}
        onOpenChange={(open) => dispatch({ expenseSheetOpen: open })}
        editingItem={null}
        users={data.users}
        selectedUserId={state.selectedUserId}
        setSelectedUserId={(val) => dispatch({ selectedUserId: val })}
        category={""}
        setCategory={() => {}}
        availableCategories={[]}
        setAvailableCategories={() => {}}
        categoryConfigs={data.categoryConfigs}
        onSubmit={(d) => addExpenseMutation.mutate(d)}
        saving={addExpenseMutation.isPending}
      />
      <TransferSheet
        open={state.transferSheetOpen}
        onOpenChange={(open) => dispatch({ transferSheetOpen: open })}
        users={data.users}
        savingsAccounts={data.savingsAccounts}
        creditCards={data.creditCards}
        availableBalance={availableBalance}
        onSubmit={(d) => addTransferMutation.mutate(d)}
        saving={addTransferMutation.isPending}
      />
    </div>
  );
}
