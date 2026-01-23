import { Outlet, Link } from "react-router-dom";
import { HeartPulse } from "lucide-react";
import { Button } from "../ui/button";

export function PublicLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <header className="border-b bg-white sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-bold text-xl">
                        <HeartPulse className="h-6 w-6" />
                        <span>RuralHealthAI</span>
                    </div>
                    <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
                        <a href="#how-it-works" className="hover:text-primary transition">How it Works</a>
                        <a href="#features" className="hover:text-primary transition">Features</a>
                        <a href="#" className="hover:text-primary transition">About</a>
                    </nav>
                    <div className="flex gap-2">
                        <Link to="/login">
                            <Button>Login</Button>
                        </Link>
                    </div>
                </div>
            </header>
            <main className="flex-1">
                <Outlet />
            </main>
            <footer className="bg-slate-900 text-slate-300 py-8">
                <div className="container mx-auto px-4 text-center text-sm">
                    © 2026 RuralHealthAI. Built for Community Health.
                </div>
            </footer>
        </div>
    )
}
