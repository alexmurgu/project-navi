import { create } from "zustand";
import { fetchSession } from "@/actions";

type SessionData = Awaited<ReturnType<typeof fetchSession>>;

/** How long a confirmed session is trusted on the client before re-checking. */
const SESSION_TTL_MS = 5 * 60 * 1000;

interface AuthState {
  user: any | null;
  session: any | null;
  /** Epoch ms of the last successful server check, 0 if never checked. */
  checkedAt: number;
  setSession: (data: SessionData) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  checkedAt: 0,
  setSession: (data) =>
    set({
      user: data?.user ?? null,
      session: data?.session ?? null,
      checkedAt: Date.now(),
    }),
  clear: () => set({ user: null, session: null, checkedAt: 0 }),
}));

/**
 * Resolves the current session for route guards.
 *
 * On the server it always asks Better Auth (the store is module-global there
 * and must never be shared between requests). On the client it reuses a recent
 * confirmed session so tab switches do not wait on a network round trip, and
 * keeps a known user signed in when the network blips (e.g. the PWA resuming
 * from background) instead of bouncing them to the error or login screen.
 */
export async function resolveSession({ force = false } = {}): Promise<SessionData> {
  if (typeof window === "undefined") return fetchSession();

  const state = useAuthStore.getState();
  const fresh = Date.now() - state.checkedAt < SESSION_TTL_MS;
  if (!force && state.user && fresh) {
    return { user: state.user, session: state.session } as SessionData;
  }

  try {
    const data = await fetchSession();
    state.setSession(data);
    return data;
  } catch (error) {
    if (state.user) return { user: state.user, session: state.session } as SessionData;
    throw error;
  }
}
