import React, { useReducer } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Trash2, X, CreditCard as CreditCardIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSheetFormReset } from "@/hooks/use-sheet-form-reset";
import { haptic } from "@/lib/haptics";

interface CreditCardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: any | null;
  onSubmit: (data: any) => void;
  onDelete?: (id: string) => void;
  saving?: boolean;
}

const COLORS = [
  "#f43f5e", // Rose
  "#8b5cf6", // Violet
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#64748b", // Slate
  "#0f172a", // Navy
  "#000000", // Black
];

interface FormState {
  name: string;
  color: string;
  limit: string;
}

type FormAction =
  | { type: "RESET"; payload: FormState }
  | { type: "SET_FIELD"; field: keyof FormState; value: any };

function creditCardReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "RESET":
      return action.payload;
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    default:
      return state;
  }
}

export function CreditCardSheet({
  open,
  onOpenChange,
  editingItem,
  onSubmit,
  onDelete,
  saving,
}: CreditCardSheetProps) {
  const [state, dispatch] = useReducer(creditCardReducer, {
    name: "",
    color: COLORS[0],
    limit: "",
  });

  useSheetFormReset(open, editingItem?.id ?? null, () => {
    dispatch({
      type: "RESET",
      payload: {
        name: editingItem?.name || "",
        color: editingItem?.color || COLORS[0],
        limit: editingItem?.limit ? (editingItem.limit / 100).toString() : "",
      },
    });
  });

  const handleSave = () => {
    if (!state.name.trim()) {
      haptic.warning();
      return;
    }

    const cleanLimit = (state.limit || "").replace(",", ".");
    const limitCents = cleanLimit ? Math.round(parseFloat(cleanLimit) * 100) : null;

    haptic.success();
    onSubmit({
      id: editingItem?.id,
      name: state.name,
      color: state.color,
      limit: limitCents,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-full max-h-[92dvh] sm:h-auto sm:max-h-[88vh] sm:max-w-xl sm:rounded-[36px] border-t sm:border sm:border-navi-border/20 rounded-t-[36px] p-0 shadow-2xl overflow-hidden flex flex-col bg-white"
      >
        {/* Mobile grab handle */}
        <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-navi-gray/25 sm:hidden" />

        <div className="p-6 sm:p-8 pb-2 text-left shrink-0">
          <h2 className="text-[28px] sm:text-[32px] md:text-[48px] font-display font-medium tracking-tight uppercase italic text-navi-dark">
            {editingItem ? "Refine Card" : "New Credit Card"}
          </h2>
          <p className="ml-1 text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-navi-gray/60">
            {editingItem ? "Adjust your credit line" : "Add a new line of credit"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-0 space-y-10">
          <div className="space-y-10">
            {/* Name Input */}
            <div className="space-y-4">
              <label className="text-[10px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60 px-2">
                Card Name
              </label>
              <input
                type="text"
                placeholder="e.g. Visa Platinum, Amex"
                className="w-full bg-navi-surface/30 border border-navi-border/10 rounded-premium p-6 font-display font-medium text-[20px] outline-none focus:border-navi-dark/20 transition-colors"
                value={state.name}
                onChange={(e) =>
                  dispatch({ type: "SET_FIELD", field: "name", value: e.target.value })
                }
              />
            </div>

            {/* Credit Limit */}
            <div className="space-y-4">
              <label className="text-[10px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60 px-2">
                Credit Limit (Optional)
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
                  value={state.limit}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "limit",
                      value: e.target.value.replace(",", "."),
                    })
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
                  <CreditCardIcon className="size-5" />
                  <span>{editingItem ? "Update" : "Add Card"}</span>
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
                  onDelete(editingItem.id);
                  onOpenChange(false);
                }
              }}
            >
              <Trash2 className="size-4 mr-2" />
              Remove Card
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
