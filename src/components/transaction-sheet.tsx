import * as React from "react";
import { Save, Trash2, Users, Check, LayoutList, Palette, ChevronRight } from "lucide-react";
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
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { addAdminCategory, getTransactionSuggestions } from "@/actions";
import {
  CATEGORY_ICON_OPTIONS,
  CategoryIcon,
  type CategoryConfig,
} from "@/lib/category-visuals";

export type TransactionMode = "expense" | "income";

const PRESET_COLORS = [
  "#F87171", "#FB923C", "#FBBF24", "#34D399", "#22D3EE", "#38BDF8", "#818CF8", "#A78BFA", "#F472B6",
  "#EF4444", "#F97316", "#F59E0B", "#10B981", "#06B6D4", "#0EA5E9", "#6366F1", "#8B5CF6", "#EC4899",
  "#B91C1C", "#C2410C", "#B45309", "#047857", "#0E7490", "#0369A1", "#4338CA", "#6D28D9", "#BE185D",
];

export type TransactionEditorItem = {
  id?: string;
  description?: string;
  amount?: number;
  category?: string;
  userId?: string | null;
  date?: string | Date;
  isMonthly?: boolean;
  status?: "pending" | "paid";
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
  categoryConfigs?: CategoryConfig[];
  onSubmit: (payload: {
    id?: string;
    description: string;
    amount: number;
    category: string;
    userId: string | null;
    date: string | Date;
    isMonthly?: boolean;
    status: "pending" | "paid";
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
  categoryConfigs = [],
  onSubmit,
  onDelete,
  saving,
}: TransactionSheetProps) {
  const queryClient = useQueryClient();
  const [isMonthly, setIsMonthly] = React.useState(false);
  const [status, setStatus] = React.useState<"pending" | "paid">("paid");
  const [isCustomizing, setIsCustomizing] = React.useState(false);
  
  const [draftColor, setDraftColor] = React.useState("#F59E0B");
  const [draftIcon, setDraftIcon] = React.useState<string | null>(null);
  const [description, setDescription] = React.useState("");
  const [debouncedDescription, setDebouncedDescription] = React.useState("");

  // Debounce description for suggestions
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedDescription(description), 300);
    return () => clearTimeout(timer);
  }, [description]);

  const { data: suggestions = [] } = useQuery({
    queryKey: ["suggestions", debouncedDescription],
    queryFn: () => getTransactionSuggestions({ data: debouncedDescription }),
    enabled: debouncedDescription.length >= 2 && !editingItem,
  });

  const categoryConfigMap = React.useMemo(() => {
    const map: Record<string, CategoryConfig> = {};
    categoryConfigs.forEach((c) => (map[c.name] = c));
    return map;
  }, [categoryConfigs]);

  const upsertCategoryMutation = useMutation({
    mutationFn: (data: { name: string; color: string; icon: string | null }) =>
      addAdminCategory({ data }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  React.useEffect(() => {
    if (open) {
      setIsMonthly(editingItem?.isMonthly || false);
      setStatus(editingItem?.status || "paid");
      setIsCustomizing(false);
      setDescription(editingItem?.description || "");
      
      const activeCat = editingItem?.category || category;
      if (activeCat) {
        const config = categoryConfigMap[activeCat];
        setDraftColor(config?.color || "#F59E0B");
        setDraftIcon(config?.icon || null);
      }
    }
  }, [open, editingItem, category, categoryConfigMap]);

  // Update draft when category changes
  React.useEffect(() => {
    if (category) {
      const config = categoryConfigMap[category];
      setDraftColor(config?.color || "#F59E0B");
      setDraftIcon(config?.icon || null);
    }
  }, [category, categoryConfigMap]);

  const title = editingItem
    ? `Edit ${mode === "expense" ? "Expense" : "Income"}`
    : `Add ${mode === "expense" ? "Expense" : "Income"}`;
  const submitColor =
    mode === "expense" ? "bg-foreground text-background" : "bg-emerald-600 text-white";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (isCustomizing && category) {
      await upsertCategoryMutation.mutateAsync({
        name: category,
        color: draftColor,
        icon: draftIcon,
      });
    }

    onSubmit({
      id: editingItem?.id,
      description: String(formData.get("description") || ""),
      amount: Math.round(parseFloat(String(formData.get("amount") || "0")) * 100),
      category,
      userId: selectedUserId === "family" ? null : selectedUserId,
      date: String(formData.get("date") || ""),
      isMonthly: mode === "expense" ? isMonthly : false,
      status: status,
    });
  };

  const today = new Date().toISOString().split("T")[0];
  const showDelete = !!editingItem?.id && !!onDelete;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[95vh] sm:h-fit sm:max-h-[95vh] sm:side-right border-t sm:border-l rounded-t-2xl sm:rounded-l-2xl p-0 shadow-2xl border-none overflow-hidden flex flex-col"
      >
        <SheetHeader className="p-8 pb-4 text-left shrink-0">
          <SheetTitle className="text-3xl font-black tracking-tighter uppercase italic">
            {title}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 pb-12 space-y-8">
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
            <div className="relative">
              <Input
                name="description"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-14 rounded-xl border-none bg-secondary/40 px-6 font-bold shadow-inner"
              />
              {suggestions.length > 0 && !editingItem && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 p-2 rounded-2xl bg-card border border-muted/20 shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  {suggestions.map((s: any) => (
                    <button
                      key={s.description}
                      type="button"
                      onClick={() => {
                        setDescription(s.description);
                        setCategory(s.category);
                        // Auto-fill amount if empty
                        const amountInput = document.querySelector(
                          'input[name="amount"]',
                        ) as HTMLInputElement;
                        if (amountInput && (!amountInput.value || amountInput.value === "0")) {
                          amountInput.value = (s.amount / 100).toString();
                        }
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/10 transition-colors text-left"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{s.description}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-30">
                          {s.category}
                        </p>
                      </div>
                      <ChevronRight className="size-4 opacity-20" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">
                {mode === "expense" ? "Category" : "Source"}
              </Label>
              {category && (
                <button
                  type="button"
                  onClick={() => setIsCustomizing(!isCustomizing)}
                  className={cn(
                    "text-[8px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md",
                    isCustomizing 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted/10 text-muted-foreground hover:bg-muted/20"
                  )}
                >
                  <Palette className="size-2.5" />
                  Customize
                </button>
              )}
            </div>
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

            {isCustomizing && category && (
              <div className="mt-4 p-6 rounded-2xl bg-secondary/20 border border-muted/10 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Color</p>
                    <span className="text-[8px] font-mono opacity-40">{draftColor}</span>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setDraftColor(color)}
                        className={cn(
                          "size-8 rounded-full transition-all flex items-center justify-center",
                          draftColor === color ? "ring-2 ring-foreground ring-offset-2 scale-110" : "hover:scale-105"
                        )}
                        style={{ backgroundColor: color }}
                      >
                        {draftColor === color && <Check className="size-3 text-white mix-blend-difference" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Icon</p>
                    <span className="text-[8px] font-mono opacity-40">{draftIcon || "Default"}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 max-h-[160px] overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => setDraftIcon(null)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                        draftIcon === null ? "bg-foreground text-background border-foreground" : "bg-background/50 border-transparent hover:bg-muted/20"
                      )}
                    >
                      <LayoutList className="size-4" />
                    </button>
                    {CATEGORY_ICON_OPTIONS.filter(o => o.value !== "LayoutList").map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDraftIcon(opt.value)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                            draftIcon === opt.value ? "bg-foreground text-background border-foreground" : "bg-background/50 border-transparent hover:bg-muted/20"
                          )}
                        >
                          <Icon className="size-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isMonthly && (
              <div className="space-y-3">
                <Label className="ml-1 text-[10px] font-black uppercase tracking-widest opacity-40">
                  Status
                </Label>
                <div className="flex bg-secondary/40 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setStatus("paid")}
                    className={cn(
                      "flex-1 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      status === "paid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground opacity-40"
                    )}
                  >
                    Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("pending")}
                    className={cn(
                      "flex-1 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      status === "pending" ? "bg-background shadow-sm text-amber-600" : "text-muted-foreground opacity-40"
                    )}
                  >
                    Pending
                  </button>
                </div>
              </div>
            )}

            {mode === "expense" && (
              <div className={cn("space-y-3", !isMonthly && "col-span-2")}>
                <Label className="ml-1 text-[10px] font-black uppercase tracking-widest opacity-40">
                  Recurring
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    const nextValue = !isMonthly;
                    setIsMonthly(nextValue);
                    if (!nextValue) setStatus("paid"); // Reset status to paid if switched to one-time
                  }}
                  className={cn(
                    "w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                    isMonthly 
                      ? "bg-foreground text-background border-foreground shadow-lg" 
                      : "bg-secondary/40 text-muted-foreground border-transparent opacity-40"
                  )}
                >
                  {isMonthly ? "Every Month" : "One-time"}
                </button>
              </div>
            )}
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
              disabled={saving || upsertCategoryMutation.isPending}
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
