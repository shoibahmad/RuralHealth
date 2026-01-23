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
    BarChart3,
    Moon,
    Sun
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

const SIDEBAR_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "New Screening", href: "/dashboard/screen", icon: PlusCircle },
    { label: "Patients", href: "/dashboard/patients", icon: Users },
    { label: "Reports", href: "/dashboard/reports", icon: FileText },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

export function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const location = useLocation();

    // Initialize theme
    useState(() => {
        if (document.documentElement.classList.contains('dark')) {
            setIsDark(true);
        }
    });

    const toggleTheme = () => {
        const newDark = !isDark;
        setIsDark(newDark);
        if (newDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
            {/* Sidebar Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r dark:border-slate-800 transition-transform duration-200 ease-in-out md:transform-none transform relative",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-16 flex items-center px-6 border-b dark:border-slate-800">
                    <span className="font-bold text-xl text-primary">RuralHealthAI</span>
                </div>
                <div className="p-4 space-y-1">
                    {SIDEBAR_ITEMS.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        )
                    })}
                </div>
                <div className="absolute bottom-4 left-4 right-4 space-y-2">
                    <Link to="/settings" onClick={() => setSidebarOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center justify-between px-4 md:px-8">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
                        <Menu className="h-6 w-6 dark:text-slate-200" />
                    </Button>
                    <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 ml-2 md:ml-0">
                        {SIDEBAR_ITEMS.find(i => i.href === location.pathname)?.label || "Dashboard"}
                    </h1>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-500 dark:text-slate-400">
                            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </Button>
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-200">Dr. Health Worker</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Community Clinic A</span>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            HW
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-4 md:p-8 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
