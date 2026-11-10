import { createFileRoute } from "@tanstack/react-router";
import { SavingsSettingsContent } from "@/settings-pages/savings-content";
import { loadDashboard, useDashboardData } from "@/lib/queries";

export const Route = createFileRoute("/settings/savings")({
  loader: ({ context }) => loadDashboard(context.queryClient),
  component: SettingsSavingsPage,
});

function SettingsSavingsPage() {
  const data = useDashboardData(Route.useLoaderData());
  return <SavingsSettingsContent accounts={data.savingsAccounts} />;
}
