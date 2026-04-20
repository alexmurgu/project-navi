import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  ArrowUpDown,
  Pencil,
  Trash2,
  ChevronDown,
  Users,
  User as UserIcon,
  Save,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CategoryCombobox } from "@/components/category-combobox";
import { TransactionSheet } from "@/components/transaction-sheet";
import {
  CategoryIcon,
  getCategoryConfig,
  type CategoryConfig,
  withAlpha,
} from "@/lib/category-visuals";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { addExpense, updateExpense, deleteExpense, updateTransactionStatus } from "./actions";

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
  const navigate = useNavigate();
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>(data.expenseCategories);
  const [selectedUserId, setSelectedUserId] = useState<string>("family");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [selectedExpenseType, setSelectedExpenseType] = useState<"monthly" | "extra">("extra");
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [tableSearch, setTableSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
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
  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => deleteExpense({ data: id }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["dashboard"], type: "active" });
      setExpenseSheetOpen(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (d: { id: string; type: "expense" | "income"; status: "pending" | "paid" }) =>
      updateTransactionStatus({ data: d }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["dashboard"], type: "active" });
    },
  });

  const filteredHistory = useMemo(() => {
    return data.expenses
      .filter((item) => {
        if (tableSearch) {
          const search = tableSearch.toLowerCase();
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
        return sortDirection === "asc" ? valA - valB : valB - valA;
      });
  }, [data.expenses, tableSearch, sortDirection]);

  const paginatedHistory = useMemo(
    () => filteredHistory.slice(0, visibleCount),
    [filteredHistory, visibleCount],
  );
  const hasMore = filteredHistory.length > visibleCount;

  const handleEdit = (item: any) => {
    const tx = { ...item, type: "expense" as const };
    setEditingItem(tx);
    setSelectedUserId(tx.userId || "family");
    setExpenseCategory(tx.category);
    setSelectedExpenseType(tx.isMonthly ? "monthly" : "extra");
    setExpenseSheetOpen(true);
  };

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, item: any) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleEdit(item);
    }
  };

  const openMemberOverview = (memberId: string | null) => {
    navigate({
      to: "/members/$memberId",
      params: { memberId: memberId || "family" },
    });
  };

  const openCategoryOverview = (category: string) => {
    navigate({
      to: "/categories/$category",
      params: { category },
    });
  };

  useEffect(() => {
    const handleQuickAddExpense = () => {
      setEditingItem(null);
      setSelectedUserId("family");
      setExpenseCategory("");
      setExpenseSheetOpen(true);
    };

    const pendingQuickAdd = sessionStorage.getItem("pendingQuickAdd");
    if (pendingQuickAdd === "expense") {
      handleQuickAddExpense();
      sessionStorage.removeItem("pendingQuickAdd");
    }

    window.addEventListener("open-quick-add-expense", handleQuickAddExpense);
    return () => window.removeEventListener("open-quick-add-expense", handleQuickAddExpense);
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
            setEditingItem(null);
            setExpenseSheetOpen(true);
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
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
          className="size-14 rounded-xl bg-secondary/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shadow-inner"
        >
          <ArrowUpDown
            className={cn(
              "size-6 transition-transform duration-500",
              sortDirection === "asc" ? "rotate-0" : "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Redesigned List */}
      <div className="flex flex-col gap-2">
        {/* Table Header (Desktop Only) */}
        <div className="hidden md:flex items-center px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-30">
          <div className="w-12 mr-5"></div>
          <div className="flex-1">Description</div>
          <div className="w-32">Member</div>
          <div className="w-40">Date</div>
          <div className="w-32 text-right">Amount</div>
          <div className="w-24 ml-4"></div>
        </div>

        {paginatedHistory.map((item) => {
          const config = getCategoryConfig(categoryConfigMap, item.category);
          const color = config?.color || "#F43F5E";
          const bgColor = withAlpha(color, 0.05);
          return (
            <div
              key={item.id}
              className="group flex items-center p-4 rounded-xl transition-all cursor-pointer border border-transparent hover:border-muted/10 shadow-sm"
              style={{ backgroundColor: bgColor }}
              onClick={() => handleEdit(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => handleRowKeyDown(event, item)}
            >
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="size-11 rounded-lg flex items-center justify-center shrink-0">
                  <CategoryIcon
                    category={item.category}
                    config={config}
                    kind="expense"
                    className="size-6"
                    color={color}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-base tracking-tight truncate">
                    {item.description}
                  </h4>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCategoryOverview(item.category);
                    }}
                    className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 block md:inline hover:text-primary transition-colors"
                  >
                    {item.category}
                  </button>
                </div>
              </div>

              <div className="hidden md:flex w-32 shrink-0 mx-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openMemberOverview(item.userId);
                  }}
                  className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-primary tracking-tighter px-0 py-0 bg-transparent hover:underline underline-offset-4"
                >
                  <UserIcon className="size-2.5 opacity-50" />
                  <span className="truncate">{item.userName || "Family"}</span>
                </button>
              </div>

              <div className="hidden md:block w-40 text-[9px] font-black uppercase text-muted-foreground opacity-40 shrink-0 mx-2">
                {format(new Date(item.date), "MMM dd, yyyy")}
              </div>

              <div className="text-right w-32 shrink-0 flex items-center gap-3 justify-end">
                <div>
                  <p
                    className={cn(
                      "font-black text-lg tracking-tight",
                      item.status === "pending"
                        ? "text-muted-foreground opacity-40"
                        : "text-rose-600",
                    )}
                  >
                    -{formatCurrency(item.amount)}
                  </p>
                  <p className="md:hidden text-[9px] font-black uppercase text-muted-foreground opacity-20 mt-0.5">
                    {format(new Date(item.date), "MMM dd")}
                  </p>
                </div>
                {item.status === "pending" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatusMutation.mutate({
                        id: item.id,
                        type: "expense",
                        status: "paid",
                      });
                    }}
                    className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-500/20 transition-all shadow-sm"
                  >
                    <Check className="size-4" />
                  </button>
                )}
              </div>

              {/* Actions visible on hover */}
              <div className="hidden md:flex items-center gap-1 ml-4 w-24 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(item);
                  }}
                  className="size-9 rounded-lg bg-muted/10 flex items-center justify-center hover:bg-muted/20"
                >
                  <Pencil className="size-4 opacity-40" />
                </button>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="size-9 rounded-lg bg-rose-500/5 text-rose-600 flex items-center justify-center hover:bg-rose-500/15"
                      >
                        <Trash2 className="size-4 opacity-40" />
                      </button>
                    }
                  />
                  <AlertDialogContent className="rounded-2xl p-10 border-none shadow-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-2xl font-black tracking-tight uppercase italic">
                        Delete Record
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-xs font-bold opacity-50 mt-2 uppercase">
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 gap-3">
                      <AlertDialogCancel className="h-12 rounded-xl font-black text-[10px] uppercase tracking-widest border-none bg-muted/10">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteExpenseMutation.mutate(item.id)}
                        className="h-12 rounded-xl bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest border-none"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="pt-10 flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setVisibleCount((prev) => prev + INITIAL_PAGE_SIZE)}
            className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:text-primary"
          >
            <ChevronDown className="mr-2 h-4 w-4" /> Load More
          </Button>
        </div>
      )}

      <TransactionSheet
        mode="expense"
        open={expenseSheetOpen}
        onOpenChange={setExpenseSheetOpen}
        editingItem={editingItem}
        users={data.users}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        category={expenseCategory}
        setCategory={setExpenseCategory}
        availableCategories={availableCategories}
        setAvailableCategories={setAvailableCategories}
        onSubmit={(d) => {
          if (editingItem) {
            updateExpenseMutation.mutate(d);
          } else {
            addExpenseMutation.mutate(d);
          }
        }}
        onDelete={(id) => deleteExpenseMutation.mutate(id)}
        saving={addExpenseMutation.isPending || updateExpenseMutation.isPending}
      />
    </div>
  );
}
