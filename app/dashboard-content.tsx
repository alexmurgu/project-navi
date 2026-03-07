"use client";

import React, { useState, useMemo } from "react";
import { 
  Wallet, TrendingDown, ArrowUpCircle, ArrowDownCircle, 
  Receipt, CircleDollarSign, ChartArea, Search, ListFilter, 
  CalendarIcon, ArrowUpDown, Trash2, Filter, Users, 
  Check, ChevronsUpDown, PlusCircle, Plus, X, FileUp, Loader2 
} from "lucide-react";
import { format } from "date-fns";
import { 
  Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer
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
import { addExpense, addIncome, deleteExpense, deleteIncome } from "./actions";

interface PageProps {
  data: {
    user: any;
    users: { id: string, name: string }[];
    expenses: any[];
    incomes: any[];
    categories: string[];
  }
}

const formatCurrency = (amountCents: number) => {
  return (amountCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
};

function CategoryCombobox({ 
  value, 
  options, 
  onChange 
}: { 
  value: string; 
  options: string[]; 
  onChange: (val: string) => void 
}) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const showAddNew = searchValue !== "" && !options.some((c) => c.toLowerCase() === searchValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-12 w-full justify-between border-white/10 bg-white/5 font-normal text-white hover:bg-white/10"
        >
          {value || "Select..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="glass-panel w-[200px] border-white/10 p-0 text-left shadow-2xl" align="start">
        <Command>
          <CommandInput 
            placeholder="Search..." 
            value={searchValue} 
            onValueChange={setSearchValue} 
            className="h-11 border-none bg-transparent text-white" 
          />
          <CommandList className="max-h-[200px] overflow-y-auto text-left">
            <CommandEmpty className="px-4 py-2 text-left text-xs text-white/50">
              {!showAddNew && "No category found."}
            </CommandEmpty>
            <CommandGroup>
              {options.map((cat) => (
                <CommandItem 
                  key={cat} 
                  value={cat} 
                  onSelect={(val) => {
                    onChange(val);
                    setOpen(false);
                    setSearchValue("");
                  }} 
                  className="cursor-pointer text-left text-white hover:bg-white/10 aria-selected:bg-white/10"
                >
                  <Check className={cn("mr-2 h-4 w-4", value === cat ? "opacity-100" : "opacity-0")} />
                  {cat}
                </CommandItem>
              ))}
            </CommandGroup>
            {showAddNew && (
              <CommandGroup heading="New" className="text-left">
                <CommandItem 
                  value={searchValue} 
                  onSelect={(val) => {
                    onChange(val);
                    setOpen(false);
                    setSearchValue("");
                  }} 
                  className="cursor-pointer text-left font-bold text-primary hover:bg-primary/10 aria-selected:bg-primary/10"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add "{searchValue}"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function DashboardContent({ data }: PageProps) {
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
  
  const [categoryValue, setCategoryValue] = useState("");
  const [selectedExpenseType, setSelectedExpenseType] = useState<"monthly" | "extra">("extra");

  const [historyView, setHistoryView] = useState<"all" | "expenses" | "incomes">("all");
  const [tableSearch, setTableSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortColumn, setSortColumn] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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
          
          // Handle European currency format (e.g., 1.992,73)
          // 1. Remove dots (thousands separators)
          // 2. Replace comma with dot (decimal separator)
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
            userId: "family",
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

  const totalIncome = data.incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalMonthly = data.expenses.filter((e) => e.isMonthly).reduce((acc, curr) => acc + curr.amount, 0);
  const totalExtra = data.expenses.filter((e) => !e.isMonthly).reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = totalMonthly + totalExtra;
  const balance = totalIncome - totalExpenses;

  const allItems = useMemo(() => [
    ...data.expenses.map((e) => ({ ...e, type: "expense" as const })),
    ...data.incomes.map((i) => ({ ...i, type: "income" as const, category: "Income", isMonthly: false }))
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

  const toggleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleCategorySelect = (val: string) => {
    if (!availableCategories.includes(val)) {
      setAvailableCategories(prev => [...prev, val]);
    }
    setCategoryValue(val);
  };

  const clearFilters = () => {
    setTableSearch("");
    setHistoryView("all");
    setDateRange(undefined);
  };

  const resetEntryDate = () => {
    setEntryDate(new Date());
    setSelectedUserId("family");
  };

  return (
    <div className="relative z-10 mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="grid gap-4 text-left md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-panel group relative overflow-hidden border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Total Income</CardTitle>
            <Wallet className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-white">
              {formatCurrency(totalIncome)}
            </div>
            <p className="mt-1 text-xs font-semibold tracking-widest text-white/50 uppercase">
              All time family income
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel group relative overflow-hidden border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-left">
            <CardTitle className="text-sm font-medium text-white/70">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent className="text-left">
            <div className="text-2xl font-bold tracking-tight text-white">
              {formatCurrency(totalExpenses)}
            </div>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex flex-col">
                <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Monthly</p>
                <p className="font-mono text-xs text-blue-400">{formatCurrency(totalMonthly)}</p>
              </div>
              <div className="mt-2 h-4 w-[1px] bg-white/10"></div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Extras</p>
                <p className="font-mono text-xs text-amber-400">{formatCurrency(totalExtra)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel relative overflow-hidden border-primary/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-primary">Net Balance</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="relative z-10 text-left">
            <div className={`text-2xl font-bold tracking-tight ${balance >= 0 ? "text-white" : "text-red-400"}`}>
              {formatCurrency(balance)}
            </div>
            <p className="mt-1 text-xs font-semibold tracking-widest text-primary/70 uppercase">
              Family net total
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/20 bg-white/5">
          <CardHeader className="pb-2 text-left">
            <CardTitle className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-2">
            <Button
              variant="default"
              className="h-10 w-full bg-primary text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all hover:bg-primary/90 hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]"
              onClick={() => {
                setExpenseSheetOpen(true);
                resetEntryDate();
              }}
            >
              <Receipt className="mr-2 h-4 w-4" /> Add Expense
            </Button>
            <Button
              variant="outline"
              className="h-10 w-full border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10"
              onClick={() => {
                setIncomeSheetOpen(true);
                resetEntryDate();
              }}
            >
              <CircleDollarSign className="mr-2 h-4 w-4 text-purple-400" /> Add Income
            </Button>
            
            <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 w-full border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10"
                >
                  <FileUp className="mr-2 h-4 w-4 text-blue-400" /> Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-panel border-white/10 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white">Import Bank Statement</DialogTitle>
                  <DialogDescription className="text-white/60">
                    Upload your bank history CSV to review and import transactions.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10  p-8 bg-black/20 hover:bg-black/30 transition-colors">
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
                      <div className="size-12  bg-blue-500/20 flex items-center justify-center mb-2">
                        <FileUp className="size-6 text-blue-400" />
                      </div>
                    )}
                    <span className="text-sm font-bold text-white">{isParsing ? "Parsing..." : "Click to select CSV"}</span>
                  </label>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel border-white/10">
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
                          <div className="glass-panel border-white/10 p-3 shadow-2xl ">
                            <div className="mb-2 text-left text-[10px] font-bold tracking-widest text-white/40 uppercase">
                              {label}
                            </div>
                            <div className="flex flex-col gap-1.5">
                              {payload.map((entry, index) => (
                                <div key={index} className="flex items-center justify-between gap-8">
                                  <span className={`flex items-center gap-1.5 text-xs font-bold ${entry.dataKey === "income" ? "text-green-400" : "text-red-400"}`}>
                                    <div className={`h-1.5 w-1.5  ${entry.dataKey === "income" ? "bg-green-400" : "bg-red-400"}`}></div>
                                    {entry.dataKey === "income" ? "Income" : "Expense"}
                                  </span>
                                  <span className="font-mono text-xs font-bold text-white">
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
                <div className="mb-4 flex h-12 w-12 items-center justify-center  border border-white/10 bg-white/5">
                  <ChartArea className="h-6 w-6 text-white/20" />
                </div>
                <p className="text-sm font-bold tracking-widest text-white/30 uppercase">
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
              <div className="h-2 w-6  border border-green-500/50 bg-green-500/30"></div>
              <span className="text-[10px] font-bold tracking-wider text-white/50 uppercase">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-6  border border-red-500/50 bg-red-500/30"></div>
              <span className="text-[10px] font-bold tracking-wider text-white/50 uppercase">Expenses</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="w-full text-left">
        <Card className="glass-panel border-white/10">
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
                  <div className="relative flex items-center gap-2">
                    <div className="relative w-full text-left md:w-64">
                      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/30" />
                      <Input
                        placeholder="Search transactions..."
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        className="h-10 border-white/10 bg-black/20 pl-9 text-white"
                      />
                    </div>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(
                            "h-10 w-10 border-white/10 bg-black/20 text-white hover:bg-white/5",
                            (dateRange?.from || dateRange?.to) && "border-primary/50 text-primary"
                          )}
                        >
                          <ListFilter className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="glass-panel w-auto border-white/10 p-0 text-left shadow-2xl" align="end">
                        <div className="space-y-4 p-4 text-left">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold tracking-widest text-white/70 uppercase">Filter by Date</h4>
                            {(dateRange?.from || dateRange?.to) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] text-primary hover:bg-primary/10 hover:text-primary"
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
                            className=" border border-white/5 bg-transparent"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex items-center gap-1  border border-white/5 bg-black/20 p-1">
                    {(["all", "expenses", "incomes"] as const).map((view) => (
                      <button
                        key={view}
                        className={` px-3 py-1.5 text-xs font-bold capitalize transition-all ${
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
            <div className="overflow-hidden  border border-white/10 bg-black/20">
              <Table>
                <TableHeader className="bg-white/5 text-left">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="h-12">
                      <button className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-white/50 uppercase transition-colors hover:text-white" onClick={() => toggleSort("description")}>
                        Description <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="h-12 text-left">
                      <button className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-white/50 uppercase transition-colors hover:text-white" onClick={() => toggleSort("userName")}>
                        User <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="h-12 text-left">
                      <button className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-white/50 uppercase transition-colors hover:text-white" onClick={() => toggleSort("category")}>
                        Category <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="h-12 text-center">
                      <button className="mx-auto flex items-center gap-1 text-[10px] font-bold tracking-widest text-white/50 uppercase transition-colors hover:text-white" onClick={() => toggleSort("date")}>
                        Date <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="h-12 text-right">
                      <button className="ml-auto flex items-center gap-1 text-[10px] font-bold tracking-widest text-white/50 uppercase transition-colors hover:text-white" onClick={() => toggleSort("amount")}>
                        Amount <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="h-12 w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((item) => (
                    <TableRow key={item.id} className="group border-white/10 transition-colors hover:bg-white/5">
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center gap-3 text-left">
                          {item.type === "income" ? (
                            <div className="flex h-8 w-8 items-center justify-center  border border-purple-500/30 bg-purple-500/20 text-purple-400">
                              <ArrowUpCircle className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center  border border-white/10 bg-white/10 text-white/60">
                              <ArrowDownCircle className="h-4 w-4" />
                            </div>
                          )}
                          {item.description}
                        </div>
                      </TableCell>
                      <TableCell className="text-left font-medium text-white/60">{item.userName}</TableCell>
                      <TableCell className="text-left">
                        <div className={`inline-flex items-center  border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase transition-colors ${item.type === "income" ? "border-purple-500/20 bg-purple-500/10 text-purple-400" : "border-white/10 bg-white/5 text-white/60"}`}>
                          {item.category}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-white/50">
                        {new Date(item.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-bold tracking-tight ${item.type === "income" ? "text-purple-400" : "text-white"}`}>
                        {item.type === "income" ? "+" : "-"}{formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <form action={deleteExpense}>
                           <input type="hidden" name="id" value={item.id} />
                            <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-white/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-400/10 hover:text-red-400">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center  border border-white/10 bg-white/5">
                    <Filter className="h-5 w-5 text-white/30" />
                  </div>
                  <p className="text-center text-sm font-bold tracking-widest text-white/50 uppercase">No results match your filters</p>
                  <Button variant="link" className="mt-2 text-xs text-primary" onClick={clearFilters}>Clear all filters</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={expenseSheetOpen} onOpenChange={setExpenseSheetOpen}>
        <SheetContent side="right" className="glass-panel w-full overflow-y-auto border-l border-white/10 p-0 text-left sm:max-w-md">
          <div className="flex h-full flex-col bg-slate-950/50 text-left backdrop-blur-3xl">
            <SheetHeader className="border-b border-white/10 p-8 text-left">
              <SheetTitle className="flex items-center gap-2 text-left text-2xl font-bold text-white">
                <Receipt className="h-6 w-6 text-primary" /> Add New Expense
              </SheetTitle>
              <SheetDescription className="text-left text-white/60">
                Enter the details of your family spending.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 p-8 text-left">
              <form action={addExpense} className="space-y-8 text-left" onSubmit={() => setExpenseSheetOpen(false)}>
                <div className="space-y-4 text-left">
                  <Label className="text-left text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Attribution</Label>
                  <div className="flex flex-wrap gap-3 py-2">
                    {data.users.map((u) => (
                      <button key={u.id} type="button" onClick={() => setSelectedUserId(u.id)} className={cn("flex h-12 w-12 items-center justify-center  border transition-all duration-300", selectedUserId === u.id ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:bg-white/10")} title={u.name}>
                        <span className="text-sm font-black uppercase">{u.name[0]}</span>
                      </button>
                    ))}
                    <button type="button" onClick={() => setSelectedUserId("family")} className={cn("flex h-12 w-12 items-center justify-center  border transition-all duration-300", selectedUserId === "family" ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:bg-white/10")} title="Family Wide">
                      <Users className="h-5 w-5" />
                    </button>
                  </div>
                  <input type="hidden" name="userId" value={selectedUserId} />
                </div>

                <div className="space-y-4 text-left">
                  <Label className="text-left text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Expense Type</Label>
                  <div className="flex w-full items-center gap-2  border border-white/5 bg-black/40 p-1.5">
                    <button type="button" onClick={() => setSelectedExpenseType("monthly")} className={`flex-1  py-2.5 text-sm font-bold transition-all ${selectedExpenseType === "monthly" ? "bg-primary text-primary-foreground shadow-xl" : "text-white/50 hover:bg-white/5 hover:text-white/80"}`}>Monthly</button>
                    <button type="button" onClick={() => setSelectedExpenseType("extra")} className={`flex-1  py-2.5 text-sm font-bold transition-all ${selectedExpenseType === "extra" ? "bg-primary text-primary-foreground shadow-xl" : "text-white/50 hover:bg-white/5 hover:text-white/80"}`}>Extras</button>
                  </div>
                  <input type="hidden" name="isMonthly" value={selectedExpenseType === "monthly" ? "on" : "off"} />
                </div>

                <div className="space-y-4 text-left">
                  <Label className="text-left text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Description</Label>
                  <Input name="description" type="text" required placeholder="e.g. Rent, Whole Foods" className="h-12 border-white/10 bg-white/5 text-lg text-white placeholder:text-white/20 focus-visible:ring-primary" />
                </div>

                <div className="grid grid-cols-1 gap-8 text-left sm:grid-cols-2">
                  <div className="space-y-4 text-left">
                    <Label className="text-left text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Amount ($)</Label>
                    <Input name="amount" type="number" step="0.01" required placeholder="0.00" className="h-12 border-white/10 bg-white/5 text-lg text-white placeholder:text-white/20 focus-visible:ring-primary" />
                  </div>
                  <div className="flex flex-col space-y-4 text-left">
                    <Label className="text-left text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Category</Label>
                    <CategoryCombobox 
                      value={categoryValue} 
                      options={availableCategories} 
                      onChange={handleCategorySelect} 
                    />
                    <input type="hidden" name="category" value={categoryValue} required />
                  </div>
                </div>
                <div className="pt-8 text-left">
                  <Button type="submit" className="h-14 w-full bg-primary text-lg font-bold shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_40px_rgba(245,158,11,0.6)]">
                    <Plus className="mr-2 h-5 w-5" /> Save Expense
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={incomeSheetOpen} onOpenChange={setIncomeSheetOpen}>
        <SheetContent side="right" className="glass-panel w-full overflow-y-auto border-l border-white/10 p-0 text-left sm:max-w-md">
          <div className="flex h-full flex-col bg-slate-950/50 text-left backdrop-blur-3xl">
            <SheetHeader className="border-b border-white/10 p-8 text-left">
              <SheetTitle className="flex items-center gap-2 text-left text-2xl font-bold text-white">
                <CircleDollarSign className="h-6 w-6 text-purple-400" /> Add Family Income
              </SheetTitle>
              <SheetDescription className="text-left text-white/60">
                Record new funds coming into the family wealth.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 p-8 text-left">
              <form action={addIncome} className="space-y-8 text-left" onSubmit={() => setIncomeSheetOpen(false)}>
                <div className="space-y-4 text-left">
                  <Label className="text-left text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Attribution</Label>
                  <div className="flex flex-wrap gap-3 py-2 text-left">
                    {data.users.map((u) => (
                      <button key={u.id} type="button" onClick={() => setSelectedUserId(u.id)} className={cn("flex h-12 w-12 items-center justify-center  border transition-all duration-300", selectedUserId === u.id ? "border-purple-500 bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]" : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:bg-white/10")} title={u.name}>
                        <span className="text-sm font-black uppercase">{u.name[0]}</span>
                      </button>
                    ))}
                    <button type="button" onClick={() => setSelectedUserId("family")} className={cn("flex h-12 w-12 items-center justify-center  border transition-all duration-300", selectedUserId === "family" ? "border-purple-500 bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]" : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:bg-white/10")} title="Family Wide">
                      <Users className="h-5 w-5" />
                    </button>
                  </div>
                  <input type="hidden" name="userId" value={selectedUserId} />
                </div>

                <div className="space-y-4 text-left">
                  <Label className="text-left text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Income Source</Label>
                  <Input name="description" type="text" required placeholder="e.g. Salary, Bonus" className="h-12 border-white/10 bg-white/5 text-lg text-white placeholder:text-white/20 focus-visible:ring-purple-500" />
                </div>

                <div className="space-y-4 text-left">
                  <Label className="text-left text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Amount ($)</Label>
                  <Input name="amount" type="number" step="0.01" required placeholder="0.00" className="h-12 border-white/10 bg-white/5 text-lg text-white placeholder:text-white/20 focus-visible:ring-purple-500" />
                </div>

                <div className="pt-8 text-left">
                  <Button type="submit" className="h-14 w-full border-none bg-purple-600 text-lg font-bold text-white shadow-[0_0_30px_rgba(147,51,234,0.4)] transition-all hover:bg-purple-500 hover:shadow-[0_0_40px_rgba(147,51,234,0.6)]">
                    <ArrowUpCircle className="mr-2 h-5 w-5" /> Save Income
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
