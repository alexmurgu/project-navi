import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { OverviewContent } from "@/overview-content";
import { useRequireAuth } from "@/hooks/use-auth-guard";
import { validateMonthSearch } from "@/lib/month-param";
import { getDashboardData } from "../actions";

export const Route = createFileRoute("/categories/$category")({
  validateSearch: validateMonthSearch,
  loader: async ({ params }) => {
    return { category: params.category };
  },
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
  const { user, loading } = useRequireAuth();
  const { category } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardData(),
    enabled: !!user,
  });

  if (loading) return <div className="p-8 text-foreground">Loading...</div>;
  if (isLoading) return <div className="p-8 text-foreground">Loading Category Overview...</div>;
  if (!data) return null;

  return <OverviewContent data={data} mode={{ type: "category", category }} />;
}
