import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { OverviewContent } from "@/overview-content";
import { useRequireAuth } from "@/hooks/use-auth-guard";
import { getDashboardData } from "../actions";

export const Route = createFileRoute("/members/$memberId")({
  head: () => ({
    meta: [
      { title: "Member Overview | Aftermind" },
      { name: "description", content: "View spending and income by member." },
    ],
  }),
  loader: () => getDashboardData(),
  component: MemberOverviewPage,
});

function MemberOverviewPage() {
  const { user, loading } = useRequireAuth();
  const { memberId } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardData(),
    enabled: !!user,
  });

  if (loading) return <div className="p-8 text-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (isLoading) return <div className="p-8 text-foreground">Loading Member Overview...</div>;
  if (!data) return null;

  return <OverviewContent data={data} mode={{ type: "member", memberId }} />;
}
