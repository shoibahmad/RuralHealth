import { ArrowRight, Activity, ShieldCheck, Stethoscope } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Link } from "react-router-dom";

export function LandingPage() {
    return (
        <div className="flex flex-col gap-16 pb-16">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-teal-50/50 to-white">
                <div className="container mx-auto px-4 flex flex-col items-center text-center">
                    <div className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800 mb-6">
                        <span className="flex h-2 w-2 rounded-full bg-teal-600 mr-2"></span>
                        Now Live for Pilot Regions
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 max-w-4xl">
                        Smart Health Screening for <span className="text-primary">Rural Communities</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
                        Empowering health workers with offline-first AI tools for early detection of Diabetes, Hypertension, and CVD risks.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link to="/register">
                            <Button size="lg" className="h-12 px-8 text-base">
                                Get Started
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                                Log In
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">How it Works</h2>
                    <p className="text-slate-600 max-w-xl mx-auto">A seamless workflow designed for low-connectivity environments.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { title: "Screen", icon: Stethoscope, desc: "Collect vitals and demographics. Use Voice AI for hands-free entry." },
                        { title: "Analyze", icon: Activity, desc: "Instant WHO-based risk scoring. Upload lab reports via OCR." },
                        { title: "Intervene", icon: ShieldCheck, desc: "Get actionable advice and referral pathways immediately." }
                    ].map((item, i) => (
                        <Card key={i} className="border-none shadow-lg bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                            <CardContent className="pt-8 flex flex-col items-center text-center p-8">
                                <div className="h-14 w-14 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-700 mb-6">
                                    <item.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                                <p className="text-slate-500">{item.desc}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="bg-slate-50 py-20">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-6">Offline-First & AI-Powered</h2>
                            <ul className="space-y-4">
                                {[
                                    "Works without internet (PWA)",
                                    "Voice-to-Text Vitals Entry",
                                    "Lab Report OCR Scanner",
                                    "Population Risk Clustering"
                                ].map((feat, i) => (
                                    <li key={i} className="flex items-center text-slate-700 font-medium">
                                        <div className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3">
                                            <ShieldCheck className="h-3 w-3" />
                                        </div>
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white p-2 rounded-2xl shadow-xl -rotate-1 ring-1 ring-slate-900/5">
                            <div className="bg-slate-100 aspect-video rounded-xl flex items-center justify-center text-slate-400">
                                {/* Placeholder for App Screenshot */}
                                <span className="font-semibold">App Screenshot Preview</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
