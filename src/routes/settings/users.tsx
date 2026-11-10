import { createFileRoute } from "@tanstack/react-router";
import { UsersContent } from "@/settings-pages/users-content";
import { loadAdminUsers, useAdminUsersData } from "@/lib/queries";

export const Route = createFileRoute("/settings/users")({
  loader: ({ context }) => loadAdminUsers(context.queryClient),
  component: SettingsUsersPage,
});

function SettingsUsersPage() {
  const users = useAdminUsersData(Route.useLoaderData());
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";

  return <UsersContent allUsers={users} adminEmail={adminEmail} />;
}
