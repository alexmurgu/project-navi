import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { FileUp, Trash2, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkImportTransactions } from "./actions";
import { CategoryCombobox } from "@/components/category-combobox";
import type { CategoryConfig } from "@/lib/category-visuals";

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
  expenseCategories: string[];
  incomeCategories: string[];
  categoryConfigs: CategoryConfig[];
  currentUserId: string;
}

export function ImportContent({
  users,
  expenseCategories,
  incomeCategories,
  categoryConfigs,
  currentUserId,
}: PageProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const importMutation = useMutation({
    mutationFn: (data: any[]) => bulkImportTransactions({ data }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate({ to: "/" });
    },
  });

  const getCategoryColor = (name: string, defaultColor: string) => {
    const config = categoryConfigs.find((c) => c.name.toLowerCase() === name.toLowerCase());
    return config?.color || defaultColor;
  };

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newExpenseCategories, setNewExpenseCategories] = useState<string[]>([]);
  const [newIncomeCategories, setNewIncomeCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const availableExpenseCategories = [...expenseCategories, ...newExpenseCategories];
  const availableIncomeCategories = [...incomeCategories, ...newIncomeCategories];

  useEffect(() => {
    const pending = sessionStorage.getItem("pending_import");
    if (pending) {
      try {
        const parsed = JSON.parse(pending);
        setTimeout(() => {
          setTransactions(parsed);
          sessionStorage.removeItem("pending_import");
        }, 0);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results: any) => {
        const rows = results.data as string[][];
        const dataRows = rows.slice(8);
        const parsed: Transaction[] = dataRows
          .map((row) => {
            const debit = row[4]?.replace(/\./g, "").replace(",", ".") || "";
            const credit = row[5]?.replace(/\./g, "").replace(",", ".") || "";
            let amount = credit ? parseFloat(credit) : parseFloat(debit);
            let type: "expense" | "income" = credit ? "income" : "expense";
            const parts = row[0].split("/");
            const formattedDate =
              parts.length === 3
                ? `${parts[2]}-${parts[1]}-${parts[0]}`
                : new Date().toISOString().split("T")[0];
            return {
              id: Math.random().toString(36).substr(2, 9),
              date: formattedDate,
              description: row[1] || "Bank Transaction",
              amount: Math.abs(amount) * 100,
              type,
              category: type === "income" ? "Salary" : availableExpenseCategories[0] || "General",
              userId: currentUserId,
              isMonthly: false,
            };
          })
          .filter((tx) => tx.amount > 0);
        setTransactions(parsed);
        setLoading(false);
      },
    });
  };

  const updateTransaction = (
    id: string,
    field: keyof Transaction,
    value: string | number | boolean | null,
  ) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    if (field === "category" && typeof value === "string") {
      if (tx.type === "expense" && !availableExpenseCategories.includes(value)) {
        setNewExpenseCategories((prev) => [...prev, value]);
      } else if (tx.type === "income" && !availableIncomeCategories.includes(value)) {
        setNewIncomeCategories((prev) => [...prev, value]);
      }
    }
    setTransactions((prev) => prev.map((tx) => (tx.id === id ? { ...tx, [field]: value } : tx)));
  };

  const removeTransaction = (id: string) =>
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));

  const handleImport = async () => {
    setLoading(true);
    try {
      importMutation.mutate(transactions);
    } catch (err) {
      console.error(err);
      alert("Failed to import transactions");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 pt-6 md:p-8 bg-background text-foreground antialiased">
      {transactions.length === 0 ? (
        <Card className="rounded-xl shadow-sm border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <FileUp className="h-5 w-5 text-muted-foreground" /> Import Data
            </CardTitle>
            <CardDescription>Upload your CSV file to parse transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center border border-dashed rounded-xl p-12 bg-muted/30 hover:bg-muted/50 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="flex flex-col items-center cursor-pointer text-center"
              >
                <div className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground mb-4 shadow-sm border">
                  <FileUp className="size-6" />
                </div>
                <span className="text-sm font-semibold text-foreground mb-1">
                  Click to upload CSV
                </span>
                <span className="text-xs text-muted-foreground">
                  Select your bank's transaction history file
                </span>
              </label>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl shadow-sm border bg-card overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-lg font-semibold">Preview Transactions</CardTitle>
              <CardDescription>
                {transactions.length} items found. Review and assign categories.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setTransactions([])}
                disabled={loading}
                className="rounded-lg shadow-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={loading || importMutation.isPending}
                className="rounded-lg shadow-sm"
              >
                {loading || importMutation.isPending ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}{" "}
                Save All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right w-[150px]">Amount</TableHead>
                    <TableHead className="w-[200px]">Category</TableHead>
                    <TableHead className="w-[150px]">Member</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const rowColor = getCategoryColor(
                      tx.category,
                      tx.type === "income" ? "#10B981" : "#F43F5E",
                    );
                    const options =
                      tx.type === "expense"
                        ? availableExpenseCategories
                        : availableIncomeCategories;
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="p-2">
                          <Input
                            type="date"
                            value={tx.date}
                            onChange={(e) => updateTransaction(tx.id, "date", e.target.value)}
                            className="rounded-lg h-9 shadow-sm"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            value={tx.description}
                            onChange={(e) =>
                              updateTransaction(tx.id, "description", e.target.value)
                            }
                            className="rounded-lg h-9 shadow-sm text-sm"
                          />
                        </TableCell>
                        <TableCell className="p-2 text-right">
                          <span
                            className="text-sm font-medium tabular-nums"
                            style={{ color: tx.type === "income" ? rowColor : undefined }}
                          >
                            {tx.type === "income" ? "+" : "-"}&euro;
                            {Math.abs(tx.amount / 100).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="p-2">
                          <CategoryCombobox
                            value={tx.category}
                            options={options}
                            onChange={(val) => updateTransaction(tx.id, "category", val)}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Select
                            value={tx.userId}
                            onValueChange={(val) => updateTransaction(tx.id, "userId", val)}
                          >
                            <SelectTrigger className="h-9 rounded-lg shadow-sm">
                              <SelectValue placeholder="Member" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="family">Family Wide</SelectItem>
                              {users.map((u) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.name}
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
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
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
