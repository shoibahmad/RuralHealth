import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { HeartPulse, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export function RegisterPage() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        full_name: "",
        role: "health_worker"
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 1. Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Create user document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                email: formData.email,
                full_name: formData.full_name,
                role: formData.role,
                created_at: new Date().toISOString(),
                is_active: true
            });

            // 3. Redirect based on role
            if (formData.role === 'health_officer') {
                navigate("/officer/dashboard");
            } else if (formData.role === 'patient') {
                navigate("/patient/dashboard");
            } else {
                navigate("/dashboard");
            }

        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError("Email is already registered.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password should be at least 6 characters.");
            } else {
                setError("Failed to create account. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
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
                        <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
                        <p className="text-slate-400 text-sm">Join the RuralHealthAI network</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="full_name" className="text-slate-300">Full Name</Label>
                            <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                required
                                className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-teal-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="bg-slate-900/50 border-white/10 text-white focus:border-teal-500/50 focus:ring-teal-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role" className="text-slate-300">Select Role</Label>
                            <select
                                id="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            >
                                <option value="health_worker">Health Worker</option>
                                <option value="health_officer">Health Officer</option>
                                <option value="patient">Patient</option>
                            </select>
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
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Create Account"}
                        </Button>

                        <div className="text-center text-sm text-slate-500 mt-6">
                            Already have an account? <Link to="/login" className="text-teal-400 hover:text-teal-300 hover:underline transition-colors">Login here</Link>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}
