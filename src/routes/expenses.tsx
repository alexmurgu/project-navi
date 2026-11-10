import { createFileRoute } from "@tanstack/react-router";
import { ExpensesContent } from "@/expenses-content";
import { validateMonthSearch } from "@/lib/month-param";
import { loadDashboard, useDashboardData } from "@/lib/queries";

export const Route = createFileRoute("/expenses")({
  validateSearch: validateMonthSearch,
  loader: ({ context }) => loadDashboard(context.queryClient),
  head: () => ({
    meta: [
      { title: "Expenses | Aftermind" },
      { name: "description", content: "Track and manage your outgoing expenses." },
    ],
  }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const data = useDashboardData(Route.useLoaderData());
  return <ExpensesContent data={data} />;
}
