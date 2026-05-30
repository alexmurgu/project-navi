import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AccountActivityContent } from "@/account-activity-content";
import { useRequireAuth } from "@/hooks/use-auth-guard";
import { getDashboardData } from "../actions";

export const Route = createFileRoute("/accounts/$accountId")({
  loader: () => getDashboardData(),
  component: AccountActivityPage,
});

function AccountActivityPage() {
  const { accountId } = Route.useParams();
  const { user, loading } = useRequireAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardData(),
    enabled: !!user,
  });

  if (loading)
    return (
      <div className="p-8 text-foreground font-display uppercase tracking-widest text-[10px]">
        Authenticating...
      </div>
    );
  if (isLoading)
    return (
      <div className="p-8 text-foreground font-display uppercase tracking-widest text-[10px]">
        Loading Activity...
      </div>
    );
  if (!data) return null;

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

  // Determine type
  const type = data.creditCards.some((cc: any) => cc.id === accountId) ? "credit" : "savings";

  return <AccountActivityContent data={data} account={{ ...account, type }} />;
}
