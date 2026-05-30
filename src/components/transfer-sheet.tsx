import React, { useReducer, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X, Plus, ArrowRightLeft, AlertCircle } from "lucide-react";
import { UserSelector } from "./transaction/user-selector";
import { TransactionForm } from "./transaction/transaction-form";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

interface User {
  id: string;
  name: string;
  email?: string;
}

interface SavingsAccount {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  currentBalance: number;
}

interface TransferSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  savingsAccounts: SavingsAccount[];
  availableBalance: number;
  onSubmit: (data: any) => void;
  saving?: boolean;
  creditCards?: any[];
}

interface FormState {
  amount: string;
  description: string;
  date: Date | undefined;
  fromType: "main" | "savings" | "credit";
  fromId: string | null;
  toType: "main" | "savings" | "credit";
  toId: string | null;
  selectedUserId: string;
}

type FormAction =
  | { type: "RESET"; payload: FormState }
  | { type: "SET_FIELD"; field: keyof FormState; value: any };

function transferReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "RESET":
      return action.payload;
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    default:
      return state;
  }
}

export function TransferSheet({
  open,
  onOpenChange,
  users,
  savingsAccounts,
  availableBalance,
  onSubmit,
  saving,
  creditCards = [],
}: TransferSheetProps) {
  const [state, dispatch] = useReducer(transferReducer, {
    amount: "",
    description: "Transfer to Savings",
    date: new Date(),
    fromType: "main",
    fromId: null,
    toType: "savings",
    toId: savingsAccounts[0]?.id || null,
    selectedUserId: "family",
  });

  useEffect(() => {
    if (open) {
      dispatch({
        type: "RESET",
        payload: {
          amount: "",
          description: "Transfer to Savings",
          date: new Date(),
          fromType: "main",
          fromId: null,
          toType: "savings",
          toId: savingsAccounts[0]?.id || null,
          selectedUserId: "family",
        },
      });
    }
  }, [open, savingsAccounts]);

  const [fromOpen, setFromOpen] = React.useState(false);
  const [toOpen, setToOpen] = React.useState(false);

  const getFromLabel = () => {
    if (state.fromType === "main") return `Main Balance (${(availableBalance / 100).toFixed(2)}€)`;
    if (state.fromType === "savings") {
      const sa = savingsAccounts.find((s) => s.id === state.fromId);
      return sa ? `${sa.name} (${(sa.currentBalance / 100).toFixed(2)}€)` : "Select source";
    }
    if (state.fromType === "credit") {
      const cc = creditCards.find((c) => c.id === state.fromId);
      return cc ? `${cc.name} (Debt: ${(cc.currentBalance / 100).toFixed(2)}€)` : "Select source";
    }
    return "Select source";
  };

  const getToLabel = () => {
    if (state.toType === "main") return "Main Balance";
    if (state.toType === "savings") {
      const sa = savingsAccounts.find((s) => s.id === state.toId);
      return sa ? sa.name : "Select destination";
    }
    if (state.toType === "credit") {
      const cc = creditCards.find((c) => c.id === state.toId);
      return cc ? cc.name : "Select destination";
    }
    return "Select destination";
  };

  const amountCents = state.amount ? Math.round(parseFloat(state.amount) * 100) : 0;
  const sourceBalance =
    state.fromType === "main"
      ? availableBalance
      : state.fromType === "savings"
        ? savingsAccounts.find((sa) => sa.id === state.fromId)?.currentBalance || 0
        : creditCards.find((cc) => cc.id === state.fromId)?.limit || 99999999; // Credit cards use limit or arbitrary high for now

  const isOverBalance = amountCents > sourceBalance;

  const handleSave = () => {
    if (isNaN(amountCents) || isOverBalance) return;

    let dynamicDescription = "Fund Transfer";
    if (state.toType === "savings") {
      const sa = savingsAccounts.find((s) => s.id === state.toId);
      dynamicDescription = sa ? `Transfer to ${sa.name}` : "Transfer to Savings";
    } else if (state.toType === "credit") {
      const cc = creditCards.find((c) => c.id === state.toId);
      dynamicDescription = cc ? `Payment to ${cc.name}` : "Credit Card Payment";
    } else if (state.fromType === "savings") {
      const sa = savingsAccounts.find((s) => s.id === state.fromId);
      dynamicDescription = sa ? `Transfer from ${sa.name}` : "Transfer from Savings";
    } else if (state.fromType === "credit") {
      const cc = creditCards.find((c) => c.id === state.fromId);
      dynamicDescription = cc ? `Transfer from ${cc.name}` : "Credit Card Transfer";
    }

    onSubmit({
      amount: amountCents,
      description: dynamicDescription,
      date: state.date?.toISOString(),
      fromType: state.fromType,
      fromId: state.fromId,
      toType: state.toType,
      toId: state.toId,
      userId: state.selectedUserId === "family" ? null : state.selectedUserId,
    });
  };

  const swapSources = () => {
    dispatch({ type: "SET_FIELD", field: "fromType", value: state.toType });
    dispatch({ type: "SET_FIELD", field: "fromId", value: state.toId });
    dispatch({ type: "SET_FIELD", field: "toType", value: state.fromType });
    dispatch({ type: "SET_FIELD", field: "toId", value: state.fromId });
    dispatch({
      type: "SET_FIELD",
      field: "description",
      value: state.fromType === "main" ? "Transfer from Savings" : "Transfer to Savings",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-full max-h-[90dvh] sm:h-fit sm:max-h-[95dvh] sm:side-right border-t sm:border-l rounded-t-[40px] sm:rounded-l-[40px] p-0 shadow-none border-none overflow-hidden flex flex-col bg-white"
      >
        <div className="p-6 sm:p-8 pb-2 text-left shrink-0">
          <h2 className="text-[28px] sm:text-[32px] md:text-[48px] font-display font-medium tracking-tight uppercase italic text-navi-dark">
            Move Funds
          </h2>
          <p className="ml-1 text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-navi-gray/60">
            Transfer between main balance and savings
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-0 space-y-10 sm:space-y-12">
          <div className="pb-10 space-y-10 sm:space-y-12">
            <UserSelector
              users={users}
              selectedUserId={state.selectedUserId}
              onSelect={(val) =>
                dispatch({ type: "SET_FIELD", field: "selectedUserId", value: val })
              }
            />

            {/* Source & Destination Picker */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60 px-2">
                Transfer Details
              </h3>

              <div className="flex flex-col gap-4 relative">
                {/* From */}
                <div
                  className={cn(
                    "p-5 rounded-premium border transition-colors space-y-3",
                    isOverBalance
                      ? "bg-navi-danger/5 border-navi-danger/20"
                      : "bg-navi-surface/30 border-navi-border/10",
                  )}
                >
                  <p className="text-[9px] font-display font-medium uppercase tracking-widest text-navi-gray/40">
                    From
                  </p>
                  <Popover open={fromOpen} onOpenChange={setFromOpen}>
                    <PopoverTrigger
                      render={
                        <button className="w-full flex items-center justify-between text-left h-auto p-0 border-none bg-transparent shadow-none focus:ring-0 text-[18px] font-display font-medium text-navi-dark">
                          <span>{getFromLabel()}</span>
                          <ChevronDown className="size-4 text-navi-gray/40" />
                        </button>
                      }
                    />
                    <PopoverContent
                      className="w-[var(--anchor-width)] min-w-[280px] p-2 rounded-2xl shadow-2xl z-[100] bg-white border border-navi-border/10"
                      align="start"
                    >
                      <div className="flex flex-col gap-1 max-h-[40vh] overflow-y-auto">
                        <button
                          className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-display hover:bg-navi-surface/50 transition-colors"
                          onClick={() => {
                            dispatch({ type: "SET_FIELD", field: "fromType", value: "main" });
                            dispatch({ type: "SET_FIELD", field: "fromId", value: null });
                            setFromOpen(false);
                          }}
                        >
                          Main Balance ({(availableBalance / 100).toFixed(2)}€)
                        </button>

                        {savingsAccounts.length > 0 && (
                          <>
                            <div className="text-[10px] font-display uppercase tracking-[0.2em] opacity-40 px-4 py-2 mt-2">
                              Savings Goals
                            </div>
                            {savingsAccounts.map((sa) => (
                              <button
                                key={sa.id}
                                className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-display hover:bg-navi-surface/50 transition-colors"
                                onClick={() => {
                                  dispatch({
                                    type: "SET_FIELD",
                                    field: "fromType",
                                    value: "savings",
                                  });
                                  dispatch({ type: "SET_FIELD", field: "fromId", value: sa.id });
                                  setFromOpen(false);
                                }}
                              >
                                {sa.name} ({(sa.currentBalance / 100).toFixed(2)}€)
                              </button>
                            ))}
                          </>
                        )}

                        {creditCards.length > 0 && (
                          <>
                            <div className="text-[10px] font-display uppercase tracking-[0.2em] opacity-40 px-4 py-2 mt-2">
                              Credit Cards
                            </div>
                            {creditCards.map((cc) => (
                              <button
                                key={cc.id}
                                className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-display hover:bg-navi-surface/50 transition-colors"
                                onClick={() => {
                                  dispatch({
                                    type: "SET_FIELD",
                                    field: "fromType",
                                    value: "credit",
                                  });
                                  dispatch({ type: "SET_FIELD", field: "fromId", value: cc.id });
                                  setFromOpen(false);
                                }}
                              >
                                {cc.name} (Debt: {(cc.currentBalance / 100).toFixed(2)}€)
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Swap Button */}
                <button
                  onClick={swapSources}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-10 rounded-full bg-white border border-navi-border/20 shadow-sm flex items-center justify-center z-10 hover:scale-110 transition-transform active:scale-95"
                >
                  <ArrowRightLeft className="size-4 text-navi-dark rotate-90" />
                </button>

                {/* To */}
                <div className="p-5 rounded-premium bg-navi-surface/30 border border-navi-border/10 space-y-3">
                  <p className="text-[9px] font-display font-medium uppercase tracking-widest text-navi-gray/40">
                    To
                  </p>
                  <Popover open={toOpen} onOpenChange={setToOpen}>
                    <PopoverTrigger
                      render={
                        <button className="w-full flex items-center justify-between text-left h-auto p-0 border-none bg-transparent shadow-none focus:ring-0 text-[18px] font-display font-medium text-navi-dark">
                          <span>{getToLabel()}</span>
                          <ChevronDown className="size-4 text-navi-gray/40" />
                        </button>
                      }
                    />
                    <PopoverContent
                      className="w-[var(--anchor-width)] min-w-[280px] p-2 rounded-2xl shadow-2xl z-[100] bg-white border border-navi-border/10"
                      align="start"
                    >
                      <div className="flex flex-col gap-1 max-h-[40vh] overflow-y-auto">
                        <button
                          className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-display hover:bg-navi-surface/50 transition-colors"
                          onClick={() => {
                            dispatch({ type: "SET_FIELD", field: "toType", value: "main" });
                            dispatch({ type: "SET_FIELD", field: "toId", value: null });
                            setToOpen(false);
                          }}
                        >
                          Main Balance
                        </button>

                        {savingsAccounts.length > 0 && (
                          <>
                            <div className="text-[10px] font-display uppercase tracking-[0.2em] opacity-40 px-4 py-2 mt-2">
                              Savings Goals
                            </div>
                            {savingsAccounts.map((sa) => (
                              <button
                                key={sa.id}
                                className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-display hover:bg-navi-surface/50 transition-colors"
                                onClick={() => {
                                  dispatch({
                                    type: "SET_FIELD",
                                    field: "toType",
                                    value: "savings",
                                  });
                                  dispatch({ type: "SET_FIELD", field: "toId", value: sa.id });
                                  setToOpen(false);
                                }}
                              >
                                {sa.name}
                              </button>
                            ))}
                          </>
                        )}

                        {creditCards.length > 0 && (
                          <>
                            <div className="text-[10px] font-display uppercase tracking-[0.2em] opacity-40 px-4 py-2 mt-2">
                              Credit Cards
                            </div>
                            {creditCards.map((cc) => (
                              <button
                                key={cc.id}
                                className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-display hover:bg-navi-surface/50 transition-colors"
                                onClick={() => {
                                  dispatch({ type: "SET_FIELD", field: "toType", value: "credit" });
                                  dispatch({ type: "SET_FIELD", field: "toId", value: cc.id });
                                  setToOpen(false);
                                }}
                              >
                                {cc.name}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <TransactionForm
              mode="income"
              amount={state.amount}
              onAmountChange={(val) => dispatch({ type: "SET_FIELD", field: "amount", value: val })}
              description={state.description}
              onDescriptionChange={(val) =>
                dispatch({ type: "SET_FIELD", field: "description", value: val })
              }
              hideDescription={true}
              date={state.date}
              onDateChange={(val) => dispatch({ type: "SET_FIELD", field: "date", value: val })}
              status="paid"
              onStatusChange={() => {}}
              isRecurrent={false}
              onRecurrentChange={() => {}}
            />

            {isOverBalance && (
              <div className="mx-2 p-4 rounded-card bg-navi-danger/10 border border-navi-danger/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="size-5 text-navi-danger shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-display font-medium text-navi-danger uppercase tracking-tight">
                    Insufficient Funds
                  </p>
                  <p className="text-[11px] font-sans text-navi-danger/70 leading-relaxed">
                    You only have {(sourceBalance / 100).toFixed(2)}€ available in your{" "}
                    {state.fromType === "main" ? "main account" : "savings account"}.
                  </p>
                </div>
              </div>
            )}
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
              className={cn(
                "h-16 rounded-full font-display font-medium uppercase tracking-[0.2em] shadow-[0_20px_40px_-15px_rgba(8,59,58,0.3)] transition-all",
                isOverBalance
                  ? "bg-navi-gray/20 text-navi-gray/40 cursor-not-allowed"
                  : "bg-navi-dark text-white hover:opacity-95 active:scale-[0.98]",
              )}
              onClick={handleSave}
              disabled={
                saving ||
                !state.amount ||
                isOverBalance ||
                (state.fromType === state.toType && state.fromId === state.toId)
              }
            >
              {saving ? (
                <span className="animate-pulse">Syncing...</span>
              ) : (
                <>
                  <Plus className="size-5" />
                  <span>Confirm</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
