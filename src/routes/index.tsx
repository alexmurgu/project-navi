import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardContent } from "@/dashboard-content";
import { useRequireAuth } from "@/hooks/use-auth-guard";
import { validateMonthSearch } from "@/lib/month-param";
import { getDashboardData } from "../actions";

export const Route = createFileRoute("/")({
  validateSearch: validateMonthSearch,
  loader: () => getDashboardData(),
  head: () => ({
    meta: [
      { title: "Dashboard | Aftermind" },
      {
        name: "description",
        content: "Overview of your financial health and recent transactions.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useRequireAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardData(),
    enabled: !!user,
  });

  if (loading) return <div className="p-8 text-foreground">Loading...</div>;
  if (isLoading) return <div className="p-8 text-foreground">Loading Dashboard...</div>;
  if (error) return <div className="p-8 text-destructive">Error loading dashboard</div>;
  if (!data) return null;

  return <DashboardContent data={data} />;
}
