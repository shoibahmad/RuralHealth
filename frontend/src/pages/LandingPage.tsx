import { ArrowRight, Activity, ShieldCheck, Stethoscope } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Link } from "react-router-dom";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LandingPage() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 4000); // 4 seconds loading
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Abstract Background Blobs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-700" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="z-10 flex flex-col items-center"
                >
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-teal-500/30 blur-xl rounded-full" />
                        <Activity className="h-20 w-20 text-teal-400 relative z-10 animate-bounce" />
                    </div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-blue-200 mb-4"
                    >
                        RuralHealthAI
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="text-slate-400 text-lg"
                    >
                        Empowering Rural Healthcare...
                    </motion.p>

                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: 200 }}
                        transition={{ delay: 1.5, duration: 1.5, ease: "easeInOut" }}
                        className="h-1 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full mt-8"
                    />
                </motion.div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-16 pb-16 min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] -z-10" />

                <div className="container mx-auto px-4 flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="inline-flex items-center rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-sm font-medium text-teal-300 mb-6 backdrop-blur-sm"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-teal-400 mr-2 animate-pulse"></span>
                        Now Live for Pilot Regions
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 max-w-4xl"
                    >
                        Smart Health Screening for <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">Rural Communities</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto"
                    >
                        Empowering health workers with offline-first AI tools for early detection of Diabetes, Hypertension, and CVD risks.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        <Link to="/register">
                            <Button size="lg" className="h-14 px-8 text-base bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 border-0 shadow-lg shadow-teal-500/25 rounded-full transition-all hover:scale-105">
                                Get Started
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button variant="ghost" size="lg" className="h-14 px-8 text-base text-slate-300 hover:text-white hover:bg-white/5 rounded-full border border-white/10 hover:border-white/20">
                                Log In
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl font-bold text-white mb-4">How it Works</h2>
                    <p className="text-slate-400 max-w-xl mx-auto">A seamless workflow designed for low-connectivity environments.</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { title: "Screen", icon: Stethoscope, desc: "Collect vitals and demographics. Use Voice AI for hands-free entry." },
                        { title: "Analyze", icon: Activity, desc: "Instant WHO-based risk scoring. Upload lab reports via OCR." },
                        { title: "Intervene", icon: ShieldCheck, desc: "Get actionable advice and referral pathways immediately." }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.2 }}
                        >
                            <Card className="border-none shadow-2xl glass-card hover:translate-y-[-5px] transition-all duration-300 group">
                                <CardContent className="pt-8 flex flex-col items-center text-center p-8">
                                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-blue-500/20 flex items-center justify-center text-teal-400 mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5">
                                        <item.icon className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-3 text-white">{item.title}</h3>
                                    <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 relative">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-3xl font-bold text-white mb-6">Offline-First & AI-Powered</h2>
                            <ul className="space-y-4">
                                {[
                                    "Works without internet (PWA)",
                                    "Voice-to-Text Vitals Entry",
                                    "Lab Report OCR Scanner",
                                    "Population Risk Clustering"
                                ].map((feat, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center text-slate-300 font-medium p-4 rounded-xl glass hover:bg-white/5 transition-colors"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center mr-4 border border-teal-500/30">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                        {feat}
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="glass-card p-3 rounded-2xl shadow-2xl -rotate-1 ring-1 ring-white/10"
                        >
                            <div className="bg-slate-900/50 aspect-video rounded-xl flex items-center justify-center text-slate-500 border border-white/5 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <Activity className="h-16 w-16 text-slate-700 group-hover:text-teal-500/50 transition-colors duration-500" />
                                <span className="font-semibold relative z-10 ml-4 group-hover:text-teal-200 transition-colors">App Screenshot Preview</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    )
}
