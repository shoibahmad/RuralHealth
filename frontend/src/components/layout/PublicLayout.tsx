import { Outlet, Link, useLocation } from "react-router-dom";
import { HeartPulse, Github, Twitter, Menu, X } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";


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
                                { name: "How it Works", href: "/#how-it-works" },
                                { name: "Features", href: "/#features" },
                                { name: "About", href: "/#" }
                            ].map((item) => (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
                                >
                                    {item.name}
                                </a>
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
                                { name: "How it Works", href: "/#how-it-works" },
                                { name: "Features", href: "/#features" },
                                { name: "About", href: "/#" }
                            ].map((item) => (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    {item.name}
                                </a>
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
            <footer className="bg-slate-950/50 border-t border-white/5 py-12 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute inset-0 bg-gradient-to-t from-teal-900/10 to-transparent pointer-events-none" />

                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-teal-500/10 p-1.5 rounded-lg">
                                    <HeartPulse className="h-5 w-5 text-teal-400" />
                                </div>
                                <span className="font-bold text-lg text-slate-200">RuralHealthAI</span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                                Bridging the gap in rural healthcare access through intelligent, offline-first screening technology.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-200 mb-4">Platform</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><a href="#" className="hover:text-teal-400 transition-colors">Risk Assessment</a></li>
                                <li><a href="#" className="hover:text-teal-400 transition-colors">Offline Capabilities</a></li>
                                <li><a href="#" className="hover:text-teal-400 transition-colors">Privacy & Security</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-200 mb-4">Connect</h4>
                            <div className="flex gap-4">
                                <a href="#" className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-teal-500/20"><Github className="h-5 w-5" /></a>
                                <a href="#" className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-blue-500/20"><Twitter className="h-5 w-5" /></a>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                        <p>© 2026 RuralHealthAI. All rights reserved.</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
                            <a href="#" className="hover:text-slate-300">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
