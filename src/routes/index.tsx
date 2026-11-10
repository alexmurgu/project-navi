import { createFileRoute } from "@tanstack/react-router";
import { DashboardContent } from "@/dashboard-content";
import { validateMonthSearch } from "@/lib/month-param";
import { loadDashboard, useDashboardData } from "@/lib/queries";

export const Route = createFileRoute("/")({
  validateSearch: validateMonthSearch,
  loader: ({ context }) => loadDashboard(context.queryClient),
  head: () => ({
    meta: [
      { title: "Dashboard | Aftermind" },
      {
        name: "description",
        content: "Overview of your financial health and recent transactions.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const data = useDashboardData(Route.useLoaderData());
  return <DashboardContent data={data} />;
}
