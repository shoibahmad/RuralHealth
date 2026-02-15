import { Outlet, Link, useLocation } from "react-router-dom";
import { HeartPulse, Menu, X } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { Footer } from "../Footer";
import { motion, AnimatePresence } from "framer-motion";


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
                            <Link to="/register" className="hidden md:block">
                                <Button className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white rounded-full shadow-lg shadow-teal-500/20 border-0 h-10 px-6 font-medium">
                                    Get Started
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && !isAuthPage && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[60] md:hidden"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-[300px] bg-[#020617] border-l border-white/10 z-[61] md:hidden shadow-2xl p-8 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <span className="font-bold text-xl text-white">Menu Navigation</span>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <nav className="flex flex-col gap-4">
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
                                        className="px-4 py-4 text-xl font-medium text-slate-300 hover:text-teal-400 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5 active:scale-95"
                                    >
                                        {item.name}
                                    </Link>
                                ))}

                                <div className="h-px bg-white/10 my-6" />

                                <div className="flex flex-col gap-4">
                                    {location.pathname !== "/login" && (
                                        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                                            <Button variant="ghost" className="w-full justify-start text-lg h-14 text-slate-300 hover:text-white hover:bg-white/5 rounded-2xl">
                                                Sign In
                                            </Button>
                                        </Link>
                                    )}
                                    {location.pathname !== "/register" && (
                                        <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                                            <Button className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white rounded-2xl shadow-lg shadow-teal-500/20 border-0 h-14 text-lg font-bold">
                                                Get Started
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </nav>

                            <div className="mt-auto">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                                        <HeartPulse className="h-5 w-5 text-teal-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">RuralHealthAI</p>
                                        <p className="text-xs text-slate-500 leading-tight">Empowering Rural Care</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 pt-20">
                <Outlet />
            </main>

            {/* Footer */}
            <Footer />
        </div>
    )
}
