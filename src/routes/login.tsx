import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useReducer } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "../store/useAuthStore";
import { useRedirectIfAuthed } from "@/hooks/use-auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login | Aftermind" },
      { name: "description", content: "Sign in to your Aftermind account." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { user, loading } = useRedirectIfAuthed();
  const { fetchSession } = useAuthStore();
  const [state, setState] = useReducer(
    (
      current: {
        email: string;
        password: string;
        loading: boolean;
        error: string;
        showPassword: boolean;
      },
      updates: Partial<{
        email: string;
        password: string;
        loading: boolean;
        error: string;
        showPassword: boolean;
      }>,
    ) => ({ ...current, ...updates }),
    {
      email: "",
      password: "",
      loading: false,
      error: "",
      showPassword: false,
    },
  );

  if (loading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.14),transparent_28%),linear-gradient(180deg,rgba(248,251,251,1)_0%,rgba(241,249,248,1)_100%)] px-4 py-10 text-foreground">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-24 -bottom-32 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#083B3A] shadow-lg">
          <img src="/icon.svg" alt="Navi" className="h-9 w-9" />
        </div>
      </main>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState({ loading: true, error: "" });

    try {
      const { error: authError } = await authClient.signIn.email({
        email: state.email,
        password: state.password,
      });

      if (authError) {
        setState({ error: authError.message || "Invalid email or password", loading: false });
      } else {
        await fetchSession();
        navigate({ to: "/" });
      }
    } catch {
      setState({ error: "An unexpected error occurred", loading: false });
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.14),transparent_28%),linear-gradient(180deg,rgba(248,251,251,1)_0%,rgba(241,249,248,1)_100%)] px-4 py-10 text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-24 -bottom-32 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-4xl border border-border/70 bg-white/80 p-6 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
        <div className="mb-8 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#083B3A] shadow-sm">
            <img src="/icon.svg" alt="Navi" className="h-9 w-9" />
          </div>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Sign in</h1>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={state.email}
                onChange={(e) => setState({ email: e.target.value })}
                className="h-12 rounded-2xl border-border/80 bg-white/90 pl-10 shadow-none"
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={state.showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={state.password}
                onChange={(e) => setState({ password: e.target.value })}
                className="h-12 rounded-2xl border-border/80 bg-white/90 pl-10 pr-12 shadow-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setState({ showPassword: !state.showPassword })}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={state.showPassword ? "Hide password" : "Show password"}
              >
                {state.showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {state.error && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm font-medium text-destructive">
              {state.error}
            </div>
          )}

          <Button
            type="submit"
            disabled={state.loading}
            className="mt-2 h-12 w-full rounded-2xl text-base shadow-[0_18px_40px_-24px_rgba(8,59,58,0.45)]"
          >
            <span className="flex items-center gap-2">
              {state.loading ? "Signing in" : "Sign in"}
              {!state.loading && <ArrowRight className="size-4" />}
            </span>
          </Button>
        </form>
      </div>
    </main>
  );
}
