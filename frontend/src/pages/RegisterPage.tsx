import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { HeartPulse, Loader2 } from "lucide-react";

export function RegisterPage() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        full_name: "",
        role: "health_worker"
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const registerMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to register");
            }
            return res.json();
        },
        onSuccess: () => {
            navigate("/login");
        },
        onError: (err: any) => {
            setError(err.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        registerMutation.mutate();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <Card className="w-full max-w-md border-none shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4 text-primary">
                        <HeartPulse className="h-10 w-10" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                    <p className="text-sm text-slate-500">Join the RuralHealthAI network</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm font-medium">{error}</div>
                        )}

                        <Button className="w-full" type="submit" disabled={registerMutation.isPending}>
                            {registerMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
                        </Button>

                        <div className="text-center text-sm text-slate-500 mt-4">
                            Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
