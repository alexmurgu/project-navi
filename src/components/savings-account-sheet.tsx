import React, { useReducer, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Trash2, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSheetHistory } from "@/hooks/use-sheet-history";
import { haptic } from "@/lib/haptics";

interface SavingsAccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: any | null;
  onSubmit: (data: any) => void;
  onDelete?: (id: string) => void;
  saving?: boolean;
}

const COLORS = [
  "#494fdf", // Navi Blue
  "#e23b4a", // Danger Red
  "#00a87e", // Teal
  "#ec7e00", // Warning Orange
  "#b09000", // Yellow
  "#936d62", // Brown
  "#e61e49", // Deep Pink
  "#007bc2", // Light Blue
];

interface FormState {
  name: string;
  color: string;
  targetAmount: string;
}

type FormAction =
  | { type: "RESET"; payload: FormState }
  | { type: "SET_FIELD"; field: keyof FormState; value: any };

function savingsReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "RESET":
      return action.payload;
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    default:
      return state;
  }
}

export function SavingsAccountSheet({
  open,
  onOpenChange,
  editingItem,
  onSubmit,
  onDelete,
  saving,
}: SavingsAccountSheetProps) {
  useSheetHistory(open, onOpenChange);

  const [state, dispatch] = useReducer(savingsReducer, {
    name: "",
    color: COLORS[0],
    targetAmount: "",
  });

  useEffect(() => {
    if (open) {
      dispatch({
        type: "RESET",
        payload: {
          name: editingItem?.name || "",
          color: editingItem?.color || COLORS[0],
          targetAmount: editingItem?.targetAmount
            ? (editingItem.targetAmount / 100).toString()
            : "",
        },
      });
    }
  }, [open, editingItem]);

  const handleSave = () => {
    if (!state.name.trim()) {
      haptic.warning();
      return;
    }

    const cleanTarget = (state.targetAmount || "").replace(",", ".");
    const targetCents = cleanTarget ? Math.round(parseFloat(cleanTarget) * 100) : null;

    haptic.success();
    onSubmit({
      id: editingItem?.id,
      name: state.name,
      color: state.color,
      targetAmount: targetCents,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-full max-h-[92dvh] sm:h-auto sm:max-h-[88vh] sm:max-w-xl sm:left-1/2 sm:-translate-x-1/2 sm:bottom-6 sm:rounded-[36px] border-t sm:border sm:border-navi-border/20 rounded-t-[36px] p-0 shadow-2xl overflow-hidden flex flex-col bg-white"
      >
        {/* Mobile grab handle */}
        <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-navi-gray/25 sm:hidden" />

        <div className="p-6 sm:p-8 pb-2 text-left shrink-0">
          <h2 className="text-[28px] sm:text-[32px] md:text-[48px] font-display font-medium tracking-tight uppercase italic text-navi-dark">
            {editingItem ? "Refine Goal" : "New Savings Goal"}
          </h2>
          <p className="ml-1 text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-navi-gray/60">
            {editingItem ? "Adjust your savings target" : "Set a new target for your future"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-0 space-y-10">
          <div className="space-y-10">
            {/* Name Input */}
            <div className="space-y-4">
              <label className="text-[10px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60 px-2">
                Goal Name
              </label>
              <input
                type="text"
                placeholder="e.g. New Car, House Deposit"
                className="w-full bg-navi-surface/30 border border-navi-border/10 rounded-premium p-6 font-display font-medium text-[20px] outline-none focus:border-navi-dark/20 transition-colors"
                value={state.name}
                onChange={(e) =>
                  dispatch({ type: "SET_FIELD", field: "name", value: e.target.value })
                }
              />
            </div>

            {/* Target Amount */}
            <div className="space-y-4">
              <label className="text-[10px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60 px-2">
                Target Amount (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-display font-medium text-navi-gray/40 text-[20px]">
                  €
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="w-full bg-navi-surface/30 border border-navi-border/10 rounded-premium p-6 pl-12 font-display font-medium text-[20px] outline-none focus:border-navi-dark/20 transition-colors"
                  value={state.targetAmount}
                  onChange={(e) =>
                    dispatch({ type: "SET_FIELD", field: "targetAmount", value: e.target.value })
                  }
                  onFocus={(e) => e.target.select()}
                />
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-4">
              <label className="text-[10px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60 px-2">
                Brand Color
              </label>
              <div className="flex flex-wrap gap-4 px-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => dispatch({ type: "SET_FIELD", field: "color", value: color })}
                    className={cn(
                      "size-10 rounded-full transition-all active:scale-90",
                      state.color === color
                        ? "ring-4 ring-offset-2 ring-navi-dark/10 scale-110"
                        : "opacity-60 hover:opacity-100",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 border-t border-navi-border/20 bg-white shrink-0">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="secondary"
              className="h-16 rounded-full font-display font-medium uppercase tracking-[0.2em]"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-5" />
              <span>Dismiss</span>
            </Button>

            <Button
              className="h-16 rounded-full bg-navi-dark text-white font-display font-medium uppercase tracking-[0.2em] shadow-[0_20px_40px_-15px_rgba(8,59,58,0.3)] hover:opacity-95 active:scale-[0.98] transition-all"
              onClick={handleSave}
              disabled={saving || !state.name}
            >
              {saving ? (
                <span className="animate-pulse">Syncing...</span>
              ) : (
                <>
                  <Plus className="size-5" />
                  <span>{editingItem ? "Update" : "Create"}</span>
                </>
              )}
            </Button>
          </div>

          {editingItem && (
            <Button
              variant="ghost"
              className="w-full mt-4 h-12 text-navi-danger font-display font-medium uppercase tracking-[0.2em]"
              onClick={() => {
                if (onDelete) {
                  haptic.medium();
                  onDelete(editingItem.id);
                  onOpenChange(false);
                }
              }}
            >
              <Trash2 className="size-4 mr-2" />
              Delete Goal
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
