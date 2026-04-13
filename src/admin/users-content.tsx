import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, UserPlus, ShieldCheck } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addAdminUser, deleteAdminUser } from "../actions";

interface UsersContentProps {
    allUsers: any[];
    adminEmail: string;
    currentUserEmail: string;
}

export function UsersContent({ allUsers, adminEmail, currentUserEmail }: UsersContentProps) {
    const queryClient = useQueryClient();

    const createUserMutation = useMutation({
        mutationFn: (data: any) => addAdminUser({ data }),
        onSuccess: async () => {
            await queryClient.refetchQueries({ queryKey: ['admin-users'], type: 'active' });
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: (id: string) => deleteAdminUser({ data: id }),
        onSuccess: async () => {
            await queryClient.refetchQueries({ queryKey: ['admin-users'], type: 'active' });
        }
    });

    const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        createUserMutation.mutate({
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password')
        });
        e.currentTarget.reset();
    };

    return (
        <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 pt-6 md:p-8 bg-background text-foreground antialiased">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 h-fit rounded-xl shadow-sm border bg-card lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                            <UserPlus className="h-5 w-5 text-muted-foreground" />
                            Add Family Member
                        </CardTitle>
                        <CardDescription>
                            Create a new account for a member of your family.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateUser} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                                <Input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    placeholder="e.g. Maria"
                                    className="h-10 rounded-lg shadow-sm bg-background border"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                                <Input
                                    type="email"
                                    name="email"
                                    id="email"
                                    required
                                    placeholder="maria@example.com"
                                    className="h-10 rounded-lg shadow-sm bg-background border"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium">Initial Password</Label>
                                <Input
                                    type="password"
                                    name="password"
                                    id="password"
                                    required
                                    minLength={8}
                                    placeholder="Minimum 8 characters"
                                    className="h-10 rounded-lg shadow-sm bg-background border"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={createUserMutation.isPending}
                                className="mt-4 w-full h-10 rounded-lg shadow-sm font-medium transition-all"
                            >
                                {createUserMutation.isPending ? "Creating..." : "Create Account"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="col-span-4 rounded-xl shadow-sm border bg-card">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Registered Members</CardTitle>
                        <CardDescription>
                            Family members with access to the protocol.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allUsers.map((u) => (
                                        <TableRow key={u.id} className="group transition-colors">
                                            <TableCell className="font-medium text-sm">
                                                <div className="flex items-center gap-2">
                                                    {u.email === adminEmail && (
                                                        <ShieldCheck className="h-4 w-4 text-primary" />
                                                    )}
                                                    {u.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                                            <TableCell>
                                                <div
                                                    className={`inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold rounded-md transition-colors ${
                                                        u.email === adminEmail
                                                            ? "border-transparent bg-primary text-primary-foreground"
                                                            : "border-border bg-secondary text-secondary-foreground"
                                                    }`}
                                                >
                                                    {u.email === adminEmail ? "Admin" : "Member"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {u.email !== adminEmail && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteUserMutation.mutate(u.id)}
                                                        disabled={deleteUserMutation.isPending}
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
