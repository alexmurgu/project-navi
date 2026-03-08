"use client";

import React, { useState, useMemo } from "react";
import { 
  Wallet, TrendingDown, ArrowUpCircle, ArrowDownCircle, 
  Receipt, CircleDollarSign, ChartArea, Search, ListFilter, 
  CalendarIcon, ArrowUpDown, Trash2, Pencil, Filter, Users, 
  Check, ChevronsUpDown, PlusCircle, Plus, X, FileUp, Loader2, 
  Save, SquareMousePointer
} from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, 
  AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend
} from "recharts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Papa from "papaparse";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { addExpense, addIncome, deleteExpense, deleteIncome, updateExpense, updateIncome, bulkDeleteTransactions } from "./actions";
import { CategoryCombobox } from "@/components/category-combobox";

interface PageProps {
  data: {
    user: any;
    users: { id: string, name: string }[];
    expenses: any[];
    incomes: any[];
    categories: string[];
    categoryConfigs: { name: string, color: string }[];
  }
}

const formatCurrency = (amountCents: number) => {
  return (amountCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
};

const toTitleCase = (str: string) => {
  if (!str) return "";
  return str.toLowerCase().split(' ').map(word => {
    return (word.charAt(0).toUpperCase() + word.slice(1));
  }).join(' ');
};

export function DashboardContent({ data }: PageProps) {
  const getCategoryColor = (name: string, defaultColor: string) => {
    const config = data.categoryConfigs.find(c => c.name.toLowerCase() === name.toLowerCase());
    return config?.color || defaultColor;
  };

  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false);
  const [incomeSheetOpen, setIncomeSheetOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>(data.categories);
  const router = useRouter();

  React.useEffect(() => {
    setAvailableCategories(data.categories);
  }, [data.categories]);
  
  const [selectedUserId, setSelectedUserId] = useState<string>("family");
  const [entryDate, setEntryDate] = useState<Date | undefined>(new Date());
  
  const [expenseCategory, setExpenseCategory] = useState("");
  const [incomeCategory, setIncomeCategory] = useState("");
  const [selectedExpenseType, setSelectedExpenseType] = useState<"monthly" | "extra">("extra");
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [historyView, setHistoryView] = useState<"all" | "expenses" | "incomes">("all");
  const [tableSearch, setTableSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortColumn, setSortColumn] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as string[][];
        const dataRows = rows.slice(8);
        
        const parsed = dataRows.map((row) => {
          const dateStr = row[0];
          const description = row[1];
          
          const cleanAmount = (val: string) => {
            if (!val) return "";
            return val.replace(/\./g, "").replace(",", ".");
          };

          const debit = cleanAmount(row[4]);
          const credit = cleanAmount(row[5]);
          
          let amount = 0;
          let type = "expense";
          
          if (credit) {
            amount = parseFloat(credit);
            type = "income";
          } else if (debit) {
            amount = parseFloat(debit);
            type = "expense";
          }

          const parts = dateStr.split("/");
          const formattedDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : new Date().toISOString().split("T")[0];

          return {
            id: Math.random().toString(36).substr(2, 9),
            date: formattedDate,
            description: description || "Bank Transaction",
            amount: Math.abs(amount),
            type,
            category: type === "income" ? "Salary" : "Groceries",
            userId: data.user.id,
            isMonthly: false
          };
        }).filter(tx => tx.amount > 0);

        sessionStorage.setItem("pending_import", JSON.stringify(parsed));
        setImportModalOpen(false);
        setIsParsing(false);
        router.push("/import");
      }
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredHistory.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredHistory.map(item => item.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    // Filter selection by type because bulk action is type-specific in our current schema implementation
    const expensesToDelete = filteredHistory.filter(i => i.type === 'expense' && selectedIds.includes(i.id)).map(i => i.id);
    const incomesToDelete = filteredHistory.filter(i => i.type === 'income' && selectedIds.includes(i.id)).map(i => i.id);

    if (expensesToDelete.length > 0) {
      await bulkDeleteTransactions(expensesToDelete, 'expense');
    }
    if (incomesToDelete.length > 0) {
      await bulkDeleteTransactions(incomesToDelete, 'income');
    }

    setSelectedIds([]);
    setSelectionMode(false);
  };

  const totalIncome = data.incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalMonthly = data.expenses.filter((e) => e.isMonthly).reduce((acc, curr) => acc + curr.amount, 0);
  const totalExtra = data.expenses.filter((e) => !e.isMonthly).reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = totalMonthly + totalExtra;
  const balance = totalIncome - totalExpenses;

  const allItems = useMemo(() => [
    ...data.expenses.map((e) => ({ ...e, type: "expense" as const })),
    ...data.incomes.map((i) => ({ ...i, type: "income" as const, isMonthly: false }))
  ], [data.expenses, data.incomes]);

  const filteredHistory = useMemo(() => {
    return allItems.filter((item) => {
      if (historyView === "expenses" && item.type !== "expense") return false;
      if (historyView === "incomes" && item.type !== "income") return false;

      if (tableSearch) {
        const search = tableSearch.toLowerCase();
        if (
          !(
            item.description.toLowerCase().includes(search) ||
            item.category.toLowerCase().includes(search) ||
            item.userName.toLowerCase().includes(search)
          )
        )
          return false;
      }

      const itemDate = new Date(item.date);
      if (dateRange?.from && itemDate < dateRange.from) return false;
      if (dateRange?.to && itemDate > dateRange.to) return false;

      return true;
    }).sort((a, b) => {
      let valA: any = a[sortColumn as keyof typeof a];
      let valB: any = b[sortColumn as keyof typeof b];

      if (sortColumn === "date") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [allItems, historyView, tableSearch, dateRange, sortColumn, sortDirection]);

  const chartData = useMemo(() => {
    const dailyMap = new Map<string, { date: Date; income: number; expense: number; label: string }>();

    filteredHistory.forEach((item) => {
      const d = new Date(item.date);
      const dateKey = d.toISOString().split("T")[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { date: new Date(dateKey), income: 0, expense: 0, label: format(d, "MMM dd") });
      }
      const entry = dailyMap.get(dateKey)!;
      if (item.type === "income") entry.income += item.amount / 100;
      else entry.expense += item.amount / 100;
    });

    return Array.from(dailyMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [filteredHistory]);

  const categoryData = useMemo(() => {
    const catMap = new Map<string, number>();
    data.expenses.forEach((exp) => {
      const cat = exp.category || "Other";
      catMap.set(cat, (catMap.get(cat) || 0) + exp.amount / 100);
    });
    return Array.from(catMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data.expenses]);

  const incomeCategoryData = useMemo(() => {
    const catMap = new Map<string, number>();
    data.incomes.forEach((inc) => {
      const cat = inc.category || "Other";
      catMap.set(cat, (catMap.get(cat) || 0) + inc.amount / 100);
    });
    return Array.from(catMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data.incomes]);

  const incomeUserData = useMemo(() => {
    const userMap = new Map<string, number>();
    data.incomes.forEach((inc) => {
      const name = inc.userName || "Family Wide";
      userMap.set(name, (userMap.get(name) || 0) + inc.amount / 100);
    });
    return Array.from(userMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data.incomes]);

  const expenseUserData = useMemo(() => {
    const userMap = new Map<string, number>();
    data.expenses.forEach((exp) => {
      const name = exp.userName || "Family Wide";
      userMap.set(name, (userMap.get(name) || 0) + exp.amount / 100);
    });
    return Array.from(userMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data.expenses]);

  const combinedUserData = useMemo(() => {
    const userMap = new Map<string, { name: string; income: number; expense: number }>();
    
    data.incomes.forEach((inc) => {
      const name = inc.userName || "Family Wide";
      if (!userMap.has(name)) userMap.set(name, { name, income: 0, expense: 0 });
      userMap.get(name)!.income += inc.amount / 100;
    });

    data.expenses.forEach((exp) => {
      const name = exp.userName || "Family Wide";
      if (!userMap.has(name)) userMap.set(name, { name, income: 0, expense: 0 });
      userMap.get(name)!.expense += exp.amount / 100;
    });

    return Array.from(userMap.values()).sort((a, b) => (b.income + b.expense) - (a.income + a.expense));
  }, [data.incomes, data.expenses]);

  const toggleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const clearFilters = () => {
    setTableSearch("");
    setHistoryView("all");
    setDateRange(undefined);
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const resetEntryDate = () => {
    setEntryDate(new Date());
    setSelectedUserId("family");
    setExpenseCategory("");
    setIncomeCategory("");
    setEditingItem(null);
  };

  const handleEdit = (item: any) => {
    setSelectionMode(false);
    setSelectedIds([]);
    setEditingItem(item);
    setSelectedUserId(item.userId || "family");
    if (item.type === "expense") {
      setExpenseCategory(item.category);
      setSelectedExpenseType(item.isMonthly ? "monthly" : "extra");
      setExpenseSheetOpen(true);
    } else {
      setIncomeCategory(item.category);
      setIncomeSheetOpen(true);
    }
  };

  return (
    <div className="relative z-10 mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="grid gap-4 text-left md:grid-cols-2 lg:grid-cols-3">
        <Card className="glass-panel relative overflow-hidden border-primary/30 shadow-[0_0_20px_rgba(245,158,11,0.1)] rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-primary">Net Balance</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="relative z-10 text-left">
            <div className={`text-3xl font-extrabold tracking-tight ${balance >= 0 ? "text-white" : "text-red-400"}`}>
              {formatCurrency(balance)}
            </div>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex flex-col">
                <p className="text-[10px] font-medium tracking-wider text-white/40 uppercase">Total Income</p>
                <p className="font-mono text-xs font-semibold text-green-400">{formatCurrency(totalIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel group relative overflow-hidden border-white/10 rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-left">
            <CardTitle className="text-sm font-semibold text-white/70">Current Month Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent className="text-left">
            <div className="text-2xl font-extrabold tracking-tight text-white">
              {formatCurrency(totalExpenses)}
            </div>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex flex-col">
                <p className="text-[10px] font-medium tracking-wider text-white/40 uppercase">Monthly</p>
                <p className="font-mono text-xs font-semibold text-blue-400">{formatCurrency(totalMonthly)}</p>
              </div>
              <div className="mt-2 h-4 w-[1px] bg-white/10"></div>
              <div className="flex flex-col">
                <p className="text-[10px] font-medium tracking-wider text-white/40 uppercase">Extras</p>
                <p className="font-mono text-xs font-semibold text-amber-400">{formatCurrency(totalExtra)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/20 bg-white/5 rounded-lg">
          <CardHeader className="pb-2 text-left">
            <CardTitle className="text-xs font-medium tracking-wider text-white/40 uppercase">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-2">
            <Button
              variant="default"
              size="xl"
              className="w-full bg-primary transition-all hover:bg-primary/90 rounded-lg"
              onClick={() => {
                setExpenseSheetOpen(true);
                resetEntryDate();
              }}
            >
              <Receipt className="mr-2 h-5 w-5" /> Add Expense
            </Button>
            <Button
              variant="outline"
              size="xl"
              className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-lg"
              onClick={() => {
                setIncomeSheetOpen(true);
                resetEntryDate();
              }}
            >
              <CircleDollarSign className="mr-2 h-5 w-5 text-purple-400" /> Add Income
            </Button>
            
            <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
              <DialogTrigger 
                render={
                  <Button
                    variant="outline"
                    size="xl"
                    className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-lg"
                  >
                    <FileUp className="mr-2 h-5 w-5 text-blue-400" /> Import CSV
                  </Button>
                }
              />
              <DialogContent className="glass-panel border-white/10 sm:max-w-md rounded-lg">
                <DialogHeader>
                  <DialogTitle className="text-white font-semibold">Import Bank Statement</DialogTitle>
                  <DialogDescription className="text-white/60">
                    Upload your bank history CSV to review and import transactions.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-lg p-8 bg-black/20 hover:bg-black/30 transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="hidden"
                    id="csv-modal-upload"
                    disabled={isParsing}
                  />
                  <label
                    htmlFor="csv-modal-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    {isParsing ? (
                      <Loader2 className="size-8 text-blue-400 animate-spin mb-2" />
                    ) : (
                      <div className="size-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-2">
                        <FileUp className="size-6 text-blue-400" />
                      </div>
                    )}
                    <span className="text-sm font-semibold text-white">{isParsing ? "Parsing..." : "Click to select CSV"}</span>
                  </label>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel border-white/10 rounded-lg">
        <CardHeader className="pb-2 text-left">
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <ChartArea className="h-5 w-5 text-primary" />
            Financial Trends
          </CardTitle>
          <CardDescription className="text-white/40">
            Cash flow over time based on current filters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full pt-4">
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="label" 
                    stroke="rgba(255,255,255,0.2)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.2)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `$${value}`} 
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <RechartsTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass-panel border-white/10 p-3 shadow-2xl rounded-lg">
                            <div className="mb-2 text-left text-[10px] font-medium tracking-wider text-white/40 uppercase">
                              {label}
                            </div>
                            <div className="flex flex-col gap-1.5">
                              {payload.map((entry, index) => (
                                <div key={index} className="flex items-center justify-between gap-8">
                                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${entry.dataKey === "income" ? "text-green-400" : "text-red-400"}`}>
                                    <div className={`h-1.5 w-1.5 rounded-lg ${entry.dataKey === "income" ? "bg-green-400" : "bg-red-400"}`}></div>
                                    {entry.dataKey === "income" ? "Income" : "Expense"}
                                  </span>
                                  <span className="font-mono text-xs font-semibold text-white">
                                    ${(entry.value as number).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <ChartArea className="h-6 w-6 text-white/20" />
                </div>
                <p className="text-sm font-medium tracking-wider text-white/30 uppercase">
                  Not enough data to generate trend
                </p>
                <p className="mt-1 text-xs text-white/20">
                  Add transactions across multiple days to see chart.
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-6 rounded-lg border border-green-500/50 bg-green-500/30"></div>
              <span className="text-[10px] font-medium tracking-wider text-white/50 uppercase">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-6 rounded-lg border border-red-500/50 bg-red-500/30"></div>
              <span className="text-[10px] font-medium tracking-wider text-white/50 uppercase">Expenses</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Category Analysis with Tabs */}
        <Card className="glass-panel border-white/10 rounded-lg">
          <Tabs defaultValue="expenses" className="w-full">
            <CardHeader className="pb-2 text-left flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <ListFilter className="h-5 w-5 text-primary" />
                  Category Analysis
                </CardTitle>
                <CardDescription className="text-white/40">
                  Breakdown of flows by category.
                </CardDescription>
              </div>
              <TabsList className="bg-black/40 border border-white/5 rounded-lg h-9 p-1">
                <TabsTrigger value="expenses" className="rounded-lg px-3 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white">Expenses</TabsTrigger>
                <TabsTrigger value="income" className="rounded-lg px-3 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white">Income</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="expenses" className="mt-0">
                <div className="h-[250px] w-full pt-4">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="rgba(255,255,255,0.2)" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          angle={-45}
                          textAnchor="end"
                          interval={0}
                          height={60}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.2)" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(value) => `$${value}`} 
                        />
                        <RechartsTooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="glass-panel border-white/10 p-3 shadow-2xl rounded-lg">
                                  <div className="mb-1 text-left text-[10px] font-medium tracking-wider text-white/40 uppercase">Category</div>
                                  <div className="mb-2 text-left text-xs font-semibold text-white">{label}</div>
                                  <div className="flex items-center justify-between gap-8">
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                                      <div className="h-1.5 w-1.5 rounded-lg bg-amber-400"></div> Spent
                                    </span>
                                    <span className="font-mono text-xs font-semibold text-white">${parseFloat(payload[0].value as string).toFixed(2)}</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name, "rgba(245, 158, 11, 0.7)")} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <p className="text-sm font-medium tracking-wider text-white/30 uppercase">No categorical data</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="income" className="mt-0">
                <div className="h-[250px] w-full pt-4">
                  {incomeCategoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incomeCategoryData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="rgba(255,255,255,0.2)" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          angle={-45}
                          textAnchor="end"
                          interval={0}
                          height={60}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.2)" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(value) => `$${value}`} 
                        />
                        <RechartsTooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="glass-panel border-white/10 p-3 shadow-2xl rounded-lg">
                                  <div className="mb-1 text-left text-[10px] font-medium tracking-wider text-white/40 uppercase">Category</div>
                                  <div className="mb-2 text-left text-xs font-semibold text-white">{label}</div>
                                  <div className="flex items-center justify-between gap-8">
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-400">
                                      <div className="h-1.5 w-1.5 rounded-lg bg-purple-400"></div> Earned
                                    </span>
                                    <span className="font-mono text-xs font-semibold text-white">${parseFloat(payload[0].value as string).toFixed(2)}</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {incomeCategoryData.map((entry, index) => (
                            <Cell key={`cell-income-${index}`} fill={getCategoryColor(entry.name, "rgba(168, 85, 247, 0.7)")} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <p className="text-sm font-medium tracking-wider text-white/30 uppercase">No categorical data</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Card 2: Family Member Performance (Grouped) */}
        <Card className="glass-panel border-white/10 rounded-lg">
          <CardHeader className="pb-2 text-left">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Users className="h-5 w-5 text-emerald-400" />
              Member Performance
            </CardTitle>
            <CardDescription className="text-white/40">
              Income vs. Expenses per family member.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full pt-4">
              {combinedUserData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={combinedUserData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="rgba(255,255,255,0.2)" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.2)" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `$${value}`} 
                    />
                    <RechartsTooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="glass-panel border-white/10 p-3 shadow-2xl rounded-lg">
                              <div className="mb-1 text-left text-[10px] font-medium tracking-wider text-white/40 uppercase">Family Member</div>
                              <div className="mb-2 text-left text-xs font-semibold text-white">{label}</div>
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between gap-8">
                                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                                    <div className="h-1.5 w-1.5 rounded-lg bg-emerald-400"></div> Earned
                                  </span>
                                  <span className="font-mono text-xs font-semibold text-white">${payload[0].value}</span>
                                </div>
                                <div className="flex items-center justify-between gap-8">
                                  <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                                    <div className="h-1.5 w-1.5 rounded-lg bg-red-400"></div> Spent
                                  </span>
                                  <span className="font-mono text-xs font-semibold text-white">${payload[1].value}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      iconType="circle" 
                      wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'semibold', opacity: 0.5 }}
                    />
                    <Bar dataKey="income" name="Income" fill="#34d399" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="text-sm font-medium tracking-wider text-white/30 uppercase">No member data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full text-left">
        <Card className="glass-panel border-white/10 rounded-lg">
          <CardHeader className="border-b border-white/5 pb-4 text-left">
            <div className="flex flex-col gap-6 text-left">
              <div className="flex flex-col justify-between gap-4 text-left md:flex-row md:items-center">
                <div className="text-left">
                  <CardTitle className="text-left text-xl text-white">Recent Transactions</CardTitle>
                  <CardDescription className="text-left text-white/60">
                    View and manage your family's financial logs.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={selectionMode ? "default" : "outline"}
                      size="icon"
                      onClick={() => {
                        setSelectionMode(!selectionMode);
                        setSelectedIds([]);
                      }}
                      className={cn(
                        "h-10 w-10 border-white/10 bg-black/20 text-white hover:bg-white/5 rounded-lg",
                        selectionMode && "bg-primary text-primary-foreground border-primary"
                      )}
                      title="Toggle Multi-select"
                    >
                      <SquareMousePointer className="h-4 w-4" />
                    </Button>

                    {selectionMode && selectedIds.length > 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="destructive"
                              size="default"
                              className="h-10 px-4 text-xs font-semibold uppercase tracking-wider rounded-lg"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedIds.length})
                            </Button>
                          }
                        />
                        <AlertDialogContent className="glass-panel border-white/10 rounded-lg shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white font-extrabold uppercase tracking-tighter">Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription className="text-white/40">
                              You are about to permanently remove {selectedIds.length} transactions. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-lg">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleBulkDelete}
                              className="bg-red-600 text-white hover:bg-red-500 rounded-lg font-semibold uppercase tracking-wider"
                            >
                              Confirm Protocol
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                  <div className="relative flex items-center gap-2">
                    <div className="relative w-full text-left md:w-64">
                      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/30" />
                      <Input
                        placeholder="Search transactions..."
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        className="h-10 border-white/10 bg-black/20 pl-9 text-white rounded-lg"
                      />
                    </div>

                    <Popover>
                      <PopoverTrigger 
                        render={
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                              "h-10 w-10 border-white/10 bg-black/20 text-white hover:bg-white/5 rounded-lg",
                              (dateRange?.from || dateRange?.to) && "border-primary/50 text-primary"
                            )}
                          >
                            <ListFilter className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <PopoverContent className="glass-panel w-auto border-white/10 p-0 text-left shadow-2xl rounded-lg" align="end">
                        <div className="space-y-4 p-4 text-left">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-medium tracking-wider text-white/70 uppercase">Filter by Date</h4>
                            {(dateRange?.from || dateRange?.to) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] text-primary hover:bg-primary/10 hover:text-primary rounded-lg"
                                onClick={() => setDateRange(undefined)}
                              >
                                Reset
                              </Button>
                            )}
                          </div>
                          <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={setDateRange}
                            className="rounded-lg border border-white/5 bg-transparent"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex items-center gap-1 rounded-lg border border-white/5 bg-black/20 p-1">
                    {(["all", "expenses", "incomes"] as const).map((view) => (
                      <button
                        key={view}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                          historyView === view
                            ? "border border-white/10 bg-white/10 text-white shadow-sm"
                            : "text-white/50 hover:bg-white/5 hover:text-white/80"
                        }`}
                        onClick={() => setHistoryView(view)}
                      >
                        {view}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 text-left">
            <div className="overflow-hidden rounded-lg border border-white/10 bg-black/20">
              <Table>
                <TableHeader className="bg-white/5 text-left">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    {selectionMode && (
                      <TableHead className="w-[50px] px-4">
                        <Checkbox 
                          checked={selectedIds.length === filteredHistory.length && filteredHistory.length > 0}
                          onCheckedChange={toggleSelectAll}
                          className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </TableHead>
                    )}
                    <TableHead>
                      <button className="flex items-center gap-1 font-semibold transition-colors hover:text-white" onClick={() => toggleSort("description")}>
                        Description <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell text-left">
                      <button className="flex items-center gap-1 font-semibold transition-colors hover:text-white" onClick={() => toggleSort("userName")}>
                        User <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell text-left">
                      <button className="flex items-center gap-1 font-semibold transition-colors hover:text-white" onClick={() => toggleSort("category")}>
                        Category <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell text-center">
                      <button className="mx-auto flex items-center gap-1 font-semibold transition-colors hover:text-white" onClick={() => toggleSort("date")}>
                        Date <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button className="ml-auto flex items-center gap-1 font-semibold transition-colors hover:text-white" onClick={() => toggleSort("amount")}>
                        Amount <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((item) => {
                    const rowColor = getCategoryColor(item.category, item.type === 'income' ? '#A855F7' : '#FFFFFF');
                    const isSelected = selectedIds.includes(item.id);
                    return (
                      <TableRow 
                        key={item.id} 
                        className={cn(
                          "group border-white/10 transition-colors hover:bg-white/5",
                          isSelected && "bg-white/5"
                        )}
                      >
                        {selectionMode && (
                          <TableCell className="w-[50px] px-4">
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={() => toggleSelection(item.id)}
                              className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                          </TableCell>
                        )}
                        <TableCell className="max-w-[200px] font-medium text-white md:max-w-[400px]">
                          <div className="flex items-center gap-3 text-left min-w-0">
                            {item.type === "income" ? (
                              <div 
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/20 text-purple-400 opacity-60"
                              >
                                <ArrowUpCircle className="h-4 w-4" />
                              </div>
                            ) : (
                              <div 
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white/60 opacity-60"
                              >
                                <ArrowDownCircle className="h-4 w-4" />
                              </div>
                            )}
                            <span className="truncate flex-1 font-semibold tracking-tight">{toTitleCase(item.description)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-left font-semibold text-white/70">
                          <div className="flex items-center justify-start">
                            {item.userName === 'Family Wide' ? (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40" title="Family Wide">
                                <Users className="h-5 w-5" />
                              </div>
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-extrabold uppercase text-white/60" title={item.userName}>
                                {item.userName[0]}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-left">
                          <div 
                            className="inline-flex items-center rounded-lg px-3 py-1 font-medium tracking-wider uppercase transition-colors"
                            style={{ 
                              backgroundColor: `${rowColor}26`,
                              color: rowColor
                            }}
                          >
                            {item.category}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-mono text-white/30">
                          {new Date(item.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold tracking-tight text-white">
                          {item.type === "income" ? (
                            <span style={{ color: rowColor }}>+{formatCurrency(item.amount)}</span>
                          ) : (
                            <span>-{formatCurrency(item.amount)}</span>
                          )}
                        </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-white/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/10 hover:text-white rounded-lg"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-white/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-400/10 hover:text-red-400 rounded-lg"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <AlertDialogContent className="glass-panel border-white/10 rounded-lg shadow-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white font-extrabold uppercase tracking-tighter">Delete Transaction?</AlertDialogTitle>
                                <AlertDialogDescription className="text-white/40">
                                  This will permanently remove "{item.description}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-lg">Cancel</AlertDialogCancel>
                                <form action={item.type === 'expense' ? deleteExpense : deleteIncome}>
                                  <input type="hidden" name="id" value={item.id} />
                                  <AlertDialogAction 
                                    type="submit"
                                    className="bg-red-600 text-white hover:bg-red-500 rounded-lg font-semibold uppercase tracking-wider"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </form>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filteredHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                    <Filter className="h-5 w-5 text-white/30" />
                  </div>
                  <p className="text-center text-sm font-medium tracking-wider text-white/50 uppercase">No results match your filters</p>
                  <Button variant="link" className="mt-2 text-xs text-primary rounded-lg" onClick={clearFilters}>Clear all filters</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={expenseSheetOpen} onOpenChange={setExpenseSheetOpen}>
        <SheetContent side="right" className="glass-panel w-full overflow-y-auto border-l border-white/10 p-0 text-left rounded-lg">
          <div className="flex h-full flex-col bg-slate-950/50 text-left backdrop-blur-3xl">
            <SheetHeader className="border-b border-white/10 p-8 text-left">
              <SheetTitle className="flex items-center gap-2 text-left text-2xl font-extrabold text-white">
                <Receipt className="h-6 w-6 text-primary" /> {editingItem ? "Edit Expense" : "Add New Expense"}
              </SheetTitle>
              <SheetDescription className="text-left text-white/60">
                {editingItem ? "Update the details of this expense." : "Enter the details of your family spending."}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 p-8 text-left">
              <form action={editingItem ? updateExpense : addExpense} className="space-y-8 text-left" onSubmit={() => setExpenseSheetOpen(false)}>
                {editingItem && <input type="hidden" name="id" value={editingItem.id} />}
                <div className="space-y-4 text-left">
                  <Label className="text-left text-xs font-medium tracking-wider text-white/70 uppercase">Attribution</Label>
                  <div className="flex flex-wrap gap-3 py-2">
                    {data.users.map((u) => (
                      <button key={u.id} type="button" onClick={() => setSelectedUserId(u.id)} className={cn("flex size-12 items-center justify-center rounded-full border transition-all duration-300", selectedUserId === u.id ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:bg-white/10")} title={u.name}>
                        <span className="text-sm font-extrabold uppercase">{u.name[0]}</span>
                      </button>
                    ))}
                    <button type="button" onClick={() => setSelectedUserId("family")} className={cn("flex size-12 items-center justify-center rounded-full border transition-all duration-300", selectedUserId === "family" ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:bg-white/10")} title="Family Wide">
                      <Users className="h-5 w-5" />
                    </button>
                  </div>
                  <input type="hidden" name="userId" value={selectedUserId} />
                </div>

                <div className="space-y-4 text-left">
                  <Label className="text-left text-xs font-medium tracking-wider text-white/70 uppercase">Expense Type</Label>
                  <div className="flex w-full items-center gap-2 rounded-lg border border-white/5 bg-black/40 p-1.5">
                    <button type="button" onClick={() => setSelectedExpenseType("monthly")} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${selectedExpenseType === "monthly" ? "bg-primary text-primary-foreground shadow-xl" : "text-white/50 hover:bg-white/5 hover:text-white/80"}`}>Monthly</button>
                    <button type="button" onClick={() => setSelectedExpenseType("extra")} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${selectedExpenseType === "extra" ? "bg-primary text-primary-foreground shadow-xl" : "text-white/50 hover:bg-white/5 hover:text-white/80"}`}>Extras</button>
                  </div>
                  <input type="hidden" name="isMonthly" value={selectedExpenseType === "monthly" ? "on" : "off"} />
                </div>

                <div className="space-y-4 text-left">
                  <Label className="text-left text-xs font-medium tracking-wider text-white/70 uppercase">Description</Label>
                  <Input name="description" key={editingItem?.id || 'new'} type="text" required defaultValue={editingItem?.description || ""} placeholder="e.g. Rent, Whole Foods" className="h-12 border-white/10 bg-white/5 text-lg text-white placeholder:text-white/20 focus-visible:ring-primary rounded-lg" />
                </div>

                <div className="grid grid-cols-1 gap-8 text-left sm:grid-cols-2">
                  <div className="space-y-4 text-left">
                    <Label className="text-left text-xs font-medium tracking-wider text-white/70 uppercase">Amount ($)</Label>
                    <Input name="amount" key={editingItem?.id || 'new-amt'} type="number" step="0.01" required defaultValue={editingItem ? (editingItem.amount / 100).toFixed(2) : ""} placeholder="0.00" className="h-12 border-white/10 bg-white/5 text-lg text-white placeholder:text-white/20 focus-visible:ring-primary rounded-lg" />
                  </div>
                  <div className="flex flex-col space-y-4 text-left">
                    <Label className="text-left text-xs font-medium tracking-wider text-white/70 uppercase">Category</Label>
                    <CategoryCombobox 
                      value={expenseCategory} 
                      options={availableCategories} 
                      onChange={(val) => {
                        if (!availableCategories.includes(val)) {
                          setAvailableCategories(prev => [...prev, val]);
                        }
                        setExpenseCategory(val);
                      }} 
                      className="h-12 text-lg"
                    />
                    <input type="hidden" name="category" value={expenseCategory} required />
                  </div>
                </div>
                <div className="pt-8 text-left">
                  <Button type="submit" className="h-14 w-full bg-primary text-lg font-semibold transition-all hover:bg-primary/90 rounded-lg">
                    {editingItem ? <Save className="mr-2 h-5 w-5" /> : <Plus className="mr-2 h-5 w-5" />}
                    {editingItem ? "Update Expense" : "Save Expense"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={incomeSheetOpen} onOpenChange={setIncomeSheetOpen}>
        <SheetContent side="right" className="glass-panel w-full overflow-y-auto border-l border-white/10 p-0 text-left rounded-lg">
          <div className="flex h-full flex-col bg-slate-950/50 text-left backdrop-blur-3xl">
            <SheetHeader className="border-b border-white/10 p-8 text-left">
              <SheetTitle className="flex items-center gap-2 text-left text-2xl font-extrabold text-white">
                <CircleDollarSign className="h-6 w-6 text-purple-400" /> {editingItem ? "Edit Family Income" : "Add Family Income"}
              </SheetTitle>
              <SheetDescription className="text-left text-white/60">
                {editingItem ? "Update the details of this income source." : "Record new funds coming into the family wealth."}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 p-8 text-left">
              <form action={editingItem ? updateIncome : addIncome} className="space-y-8 text-left" onSubmit={() => setIncomeSheetOpen(false)}>
                {editingItem && <input type="hidden" name="id" value={editingItem.id} />}
                <div className="space-y-4 text-left">
                  <Label className="text-left text-xs font-medium tracking-wider text-white/70 uppercase">Attribution</Label>
                  <div className="flex flex-wrap gap-3 py-2 text-left">
                    {data.users.map((u) => (
                      <button key={u.id} type="button" onClick={() => setSelectedUserId(u.id)} className={cn("flex size-12 items-center justify-center rounded-full border transition-all duration-300", selectedUserId === u.id ? "border-purple-500 bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]" : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:bg-white/10")} title={u.name}>
                        <span className="text-sm font-extrabold uppercase">{u.name[0]}</span>
                      </button>
                    ))}
                    <button type="button" onClick={() => setSelectedUserId("family")} className={cn("flex size-12 items-center justify-center rounded-full border transition-all duration-300", selectedUserId === "family" ? "border-purple-500 bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]" : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:bg-white/10")} title="Family Wide">
                      <Users className="h-5 w-5" />
                    </button>
                  </div>
                  <input type="hidden" name="userId" value={selectedUserId} />
                </div>

                <div className="space-y-4 text-left">
                  <Label className="text-left text-xs font-medium tracking-wider text-white/70 uppercase">Income Source</Label>
                  <Input name="description" key={editingItem?.id || 'new-inc'} type="text" required defaultValue={editingItem?.description || ""} placeholder="e.g. Salary, Bonus" className="h-12 border-white/10 bg-white/5 text-lg text-white placeholder:text-white/20 focus-visible:ring-purple-500 rounded-lg" />
                </div>

                <div className="grid grid-cols-1 gap-8 text-left sm:grid-cols-2">
                  <div className="space-y-4 text-left">
                    <Label className="text-left text-xs font-medium tracking-wider text-white/70 uppercase">Amount ($)</Label>
                    <Input name="amount" key={editingItem?.id || 'new-inc-amt'} type="number" step="0.01" required defaultValue={editingItem ? (editingItem.amount / 100).toFixed(2) : ""} placeholder="0.00" className="h-12 border-white/10 bg-white/5 text-lg text-white placeholder:text-white/20 focus-visible:ring-purple-500 rounded-lg" />
                  </div>
                  <div className="flex flex-col space-y-4 text-left">
                    <Label className="text-left text-xs font-medium tracking-wider text-white/70 uppercase">Category</Label>
                    <CategoryCombobox 
                      value={incomeCategory} 
                      options={availableCategories} 
                      onChange={(val) => {
                        if (!availableCategories.includes(val)) {
                          setAvailableCategories(prev => [...prev, val]);
                        }
                        setIncomeCategory(val);
                      }} 
                      className="h-12 text-lg"
                    />
                    <input type="hidden" name="category" value={incomeCategory} required />
                  </div>
                </div>

                <div className="pt-8 text-left">
                  <Button type="submit" className="h-14 w-full border-none bg-purple-600 text-lg font-semibold text-white transition-all hover:bg-purple-500 rounded-lg">
                    {editingItem ? <Save className="mr-2 h-5 w-5" /> : <ArrowUpCircle className="mr-2 h-5 w-5" />}
                    {editingItem ? "Update Income" : "Save Income"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
