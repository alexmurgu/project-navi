import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UsersContent } from "@/admin/users-content";
import { useAuthStore } from "../../store/useAuthStore";
import { getAdminUsers } from "../../actions";

export const Route = createFileRoute("/admin/users")({
  loader: () => getAdminUsers(),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { user } = useAuthStore();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => getAdminUsers(),
    enabled: !!user,
  });

  if (!user) return <Navigate to="/login" replace />;
  if (isLoading) return <div className="p-8 text-foreground">Loading...</div>;
  if (!users) return null;

  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";

  return <UsersContent allUsers={users} adminEmail={adminEmail} currentUserEmail={user.email} />;
}
