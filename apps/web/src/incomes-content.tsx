import React, { useState, useMemo, useEffect } from "react";
import { Search, Plus, Loader2, ArrowUpDown, Pencil, Trash2, ChevronDown, Users, User as UserIcon, Save } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, 
  AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CategoryCombobox } from "@/components/category-combobox";
import { CategoryIcon, getCategoryConfig, type CategoryConfig, withAlpha } from "@/lib/category-visuals";
import axios from 'axios';
import { useQueryClient, useMutation } from '@tanstack/react-query';

interface User { id: string; name: string; email: string; }
interface Transaction {
  id: string; date: string; description: string; amount: number;
  category: string; userId: string | null; userName: string;
  type: "expense" | "income"; isMonthly?: boolean;
}
interface PageProps {
  data: {
    user: User; users: { id: string, name: string }[];
    incomes: Omit<Transaction, "type">[];
    incomeCategories: string[];
    categoryConfigs: CategoryConfig[];
  }
}

const INITIAL_PAGE_SIZE = 20;

const formatCurrency = (amountCents: number) => {
  return (amountCents / 100).toLocaleString("en-IE", { style: "currency", currency: "EUR" });
};

export function IncomesContent({ data }: PageProps) {
  const queryClient = useQueryClient();
  const [incomeSheetOpen, setIncomeSheetOpen] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>(data.incomeCategories);
  const [selectedUserId, setSelectedUserId] = useState<string>("family");
  const [incomeCategory, setIncomeCategory] = useState("");
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

  const addIncomeMutation = useMutation({ mutationFn: (d: any) => axios.post('/api/incomes', d), onSuccess: async () => { await queryClient.refetchQueries({ queryKey: ['dashboard'], type: 'active' }); setIncomeSheetOpen(false); } });
  const updateIncomeMutation = useMutation({ mutationFn: (d: any) => axios.put(`/api/incomes/${d.id}`, d), onSuccess: async () => { await queryClient.refetchQueries({ queryKey: ['dashboard'], type: 'active' }); setIncomeSheetOpen(false); } });
  const deleteIncomeMutation = useMutation({ mutationFn: (id: string) => axios.delete(`/api/incomes/${id}`), onSuccess: async () => { await queryClient.refetchQueries({ queryKey: ['dashboard'], type: 'active' }); setIncomeSheetOpen(false); } });

  const filteredHistory = useMemo(() => {
    return data.incomes
      .filter((item) => {
        if (tableSearch) {
          const search = tableSearch.toLowerCase();
          return item.description.toLowerCase().includes(search) || item.category.toLowerCase().includes(search);
        }
        return true;
      })
      .sort((a, b) => {
        const valA = new Date(a.date).getTime();
        const valB = new Date(b.date).getTime();
        return sortDirection === "asc" ? valA - valB : valB - valA;
      });
  }, [data.incomes, tableSearch, sortDirection]);

  const paginatedHistory = useMemo(() => filteredHistory.slice(0, visibleCount), [filteredHistory, visibleCount]);
  const hasMore = filteredHistory.length > visibleCount;

  const handleEdit = (item: any) => {
    const tx = { ...item, type: 'income' as const };
    setEditingItem(tx); setSelectedUserId(tx.userId || "family");
    setIncomeCategory(tx.category);
    setIncomeSheetOpen(true);
  };

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, item: any) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleEdit(item);
    }
  };

  useEffect(() => {
    const handleQuickAddIncome = () => {
      setEditingItem(null);
      setSelectedUserId("family");
      setIncomeCategory("");
      setIncomeSheetOpen(true);
    };

    const pendingQuickAdd = sessionStorage.getItem("pendingQuickAdd");
    if (pendingQuickAdd === "income") {
      handleQuickAddIncome();
      sessionStorage.removeItem("pendingQuickAdd");
    }

    window.addEventListener("open-quick-add-income", handleQuickAddIncome);
    return () => window.removeEventListener("open-quick-add-income", handleQuickAddIncome);
  }, []);

  return (
    <div className="w-full min-h-screen flex flex-col bg-background antialiased p-6 md:p-12 pb-32">
      
      {/* Dynamic Header */}
      <div className="flex items-center justify-between pt-4 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground uppercase italic">Income</h1>
          <p className="text-[10px] md:text-sm font-black tracking-[0.2em] text-muted-foreground opacity-40 uppercase ml-1">Income History</p>
        </div>
        <button 
          onClick={() => { setEditingItem(null); setIncomeSheetOpen(true); }}
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
            value={tableSearch} 
            onChange={(e) => setTableSearch(e.target.value)} 
          />
        </div>
        <button 
          onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
          className="size-14 rounded-xl bg-secondary/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shadow-inner"
        >
          <ArrowUpDown className={cn("size-6 transition-transform duration-500", sortDirection === "asc" ? "rotate-0" : "rotate-180")} />
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
            const color = config?.color || "#10B981";
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
                      kind="income"
                      className="size-6"
                      color={color}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-base tracking-tight truncate">{item.description}</h4>
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 opacity-40 block md:inline">{item.category}</span>
                  </div>
                </div>

                <div className="hidden md:flex w-32 items-center gap-1.5 text-[9px] font-black uppercase text-emerald-600/80 tracking-tighter bg-emerald-500/5 px-2 py-0.5 rounded-md shrink-0 mx-2">
                    <UserIcon className="size-2.5 opacity-50" />
                    <span className="truncate">{item.userName || "Family"}</span>
                </div>

                <div className="hidden md:block w-40 text-[9px] font-black uppercase text-muted-foreground opacity-40 shrink-0 mx-2">
                    {format(new Date(item.date), "MMM dd, yyyy")}
                </div>

                <div className="text-right w-32 shrink-0">
                  <p className="font-black text-lg tracking-tight text-emerald-600">
                    +{formatCurrency(item.amount)}
                  </p>
                  <p className="md:hidden text-[9px] font-black uppercase text-muted-foreground opacity-20 mt-0.5">{format(new Date(item.date), "MMM dd")}</p>
                </div>

                {/* Actions visible on hover */}
                <div className="hidden md:flex items-center gap-1 ml-4 w-24 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="size-9 rounded-lg bg-muted/10 flex items-center justify-center hover:bg-muted/20">
                        <Pencil className="size-4 opacity-40" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger render={
                        <button onClick={(e) => e.stopPropagation()} className="size-9 rounded-lg bg-rose-500/5 text-rose-600 flex items-center justify-center hover:bg-rose-500/15">
                          <Trash2 className="size-4 opacity-40" />
                        </button>
                      } />
                      <AlertDialogContent className="rounded-2xl p-10 border-none shadow-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-2xl font-black tracking-tight uppercase italic">Delete Record</AlertDialogTitle>
                          <AlertDialogDescription className="text-xs font-bold opacity-50 mt-2 uppercase">This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-8 gap-3">
                          <AlertDialogCancel className="h-12 rounded-xl font-black text-[10px] uppercase tracking-widest border-none bg-muted/10">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteIncomeMutation.mutate(item.id)} className="h-12 rounded-xl bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest border-none">Delete</AlertDialogAction>
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
          <Button variant="ghost" onClick={() => setVisibleCount(prev => prev + INITIAL_PAGE_SIZE)} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:text-emerald-600">
            <ChevronDown className="mr-2 h-4 w-4" /> Load More
          </Button>
        </div>
      )}

      <Sheet open={incomeSheetOpen} onOpenChange={setIncomeSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] sm:h-fit sm:side-right border-t sm:border-l rounded-t-2xl sm:rounded-l-2xl p-8 pb-12 shadow-2xl border-none">
          <SheetHeader className="mb-10 text-left">
            <SheetTitle className="text-3xl font-black tracking-tighter uppercase italic">{editingItem ? "Edit Income" : "Add Income"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={(e) => {
            e.preventDefault(); const formData = new FormData(e.currentTarget);
            const d = { id: editingItem?.id, description: formData.get('description'), amount: Math.round(parseFloat(formData.get('amount') as string) * 100), category: incomeCategory, userId: selectedUserId === 'family' ? null : selectedUserId, date: formData.get('date') };
            editingItem ? updateIncomeMutation.mutate(d) : addIncomeMutation.mutate(d);
          }} className="space-y-8">
             <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Member</Label>
              <div className="flex flex-wrap gap-3">
                {data.users.map((u) => (
                  <button key={u.id} type="button" onClick={() => setSelectedUserId(u.id)} className={cn("size-12 rounded-xl border flex items-center justify-center text-sm font-black transition-all", selectedUserId === u.id ? "bg-emerald-600 text-white border-emerald-600 shadow-lg" : "bg-muted/10 text-muted-foreground border-transparent hover:bg-muted/20")}>{u.name[0]}</button>
                ))}
                <button type="button" onClick={() => setSelectedUserId("family")} className={cn("size-12 rounded-xl border flex items-center justify-center transition-all", selectedUserId === "family" ? "bg-emerald-600 text-white border-emerald-600 shadow-lg" : "bg-muted/10 text-muted-foreground border-transparent hover:bg-muted/20")}><Users className="size-5" /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Amount (EUR)</Label><Input name="amount" type="number" step="0.01" required defaultValue={editingItem ? editingItem.amount / 100 : ""} className="h-14 rounded-xl bg-secondary/40 border-none font-black text-2xl px-6 text-emerald-600 shadow-inner" /></div>
              <div className="space-y-3"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Date</Label><Input name="date" type="date" required defaultValue={editingItem ? new Date(editingItem.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} className="h-14 rounded-xl bg-secondary/40 border-none px-6 font-bold shadow-inner" /></div>
            </div>
            <div className="space-y-3"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Description</Label><Input name="description" required defaultValue={editingItem?.description || ""} className="h-14 rounded-xl bg-secondary/40 border-none px-6 font-bold shadow-inner" /></div>
            <div className="space-y-3"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Category</Label>
              <CategoryCombobox kind="income" value={incomeCategory} options={availableCategories} onChange={(val) => {
                if (val && !availableCategories.includes(val)) setAvailableCategories(prev => [...prev, val]);
                setIncomeCategory(val);
              }} />
            </div>
            <div className={cn("pt-6", editingItem ? "grid grid-cols-2 gap-4" : "flex")}>
              {editingItem && (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        type="button"
                        variant="destructive"
                        className="h-14 w-full rounded-xl font-black bg-rose-600 text-white shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest border-none px-0 sm:px-4"
                      >
                        <Trash2 className="size-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    }
                  />
                  <AlertDialogContent className="rounded-2xl p-8 border-none shadow-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-2xl font-black tracking-tight uppercase italic">Delete Income</AlertDialogTitle>
                      <AlertDialogDescription className="text-xs font-bold opacity-50 mt-2 uppercase">
                        Are you sure you want to delete this income?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 gap-3">
                      <AlertDialogCancel className="h-12 rounded-xl font-black text-[10px] uppercase tracking-widest border-none bg-muted/10">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => editingItem && deleteIncomeMutation.mutate(editingItem.id)}
                        className="h-12 rounded-xl bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest border-none"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button
                type="submit"
                disabled={addIncomeMutation.isPending || updateIncomeMutation.isPending}
                className="h-14 flex-1 rounded-xl font-black bg-emerald-600 text-white shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all border-none uppercase tracking-[0.2em] text-[10px] px-0 sm:px-4"
              >
                <Save className="size-4" />
                <span className="hidden sm:inline">Save</span>
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
