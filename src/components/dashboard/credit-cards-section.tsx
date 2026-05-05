import React from "react";
import { Plus, CreditCard as CreditCardIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CreditCard {
  id: string;
  name: string;
  color: string;
  limit: number | null;
  currentBalance: number;
}

interface CreditCardsSectionProps {
  cards: CreditCard[];
  onEditCard: (card: CreditCard) => void;
  formatCurrency: (amount: number) => string;
}

export function CreditCardsSection({ cards, onEditCard, formatCurrency }: CreditCardsSectionProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between px-1">
        <div className="space-y-1">
          <h3 className="text-[10px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60">
            Credit Management
          </h3>
          <p className="text-[20px] font-display font-medium text-navi-dark italic">
            Debt & Utilization
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-full px-3 text-[10px] font-display font-medium uppercase tracking-widest text-navi-gray/60 hover:text-navi-dark hover:bg-navi-surface transition-all"
          onClick={() => (window as any).dispatchEvent(new CustomEvent("open-add-credit-card"))}
        >
          <Plus className="size-3 mr-1.5" strokeWidth={2.5} />
          <span>New Card</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.length === 0 ? (
          <div className="col-span-full py-12 rounded-[32px] border-2 border-dashed border-navi-border/20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="size-12 rounded-full bg-navi-surface flex items-center justify-center">
              <CreditCardIcon className="size-6 text-navi-gray/40" strokeWidth={1.5} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-display font-medium text-navi-dark uppercase tracking-tight">
                No credit cards tracked
              </p>
              <p className="text-[11px] font-sans text-navi-gray/60 max-w-[200px]">
                Add your credit cards to track debt and payments.
              </p>
            </div>
          </div>
        ) : (
          cards.map((card) => {
            const utilization = card.limit ? (card.currentBalance / card.limit) * 100 : null;
            const isHighUtilization = utilization !== null && utilization > 80;

            return (
              <button
                key={card.id}
                onClick={() => onEditCard(card)}
                className="group relative flex flex-col p-6 rounded-[32px] bg-navi-surface/30 border border-navi-border/10 hover:bg-white hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 text-left overflow-hidden"
              >
                <div 
                  className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full opacity-[0.03] transition-transform duration-700 group-hover:scale-150 group-hover:rotate-12"
                  style={{ backgroundColor: card.color }}
                />

                <div className="flex items-start justify-between relative mb-8">
                  <div className="flex items-center gap-3">
                    <div 
                      className="size-10 rounded-2xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: card.color }}
                    >
                      <CreditCardIcon className="size-5 text-white" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="text-sm font-display font-medium text-navi-dark uppercase tracking-tight">
                        {card.name}
                      </h4>
                      <p className="text-[10px] font-sans text-navi-gray/60 uppercase tracking-widest font-black">
                        Current Debt
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto space-y-4">
                  <div className="flex items-baseline justify-between">
                    <p className="text-[24px] font-display font-medium text-navi-dark tracking-tight">
                      {formatCurrency(card.currentBalance)}
                    </p>
                    {utilization !== null && (
                      <span className={cn(
                        "text-[10px] font-display font-medium uppercase tracking-widest",
                        isHighUtilization ? "text-navi-danger" : "text-navi-gray/40"
                      )}>
                        {utilization.toFixed(0)}% Use
                      </span>
                    )}
                  </div>

                  {card.limit && (
                    <div className="space-y-2">
                      <div className="h-1.5 w-full bg-navi-border/10 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-1000 ease-out",
                            isHighUtilization ? "bg-navi-danger" : ""
                          )}
                          style={{ 
                            width: `${Math.min(utilization || 0, 100)}%`,
                            backgroundColor: isHighUtilization ? undefined : card.color 
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-sans font-medium uppercase tracking-[0.15em] text-navi-gray/40">
                        <span>Available: {formatCurrency(card.limit - card.currentBalance)}</span>
                        <span>Limit: {formatCurrency(card.limit)}</span>
                      </div>
                    </div>
                  )}

                  {isHighUtilization && (
                    <div className="pt-1 flex items-center gap-1.5 text-navi-danger">
                      <AlertCircle className="size-3" />
                      <span className="text-[9px] font-display font-medium uppercase tracking-wider">High Utilization</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
