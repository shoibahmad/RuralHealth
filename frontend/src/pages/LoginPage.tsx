import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

import { HeartPulse, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const loginMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append("username", email);
            formData.append("password", password);

            const res = await fetch("/api/auth/login", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to login");
            }
            return res.json();
        },
        onSuccess: (data) => {
            login(data.access_token);
            navigate("/dashboard");
        },
        onError: (err: any) => {
            setError(err.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loginMutation.mutate();
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                vocab="0.5"
                className="w-full max-w-md"
            >
                <div className="glass-card rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="bg-gradient-to-tr from-teal-400 to-blue-500 p-3 rounded-full shadow-lg shadow-teal-500/30">
                                <HeartPulse className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                        <p className="text-slate-400 text-sm">Sign in to access the RuralHealthAI platform</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@clinic.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-slate-900/50 border-white/10 text-white focus:border-teal-500/50 focus:ring-teal-500/20"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <Button
                            className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white border-0 shadow-lg shadow-teal-500/25 py-6 font-medium transition-all duration-300"
                            type="submit"
                            disabled={loginMutation.isPending}
                        >
                            {loginMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Sign In"}
                        </Button>

                        <div className="text-center text-sm text-slate-500 mt-6">
                            Don't have an account? <Link to="/register" className="text-teal-400 hover:text-teal-300 hover:underline transition-colors">Register now</Link>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}
