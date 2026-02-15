import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { firestoreService } from "../services/firestoreService";

export function SettingsPage() {
    const { user } = useAuth(); // User from context
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [profileData, setProfileData] = useState({
        full_name: "",
        email: "",
        age: "",
        gender: "",
        village: "",
        phone: ""
    });

    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });

    useEffect(() => {
        const loadData = async () => {
            if (user) {
                // Load Auth Data
                const baseData = {
                    full_name: user.displayName || user.full_name || "",
                    email: user.email || "",
                    age: "",
                    gender: "",
                    village: "",
                    phone: ""
                };

                // Load Clinical Data from 'patients' collection
                try {
                    const patientDoc = await firestoreService.getPatient(user.uid);
                    if (patientDoc) {
                        baseData.age = patientDoc.age?.toString() || "";
                        baseData.gender = patientDoc.gender || "";
                        baseData.village = patientDoc.village || "";
                        baseData.phone = patientDoc.phone || "";
                    }
                } catch (err) {
                    console.error("Failed to load clinical profile:", err);
                }

                setProfileData(baseData);
            }
        };
        loadData();
    }, [user]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (!auth.currentUser) throw new Error("No user logged in");

            // Update Auth Profile
            if (profileData.full_name !== auth.currentUser.displayName) {
                await updateProfile(auth.currentUser, {
                    displayName: profileData.full_name
                });
            }

            // Update Firestore Doc (users collection)
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
                full_name: profileData.full_name
            });

            // Update Clinical Profile (patients collection)
            // Linked by UID
            await firestoreService.setPatient(auth.currentUser.uid, {
                full_name: profileData.full_name,
                age: parseInt(profileData.age) || 0,
                gender: profileData.gender,
                village: profileData.village,
                phone: profileData.phone,
                // created_at will be handled by setPatient if new
            });

            showToast("Profile updated successfully!", "success");
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to update profile', "error");
            setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (passwordData.new_password !== passwordData.confirm_password) {
            setMessage({ type: 'error', text: 'New passwords do not match!' });
            setLoading(false);
            return;
        }

        if (passwordData.new_password.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters long!' });
            setLoading(false);
            return;
        }

        try {
            if (!auth.currentUser || !auth.currentUser.email) throw new Error("No user logged in");

            // Re-authenticate first
            const credential = EmailAuthProvider.credential(auth.currentUser.email, passwordData.current_password);
            await reauthenticateWithCredential(auth.currentUser, credential);

            // Update Password
            await updatePassword(auth.currentUser, passwordData.new_password);

            showToast("Password changed successfully!", "success");
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordData({
                current_password: "",
                new_password: "",
                confirm_password: ""
            });
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to change password', "error");
            setMessage({ type: 'error', text: error.message || 'Failed to change password. Check current password.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-8 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
                <p className="text-slate-400">Manage your account settings and preferences</p>
            </div>

            {/* Success/Error Message */}
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}
                >
                    {message.type === 'success' ? (
                        <CheckCircle2 className="h-5 w-5" />
                    ) : (
                        <AlertCircle className="h-5 w-5" />
                    )}
                    <span>{message.text}</span>
                </motion.div>
            )}

            {/* Profile Information */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-2xl border border-white/5"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                        <User className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Profile Information</h2>
                        <p className="text-sm text-slate-400">Update your personal details</p>
                    </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-slate-300">Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                id="full_name"
                                value={profileData.full_name}
                                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                className="pl-10 bg-slate-900/50 border-white/10 text-white"
                                placeholder="Enter your full name"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                id="email"
                                type="email"
                                value={profileData.email}
                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                className="pl-10 bg-slate-900/50 border-white/10 text-white"
                                placeholder="Enter your email"
                            />
                        </div>
                        <p className="text-xs text-slate-500">Changing your email will require you to log in again</p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                if (user) {
                                    setProfileData({
                                        full_name: user.displayName || user.full_name || "",
                                        email: user.email || "",
                                        age: "",
                                        gender: "",
                                        village: "",
                                        phone: ""
                                    });
                                }
                            }}
                            className="text-slate-400 hover:text-white"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </motion.div>

            {/* Change Password */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6 rounded-2xl border border-white/5"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <Lock className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Change Password</h2>
                        <p className="text-sm text-slate-400">Update your password to keep your account secure</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current_password" className="text-slate-300">Current Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                id="current_password"
                                type="password"
                                value={passwordData.current_password}
                                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                className="pl-10 bg-slate-900/50 border-white/10 text-white"
                                placeholder="Enter current password"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="new_password" className="text-slate-300">New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                id="new_password"
                                type="password"
                                value={passwordData.new_password}
                                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                className="pl-10 bg-slate-900/50 border-white/10 text-white"
                                placeholder="Enter new password"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm_password" className="text-slate-300">Confirm New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                id="confirm_password"
                                type="password"
                                value={passwordData.confirm_password}
                                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                className="pl-10 bg-slate-900/50 border-white/10 text-white"
                                placeholder="Confirm new password"
                            />
                        </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                        <p className="text-xs text-amber-400">
                            <strong>Password Requirements:</strong> Minimum 6 characters
                        </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Lock className="mr-2 h-4 w-4" />
                                    Update Password
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setPasswordData({
                                current_password: "",
                                new_password: "",
                                confirm_password: ""
                            })}
                            className="text-slate-400 hover:text-white"
                        >
                            Clear
                        </Button>
                    </div>
                </form>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card p-6 rounded-2xl border border-white/5"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                        <User className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Clinical Profile</h2>
                        <p className="text-sm text-slate-400">Manage your health demographics</p>
                    </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="age" className="text-slate-300">Age</Label>
                            <Input
                                id="age"
                                type="number"
                                value={profileData.age}
                                onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                                className="bg-slate-900/50 border-white/10 text-white"
                                placeholder="e.g. 30"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gender" className="text-slate-300">Gender</Label>
                            <select
                                id="gender"
                                value={profileData.gender}
                                onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                                className="w-full h-10 px-3 rounded-md border border-white/10 bg-slate-900/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="" disabled>Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="village" className="text-slate-300">Village/City</Label>
                            <Input
                                id="village"
                                value={profileData.village}
                                onChange={(e) => setProfileData({ ...profileData, village: e.target.value })}
                                className="bg-slate-900/50 border-white/10 text-white"
                                placeholder="e.g. New York"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-slate-300">Phone</Label>
                            <Input
                                id="phone"
                                value={profileData.phone}
                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                className="bg-slate-900/50 border-white/10 text-white"
                                placeholder="e.g. +1234567890"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Profile
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </motion.div>

            {/* Account Information */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6 rounded-2xl border border-white/5"
            >
                <h2 className="text-lg font-bold text-white mb-4">Account Information</h2>
                <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-slate-400 text-sm">Account Role</span>
                        <span className="text-white font-medium capitalize">
                            {user?.role?.replace('_', ' ') || 'Health Worker'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-slate-400 text-sm">Account Status</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-slate-400 text-sm">User ID</span>
                        <span className="text-slate-300 text-sm font-mono">{user?.uid || 'N/A'}</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
