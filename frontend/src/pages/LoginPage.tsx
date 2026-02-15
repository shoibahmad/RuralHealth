import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase";

import { HeartPulse, Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

import { useToast } from "../context/ToastContext";

export function LoginPage() {
    const { showToast } = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleForgotPassword = async () => {
        if (!email) {
            showToast("Please enter your email address first.", "error");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            showToast("Password reset email sent! Check your inbox.", "success");
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/user-not-found') {
                showToast("No user found with this email.", "error");
            } else {
                showToast("Failed to send reset email. Please try again.", "error");
            }
        }
    };
    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    if (user) {
        if (user.role === 'health_officer' || user.role === 'admin') {
            navigate("/officer/dashboard");
        } else if (user.role === 'patient') {
            navigate("/patient/dashboard");
        } else {
            navigate("/dashboard");
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            showToast("Successfully logged in!", "success");
            // Navigation handled by AuthContext or the redirect check above/useEffect
            navigate("/dashboard");
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential') {
                setError("Invalid email or password.");
            } else if (err.code === 'auth/user-not-found') {
                setError("No user found with this email.");
            } else if (err.code === 'auth/wrong-password') {
                setError("Incorrect password.");
            } else {
                setError("Failed to sign in. Please try again.");
            }
            showToast(error || "Failed to sign in", "error");
        } finally {
            setLoading(false);
        }
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
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password" className="text-slate-300">Password</Label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-xs text-teal-400 hover:text-teal-300 hover:underline"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-slate-900/50 border-white/10 text-white focus:border-teal-500/50 focus:ring-teal-500/20 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <Button
                            className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white border-0 shadow-lg shadow-teal-500/25 py-6 font-medium transition-all duration-300"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Sign In"}
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
