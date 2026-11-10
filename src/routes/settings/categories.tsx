import { createFileRoute } from "@tanstack/react-router";
import { CategoriesContent } from "@/settings-pages/categories-content";
import type { CategoryConfig } from "@/lib/category-visuals";
import { loadDashboard, useDashboardData } from "@/lib/queries";

export const Route = createFileRoute("/settings/categories")({
  loader: ({ context }) => loadDashboard(context.queryClient),
  component: SettingsCategoriesPage,
});

function SettingsCategoriesPage() {
  const data = useDashboardData(Route.useLoaderData());

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
