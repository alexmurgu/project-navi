import React from "react";
import { Calendar as CalendarIcon, Check, Clock, CreditCard, FileText, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getTransactionSuggestions } from "@/actions";
import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface TransactionFormProps {
  mode: "expense" | "income";
  amount: string;
  onAmountChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  date: Date | undefined;
  onDateChange: (val: Date | undefined) => void;
  status: "pending" | "paid";
  onStatusChange: (val: "pending" | "paid") => void;
  isRecurrent: boolean;
  onRecurrentChange: (val: boolean) => void;
  onSuggestionSelect?: (suggestion: any) => void;
  creditCards?: any[];
  accountType?: "main" | "credit";
  onAccountTypeChange?: (val: "main" | "credit") => void;
  accountId?: string | null;
  onAccountIdChange?: (val: string | null) => void;
  hideDescription?: boolean;
  categoryPickerNode?: React.ReactNode;
}

export function TransactionForm({
  mode,
  amount,
  onAmountChange,
  description,
  onDescriptionChange,
  date,
  onDateChange,
  status,
  onStatusChange,
  isRecurrent,
  onRecurrentChange,
  onSuggestionSelect,
  creditCards = [],
  accountType = "main",
  onAccountTypeChange,
  accountId,
  onAccountIdChange,
  hideDescription = false,
  categoryPickerNode,
}: TransactionFormProps) {
  const showStatus = mode === "expense" && isRecurrent;

  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [openDatePicker, setOpenDatePicker] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: suggestions } = useQuery({
    queryKey: ["suggestions", description],
    queryFn: () => getTransactionSuggestions({ data: description }),
    enabled: description.length >= 2 && showSuggestions,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAmountChange = (raw: string) => {
    let val = raw.replace(",", ".");
    if (!val) {
      onAmountChange("");
      return;
    }
    val = val.replace(/[^0-9.]/g, "");
    const parts = val.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) {
      val = `${parts[0]}.${parts[1].slice(0, 2)}`;
    }
    onAmountChange(val);
  };

  return (
    <div className="space-y-8">
      {/* Description */}
      {!hideDescription && (
        <div className="space-y-3" ref={containerRef}>
          <Label
            htmlFor="description"
            className="ml-1 text-[11px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60"
          >
            Description
          </Label>
          <div className="relative">
            <FileText
              className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-navi-gray/40"
              strokeWidth={1}
            />
            <Input
              id="description"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => {
                onDescriptionChange(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="h-14 rounded-2xl border-none bg-navi-surface px-12 font-display font-medium text-navi-dark shadow-sm"
              autoComplete="off"
            />
            {showSuggestions && suggestions && suggestions.length > 0 && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full z-50 bg-white rounded-2xl shadow-xl border border-navi-surface p-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <ul className="max-h-[200px] overflow-auto">
                  {suggestions.map((suggestion, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-navi-surface/50 transition-colors flex flex-col gap-1"
                        onClick={() => {
                          onDescriptionChange(suggestion.description);
                          if (onSuggestionSelect) {
                            onSuggestionSelect(suggestion);
                          }
                          setShowSuggestions(false);
                        }}
                      >
                        <span className="font-display font-medium text-navi-dark text-sm block truncate">
                          {suggestion.description}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-navi-gray/60 font-black">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full border",
                              suggestion.type === "expense"
                                ? "bg-navi-dark/5 border-navi-dark/10"
                                : "bg-navi-teal/5 border-navi-teal/10",
                            )}
                          >
                            {suggestion.category}
                          </span>
                          <span>•</span>
                          <span>
                            {(suggestion.amount / 100).toLocaleString("en-IE", {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Picker inserted here between description and amount fields */}
      {categoryPickerNode}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Amount Input */}
        <div className="space-y-4">
          <Label
            htmlFor="amount"
            className="ml-1 text-[11px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60"
          >
            Transaction Amount
          </Label>
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 text-navi-gray/40 group-focus-within:text-navi-dark transition-colors">
              <CreditCard className="size-4" strokeWidth={1} />
              <span className="text-[15px] font-display font-medium">€</span>
            </div>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="h-14 rounded-2xl border-none bg-navi-surface pl-[72px] pr-5 font-display font-medium text-navi-dark shadow-sm placeholder:text-navi-gray/40 focus-visible:ring-2 focus-visible:ring-navi-dark/5"
            />
          </div>
        </div>

        {/* Date Picker */}
        <div className="space-y-3">
          <Label
            htmlFor="date-picker"
            className="ml-1 text-[11px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60"
          >
            Occurrence
          </Label>
          {!mounted ? (
            <button
              id="date-picker"
              type="button"
              className="w-full h-14 rounded-2xl bg-navi-surface flex items-center px-5 gap-4 text-navi-dark hover:bg-white/50 transition-colors shadow-sm"
            >
              <CalendarIcon className="size-4 text-navi-gray/40" strokeWidth={1} />
              <span className="font-display font-medium text-[15px]">
                {date ? format(date, "PPP") : "Select date"}
              </span>
            </button>
          ) : isMobile ? (
            <Sheet open={openDatePicker} onOpenChange={setOpenDatePicker}>
              <SheetTrigger
                render={
                  <button
                    id="date-picker"
                    type="button"
                    className="w-full h-14 rounded-2xl bg-navi-surface flex items-center px-5 gap-4 text-navi-dark hover:bg-white/50 transition-colors shadow-sm"
                  >
                    <CalendarIcon className="size-4 text-navi-gray/40" strokeWidth={1} />
                    <span className="font-display font-medium text-[15px]">
                      {date ? format(date, "PPP") : "Select date"}
                    </span>
                  </button>
                }
              />
              <SheetContent
                side="bottom"
                className="rounded-t-[40px] border-none px-6 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-4 bg-white flex flex-col max-h-[85dvh] z-[100]"
                showCloseButton={false}
              >
                {/* iOS Native Pull Handle */}
                <div className="mx-auto w-12 h-1.5 rounded-full bg-navi-border/30 mb-6 shrink-0" />

                <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                  <h3 className="text-lg font-display font-medium text-navi-dark uppercase tracking-wider">
                    Select Date
                  </h3>
                  <button
                    type="button"
                    onClick={() => setOpenDatePicker(false)}
                    className="text-xs font-display font-medium uppercase tracking-widest text-navi-gray/60 hover:text-navi-dark px-2 py-1"
                  >
                    Done
                  </button>
                </div>

                <div className="flex-1 flex justify-center items-center py-4 overflow-y-auto min-h-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      onDateChange(selectedDate);
                      setOpenDatePicker(false);
                    }}
                    defaultMonth={date || new Date()}
                    autoFocus
                    className="p-4 bg-transparent border-none scale-105"
                  />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    id="date-picker"
                    type="button"
                    className="w-full h-14 rounded-2xl bg-navi-surface flex items-center px-5 gap-4 text-navi-dark hover:bg-white/50 transition-colors shadow-sm"
                  >
                    <CalendarIcon className="size-4 text-navi-gray/40" strokeWidth={1} />
                    <span className="font-display font-medium text-[15px]">
                      {date ? format(date, "PPP") : "Select date"}
                    </span>
                  </button>
                }
              />
              <PopoverContent
                className="w-auto p-0 rounded-3xl overflow-hidden border-none shadow-2xl z-[100]"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={onDateChange}
                  defaultMonth={date || new Date()}
                  autoFocus
                  className="p-4"
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Account Selection */}
      {mode === "expense" && (
        <div className="space-y-4 pt-2">
          <Label className="ml-1 text-[11px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60 px-2">
            Payment Source
          </Label>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                onAccountTypeChange?.("main");
                onAccountIdChange?.(null);
              }}
              className={cn(
                "flex items-center gap-4 h-14 w-full rounded-2xl border px-5 transition-all active:scale-[0.98]",
                accountType === "main"
                  ? "bg-navi-dark border-navi-dark text-white shadow-lg shadow-navi-dark/20"
                  : "bg-navi-surface border-transparent text-navi-dark hover:bg-white/50",
              )}
            >
              <div
                className={cn(
                  "size-7 rounded-full flex items-center justify-center",
                  accountType === "main" ? "bg-white/20" : "bg-white shadow-sm",
                )}
              >
                <div className="size-2 rounded-full bg-navi-dark" />
              </div>
              <span className="text-sm font-display font-medium uppercase tracking-widest">
                Main Balance
              </span>
            </button>

            {creditCards.map((cc) => (
              <button
                key={cc.id}
                type="button"
                onClick={() => {
                  onAccountTypeChange?.("credit");
                  onAccountIdChange?.(cc.id);
                }}
                className={cn(
                  "flex items-center gap-4 h-14 w-full rounded-2xl border px-5 transition-all active:scale-[0.98]",
                  accountType === "credit" && accountId === cc.id
                    ? "bg-navi-dark border-navi-dark text-white shadow-lg shadow-navi-dark/20"
                    : "bg-navi-surface border-transparent text-navi-dark hover:bg-white/50",
                )}
              >
                <div
                  className={cn(
                    "size-7 rounded-full flex items-center justify-center",
                    accountType === "credit" && accountId === cc.id
                      ? "bg-white/20"
                      : "bg-white shadow-sm",
                  )}
                >
                  <div className="size-2 rounded-full" style={{ backgroundColor: cc.color }} />
                </div>
                <span className="text-sm font-display font-medium uppercase tracking-widest">
                  {cc.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recurrent Toggle */}
      {mode === "expense" && (
        <div className="space-y-4 pt-2">
          <Label
            id="recurrent-status-label"
            className="ml-1 text-[11px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60"
          >
            Recurrence
          </Label>
          <button
            type="button"
            onClick={() => onRecurrentChange(!isRecurrent)}
            className={cn(
              "flex items-center justify-center gap-3 h-14 w-full rounded-2xl border transition-all active:scale-[0.98]",
              isRecurrent
                ? "bg-navi-dark border-navi-dark text-white shadow-lg shadow-navi-dark/20"
                : "bg-navi-surface border-transparent text-navi-dark hover:bg-white/50",
            )}
          >
            <div
              className={cn(
                "size-7 rounded-full flex items-center justify-center",
                isRecurrent ? "bg-white/20" : "bg-white shadow-sm",
              )}
            >
              <Repeat className="size-4" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-display font-medium uppercase tracking-widest">
              Recurring Expense
            </span>
          </button>
        </div>
      )}

      {/* Status Toggle */}
      {showStatus && (
        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
          <Label
            id="payment-status-label"
            className="ml-1 text-[11px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60"
          >
            Payment Status
          </Label>
          <div
            className="grid grid-cols-2 gap-3"
            role="group"
            aria-labelledby="payment-status-label"
          >
            <button
              type="button"
              onClick={() => onStatusChange("paid")}
              className={cn(
                "flex items-center justify-center gap-3 h-14 rounded-2xl border transition-all active:scale-[0.98]",
                status === "paid"
                  ? "bg-navi-teal border-navi-teal text-white shadow-lg shadow-navi-teal/20"
                  : "bg-navi-surface border-transparent text-navi-dark hover:bg-white/50",
              )}
            >
              <div
                className={cn(
                  "size-7 rounded-full flex items-center justify-center",
                  status === "paid" ? "bg-white/20" : "bg-white shadow-sm",
                )}
              >
                <Check className="size-4" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-display font-medium uppercase tracking-widest">
                Settled
              </span>
            </button>

            <button
              type="button"
              onClick={() => onStatusChange("pending")}
              className={cn(
                "flex items-center justify-center gap-3 h-14 rounded-2xl border transition-all active:scale-[0.98]",
                status === "pending"
                  ? "bg-navi-warning border-navi-warning text-white shadow-lg shadow-navi-warning/20"
                  : "bg-navi-surface border-transparent text-navi-dark hover:bg-white/50",
              )}
            >
              <div
                className={cn(
                  "size-7 rounded-full flex items-center justify-center",
                  status === "pending" ? "bg-white/20" : "bg-white shadow-sm",
                )}
              >
                <Clock className="size-4" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-display font-medium uppercase tracking-widest">
                Pending
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
