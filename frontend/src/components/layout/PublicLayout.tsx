import { Outlet, Link, useLocation } from "react-router-dom";
import { HeartPulse, Menu, X } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { Footer } from "../Footer";


export function PublicLayout() {
    const location = useLocation();
    const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-teal-500/30">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 glass border-b border-white/5 transition-all duration-300">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="bg-gradient-to-tr from-teal-400 to-blue-500 p-2 rounded-lg shadow-lg shadow-teal-500/20 group-hover:scale-110 transition-transform duration-300">
                            <HeartPulse className="h-6 w-6 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-blue-200">
                            RuralHealthAI
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    {!isAuthPage && (
                        <nav className="hidden md:flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full border border-white/5 backdrop-blur-md">
                            {[
                                { name: "How it Works", href: "/how-it-works" },
                                { name: "Features", href: "/features" },
                                { name: "About", href: "/about" },
                                { name: "API Docs", href: "/api-docs" }
                            ].map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    )}

                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Toggle */}
                        {!isAuthPage && (
                            <button
                                className="md:hidden p-2 text-slate-300 hover:text-white"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        )}

                        {location.pathname !== "/login" && (
                            <Link to="/login" className="hidden sm:block">
                                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10 rounded-full">
                                    Sign In
                                </Button>
                            </Link>
                        )}
                        {location.pathname !== "/register" && (
                            <Link to="/register">
                                <Button className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white rounded-full shadow-lg shadow-teal-500/20 border-0 h-10 px-6 font-medium">
                                    Get Started
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {mobileMenuOpen && !isAuthPage && (
                    <div className="md:hidden glass border-t border-white/5 absolute top-20 left-0 w-full animate-in slide-in-from-top-4 fade-in duration-200">
                        <nav className="flex flex-col p-4 gap-2">
                            {[
                                { name: "How it Works", href: "/how-it-works" },
                                { name: "Features", href: "/features" },
                                { name: "About", href: "/about" },
                                { name: "API Docs", href: "/api-docs" }
                            ].map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    {item.name}
                                </Link>
                            ))}
                            <div className="h-px bg-white/5 my-2" />
                            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="sm:hidden">
                                <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/5">
                                    Sign In
                                </Button>
                            </Link>
                        </nav>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 pt-20">
                <Outlet />
            </main>

            {/* Footer */}
            {/* Footer */}
            <Footer />
        </div>
    )
}
