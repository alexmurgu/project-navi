import { createFileRoute } from "@tanstack/react-router";
import { IncomesContent } from "@/incomes-content";
import { validateMonthSearch } from "@/lib/month-param";
import { loadDashboard, useDashboardData } from "@/lib/queries";

export const Route = createFileRoute("/incomes")({
  validateSearch: validateMonthSearch,
  loader: ({ context }) => loadDashboard(context.queryClient),
  head: () => ({
    meta: [
      { title: "Incomes | Aftermind" },
      { name: "description", content: "Track and manage your incoming revenue." },
    ],
  }),
  component: IncomesPage,
});

function IncomesPage() {
  const data = useDashboardData(Route.useLoaderData());
  return <IncomesContent data={data} />;
}
