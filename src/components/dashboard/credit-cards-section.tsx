import { CreditCard as CreditCardIcon } from "lucide-react";

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
    <section className="space-y-8">
      <div className="flex flex-col gap-3">
        {cards.length === 0 ? (
          <div className="h-24 rounded-premium border border-dashed border-navi-border/20 flex flex-col items-center justify-center gap-2 text-navi-gray/30 transition-all">
            <CreditCardIcon className="size-5" strokeWidth={1} />
            <p className="font-display font-medium uppercase tracking-widest text-[9px]">
              Manage cards in settings
            </p>
          </div>
        ) : (
          cards.map((card) => {
            const utilization = card.limit
              ? Math.min(100, (card.currentBalance / card.limit) * 100)
              : null;

            return (
              <div
                key={card.id}
                onClick={() => onEditCard(card)}
                className="group cursor-pointer flex flex-col gap-2 py-2 px-1 hover:opacity-60 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: card.color }}
                    />
                    <h4 className="font-display font-medium text-[10px] text-navi-dark/60 uppercase tracking-[0.2em] truncate">
                      {card.name}
                    </h4>
                  </div>
                  <p className="text-[12px] font-display font-medium text-navi-dark/60 tracking-tight">
                    {formatCurrency(-card.currentBalance)}
                  </p>
                </div>

                {card.limit && (
                  <div className="h-[3px] w-full bg-navi-dark/4 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                      style={{
                        width: `${utilization}%`,
                        backgroundColor: card.color,
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
