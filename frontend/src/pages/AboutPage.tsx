import { motion } from "framer-motion";
import { Github, Linkedin, Mail, Server, Database, Brain, Globe, Shield, Wifi, Activity, Users, FileText } from "lucide-react";
import { Button } from "../components/ui/button";

export function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-16">
            <div className="container mx-auto px-6">

                {/* Mission Section */}
                <div className="max-w-4xl mx-auto text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-block px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 font-medium text-sm mb-6"
                    >
                        Bridging the Rural Healthcare Gap
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight"
                    >
                        Empowering Frontline Workers with <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">Intelligent Tools</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-slate-300 leading-relaxed font-light"
                    >
                        "RuralHealthAI is a production-ready Digital Health Survey & Risk Screening Tool designed to democratize access to preventative healthcare."
                    </motion.p>
                </div>

                {/* What is it? */}
                <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-6"
                    >
                        <h2 className="text-3xl font-bold text-white">The Challenge</h2>
                        <div className="space-y-4 text-slate-400 text-lg leading-relaxed">
                            <p>
                                <strong className="text-white">The Gap:</strong> Rural regions face a critical shortage of medical specialists. Non-Communicable Diseases (NCDs) like Diabetes and Hypertension often go undetected until major complications arise.
                            </p>
                            <p>
                                <strong className="text-white">Our Solution:</strong> By equipping Accredited Social Health Activists (ASHAs) with AI-powered screening tools, we bring hospital-grade diagnostics to the doorstep of every villager.
                            </p>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-3xl font-bold text-teal-400">70%</span>
                                <span className="text-sm text-slate-500">Lives in Rural Areas</span>
                            </div>
                            <div className="w-px bg-slate-800" />
                            <div className="flex flex-col gap-1">
                                <span className="text-3xl font-bold text-blue-400">1:11K</span>
                                <span className="text-sm text-slate-500">Doctor-Patient Ratio</span>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/20 to-blue-500/20 rounded-xl blur-xl" />
                        <div className="relative glass-card p-8 rounded-2xl border border-white/5 bg-slate-900/80">
                            <h3 className="text-xl font-bold text-white mb-6">Key Capabilities</h3>
                            <ul className="space-y-4">
                                {[
                                    { icon: Wifi, text: "Works 100% Offline in remote areas" },
                                    { icon: Brain, text: "AI Analysis powered by Google Gemini" },
                                    { icon: Globe, text: "Multi-language Voice Support" },
                                    { icon: Shield, text: "Secure & Private Patient Data" }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300">
                                        <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-teal-400">
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                </div>

                {/* Tech Stack */}
                <div className="mb-24">
                    <h2 className="text-3xl font-bold text-white text-center mb-12">Built with Modern Tech</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { icon: Globe, label: "Frontend", desc: "React + Vite + TS" },
                            { icon: Server, label: "Backend", desc: "Django REST Framework" },
                            { icon: Database, label: "Database", desc: "PostgreSQL / SQLite" },
                            { icon: Brain, label: "AI Core", desc: "Google Gemini + OpenAI" },
                            { icon: Shield, label: "Auth", desc: "Firebase Identity" },
                            { icon: Activity, label: "UI Library", desc: "ShadCN + Tailwind" },
                            { icon: Users, label: "Deployment", desc: "Render Cloud" },
                            { icon: FileText, label: "Docs", desc: "Swagger / OpenAPI" },
                        ].map((tech, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card p-6 rounded-xl border border-white/5 hover:border-teal-500/30 transition-colors text-center group"
                            >
                                <div className="h-12 w-12 mx-auto rounded-full bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-teal-400 group-hover:bg-teal-500/10 transition-colors mb-4">
                                    <tech.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-white font-semibold mb-1">{tech.label}</h3>
                                <p className="text-sm text-slate-500">{tech.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Contact/CTA */}
                <div className="max-w-2xl mx-auto text-center glass-card p-10 rounded-2xl border border-white/5 bg-gradient-to-b from-slate-900 to-slate-950">
                    <h2 className="text-2xl font-bold text-white mb-4">Join Our Mission</h2>
                    <p className="text-slate-400 mb-8">
                        Interested in partnering with us, contributing to the code, or piloting RuralHealthAI in your district?
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button
                            variant="outline"
                            className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10 gap-2 h-12 px-6"
                            onClick={() => window.location.href = 'mailto:alishasshad@gmail.com'}
                        >
                            <Mail className="h-4 w-4" /> Email Us
                        </Button>
                        <Button
                            variant="outline"
                            className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10 gap-2 h-12 px-6"
                            onClick={() => window.open('https://www.linkedin.com/in/alisha-shad-983456380/', '_blank')}
                        >
                            <Linkedin className="h-4 w-4" /> Connect on LinkedIn
                        </Button>
                        <Button
                            className="bg-teal-500 hover:bg-teal-600 text-white gap-2 h-12 px-6"
                            onClick={() => window.open('https://www.github.com/alishashad', '_blank')}
                        >
                            <Github className="h-4 w-4" /> GitHub Profile
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

