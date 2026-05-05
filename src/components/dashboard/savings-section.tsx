import React from "react";
import { PiggyBank } from "lucide-react";

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
  formatCurrency: (amount: number) => string;
}

export function SavingsSection({ accounts, onEditAccount, formatCurrency }: SavingsSectionProps) {
  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-3">
        {accounts.length === 0 ? (
          <div className="h-24 rounded-premium border border-dashed border-navi-border/20 flex flex-col items-center justify-center gap-2 text-navi-gray/30 transition-all">
            <PiggyBank className="size-5" strokeWidth={1} />
            <p className="font-display font-medium uppercase tracking-widest text-[9px]">
              Set your goals in settings
            </p>
          </div>
        ) : (
          accounts.map((sa) => {
            const progress = sa.targetAmount
              ? Math.min(100, (sa.currentBalance / sa.targetAmount) * 100)
              : null;

            return (
              <div
                key={sa.id}
                onClick={() => onEditAccount(sa)}
                className="group cursor-pointer flex flex-col gap-2 py-2 px-1 hover:opacity-60 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full" style={{ backgroundColor: sa.color }} />
                    <h4 className="font-display font-medium text-[10px] text-navi-dark/60 uppercase tracking-[0.2em] truncate">
                      {sa.name}
                    </h4>
                  </div>
                  <p className="text-[12px] font-display font-medium text-navi-dark/60 tracking-tight">
                    {formatCurrency(sa.currentBalance)}
                  </p>
                </div>

                {sa.targetAmount && (
                  <div className="h-[3px] w-full bg-navi-dark/4 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: sa.color,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
