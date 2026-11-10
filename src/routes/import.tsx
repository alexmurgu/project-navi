import { createFileRoute } from "@tanstack/react-router";
import { ImportContent } from "@/import-content";
import { loadDashboard, useDashboardData } from "@/lib/queries";

export const Route = createFileRoute("/import")({
  loader: ({ context }) => loadDashboard(context.queryClient),
  head: () => ({
    meta: [
      { title: "Import Data | Aftermind" },
      { name: "description", content: "Import your financial data from CSV or other formats." },
    ],
  }),
  component: ImportPage,
});

function ImportPage() {
  const { user } = Route.useRouteContext();
  const data = useDashboardData(Route.useLoaderData());

  return (
    <ImportContent
      users={data.users}
      expenseCategories={data.expenseCategories}
      incomeCategories={data.incomeCategories}
      categoryConfigs={data.categoryConfigs}
      currentUserId={user?.id ?? ""}
    />
  );
}
