import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/actions";
import { CreditCardsSettingsContent } from "@/settings-pages/credit-cards-content";

export const Route = createFileRoute("/settings/credit-cards")({
  loader: () => getDashboardData(),
  component: SettingsCreditCardsPage,
});

function SettingsCreditCardsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardData(),
  });

  if (isLoading) return <div className="p-8 text-foreground">Loading...</div>;
  if (!data) return null;

  return <CreditCardsSettingsContent cards={data.creditCards} />;
}
