import { createFileRoute } from "@tanstack/react-router";
import { AccountActivityContent } from "@/account-activity-content";
import { validateMonthSearch } from "@/lib/month-param";
import { loadDashboard, useDashboardData } from "@/lib/queries";

export const Route = createFileRoute("/accounts/$accountId")({
  validateSearch: validateMonthSearch,
  loader: ({ context }) => loadDashboard(context.queryClient),
  component: AccountActivityPage,
});

function AccountActivityPage() {
  const { accountId } = Route.useParams();
  const data = useDashboardData(Route.useLoaderData());

  // Find the account in either credit cards or savings accounts
  const account =
    data.creditCards.find((cc: any) => cc.id === accountId) ||
    data.savingsAccounts.find((sa: any) => sa.id === accountId);

  if (!account) {
    return (
      <div className="p-8 text-foreground font-display uppercase tracking-widest text-[10px]">
        Account not found
      </div>
    );
  }

  const type = data.creditCards.some((cc: any) => cc.id === accountId) ? "credit" : "savings";

  return <AccountActivityContent data={data} account={{ ...account, type }} />;
}
