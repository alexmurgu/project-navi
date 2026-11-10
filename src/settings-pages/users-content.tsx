import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, UserPlus, ShieldCheck, Mail, Lock, User as UserIcon, Users } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addAdminUser, deleteAdminUser } from "@/actions";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

interface UsersContentProps {
  allUsers: any[];
  adminEmail: string;
}

export function UsersContent({ allUsers, adminEmail }: UsersContentProps) {
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: (data: any) => addAdminUser({ data }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => deleteAdminUser({ data: id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createUserMutation.mutate({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    e.currentTarget.reset();
  };

  return (
    <div className="w-full min-h-dvh flex flex-col bg-white antialiased">
      {/* High-Impact Header */}
      <section className="bg-navi-dark pt-[calc(env(safe-area-inset-top,0px)+64px)] pb-20 px-6 md:px-12 flex flex-col gap-4 relative overflow-hidden text-white">
        <div className="space-y-4 relative z-10">
          <p className="text-[12px] font-display font-medium uppercase tracking-[0.25em] opacity-50">
            Access Control
          </p>
          <h1 className="text-[64px] md:text-[80px] font-display font-medium leading-[0.9] tracking-[-0.04em]">
            Members
          </h1>
        </div>
      </section>

      <div className="p-6 md:p-12 space-y-20 max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-12 items-start">
          {/* Add Member Section */}
          <section className="lg:col-span-5 space-y-8">
            <div className="flex items-center gap-4 px-2">
              <div className="h-1.5 w-8 bg-navi-blue rounded-full" />
              <h3 className="text-[20px] font-display font-medium uppercase tracking-widest text-navi-dark/40">
                Add Member
              </h3>
            </div>

            <div className="bg-navi-surface p-8 rounded-[32px] border border-navi-border/20">
              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="name"
                    className="ml-1 text-[11px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60"
                  >
                    Full Name
                  </Label>
                  <div className="relative">
                    <UserIcon
                      className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-navi-gray/40"
                      strokeWidth={1}
                    />
                    <Input
                      id="name"
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Maria"
                      className="h-14 rounded-2xl border-none bg-white px-12 font-display font-medium text-navi-dark shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="email"
                    className="ml-1 text-[11px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail
                      className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-navi-gray/40"
                      strokeWidth={1}
                    />
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      required
                      placeholder="maria@example.com"
                      className="h-14 rounded-2xl border-none bg-white px-12 font-display font-medium text-navi-dark shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="password"
                    className="ml-1 text-[11px] font-display font-medium uppercase tracking-[0.2em] text-navi-gray/60"
                  >
                    Access Key
                  </Label>
                  <div className="relative">
                    <Lock
                      className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-navi-gray/40"
                      strokeWidth={1}
                    />
                    <Input
                      id="password"
                      type="password"
                      name="password"
                      required
                      minLength={8}
                      placeholder="••••••••"
                      className="h-14 rounded-2xl border-none bg-white px-12 font-display font-medium text-navi-dark shadow-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="w-full h-16 rounded-full bg-navi-dark text-white font-display font-medium uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  <UserPlus className="size-5 mr-2" strokeWidth={1} />
                  {createUserMutation.isPending ? "Syncing..." : "Create Account"}
                </Button>
              </form>
            </div>
          </section>

          {/* Members List Section */}
          <section className="lg:col-span-7 space-y-8">
            <div className="flex items-center gap-4 px-2">
              <div className="h-1.5 w-8 bg-navi-teal rounded-full" />
              <h3 className="text-[20px] font-display font-medium uppercase tracking-widest text-navi-dark/40">
                Registered
              </h3>
            </div>

            <div className="grid gap-4">
              {/* Joint Family / Shared Profile */}
              <div className="group relative flex items-center justify-between p-6 rounded-premium bg-navi-surface transition-all active:scale-[0.995]">
                <div className="flex items-center gap-6">
                  <div className="size-14 rounded-full flex items-center justify-center bg-white shadow-sm text-navi-blue">
                    <Users className="size-6" strokeWidth={1} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <h4 className="text-[18px] font-display font-medium text-navi-dark tracking-tight truncate">
                        Joint Family
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-navi-teal/10 text-navi-teal text-[9px] font-display font-medium uppercase tracking-widest">
                        Shared
                      </span>
                    </div>
                    <p className="text-[11px] font-display font-medium uppercase tracking-widest text-navi-gray/60 mt-1 truncate">
                      Shared household bills & joint expenses
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Link
                    to="/members/$memberId"
                    params={{ memberId: "family" }}
                    search={(prev: any) => prev}
                    className="h-10 px-4 rounded-full bg-white text-navi-dark border border-navi-border/20 flex items-center justify-center hover:bg-navi-dark hover:text-white transition-all font-display font-medium text-[10px] uppercase tracking-widest shrink-0"
                  >
                    Activity
                  </Link>
                </div>
              </div>

              {allUsers.map((user) => {
                const isAdmin = user.email === adminEmail;
                return (
                  <div
                    key={user.id}
                    className="group relative flex items-center justify-between p-6 rounded-premium bg-navi-surface transition-all active:scale-[0.995]"
                  >
                    <div className="flex items-center gap-6">
                      <div
                        className={cn(
                          "size-14 rounded-full flex items-center justify-center bg-white shadow-sm",
                          isAdmin ? "text-navi-blue" : "text-navi-dark",
                        )}
                      >
                        <UserIcon className="size-6" strokeWidth={1} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <h4 className="text-[18px] font-display font-medium text-navi-dark tracking-tight truncate">
                            {user.name}
                          </h4>
                          {isAdmin && (
                            <span className="px-2 py-0.5 rounded-full bg-navi-blue/10 text-navi-blue text-[9px] font-display font-medium uppercase tracking-widest">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-display font-medium uppercase tracking-widest text-navi-gray/60 mt-1 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Link
                        to="/members/$memberId"
                        params={{ memberId: user.id }}
                        search={(prev: any) => prev}
                        className="h-10 px-4 rounded-full bg-white text-navi-dark border border-navi-border/20 flex items-center justify-center hover:bg-navi-dark hover:text-white transition-all font-display font-medium text-[10px] uppercase tracking-widest shrink-0"
                      >
                        Activity
                      </Link>

                      {isAdmin ? (
                        <div className="size-10 rounded-full flex items-center justify-center text-navi-blue bg-navi-blue/5">
                          <ShieldCheck className="size-5" strokeWidth={1} />
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (confirm(`Remove access for ${user.name}?`)) {
                              deleteUserMutation.mutate(user.id);
                            }
                          }}
                          className="size-10 rounded-full bg-white flex items-center justify-center text-navi-danger opacity-0 group-hover:opacity-100 transition-opacity hover:bg-navi-danger hover:text-white"
                        >
                          <Trash2 className="size-4" strokeWidth={1} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
