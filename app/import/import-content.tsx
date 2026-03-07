"use client";

import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { 
  FileUp, Trash2, Save, Users, Loader2 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { bulkImportTransactions } from "./actions";
import { cn } from "@/lib/utils";
import { CategoryCombobox } from "@/components/category-combobox";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  userId: string;
  isMonthly: boolean;
}

interface PageProps {
  users: { id: string; name: string }[];
  categories: string[];
  categoryConfigs: { name: string, color: string }[];
  currentUserId: string;
}

export function ImportContent({ users, categories, categoryConfigs, currentUserId }: PageProps) {
  const getCategoryColor = (name: string, defaultColor: string) => {
    const config = categoryConfigs.find(c => c.name.toLowerCase() === name.toLowerCase());
    return config?.color || defaultColor;
  };

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>(categories);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const pending = sessionStorage.getItem("pending_import");
    if (pending) {
      try {
        setTransactions(JSON.parse(pending));
        sessionStorage.removeItem("pending_import");
      } catch (e) {
        console.error("Failed to parse pending import", e);
      }
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as string[][];
        const dataRows = rows.slice(8);
        
        const parsed: Transaction[] = dataRows.map((row) => {
          const dateStr = row[0];
          const description = row[1];
          const cleanAmount = (val: string) => {
            if (!val) return "";
            return val.replace(/\./g, "").replace(",", ".");
          };
          const debit = cleanAmount(row[4]);
          const credit = cleanAmount(row[5]);
          let amount = 0;
          let type: "expense" | "income" = "expense";
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
            category: type === "income" ? "Income" : (availableCategories[0] || "General"),
            userId: currentUserId,
            isMonthly: false
          };
        }).filter(tx => tx.amount > 0);

        setTransactions(parsed);
        setLoading(false);
      }
    });
  };

  const updateTransaction = (id: string, field: keyof Transaction, value: any) => {
    if (field === "category" && !availableCategories.includes(value)) {
      setAvailableCategories(prev => [...prev, value]);
    }
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, [field]: value } : tx));
  };

  const removeTransaction = (id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      await bulkImportTransactions(transactions);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to import transactions");
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 pt-6 md:p-8">
      {transactions.length === 0 ? (
        <Card className="glass-panel border-white/10">
          <CardHeader className="text-left">
            <CardTitle className="flex items-center gap-2 text-2xl text-white">
              <FileUp className="h-6 w-6 text-blue-400" />
              Import Bank Statement
            </CardTitle>
            <CardDescription className="text-white/60">
              Upload your CSV file to parse transactions and review them before saving.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10  p-12 bg-black/20 hover:bg-black/30 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <div className="size-16  bg-blue-500/20 flex items-center justify-center mb-4">
                  <FileUp className="size-8 text-blue-400" />
                </div>
                <span className="text-lg font-bold text-white mb-1">Click to upload CSV</span>
                <span className="text-sm text-white/40">Select your bank's transaction history file</span>
              </label>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-panel border-white/10 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4 text-left">
            <div>
              <CardTitle className="text-xl text-white">Preview Transactions</CardTitle>
              <CardDescription className="text-white/60">
                {transactions.length} items found. Review and assign categories.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setTransactions([])}
                disabled={loading}
                className="border-white/10 text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={loading}
                className="bg-primary text-primary-foreground font-bold shadow-lg"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                Save All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="w-[180px]">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[150px] text-right">Amount</TableHead>
                    <TableHead className="w-[250px]">Category</TableHead>
                    <TableHead className="w-[200px]">Attribution</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const rowColor = getCategoryColor(tx.category, tx.type === 'income' ? '#A855F7' : '#FFFFFF');
                    return (
                      <TableRow 
                        key={tx.id} 
                        className="border-white/10 transition-colors hover:bg-white/5"
                      >
                        <TableCell className="p-2">
                          <Input 
                            type="date" 
                            value={tx.date} 
                            onChange={(e) => updateTransaction(tx.id, "date", e.target.value)}
                            className="h-12 border-white/10 bg-black/20 text-base rounded-none text-white"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input 
                            value={tx.description} 
                            onChange={(e) => updateTransaction(tx.id, "description", e.target.value)}
                            className="h-12 border-white/10 bg-black/20 text-base rounded-none uppercase text-white"
                          />
                        </TableCell>
                        <TableCell className="p-2 text-right">
                          <span 
                            className="text-base font-mono font-bold"
                            style={{ color: tx.type === "income" ? rowColor : undefined }}
                          >
                            {tx.type === "income" ? "+" : "-"}${tx.amount.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="p-2 text-left">
                          <CategoryCombobox 
                            value={tx.category} 
                            options={availableCategories} 
                            onChange={(val) => updateTransaction(tx.id, "category", val)}
                            className="h-12 text-base"
                            style={{ 
                              borderColor: `${rowColor}33`,
                              backgroundColor: `${rowColor}1A`,
                              color: rowColor
                            }}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Select 
                            value={tx.userId} 
                            onValueChange={(val) => updateTransaction(tx.id, "userId", val)}
                          >
                            <SelectTrigger 
                              className="h-12 border-white/10 bg-black/20 text-base rounded-none px-2 text-white"
                            >
                              <div className="flex items-center gap-2">
                                {tx.userId === "family" ? (
                                  <div 
                                    className="flex h-8 w-8 items-center justify-center rounded-none border border-white/10 bg-white/5 text-white/40"
                                  >
                                    <Users className="h-4 w-4" />
                                  </div>
                                ) : (
                                  <div 
                                    className="flex h-8 w-8 items-center justify-center rounded-none border border-white/10 bg-white/5 text-[10px] font-black uppercase text-white/60"
                                  >
                                    {users.find(u => u.id === tx.userId)?.name[0] || "?"}
                                  </div>
                                )}
                                <SelectValue placeholder="Attribution" />
                              </div>
                            </SelectTrigger>
                            <SelectContent className="glass-panel border-white/10">
                              <SelectItem value="family" className="text-base">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-none border border-white/10 bg-white/5">
                                    <Users className="h-4 w-4" />
                                  </div>
                                  Family Wide
                                </div>
                              </SelectItem>
                              {users.map(u => (
                                <SelectItem key={u.id} value={u.id} className="text-base">
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-none border border-white/10 bg-white/5 text-[10px] font-black uppercase">
                                      {u.name[0]}
                                    </div>
                                    {u.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      <TableCell className="p-2 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeTransaction(tx.id)}
                          className="h-8 w-8 text-white/40 hover:bg-red-400/10 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
