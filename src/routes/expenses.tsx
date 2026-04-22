import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExpensesContent } from "@/expenses-content";
import { useRequireAuth } from "@/hooks/use-auth-guard";
import { getDashboardData } from "../actions";

export const Route = createFileRoute("/expenses")({
  loader: () => getDashboardData(),
  head: () => ({
    meta: [
      { title: "Expenses | Aftermind" },
      { name: "description", content: "Track and manage your outgoing expenses." },
    ],
  }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const { user, loading } = useRequireAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardData(),
    enabled: !!user,
  });

  if (loading) return <div className="p-8 text-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (isLoading) return <div className="p-8 text-foreground">Loading Expenses...</div>;
  if (!data) return null;

  return <ExpensesContent data={data} />;
}
