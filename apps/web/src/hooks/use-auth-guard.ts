import { useAuthStore } from "@/store/useAuthStore";

export function useRequireAuth() {
  const { user, loading } = useAuthStore();

  return { user, loading };
}

export function useRedirectIfAuthed() {
  const { user, loading } = useAuthStore();

  return { user, loading };
}
