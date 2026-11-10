import { createFileRoute } from "@tanstack/react-router";
import { OverviewContent } from "@/overview-content";
import { validateMonthSearch } from "@/lib/month-param";
import { loadDashboard, useDashboardData } from "@/lib/queries";

export const Route = createFileRoute("/categories/$category")({
  validateSearch: validateMonthSearch,
  loader: async ({ params, context }) => ({
    category: params.category,
    dashboard: await loadDashboard(context.queryClient),
  }),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.category || "Category"} | Categories` },
      {
        name: "description",
        content: `Viewing transactions for ${loaderData?.category || "Category"}`,
      },
    ],
  }),
  component: CategoryOverviewPage,
});

function CategoryOverviewPage() {
  const { category } = Route.useParams();
  const data = useDashboardData(Route.useLoaderData().dashboard);
  return <OverviewContent data={data} mode={{ type: "category", category }} />;
}
