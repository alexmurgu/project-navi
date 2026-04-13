import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CategoriesContent } from "@/admin/categories-content";
import { useAuthStore } from "../../store/useAuthStore";
import type { CategoryConfig } from "@/lib/category-visuals";
import { getDashboardData } from "../../actions";

export const Route = createFileRoute("/admin/categories")({
  loader: () => getDashboardData(),
  component: AdminCategories,
});

function AdminCategories() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardData(),
    enabled: !!user,
  });

  if (!user) return <Navigate to="/login" replace />;
  if (isLoading) return <div className="p-8 text-foreground">Loading...</div>;
  if (!data) return null;

  const configMap: Record<string, CategoryConfig> = {};
  data.categoryConfigs.forEach((c: any) => {
    configMap[c.name] = c;
  });

  return (
    <CategoriesContent
      expenseCategories={data.expenseCategories}
      incomeCategories={data.incomeCategories}
      configMap={configMap}
    />
  );
}
