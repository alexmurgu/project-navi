import { createFileRoute } from "@tanstack/react-router";
import { CreditCardsSettingsContent } from "@/settings-pages/credit-cards-content";
import { loadDashboard, useDashboardData } from "@/lib/queries";

export const Route = createFileRoute("/settings/credit-cards")({
  loader: ({ context }) => loadDashboard(context.queryClient),
  component: SettingsCreditCardsPage,
});

function SettingsCreditCardsPage() {
  const data = useDashboardData(Route.useLoaderData());
  return <CreditCardsSettingsContent cards={data.creditCards} />;
}
