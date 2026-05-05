import React, { useState } from "react";
import { Plus, PiggyBank, Target, ArrowLeft, ChevronRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addSavingsAccount, updateSavingsAccount, deleteSavingsAccount } from "@/actions";
import { withAlpha } from "@/lib/category-visuals";
import { SavingsAccountSheet } from "@/components/savings-account-sheet";
import { Link } from "@tanstack/react-router";

interface SavingsAccount {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  targetAmount: number | null;
  currentBalance: number;
}

interface SavingsSettingsContentProps {
  accounts: SavingsAccount[];
}

export function SavingsSettingsContent({ accounts }: SavingsSettingsContentProps) {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SavingsAccount | null>(null);

  const addMutation = useMutation({
    mutationFn: (d: any) => addSavingsAccount({ data: d }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSheetOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => updateSavingsAccount({ data: d }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSheetOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSavingsAccount({ data: id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSheetOpen(false);
    },
  });

  const handleAdd = () => {
    setEditingAccount(null);
    setSheetOpen(true);
  };

  const handleEdit = (account: SavingsAccount) => {
    setEditingAccount(account);
    setSheetOpen(true);
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-white antialiased">
      {/* Header */}
      <section className="bg-navi-dark pt-16 pb-20 px-6 md:px-12 flex flex-col gap-4 relative overflow-hidden text-white">
        <div className="space-y-4 relative z-10">
          <Link 
            to="/settings" 
            className="flex items-center gap-2 text-[10px] font-display font-medium uppercase tracking-[0.2em] opacity-50 hover:opacity-100 transition-opacity mb-4"
          >
            <ArrowLeft className="size-3" />
            Back to Settings
          </Link>
          <p className="text-[12px] font-display font-medium uppercase tracking-[0.25em] opacity-50">
            Financial Targets
          </p>
          <h1 className="text-[64px] md:text-[80px] font-display font-medium leading-[0.9] tracking-[-0.04em]">
            Savings Goals
          </h1>
        </div>
      </section>

      <div className="p-6 md:p-12 space-y-12">
        {/* Action Card */}
        <section className="space-y-6">
          <button 
            onClick={handleAdd}
            className="w-full navi-card p-8 border-2 border-dashed border-navi-border/20 flex flex-col items-center justify-center gap-4 group hover:border-navi-dark/20 transition-all bg-navi-surface/30"
          >
            <div className="size-14 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform group-hover:scale-110">
              <Plus className="size-6 text-navi-dark" />
            </div>
            <div className="text-center">
              <h3 className="text-[20px] font-display font-medium text-navi-dark">Create New Goal</h3>
              <p className="text-[11px] font-sans font-medium uppercase tracking-widest text-navi-gray/60 mt-1">Set a new target to save for</p>
            </div>
          </button>
        </section>

        {/* Existing Goals */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 px-2">
            <div className="h-1.5 w-8 bg-navi-blue rounded-full" />
            <h3 className="text-[20px] font-display font-medium uppercase tracking-widest text-navi-dark/40">
              Active Targets
            </h3>
          </div>

          <div className="grid gap-4">
            {accounts.map((sa) => (
              <button
                key={sa.id}
                onClick={() => handleEdit(sa)}
                className="navi-card flex items-center justify-between p-6 text-left group"
              >
                <div className="flex items-center gap-6">
                  <div
                    className="size-14 rounded-[18px] flex items-center justify-center border transition-colors"
                    style={{
                      backgroundColor: withAlpha(sa.color, 0.05),
                      borderColor: withAlpha(sa.color, 0.1),
                    }}
                  >
                    <PiggyBank className="size-6" style={{ color: sa.color }} strokeWidth={1.2} />
                  </div>
                  <div>
                    <h4 className="text-[18px] font-display font-medium text-navi-dark tracking-tight">
                      {sa.name}
                    </h4>
                    {sa.targetAmount && (
                      <div className="flex items-center gap-2 mt-1 opacity-60">
                        <Target className="size-3" />
                        <p className="text-[10px] font-sans font-medium uppercase tracking-widest text-navi-gray/60">
                          Target: {(sa.targetAmount / 100).toFixed(2)}€
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[16px] font-display font-medium text-navi-dark">
                      {(sa.currentBalance / 100).toFixed(2)}€
                    </p>
                    <p className="text-[9px] font-sans font-medium uppercase tracking-widest text-navi-gray/40">Saved</p>
                  </div>
                  <ChevronRight className="size-5 text-navi-gray/30 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}

            {accounts.length === 0 && (
              <div className="p-12 text-center text-navi-gray/30">
                <p className="font-display font-medium uppercase tracking-widest text-[11px]">No active goals yet</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <SavingsAccountSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editingItem={editingAccount}
        onSubmit={(d) => {
          if (editingAccount) {
            updateMutation.mutate(d);
          } else {
            addMutation.mutate(d);
          }
        }}
        onDelete={(id) => deleteMutation.mutate(id)}
        saving={addMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
