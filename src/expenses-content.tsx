import React, { useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TransactionSheet } from "@/components/transaction-sheet";
import { TransactionCard } from "@/components/transaction-card";
import {
  type CategoryConfig,
} from "@/lib/category-visuals";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { addExpense, updateExpense, deleteExpense, updateTransactionStatus, addIncome } from "./actions";

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
    expenseCategories: string[];
    categoryConfigs: CategoryConfig[];
  };
}

const INITIAL_PAGE_SIZE = 20;

const formatCurrency = (amountCents: number) => {
  return (amountCents / 100).toLocaleString("en-IE", { style: "currency", currency: "EUR" });
};

export function ExpensesContent({ data }: PageProps) {
  const queryClient = useQueryClient();
  const [state, dispatch] = React.useReducer(
    (s: any, a: any) => ({ ...s, ...a }),
    {
      expenseSheetOpen: false,
      incomeSheetOpen: false,
      selectedUserId: "family",
      expenseCategory: "",
      editingItem: null,
      tableSearch: "",
      visibleCount: INITIAL_PAGE_SIZE,
      sortDirection: "desc",
    }
  );

  const availableCategories = data.expenseCategories;
  const categoryConfigMap = useMemo(() => {
    const map: Record<string, CategoryConfig> = {};
    data.categoryConfigs.forEach((config) => {
      map[config.name] = config;
    });
    return map;
  }, [data.categoryConfigs]);

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
  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => deleteExpense({ data: id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      dispatch({ expenseSheetOpen: false });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (d: { id: string; type: "expense" | "income"; status: "pending" | "paid" }) =>
      updateTransactionStatus({ data: d }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const addIncomeMutation = useMutation({
    mutationFn: (d: any) => addIncome({ data: d }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      dispatch({ incomeSheetOpen: false });
    },
  });


  const filteredHistory = useMemo(() => {
    return data.expenses
      .filter((item) => {
        if (state.tableSearch) {
          const search = state.tableSearch.toLowerCase();
          return (
            item.description.toLowerCase().includes(search) ||
            item.category.toLowerCase().includes(search)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const valA = new Date(a.date).getTime();
        const valB = new Date(b.date).getTime();
        return state.sortDirection === "asc" ? valA - valB : valB - valA;
      });
  }, [data.expenses, state.tableSearch, state.sortDirection]);

  const paginatedHistory = useMemo(
    () => filteredHistory.slice(0, state.visibleCount),
    [filteredHistory, state.visibleCount],
  );
  const hasMore = filteredHistory.length > state.visibleCount;

  const handleEdit = (item: any) => {
    const tx = { ...item, type: "expense" as const };
    dispatch({
      editingItem: tx,
      selectedUserId: tx.userId || "family",
      expenseCategory: tx.category,
      expenseSheetOpen: true,
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
        expenseCategory: "",
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
    <div className="w-full min-h-screen flex flex-col bg-background antialiased p-6 md:p-12 pb-32">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between pt-4 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground uppercase italic">
            Expenses
          </h1>
          <p className="text-[10px] md:text-sm font-black tracking-[0.2em] text-muted-foreground opacity-40 uppercase ml-1">
            Spending History
          </p>
        </div>
        <button
          onClick={() => {
            dispatch({
              editingItem: null,
              expenseSheetOpen: true,
            });
          }}
          className="hidden size-16 rounded-xl bg-foreground text-background items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all md:flex"
        >
          <Plus className="size-8" />
        </button>
      </div>

      {/* Modern Search/Filter */}
      <div className="flex gap-3 mb-10">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground opacity-30 group-focus-within:opacity-100 transition-opacity" />
          <Input
            placeholder="Search records..."
            className="h-14 pl-14 rounded-xl bg-secondary/30 border-none shadow-inner text-base font-bold placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
            value={state.tableSearch}
            onChange={(e) => dispatch({ tableSearch: e.target.value })}
          />
        </div>
        <button
          onClick={() => dispatch({ sortDirection: state.sortDirection === "asc" ? "desc" : "asc" })}
          className="size-14 rounded-xl bg-secondary/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shadow-inner"
        >
          <ArrowUpDown
            className={cn(
              "size-6 transition-transform duration-500",
              state.sortDirection === "asc" ? "rotate-0" : "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Redesigned List */}
      <div className="flex flex-col gap-4">
        {paginatedHistory.map((item) => (
          <TransactionCard
            key={item.id}
            transaction={{ ...item, type: "expense" }}
            categoryConfigMap={categoryConfigMap}
            onClick={() => handleEdit(item)}
            onStatusUpdate={
              item.status === "pending"
                ? (status) =>
                    updateStatusMutation.mutate({
                      id: item.id,
                      type: "expense",
                      status,
                    })
                : undefined
            }
            formatCurrency={formatCurrency}
          />
        ))}
      </div>

      {hasMore && (
        <div className="pt-10 flex justify-center">
          <Button
            variant="ghost"
            onClick={() => dispatch({ visibleCount: state.visibleCount + INITIAL_PAGE_SIZE })}
            className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:text-primary"
          >
            <ChevronDown className="mr-2 h-4 w-4" /> Load More
          </Button>
        </div>
      )}

      <TransactionSheet
        mode="expense"
        open={state.expenseSheetOpen}
        onOpenChange={(open) => dispatch({ expenseSheetOpen: open })}
        editingItem={state.editingItem}
        users={data.users}
        selectedUserId={state.selectedUserId}
        setSelectedUserId={(val) => dispatch({ selectedUserId: val })}
        category={state.expenseCategory}
        setCategory={(val) => dispatch({ expenseCategory: val })}
        availableCategories={availableCategories}
        setAvailableCategories={() => {}} // Derived from props
        categoryConfigs={data.categoryConfigs}
        onSubmit={(d) => {
          if (state.editingItem) {
            updateExpenseMutation.mutate(d);
          } else {
            addExpenseMutation.mutate(d);
          }
        }}
        onDelete={(id) => deleteExpenseMutation.mutate(id)}
        saving={addExpenseMutation.isPending || updateExpenseMutation.isPending}
      />

      <TransactionSheet
        mode="income"
        open={state.incomeSheetOpen}
        onOpenChange={(open) => dispatch({ incomeSheetOpen: open })}
        editingItem={null}
        users={data.users}
        selectedUserId={state.selectedUserId}
        setSelectedUserId={(val) => dispatch({ selectedUserId: val })}
        category={""}
        setCategory={() => {}}
        availableCategories={[]}
        setAvailableCategories={() => {}}
        categoryConfigs={data.categoryConfigs}
        onSubmit={(d) => addIncomeMutation.mutate(d)}
        saving={addIncomeMutation.isPending}
      />
    </div>
  );
}
