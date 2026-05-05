import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/actions";
import { SavingsSettingsContent } from "@/settings-pages/savings-content";

export const Route = createFileRoute("/settings/savings")({
  loader: () => getDashboardData(),
  component: SettingsSavingsPage,
});

function SettingsSavingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardData(),
  });

  if (isLoading) return <div className="p-8 text-foreground">Loading...</div>;
  if (!data) return null;

  return <SavingsSettingsContent accounts={data.savingsAccounts} />;
}
