import { create } from "zustand";
import { fetchSession } from "@/actions";

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
      const data = await fetchSession();
      set({
        user: data?.user ?? null,
        session: data?.session ?? null,
        loading: false,
      });
    } catch {
      set({ user: null, session: null, loading: false });
    }
  },
}));
