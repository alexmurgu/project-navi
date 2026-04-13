import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { OverviewContent } from "@/overview-content";
import { useRequireAuth } from "@/hooks/use-auth-guard";
import { getDashboardData } from "../actions";

export const Route = createFileRoute("/categories/$category")({
  head: () => ({
    meta: [
      { title: "Category Overview | Aftermind" },
      { name: "description", content: "View all spending and income for a category." },
    ],
  }),
  loader: () => getDashboardData(),
  component: CategoryOverviewPage,
});

function CategoryOverviewPage() {
  const { user, loading } = useRequireAuth();
  const { category } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardData(),
    enabled: !!user,
  });

  if (loading) return <div className="p-8 text-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (isLoading) return <div className="p-8 text-foreground">Loading Category Overview...</div>;
  if (!data) return null;

  return <OverviewContent data={data} mode={{ type: "category", category }} />;
}
