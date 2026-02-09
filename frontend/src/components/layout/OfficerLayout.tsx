import { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Activity, LayoutDashboard, Users, BarChart3, LogOut, Settings, X, Mail, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { Footer } from "../Footer";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
    { path: "/officer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/officer/workers", label: "Health Workers", icon: Users },
    { path: "/officer/patients", label: "All Patients", icon: Activity },
    { path: "/officer/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/officer/settings", label: "Settings", icon: Settings },
];

export function OfficerLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col font-sans text-slate-100">
            {/* Top Navigation */}
            <nav className="glass-card border-b border-white/5 sticky top-0 z-50 backdrop-blur-xl">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-8">
                            <Link to="/officer/dashboard" className="flex items-center gap-2">
                                <Activity className="h-6 w-6 text-teal-400" />
                                <span className="text-xl font-bold text-white">RuralHealthAI</span>
                                <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    Officer
                                </span>
                            </Link>
                            <div className="hidden lg:flex items-center gap-1">
                                {NAV_ITEMS.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                                ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                                                : "text-slate-400 hover:text-white hover:bg-white/5"
                                                }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-sm font-semibold text-slate-100">{user?.full_name || user?.email}</span>
                                <span className="text-xs text-slate-400">Health Officer</span>
                            </div>
                            <button
                                onClick={() => setProfileDrawerOpen(true)}
                                className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-600 p-[2px] shadow-lg shadow-purple-500/30 hover:scale-105 transition-transform"
                            >
                                <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center">
                                    <span className="font-bold text-white text-sm">
                                        {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "O"}
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 flex-1 overflow-x-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer */}
            <Footer />

            {/* Profile Drawer - Right Side */}
            <AnimatePresence>
                {profileDrawerOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setProfileDrawerOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-80 glass-card border-l border-white/10 z-50 flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Profile</h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setProfileDrawerOpen(false)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Profile Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Avatar and Name */}
                                <div className="flex flex-col items-center text-center">
                                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-400 to-blue-600 p-[3px] shadow-lg shadow-purple-500/30 mb-4">
                                        <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center">
                                            <span className="font-bold text-white text-2xl">
                                                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "O"}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-1">
                                        {user?.full_name || "Officer"}
                                    </h3>
                                    <p className="text-sm text-purple-400 font-medium uppercase tracking-wide">
                                        {user?.role ? user.role.replace('_', ' ') : "Health Officer"}
                                    </p>
                                </div>

                                {/* User Info */}
                                <div className="space-y-3">
                                    <div className="glass-card p-4 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <Mail className="h-5 w-5 text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-slate-400 mb-1">Email</p>
                                                <p className="text-sm text-white font-medium truncate">
                                                    {user?.email || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="glass-card p-4 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                                <Shield className="h-5 w-5 text-purple-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-slate-400 mb-1">Role</p>
                                                <p className="text-sm text-white font-medium capitalize">
                                                    {user?.role ? user.role.replace('_', ' ') : "Health Officer"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation Menu */}
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider px-2 mb-2">
                                        Navigation
                                    </p>
                                    {NAV_ITEMS.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                onClick={() => setProfileDrawerOpen(false)}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    className={`w-full justify-start ${isActive
                                                        ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                                                        : "text-slate-300 hover:text-white hover:bg-white/5"
                                                        }`}
                                                >
                                                    <Icon className="mr-3 h-4 w-4" />
                                                    {item.label}
                                                </Button>
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* Quick Actions */}
                                <div className="space-y-2 pt-4 border-t border-white/5">
                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider px-2 mb-2">
                                        Account
                                    </p>
                                    <Button
                                        variant="ghost"
                                        onClick={handleLogout}
                                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                        <LogOut className="mr-3 h-4 w-4" />
                                        Logout
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
