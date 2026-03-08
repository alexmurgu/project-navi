"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { error: authError } = await authClient.signIn.email({
                email,
                password,
                callbackURL: "/"
            });

            if (authError) {
                setError(authError.message || "Invalid email or password");
                setLoading(false);
            } else {
                // Better Auth handles the redirect if callbackURL is provided, 
                // but we can also manually push to ensure it happens.
                router.push("/");
                router.refresh();
            }
        } catch (err: any) {
            setError("An unexpected error occurred");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center border-2 border-primary bg-primary/10 text-primary shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                        <span className="text-3xl font-black">N</span>
                    </div>
                </div>
                <h2 className="mt-6 text-center text-4xl font-black tracking-tighter text-white uppercase">
                    Project Navi
                </h2>
                <p className="mt-2 text-center text-sm font-bold tracking-[0.2em] text-white/40 uppercase">
                    Advanced Finance Protocol
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="glass-panel border-white/10 p-4">
                    <CardHeader>
                        <CardTitle className="sr-only">Login</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSignIn} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-white/70">
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11 border-white/10 bg-black/20 text-white"
                                    placeholder="alex@aftermind.net"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-white/70">
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-11 border-white/10 bg-black/20 text-white"
                                    placeholder="••••••••"
                                />
                            </div>

                            {error && (
                                <div className="text-sm font-medium text-red-400 bg-red-400/10 p-3  border border-red-400/20">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-primary hover:bg-primary/90 font-black text-primary-foreground uppercase tracking-widest shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all rounded-lg"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Authorize"}
                            </Button>
                        </form>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-transparent px-2 text-white/40 italic">
                                        Admin accounts only
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
