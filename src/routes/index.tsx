import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardContent } from "@/dashboard-content";
import { useRequireAuth } from "@/hooks/use-auth-guard";
import { getDashboardData } from "../actions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Aftermind" },
      {
        name: "description",
        content: "Overview of your financial health and recent transactions.",
      },
    ],
  }),
  loader: () => getDashboardData(),
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
  if (!user) return <Navigate to="/login" replace />;
  if (isLoading) return <div className="p-8 text-foreground">Loading Dashboard...</div>;
  if (error) return <div className="p-8 text-destructive">Error loading dashboard</div>;
  if (!data) return null;

  return <DashboardContent data={data} />;
}
