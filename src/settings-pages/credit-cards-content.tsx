import React, { useState } from "react";
import { Plus, CreditCard, ArrowLeft, ChevronRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addCreditCard, updateCreditCard, deleteCreditCard } from "@/actions";
import { withAlpha } from "@/lib/category-visuals";
import { CreditCardSheet } from "@/components/credit-card-sheet";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface CreditCardType {
  id: string;
  name: string;
  color: string;
  limit: number | null;
  currentBalance: number;
}

interface CreditCardsSettingsContentProps {
  cards: CreditCardType[];
}

export function CreditCardsSettingsContent({ cards }: CreditCardsSettingsContentProps) {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);

  const addMutation = useMutation({
    mutationFn: (d: any) => addCreditCard({ data: d }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSheetOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => updateCreditCard({ data: d }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSheetOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCreditCard({ data: id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSheetOpen(false);
    },
  });

  const handleAdd = () => {
    setEditingCard(null);
    setSheetOpen(true);
  };

  const handleEdit = (card: CreditCardType) => {
    setEditingCard(card);
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
            Debt Management
          </p>
          <h1 className="text-[64px] md:text-[80px] font-display font-medium leading-[0.9] tracking-[-0.04em]">
            Credit Cards
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
              <h3 className="text-[20px] font-display font-medium text-navi-dark">
                Track New Card
              </h3>
              <p className="text-[11px] font-sans font-medium uppercase tracking-widest text-navi-gray/60 mt-1">
                Add a new credit card to monitor
              </p>
            </div>
          </button>
        </section>

        {/* Existing Cards */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 px-2">
            <div className="h-1.5 w-8 bg-navi-danger rounded-full" />
            <h3 className="text-[20px] font-display font-medium uppercase tracking-widest text-navi-dark/40">
              Managed Cards
            </h3>
          </div>

          <div className="grid gap-4">
            {cards.map((card) => {
              const utilization = card.limit ? (card.currentBalance / card.limit) * 100 : null;
              const isHighUtilization = utilization !== null && utilization > 80;

              return (
                <button
                  key={card.id}
                  onClick={() => handleEdit(card)}
                  className="navi-card flex items-center justify-between p-6 text-left group"
                >
                  <div className="flex items-center gap-6">
                    <div
                      className="size-14 rounded-[18px] flex items-center justify-center border transition-colors"
                      style={{
                        backgroundColor: withAlpha(card.color, 0.05),
                        borderColor: withAlpha(card.color, 0.1),
                      }}
                    >
                      <CreditCard
                        className="size-6"
                        style={{ color: card.color }}
                        strokeWidth={1.2}
                      />
                    </div>
                    <div>
                      <h4 className="text-[18px] font-display font-medium text-navi-dark tracking-tight">
                        {card.name}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-[10px] font-sans font-medium uppercase tracking-widest text-navi-gray/60">
                          {card.limit ? `Limit: ${(card.limit / 100).toFixed(0)}€` : "No Limit Set"}
                        </p>
                        {utilization !== null && (
                          <span
                            className={cn(
                              "text-[10px] font-display font-medium uppercase tracking-widest",
                              isHighUtilization ? "text-navi-danger" : "text-navi-gray/40",
                            )}
                          >
                            {utilization.toFixed(0)}% Utilized
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-[16px] font-display font-medium text-navi-dark">
                        -{(card.currentBalance / 100).toFixed(2)}€
                      </p>
                      <p className="text-[9px] font-sans font-medium uppercase tracking-widest text-navi-gray/40">
                        Debt
                      </p>
                    </div>
                    <ChevronRight className="size-5 text-navi-gray/30 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}

            {cards.length === 0 && (
              <div className="p-12 text-center text-navi-gray/30">
                <p className="font-display font-medium uppercase tracking-widest text-[11px]">
                  No cards tracked yet
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <CreditCardSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editingItem={editingCard}
        onSubmit={(d) => {
          if (editingCard) {
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
