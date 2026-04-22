import React, { useReducer, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  Save, 
  X,
  Plus,
} from "lucide-react";
import { type CategoryConfig } from "@/lib/category-visuals";
import { UserSelector } from "./transaction/user-selector";
import { CategoryPicker } from "./transaction/category-picker";
import { TransactionForm } from "./transaction/transaction-form";

interface User {
  id: string;
  name: string;
  email: string;
}

interface TransactionSheetProps {
  mode: "expense" | "income";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: any | null;
  users: User[];
  selectedUserId: string;
  setSelectedUserId: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  availableCategories: string[];
  setAvailableCategories: (val: string[]) => void;
  categoryConfigs: CategoryConfig[];
  onSubmit: (data: any) => void;
  onDelete?: (id: string) => void;
  saving?: boolean;
}

interface FormState {
  amount: string;
  description: string;
  date: Date | undefined;
  status: "pending" | "paid";
  selectedUserId: string;
  category: string;
  isCustomizing: boolean;
  draftColor: string;
  draftIcon: string | null;
}

type FormAction =
  | { type: "RESET"; payload: FormState }
  | { type: "SET_FIELD"; field: keyof FormState; value: any };

function transactionReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "RESET":
      return action.payload;
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    default:
      return state;
  }
}

export function TransactionSheet({
  mode,
  open,
  onOpenChange,
  editingItem,
  users,
  categoryConfigs,
  onSubmit,
  onDelete,
  saving,
  availableCategories,
}: TransactionSheetProps) {
  const [state, dispatch] = useReducer(transactionReducer, {
    amount: "",
    description: "",
    date: new Date(),
    status: "paid",
    selectedUserId: "family",
    category: "",
    isCustomizing: false,
    draftColor: "#494fdf",
    draftIcon: null,
  });

  useEffect(() => {
    if (open) {
      const initialState: FormState = {
        amount: editingItem ? (editingItem.amount / 100).toString() : "",
        description: editingItem?.description || "",
        date: editingItem ? new Date(editingItem.date) : new Date(),
        status: editingItem?.status || "paid",
        selectedUserId: editingItem?.userId || "family",
        category: editingItem?.category || availableCategories[0] || "",
        isCustomizing: false,
        draftColor: "#494fdf",
        draftIcon: null,
      };
      dispatch({ type: "RESET", payload: initialState });
    }
  }, [open, editingItem, availableCategories]);

  const handleSave = () => {
    const amountCents = Math.round(parseFloat(state.amount) * 100);
    if (isNaN(amountCents)) return;

    onSubmit({
      id: editingItem?.id,
      amount: amountCents,
      description: state.description,
      date: state.date?.toISOString(),
      category: state.category,
      userId: state.selectedUserId === "family" ? null : state.selectedUserId,
      status: state.status,
      customization: state.isCustomizing ? { color: state.draftColor, icon: state.draftIcon } : undefined,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[95vh] sm:h-fit sm:max-h-[95vh] sm:side-right border-t sm:border-l rounded-t-[40px] sm:rounded-l-[40px] p-0 shadow-none border-none overflow-hidden flex flex-col bg-white"
      >
        {/* Header Section */}
        <div className="p-6 sm:p-8 pb-2 text-left shrink-0">
          <h2 className="text-[28px] sm:text-[32px] md:text-[48px] font-display font-medium tracking-tight uppercase italic text-navi-dark">
            {editingItem ? "Refine Entry" : `New ${mode}`}
          </h2>
          <p className="ml-1 text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-navi-gray/60">
            {editingItem ? "Update existing transaction records" : "Record a new financial movement"}
          </p>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-0 space-y-10 sm:space-y-12">
          <div className="pb-10 space-y-10 sm:space-y-12">
            <UserSelector 
              users={users} 
              selectedUserId={state.selectedUserId} 
              onSelect={(val) => dispatch({ type: "SET_FIELD", field: "selectedUserId", value: val })} 
            />

            <CategoryPicker 
              category={state.category}
              onCategoryChange={(val) => dispatch({ type: "SET_FIELD", field: "category", value: val })}
              availableCategories={availableCategories}
              categoryConfigs={categoryConfigs}
              isCustomizing={state.isCustomizing}
              onCustomizingChange={(val) => dispatch({ type: "SET_FIELD", field: "isCustomizing", value: val })}
              draftColor={state.draftColor}
              onDraftColorChange={(val) => dispatch({ type: "SET_FIELD", field: "draftColor", value: val })}
              draftIcon={state.draftIcon}
              onDraftIconChange={(val) => dispatch({ type: "SET_FIELD", field: "draftIcon", value: val })}
            />

            <TransactionForm 
              amount={state.amount}
              onAmountChange={(val) => dispatch({ type: "SET_FIELD", field: "amount", value: val })}
              description={state.description}
              onDescriptionChange={(val) => dispatch({ type: "SET_FIELD", field: "description", value: val })}
              date={state.date}
              onDateChange={(val) => dispatch({ type: "SET_FIELD", field: "date", value: val })}
              status={state.status}
              onStatusChange={(val) => dispatch({ type: "SET_FIELD", field: "status", value: val })}
            />
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-6 sm:p-8 border-t border-navi-border/20 bg-white shrink-0">
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant="secondary"
              className="h-16 rounded-full font-display font-medium uppercase tracking-[0.2em]"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-5" />
              <span className="hidden sm:inline">Dismiss</span>
            </Button>

            <Button
              className="col-span-1 h-16 rounded-full bg-navi-dark text-white font-display font-medium uppercase tracking-[0.2em] shadow-[0_20px_40px_-15px_rgba(8,59,58,0.3)] hover:opacity-95 active:scale-[0.98] transition-all"
              onClick={handleSave}
              disabled={saving || !state.amount}
            >
              {saving ? (
                <span className="animate-pulse">Syncing...</span>
              ) : (
                <>
                  {editingItem ? <Save className="size-5" /> : <Plus className="size-5" />}
                  <span className="hidden sm:inline">{editingItem ? "Update" : "Confirm"}</span>
                </>
              )}
            </Button>

            <Button
              variant="destructive"
              className="h-16 rounded-full font-display font-medium uppercase tracking-[0.2em]"
              onClick={() => {
                if (editingItem && onDelete) {
                  onDelete(editingItem.id);
                  onOpenChange(false);
                } else {
                  onOpenChange(false);
                }
              }}
              disabled={saving}
            >
              <Trash2 className="size-5" />
              <span className="hidden sm:inline">{editingItem ? "Delete" : "Void"}</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
