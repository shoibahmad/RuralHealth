import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
    Users,
    LayoutDashboard,
    FileText,
    Settings,
    LogOut,
    Menu,
    PlusCircle,
    BarChart3
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const SIDEBAR_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "New Screening", href: "/dashboard/screen", icon: PlusCircle },
    { label: "Patients", href: "/dashboard/patients", icon: Users },
    { label: "Reports", href: "/dashboard/reports", icon: FileText },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

export function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-transparent flex text-slate-100 overflow-hidden font-sans">
            {/* Sidebar Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "glass-sidebar fixed md:static inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-out md:transform-none transform relative",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-20 flex items-center px-6 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-tr from-teal-400 to-blue-500 p-2 rounded-lg shadow-lg shadow-teal-500/20">
                            <LayoutDashboard className="h-6 w-6 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-blue-100">
                            RuralHealthAI
                        </span>
                    </div>
                </div>
                <div className="p-4 space-y-2 mt-4">
                    {SIDEBAR_ITEMS.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "bg-gradient-to-r from-teal-500/20 to-blue-500/20 text-teal-200 shadow-md border border-white/5"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 w-1 h-6 bg-teal-400 rounded-r-full"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    />
                                )}
                                <item.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive ? "text-teal-400" : "text-slate-500 group-hover:text-slate-300")} />
                                {item.label}
                            </Link>
                        )
                    })}
                </div>
                <div className="absolute bottom-6 left-4 right-4 space-y-3">
                    <Link to="/settings" onClick={() => setSidebarOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5 rounded-xl h-11">
                            <Settings className="mr-3 h-4 w-4" />
                            Settings
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        onClick={logout}
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl h-11"
                    >
                        <LogOut className="mr-3 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                <header className="h-20 glass border-b border-white/5 flex items-center justify-between px-6 md:px-10 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="md:hidden text-slate-300 hover:bg-white/10" onClick={() => setSidebarOpen(true)}>
                            <Menu className="h-6 w-6" />
                        </Button>
                        <h1 className="text-xl font-bold text-white tracking-wide ml-2 md:ml-0">
                            {SIDEBAR_ITEMS.find(i => i.href === location.pathname)?.label || "Dashboard"}
                        </h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-semibold text-slate-100">
                                {user?.full_name || "Dr. Health Worker"}
                            </span>
                            <span className="text-xs text-teal-400 font-medium tracking-wide uppercase">
                                {user?.role ? user.role.replace('_', ' ') : "Medical Officer"}
                            </span>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-600 p-[2px] shadow-lg shadow-teal-500/30">
                            <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center">
                                <span className="font-bold text-white text-sm">
                                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "Dr"}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 15, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -15, scale: 0.98 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="w-full max-w-7xl mx-auto"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    )
}
