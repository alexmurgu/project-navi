import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UsersContent } from "@/settings-pages/users-content";

import { getAdminUsers } from "@/actions";

export const Route = createFileRoute("/settings/users")({
  loader: () => getAdminUsers(),
  component: SettingsUsersPage,
});

function SettingsUsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => getAdminUsers(),
  });

  if (isLoading) return <div className="p-8 text-foreground">Loading...</div>;
  if (!users) return null;

  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";

  return <UsersContent allUsers={users} adminEmail={adminEmail} />;
}
