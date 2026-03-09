import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { getSession } from "@/lib/get-session";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, UserPlus, ShieldCheck } from "lucide-react";
import { createUser, deleteUser } from "./actions";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';

export default async function UsersPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (session.user.email !== ADMIN_EMAIL) {
        notFound();
    }

    const allUsers = await db.select().from(user);

    return (
        <div className="relative z-10 mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 pt-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="glass-panel col-span-4 h-fit border-white/10 lg:col-span-3">
                    <div className="pointer-events-none absolute inset-0  bg-gradient-to-br from-blue-500/10 to-transparent"></div>
                    <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2 text-xl text-white">
                            <UserPlus className="h-5 w-5 text-blue-400" />
                            Add Family Member
                        </CardTitle>
                        <CardDescription className="text-white/60">
                            Create a new account for a family member.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <form action={createUser} className="space-y-5">
                            <div className="space-y-3">
                                <Label htmlFor="name" className="text-xs font-semibold tracking-widest text-white/70 uppercase">
                                    Full Name
                                </Label>
                                <Input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    placeholder="e.g. Maria"
                                    className="h-12 border-white/10 bg-black/20 text-white text-base placeholder:text-white/30 focus-visible:ring-blue-500 rounded-lg"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="email" className="text-xs font-semibold tracking-widest text-white/70 uppercase">
                                    Email Address
                                </Label>
                                <Input
                                    type="email"
                                    name="email"
                                    id="email"
                                    required
                                    placeholder="maria@aftermind.net"
                                    className="h-12 border-white/10 bg-black/20 text-white text-base placeholder:text-white/30 focus-visible:ring-blue-500 rounded-lg"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="password" className="text-xs font-semibold tracking-widest text-white/70 uppercase">
                                    Initial Password
                                </Label>
                                <Input
                                    type="password"
                                    name="password"
                                    id="password"
                                    required
                                    minLength={8}
                                    placeholder="Minimum 8 characters"
                                    className="h-12 border-white/10 bg-black/20 text-white text-base placeholder:text-white/30 focus-visible:ring-blue-500 rounded-lg"
                                />
                            </div>

                            <Button
                                type="submit"
                                size="xl"
                                className="mt-4 w-full bg-blue-600 transition-all hover:bg-blue-500 rounded-lg"
                            >
                                Create Account
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="glass-panel col-span-4 border-white/10">
                    <CardHeader>
                        <CardTitle className="text-xl text-white font-black uppercase tracking-tighter">Current Members</CardTitle>
                        <CardDescription className="text-white/60">
                            Manage access to the Project Navi protocol.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden  border border-white/10 bg-black/20">
                            <Table>
                                <TableHeader className="bg-white/5">
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allUsers.map((u) => (
                                        <TableRow key={u.id} className="group border-white/10 transition-colors hover:bg-white/5">
                                            <TableCell className="font-bold text-white">
                                                <div className="flex items-center gap-2">
                                                    {u.email === ADMIN_EMAIL && (
                                                        <ShieldCheck className="h-5 w-5 text-primary" />
                                                    )}
                                                    {u.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-white/60 font-medium">{u.email}</TableCell>
                                            <TableCell>
                                                <div
                                                    className={`inline-flex items-center border px-3 py-1 font-bold tracking-wider uppercase transition-colors ${
                                                        u.email === ADMIN_EMAIL
                                                            ? "border-primary/30 bg-primary/20 text-primary"
                                                            : "border-white/10 bg-white/5 text-white/60"
                                                    }`}
                                                >
                                                    {u.email === ADMIN_EMAIL ? "Admin" : "Member"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {u.email !== ADMIN_EMAIL && (
                                                    <form action={deleteUser}>
                                                        <input type="hidden" name="id" value={u.id} />
                                                        <Button
                                                            type="submit"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-white/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-400/10 hover:text-red-400"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </form>
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
