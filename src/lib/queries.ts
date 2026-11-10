import { queryOptions, useQuery, type QueryClient } from "@tanstack/react-query";
import { getAdminUsers, getDashboardData } from "@/actions";

/**
 * Shared query definitions. Route loaders prime the cache through
 * `ensureQueryData`, so navigating between tabs renders cached data instantly
 * and refreshes stale data in the background instead of blocking the tap on a
 * server round trip.
 */

export const dashboardQueryOptions = queryOptions({
  queryKey: ["dashboard"],
  queryFn: () => getDashboardData(),
});

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export const adminUsersQueryOptions = queryOptions({
  queryKey: ["admin-users"],
  queryFn: () => getAdminUsers(),
});

export type AdminUsersData = Awaited<ReturnType<typeof getAdminUsers>>;

export function loadDashboard(queryClient: QueryClient) {
  return queryClient.ensureQueryData({ ...dashboardQueryOptions, revalidateIfStale: true });
}

export function loadAdminUsers(queryClient: QueryClient) {
  return queryClient.ensureQueryData({ ...adminUsersQueryOptions, revalidateIfStale: true });
}

/**
 * Live dashboard data for a route whose loader called `loadDashboard`.
 * `loaderData` seeds the cache after SSR hydration, so this never returns
 * undefined and pages never flash a loading state.
 */
export function useDashboardData(loaderData: DashboardData): DashboardData {
  return useQuery({ ...dashboardQueryOptions, initialData: loaderData }).data;
}

export function useAdminUsersData(loaderData: AdminUsersData): AdminUsersData {
  return useQuery({ ...adminUsersQueryOptions, initialData: loaderData }).data;
}
