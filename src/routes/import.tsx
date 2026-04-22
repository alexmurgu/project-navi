import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ImportContent } from "@/import-content";
import { useRequireAuth } from "@/hooks/use-auth-guard";
import { getDashboardData } from "../actions";

export const Route = createFileRoute("/import")({
  loader: () => getDashboardData(),
  head: () => ({
    meta: [
      { title: "Import Data | Aftermind" },
      { name: "description", content: "Import your financial data from CSV or other formats." },
    ],
  }),
  component: ImportPage,
});

function ImportPage() {
  const { user, loading } = useRequireAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardData(),
    enabled: !!user,
  });

  if (loading) return <div className="p-8 text-foreground">Loading...</div>;
  if (isLoading) return <div className="p-8 text-foreground">Loading...</div>;
  if (!data) return null;

  return (
    <ImportContent
      users={data.users}
      expenseCategories={data.expenseCategories}
      incomeCategories={data.incomeCategories}
      categoryConfigs={data.categoryConfigs}
      currentUserId={user.id}
    />
  );
}
