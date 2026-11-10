import { createFileRoute } from "@tanstack/react-router";
import { OverviewContent } from "@/overview-content";
import { validateMonthSearch } from "@/lib/month-param";
import { loadDashboard, useDashboardData } from "@/lib/queries";

export const Route = createFileRoute("/members/$memberId")({
  validateSearch: validateMonthSearch,
  loader: ({ context }) => loadDashboard(context.queryClient),
  head: () => ({
    meta: [
      { title: "Member Overview | Aftermind" },
      { name: "description", content: "View spending and income by member." },
    ],
  }),
  component: MemberOverviewPage,
});

function MemberOverviewPage() {
  const { memberId } = Route.useParams();
  const data = useDashboardData(Route.useLoaderData());
  return <OverviewContent data={data} mode={{ type: "member", memberId }} />;
}
