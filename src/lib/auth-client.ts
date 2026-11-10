import { createAuthClient } from "better-auth/react";
import { useAuthStore } from "@/store/useAuthStore";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
});

/**
 * Signs out and lands on the login page with a full reload, so no cached
 * session, query data or open sheet survives into the next user's session.
 */
export async function signOut() {
  try {
    await authClient.signOut();
  } catch (error) {
    console.error("Sign out failed:", error);
  } finally {
    useAuthStore.getState().clear();
    window.location.href = "/login";
  }
}
