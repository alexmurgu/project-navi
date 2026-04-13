import { create } from "zustand";
import { authClient } from "@/lib/auth-client";

interface AuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
  fetchSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  fetchSession: async () => {
    try {
      const { data } = await authClient.getSession();
      if (data) {
        set({ user: data.user, session: data.session, loading: false });
      } else {
        set({ user: null, session: null, loading: false });
      }
    } catch {
      set({ user: null, session: null, loading: false });
    }
  },
}));
