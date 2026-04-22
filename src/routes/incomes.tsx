import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IncomesContent } from "@/incomes-content";
import { useRequireAuth } from "@/hooks/use-auth-guard";
import { getDashboardData } from "../actions";

export const Route = createFileRoute("/incomes")({
  loader: () => getDashboardData(),
  head: () => ({
    meta: [
      { title: "Incomes | Aftermind" },
      { name: "description", content: "Track and manage your incoming revenue." },
    ],
  }),
  component: IncomesPage,
});

function IncomesPage() {
  const { user, loading } = useRequireAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardData(),
    enabled: !!user,
  });

  if (loading) return <div className="p-8 text-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (isLoading) return <div className="p-8 text-foreground">Loading Incomes...</div>;
  if (!data) return null;

  return <IncomesContent data={data} />;
}
