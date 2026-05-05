import React from "react";
import { PiggyBank, ArrowRightLeft } from "lucide-react";
import { withAlpha } from "@/lib/category-visuals";

interface SavingsAccount {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  targetAmount: number | null;
  currentBalance: number;
}

interface SavingsSectionProps {
  accounts: SavingsAccount[];
  onEditAccount: (account: SavingsAccount) => void;
  onTransfer: () => void;
  formatCurrency: (amount: number) => string;
}

export function SavingsSection({
  accounts,
  onEditAccount,
  onTransfer,
  formatCurrency,
}: SavingsSectionProps) {
  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[20px] font-display font-medium uppercase tracking-widest text-navi-dark/40">
          Savings Goals
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={onTransfer}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-navi-dark text-white text-[11px] font-display font-medium uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all"
          >
            <ArrowRightLeft className="size-3" />
            Transfer
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {accounts.length === 0 ? (
          <div 
            className="h-24 rounded-premium border border-dashed border-navi-border/20 flex flex-col items-center justify-center gap-2 text-navi-gray/30 transition-all"
          >
            <PiggyBank className="size-5" strokeWidth={1} />
            <p className="font-display font-medium uppercase tracking-widest text-[9px]">Set your goals in settings</p>
          </div>
        ) : (
          accounts.map((sa) => {
            const progress = sa.targetAmount ? Math.min(100, (sa.currentBalance / sa.targetAmount) * 100) : null;
            
            return (
              <div 
                key={sa.id}
                onClick={() => onEditAccount(sa)}
                className="navi-card p-4 flex items-center justify-between group cursor-pointer border-none shadow-none bg-navi-surface/30 hover:bg-navi-surface/50 transition-all rounded-premium"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="size-10 rounded-[14px] flex items-center justify-center border transition-colors shrink-0"
                    style={{
                      backgroundColor: withAlpha(sa.color, 0.05),
                      borderColor: withAlpha(sa.color, 0.1),
                    }}
                  >
                    <PiggyBank className="size-4" style={{ color: sa.color }} strokeWidth={1.2} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-display font-medium text-[15px] text-navi-dark truncate">{sa.name}</h4>
                    {sa.targetAmount && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="h-1 w-20 bg-navi-border/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all duration-1000 ease-out"
                            style={{ 
                              width: `${progress}%`,
                              backgroundColor: sa.color
                            }}
                          />
                        </div>
                        <span className="text-[9px] font-sans font-medium text-navi-gray/40">{Math.round(progress || 0)}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[14px] font-display font-medium text-navi-dark">{formatCurrency(sa.currentBalance)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
