import React, { useState, useMemo, useEffect } from "react";
import { Search, Users, Plus, ArrowUpDown, Pencil, Trash2, User as UserIcon } from "lucide-react";
import { format, isToday, isYesterday, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { useNavigate } from "@tanstack/react-router";
import { 
  Bar, BarChart, CartesianGrid, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Area, AreaChart
} from "recharts";

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
    expenses: Omit<Transaction, "type">[]; incomes: Omit<Transaction, "type">[];
    expenseCategories: string[]; incomeCategories: string[];
    categoryConfigs: CategoryConfig[];
  }
}

const formatCurrency = (amountCents: number) => {
  return (amountCents / 100).toLocaleString("en-IE", { style: "currency", currency: "EUR" });
};

export function DashboardContent({ data }: PageProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false);
  const [incomeSheetOpen, setIncomeSheetOpen] = useState(false);
  const [availableExpenseCategories, setAvailableExpenseCategories] = useState<string[]>(data.expenseCategories);
  const [availableIncomeCategories, setAvailableIncomeCategories] = useState<string[]>(data.incomeCategories);
  const [selectedUserId, setSelectedUserId] = useState<string>("family");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [incomeCategory, setIncomeCategory] = useState("");
  const [selectedExpenseType, setSelectedExpenseType] = useState<"monthly" | "extra">("extra");
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);

  useEffect(() => {
    const handleQuickAdd = () => { setEditingItem(null); setExpenseSheetOpen(true); };
    window.addEventListener('open-quick-add', handleQuickAdd);
    return () => window.removeEventListener('open-quick-add', handleQuickAdd);
  }, []);
  
  const addExpenseMutation = useMutation({ mutationFn: (d: any) => axios.post('/api/expenses', d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dashboard'] }); setExpenseSheetOpen(false); } });
  const updateExpenseMutation = useMutation({ mutationFn: (d: any) => axios.put(`/api/expenses/${d.id}`, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dashboard'] }); setExpenseSheetOpen(false); } });
  const addIncomeMutation = useMutation({ mutationFn: (d: any) => axios.post('/api/incomes', d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dashboard'] }); setIncomeSheetOpen(false); } });
  const updateIncomeMutation = useMutation({ mutationFn: (d: any) => axios.put(`/api/incomes/${d.id}`, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dashboard'] }); setIncomeSheetOpen(true); } });

  const allItems = useMemo(() => [
    ...data.expenses.map((e) => ({ ...e, type: "expense" as const })),
    ...data.incomes.map((i) => ({ ...i, type: "income" as const, isMonthly: false }))
  ], [data.expenses, data.incomes]) as Transaction[];

  const stats = useMemo(() => {
    const totalIncome = data.incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExp = data.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const monthlyExp = data.expenses
      .filter(e => isWithinInterval(new Date(e.date), { start, end }))
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { income: totalIncome, expense: totalExp, monthlyExp, balance: totalIncome - totalExp };
  }, [data]);

  const groupedRecentActivity = useMemo(() => {
    const sorted = [...allItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    const groups: { title: string, items: Transaction[] }[] = [];
    sorted.forEach(item => {
      let title = format(new Date(item.date), "MMM dd, yyyy");
      if (isToday(new Date(item.date))) title = "Today";
      else if (isYesterday(new Date(item.date))) title = "Yesterday";
      const existing = groups.find(g => g.title === title);
      if (existing) existing.items.push(item);
      else groups.push({ title, items: [item] });
    });
    return groups;
  }, [allItems]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    data.expenses.forEach(exp => map.set(exp.category, (map.get(exp.category) || 0) + exp.amount / 100));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [data.expenses]);

  const categoryConfigMap = useMemo(() => {
    const map: Record<string, CategoryConfig> = {};
    data.categoryConfigs.forEach((config) => {
      map[config.name] = config;
    });
    return map;
  }, [data.categoryConfigs]);

  const handleEdit = (item: Transaction) => {
    setEditingItem(item); setSelectedUserId(item.userId || "family");
    if (item.type === "expense") { setExpenseCategory(item.category); setSelectedExpenseType(item.isMonthly ? "monthly" : "extra"); setExpenseSheetOpen(true); }
    else { setIncomeCategory(item.category); setIncomeSheetOpen(true); }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-background antialiased">
      
      {/* High-Impact Hero Section - Full bleed everywhere */}
      <section className="wallet-hero-gradient pt-10 pb-16 px-6 md:px-12 flex flex-col gap-14 relative overflow-hidden text-white shadow-xl">
          <div className="absolute top-0 right-0 size-96 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
          
          <div className="space-y-4 relative z-10 text-center md:text-left">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60">Available Balance</p>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none">
                  {formatCurrency(stats.balance)}
              </h1>
          </div>

          <div className="flex items-center justify-between px-2 relative z-10">
              <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50">Expenses (Monthly)</p>
                  <p className="text-3xl md:text-5xl font-black tracking-tight">{formatCurrency(stats.monthlyExp)}</p>
              </div>
              <div className="h-16 w-1.5 bg-white/20 rounded-full" />
              <div className="space-y-1 text-right">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50">Income (Total)</p>
                  <p className="text-3xl md:text-5xl font-black tracking-tight">{formatCurrency(stats.income)}</p>
              </div>
          </div>
      </section>

      <div className="p-6 md:p-12 space-y-12">
        {/* Recent Transactions List */}
        <section className="space-y-8">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-black tracking-tight italic uppercase">Recent Activity</h3>
                <button onClick={() => navigate({ to: '/expenses' })} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">View All</button>
            </div>

            <div className="space-y-10">
            {groupedRecentActivity.map((group) => (
                <div key={group.title} className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40 ml-2">{group.title}</h4>
                <div className="space-y-2">
            {group.items.map((tx) => (
                    <div 
                        key={tx.id} 
                        className="flex items-center justify-between p-4 rounded-xl bg-card hover:bg-secondary/30 transition-all cursor-pointer group border border-transparent hover:border-muted/10 shadow-sm md:shadow-none"
                        onClick={() => handleEdit(tx)}
                    >
                        <div className="flex items-center gap-4">
                        {(() => {
                          const config = getCategoryConfig(categoryConfigMap, tx.category);
                          const color = config?.color || (tx.type === 'expense' ? "#F43F5E" : "#10B981");
                          return (
                            <div
                              className="size-12 rounded-lg flex items-center justify-center shadow-sm transition-transform group-hover:-rotate-6"
                              style={{
                                backgroundColor: withAlpha(color, 0.10),
                                color
                              }}
                            >
                            <CategoryIcon
                              category={tx.category}
                              config={config}
                              kind={tx.type}
                              className="size-5"
                            />
                            </div>
                          );
                        })()}
                        <div className="space-y-0.5">
                            <p className="font-bold text-sm tracking-tight text-foreground">{tx.description}</p>
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-30">{tx.category}</p>
                                <div className="flex items-center gap-1 text-[8px] font-black uppercase text-muted-foreground/40 bg-muted/5 px-1.5 py-0.5 rounded">
                                    <UserIcon className="size-2 opacity-50" />
                                    <span>{tx.userName || "Family"}</span>
                                </div>
                            </div>
                        </div>
                        </div>
                        <div className="text-right">
                        <p className={cn(
                            "font-black text-sm tracking-tight",
                            tx.type === 'expense' ? "text-rose-600" : "text-emerald-600"
                        )}>
                            {tx.type === 'expense' ? "-" : "+"}{formatCurrency(tx.amount)}
                        </p>
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            ))}
            </div>
        </section>

        {/* Analytics Sneak Peek */}
        <section className="space-y-6 pt-10 border-t border-muted-foreground/10">
            <h3 className="text-lg font-black tracking-tight italic uppercase px-2">Flow Analysis</h3>
            <div className="h-64 rounded-2xl p-6 bg-secondary/20 shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData.slice(0, 5)}>
                    <XAxis dataKey="name" hide />
                    <RechartsTooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', background: 'white' }} 
                    />
                    <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={24}>
                    {categoryData.slice(0, 5).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "oklch(0.6 0.12 190)" : "oklch(0.8 0.05 190)"} />
                    ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </div>
        </section>
      </div>

      <Sheet open={expenseSheetOpen} onOpenChange={setExpenseSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] sm:h-fit sm:side-right border-t sm:border-l rounded-t-2xl sm:rounded-l-2xl p-8 pb-12 shadow-2xl border-none">
          <SheetHeader className="mb-10 text-left">
            <SheetTitle className="text-3xl font-black tracking-tighter uppercase italic">{editingItem ? "Edit Expense" : "Add Expense"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={(e) => {
            e.preventDefault(); const formData = new FormData(e.currentTarget);
            const d = { id: editingItem?.id, description: formData.get('description'), amount: Math.round(parseFloat(formData.get('amount') as string) * 100), category: expenseCategory, isMonthly: selectedExpenseType === 'monthly', userId: selectedUserId === 'family' ? null : selectedUserId, date: formData.get('date') };
            editingItem ? updateExpenseMutation.mutate(d) : addExpenseMutation.mutate(d);
          }} className="space-y-8">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 bg-secondary/50 p-1 rounded-xl">
                    <button type="button" onClick={() => setSelectedExpenseType("extra")} className={cn("h-11 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", selectedExpenseType === 'extra' ? "bg-primary text-white shadow-lg" : "text-muted-foreground opacity-50")}>Expense</button>
                    <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('switch-to-income'))} className="h-11 rounded-lg text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Income</button>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Amount</Label><Input name="amount" type="number" step="0.01" required placeholder="0.00" defaultValue={editingItem ? editingItem.amount / 100 : ""} className="h-14 rounded-xl bg-secondary/40 border-none font-black text-2xl px-6 shadow-inner" /></div>
              <div className="space-y-3"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Date</Label><Input name="date" type="date" required defaultValue={editingItem ? new Date(editingItem.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} className="h-14 rounded-xl bg-secondary/40 border-none px-6 font-bold shadow-inner" /></div>
            </div>
            <div className="space-y-3"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Category</Label>
              <CategoryCombobox value={expenseCategory} options={availableExpenseCategories} onChange={(val) => {
                if (val && !availableExpenseCategories.includes(val)) setAvailableExpenseCategories(prev => [...prev, val]);
                setExpenseCategory(val);
              }} />
            </div>
            <div className="space-y-3"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Description</Label><Input name="description" required defaultValue={editingItem?.description || ""} className="h-14 rounded-xl bg-secondary/40 border-none px-6 font-bold shadow-inner" /></div>
            <div className="flex gap-4 pt-6">
              <Button type="submit" disabled={addExpenseMutation.isPending || updateExpenseMutation.isPending} className="h-14 flex-1 rounded-xl font-black uppercase tracking-[0.2em] bg-foreground text-background shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">Save</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

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
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Amount</Label><Input name="amount" type="number" step="0.01" required placeholder="0.00" defaultValue={editingItem ? editingItem.amount / 100 : ""} className="h-14 rounded-xl bg-secondary/40 border-none font-black text-2xl px-6 text-emerald-600 shadow-inner" /></div>
              <div className="space-y-3"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Date</Label><Input name="date" type="date" required defaultValue={editingItem ? new Date(editingItem.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} className="h-14 rounded-xl bg-secondary/40 border-none px-6 font-bold shadow-inner" /></div>
            </div>
            <div className="space-y-3"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Source</Label>
              <CategoryCombobox value={incomeCategory} options={availableIncomeCategories} onChange={(val) => {
                if (val && !availableIncomeCategories.includes(val)) setAvailableIncomeCategories(prev => [...prev, val]);
                setIncomeCategory(val);
              }} />
            </div>
            <div className="flex gap-4 pt-6">
              <Button type="submit" disabled={addIncomeMutation.isPending || updateIncomeMutation.isPending} className="h-14 flex-1 rounded-xl font-black uppercase tracking-[0.2em] bg-emerald-600 text-white shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all border-none">Save</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
