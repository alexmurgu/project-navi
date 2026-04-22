import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CategoriesContent } from "@/settings-pages/categories-content";

import type { CategoryConfig } from "@/lib/category-visuals";
import { getDashboardData } from "@/actions";

export const Route = createFileRoute("/settings/categories")({
  loader: () => getDashboardData(),
  component: SettingsCategoriesPage,
});

function SettingsCategoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardData(),
  });

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
