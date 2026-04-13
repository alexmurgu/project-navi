import * as React from "react";
import { Save, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { CategoryCombobox } from "@/components/category-combobox";
import { cn } from "@/lib/utils";

export type TransactionMode = "expense" | "income";

export type TransactionEditorItem = {
  id?: string;
  description?: string;
  amount?: number;
  category?: string;
  userId?: string | null;
  date?: string | Date;
  isMonthly?: boolean;
};

type UserOption = {
  id: string;
  name: string;
};

interface TransactionSheetProps {
  mode: TransactionMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: TransactionEditorItem | null;
  users: UserOption[];
  selectedUserId: string;
  setSelectedUserId: React.Dispatch<React.SetStateAction<string>>;
  category: string;
  setCategory: React.Dispatch<React.SetStateAction<string>>;
  availableCategories: string[];
  setAvailableCategories: React.Dispatch<React.SetStateAction<string[]>>;
  onSubmit: (payload: {
    id?: string;
    description: string;
    amount: number;
    category: string;
    userId: string | null;
    date: string | Date;
    isMonthly?: boolean;
  }) => void;
  onDelete?: (id: string) => void;
  saving?: boolean;
}

export function TransactionSheet({
  mode,
  open,
  onOpenChange,
  editingItem,
  users,
  selectedUserId,
  setSelectedUserId,
  category,
  setCategory,
  availableCategories,
  setAvailableCategories,
  onSubmit,
  onDelete,
  saving,
}: TransactionSheetProps) {
  const title = editingItem
    ? `Edit ${mode === "expense" ? "Expense" : "Income"}`
    : `Add ${mode === "expense" ? "Expense" : "Income"}`;
  const submitColor =
    mode === "expense" ? "bg-foreground text-background" : "bg-emerald-600 text-white";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      id: editingItem?.id,
      description: String(formData.get("description") || ""),
      amount: Math.round(parseFloat(String(formData.get("amount") || "0")) * 100),
      category,
      userId: selectedUserId === "family" ? null : selectedUserId,
      date: String(formData.get("date") || ""),
      isMonthly: editingItem?.isMonthly,
    });
  };

  const today = new Date().toISOString().split("T")[0];
  const showDelete = !!editingItem?.id && !!onDelete;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] sm:h-fit sm:side-right border-t sm:border-l rounded-t-2xl sm:rounded-l-2xl p-8 pb-12 shadow-2xl border-none"
      >
        <SheetHeader className="mb-10 text-left">
          <SheetTitle className="text-3xl font-black tracking-tighter uppercase italic">
            {title}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
              Member
            </Label>
            <div className="flex flex-wrap gap-3">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={cn(
                    "size-12 rounded-xl border flex items-center justify-center text-sm font-black transition-all",
                    selectedUserId === user.id
                      ? mode === "expense"
                        ? "bg-foreground text-background border-foreground shadow-lg"
                        : "bg-emerald-600 text-white border-emerald-600 shadow-lg"
                      : "bg-muted/10 text-muted-foreground border-transparent hover:bg-muted/20",
                  )}
                >
                  {user.name[0]}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedUserId("family")}
                className={cn(
                  "size-12 rounded-xl border flex items-center justify-center transition-all",
                  selectedUserId === "family"
                    ? mode === "expense"
                      ? "bg-foreground text-background border-foreground shadow-lg"
                      : "bg-emerald-600 text-white border-emerald-600 shadow-lg"
                    : "bg-muted/10 text-muted-foreground border-transparent hover:bg-muted/20",
                )}
              >
                <Users className="size-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="ml-1 text-[10px] font-black uppercase tracking-widest opacity-40">
                Amount
              </Label>
              <Input
                name="amount"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                defaultValue={editingItem?.amount ? editingItem.amount / 100 : ""}
                className={cn(
                  "h-14 rounded-xl border-none px-6 font-black text-2xl shadow-inner",
                  mode === "expense" ? "bg-secondary/40" : "bg-secondary/40 text-emerald-600",
                )}
              />
            </div>
            <div className="space-y-3">
              <Label className="ml-1 text-[10px] font-black uppercase tracking-widest opacity-40">
                Date
              </Label>
              <Input
                name="date"
                type="date"
                required
                defaultValue={
                  editingItem?.date ? new Date(editingItem.date).toISOString().split("T")[0] : today
                }
                className="h-14 rounded-xl border-none bg-secondary/40 px-6 font-bold shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="ml-1 text-[10px] font-black uppercase tracking-widest opacity-40">
              Description
            </Label>
            <Input
              name="description"
              required
              defaultValue={editingItem?.description || ""}
              className="h-14 rounded-xl border-none bg-secondary/40 px-6 font-bold shadow-inner"
            />
          </div>

          <div className="space-y-3">
            <Label className="ml-1 text-[10px] font-black uppercase tracking-widest opacity-40">
              {mode === "expense" ? "Category" : "Source"}
            </Label>
            <CategoryCombobox
              value={category}
              options={availableCategories}
              onChange={(value) => {
                if (value && !availableCategories.includes(value)) {
                  setAvailableCategories((prev) => [...prev, value]);
                }
                setCategory(value);
              }}
            />
          </div>

          <div className={cn("pt-6", showDelete ? "grid grid-cols-2 gap-4" : "flex")}>
            {showDelete && (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="destructive"
                      className="h-14 w-full rounded-xl border-none bg-rose-600 px-0 font-black uppercase tracking-widest text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] sm:px-4"
                    >
                      <Trash2 className="size-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  }
                />
                <AlertDialogContent className="rounded-2xl border-none p-8 shadow-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-black italic tracking-tight uppercase">
                      Delete {mode === "expense" ? "Expense" : "Income"}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="mt-2 text-xs font-bold uppercase opacity-50">
                      Are you sure you want to delete this {mode}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-8 gap-3">
                    <AlertDialogCancel className="h-12 rounded-xl border-none bg-muted/10 text-[10px] font-black uppercase tracking-widest">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (!editingItem?.id || !onDelete) return;
                        Promise.resolve(onDelete(editingItem.id)).then(() => onOpenChange(false));
                      }}
                      className="h-12 rounded-xl border-none bg-rose-600 text-[10px] font-black uppercase tracking-widest text-white"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button
              type="submit"
              disabled={saving}
              className={cn(
                "h-14 flex-1 rounded-xl border-none px-0 font-black uppercase tracking-[0.2em] shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] sm:px-4",
                submitColor,
              )}
            >
              <Save className="size-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
