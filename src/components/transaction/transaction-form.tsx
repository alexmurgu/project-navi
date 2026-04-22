import React from "react";
import { Calendar as CalendarIcon, Check, Clock, CreditCard, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

interface TransactionFormProps {
  amount: string;
  onAmountChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  date: Date | undefined;
  onDateChange: (val: Date | undefined) => void;
  status: "pending" | "paid";
  onStatusChange: (val: "pending" | "paid") => void;
}

export function TransactionForm({
  amount,
  onAmountChange,
  description,
  onDescriptionChange,
  date,
  onDateChange,
  status,
  onStatusChange,
}: TransactionFormProps) {
  return (
    <div className="space-y-8">
      {/* Amount Input */}
      <div className="space-y-4">
        <Label htmlFor="amount" className="ml-1 text-[11px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60">
          Transaction Amount
        </Label>
        <div className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-navi-dark/30 group-focus-within:text-navi-dark transition-colors">
            <CreditCard className="size-5" strokeWidth={1.2} />
            <span className="text-xl font-display font-medium">€</span>
          </div>
          <Input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="h-20 rounded-[28px] border-none bg-navi-surface pl-16 pr-8 text-4xl font-display font-medium text-navi-dark placeholder:text-navi-gray/20 focus-visible:ring-2 focus-visible:ring-navi-dark/5 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Description */}
        <div className="space-y-3">
          <Label htmlFor="description" className="ml-1 text-[11px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60">
            Reference
          </Label>
          <div className="relative">
            <FileText className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-navi-gray/40" strokeWidth={1} />
            <Input
              id="description"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="h-14 rounded-2xl border-none bg-navi-surface px-12 font-display font-medium text-navi-dark shadow-sm"
            />
          </div>
        </div>

        {/* Date Picker */}
        <div className="space-y-3">
          <Label htmlFor="date-picker" className="ml-1 text-[11px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60">
            Occurrence
          </Label>
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
            <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-none shadow-2xl" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={onDateChange}
                initialFocus
                className="p-4"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Status Toggle */}
      <div className="space-y-4 pt-2">
        <Label id="payment-status-label" className="ml-1 text-[11px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60">
          Payment Status
        </Label>
        <div className="grid grid-cols-2 gap-3" role="group" aria-labelledby="payment-status-label">
          <button
            type="button"
            onClick={() => onStatusChange("paid")}
            className={cn(
              "flex items-center justify-center gap-3 h-14 rounded-2xl border transition-all active:scale-[0.98]",
              status === "paid" 
                ? "bg-navi-teal border-navi-teal text-white shadow-lg shadow-navi-teal/20" 
                : "bg-navi-surface border-transparent text-navi-dark hover:bg-white/50"
            )}
          >
            <div className={cn(
              "size-7 rounded-full flex items-center justify-center",
              status === "paid" ? "bg-white/20" : "bg-white shadow-sm"
            )}>
              <Check className="size-4" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-display font-medium uppercase tracking-widest">Settled</span>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange("pending")}
            className={cn(
              "flex items-center justify-center gap-3 h-14 rounded-2xl border transition-all active:scale-[0.98]",
              status === "pending" 
                ? "bg-navi-warning border-navi-warning text-white shadow-lg shadow-navi-warning/20" 
                : "bg-navi-surface border-transparent text-navi-dark hover:bg-white/50"
            )}
          >
            <div className={cn(
              "size-7 rounded-full flex items-center justify-center",
              status === "pending" ? "bg-white/20" : "bg-white shadow-sm"
            )}>
              <Clock className="size-4" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-display font-medium uppercase tracking-widest">Pending</span>
          </button>
        </div>
      </div>
    </div>
  );
}
