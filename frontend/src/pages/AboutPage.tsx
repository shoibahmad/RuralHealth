import { motion } from "framer-motion";
import { Github, Linkedin, Mail, Server, Database, Brain, Globe, Shield, Wifi, Activity, Users, FileText, ArrowDown } from "lucide-react";
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

                {/* Project Modules */}
                <div className="mb-24">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Project Modules</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">The core components that power RuralHealthAI's intelligent screening platform.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Authentication & RBAC",
                                desc: "Secure multi-role access control system for Patients, Health Workers (ASHAs), and Medical Officers using Firebase & JWT.",
                                icon: Shield,
                            },
                            {
                                title: "Offline Screening Engine",
                                desc: "PWA-based vitals collection that works without internet, featuring local persistence and background cloud sync.",
                                icon: Wifi,
                            },
                            {
                                title: "AI Diagnostic Suite",
                                desc: "Multi-modal AI featuring Voice-to-Text for vitals and OCR for automated lab report digitization using Gemini Flash.",
                                icon: Brain,
                            },
                            {
                                title: "Risk Stratification",
                                desc: "Evidence-based clinical algorithms that process vitals and history to classify NCD risks (Diabetes, Hypertension, CVD).",
                                icon: Activity,
                            },
                            {
                                title: "Analytics & Hotspots",
                                desc: "Interactive geospatial dashboards for tracking disease prevalence and screening coverage across various districts.",
                                icon: Database,
                            },
                            {
                                title: "Patient Management",
                                desc: "Unified longitudinal health records providing a 360-degree view of patient history and referral pathways.",
                                icon: Users,
                            }
                        ].map((module, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card p-8 rounded-2xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-all border-l-4 border-l-teal-500"
                            >
                                <div className="h-12 w-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-6 font-bold">
                                    <module.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{module.title}</h3>
                                <p className="text-slate-400 leading-relaxed text-sm">
                                    {module.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* System Design & Diagrams */}
                <div className="mb-24">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">System Design & Architecture</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">Visual breakdown of how RuralHealthAI processes data and facilitates healthcare delivery.</p>
                    </div>

                    <div className="space-y-16">
                        {/* DFD Level 0 & 1 */}
                        <div className="grid lg:grid-cols-2 gap-12">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="glass-card p-8 rounded-2xl border border-white/5 bg-slate-900/40"
                            >
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                    <div className="w-2 h-8 bg-teal-500 rounded-full" />
                                    DFD Level 0: Context Diagram
                                </h3>
                                <div className="aspect-[4/3] bg-slate-950/50 rounded-xl border border-white/5 flex items-center justify-center p-4">
                                    <svg viewBox="0 0 400 300" className="w-full h-full text-slate-300">
                                        {/* Icons/Entities (No Boxes) */}
                                        <g transform="translate(60, 155)">
                                            <Activity className="h-10 w-10 text-slate-500 opacity-20" x="-20" y="-40" />
                                            <text textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">Health Worker</text>
                                        </g>

                                        <g transform="translate(340, 155)">
                                            <Users className="h-10 w-10 text-slate-500 opacity-20" x="-20" y="-40" />
                                            <text textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">Medical Officer</text>
                                        </g>

                                        {/* System Core (Subtle Glow) */}
                                        <rect x="150" y="110" width="100" height="80" rx="16" fill="rgba(20, 184, 166, 0.05)" stroke="#14b8a6" strokeWidth="1.5" className="blur-[1px]" />
                                        <text x="200" y="145" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">RuralHealthAI</text>
                                        <text x="200" y="162" textAnchor="middle" fill="#14b8a6" fontSize="9" letterSpacing="1">CORE SYSTEM</text>

                                        {/* Flow Lines */}
                                        <path d="M110 145 H 150" fill="none" stroke="#14b8a6" strokeWidth="1" strokeDasharray="4 2" />
                                        <text x="130" y="140" textAnchor="middle" fill="#14b8a6" fontSize="8">Vitals/Data</text>

                                        <path d="M150 165 H 110" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 2" />
                                        <text x="130" y="175" textAnchor="middle" fill="#3b82f6" fontSize="8">Instructions</text>

                                        <path d="M250 145 H 290" fill="none" stroke="#14b8a6" strokeWidth="1" strokeDasharray="4 2" />
                                        <text x="270" y="140" textAnchor="middle" fill="#14b8a6" fontSize="8">Analytics</text>

                                        <path d="M290 165 H 250" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 2" />
                                        <text x="270" y="175" textAnchor="middle" fill="#3b82f6" fontSize="8">Assignments</text>
                                    </svg>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="glass-card p-8 rounded-2xl border border-white/5 bg-slate-900/40"
                            >
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                    <div className="w-2 h-8 bg-blue-500 rounded-full" />
                                    DFD Level 1: Data Flow
                                </h3>
                                <div className="aspect-[4/3] bg-slate-950/50 rounded-xl border border-white/5 flex items-center justify-center p-4">
                                    <svg viewBox="0 0 400 300" className="w-full h-full text-slate-300">
                                        {/* Processes (Minimalist) */}
                                        <g transform="translate(200, 50)">
                                            <circle r="30" fill="rgba(20, 184, 166, 0.05)" stroke="#14b8a6" strokeWidth="1" strokeDasharray="2 2" />
                                            <text y="5" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="600">Screening</text>
                                        </g>

                                        <g transform="translate(100, 150)">
                                            <circle r="30" fill="rgba(59, 130, 246, 0.05)" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2 2" />
                                            <text y="5" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="600">AI Analysis</text>
                                        </g>

                                        <g transform="translate(300, 150)">
                                            <circle r="30" fill="rgba(168, 85, 247, 0.05)" stroke="#a855f7" strokeWidth="1" strokeDasharray="2 2" />
                                            <text y="5" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="600">Risk Logic</text>
                                        </g>

                                        <g transform="translate(200, 250)">
                                            <circle r="30" fill="rgba(244, 63, 94, 0.05)" stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2" />
                                            <text y="5" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="600">Insights</text>
                                        </g>

                                        {/* Flow Lines */}
                                        <path d="M178 72 L 122 128" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                                        <path d="M130 150 H 270" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                                        <path d="M278 172 L 222 228" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                                        <path d="M200 80 V 220" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                                    </svg>
                                </div>
                            </motion.div>
                        </div>

                        {/* Flowchart & Architecture */}
                        <div className="grid lg:grid-cols-2 gap-12">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="glass-card p-8 rounded-2xl border border-white/5 bg-slate-900/40"
                            >
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                    <div className="w-2 h-8 bg-purple-500 rounded-full" />
                                    Patient Journey Flowchart
                                </h3>
                                <div className="aspect-[4/3] bg-slate-950/50 rounded-xl border border-white/5 flex items-center justify-center p-4">
                                    <svg viewBox="0 0 400 300" className="w-full h-full text-slate-300">
                                        <rect x="150" y="20" width="100" height="30" rx="15" fill="#1e293b" stroke="#14b8a6" />
                                        <text x="200" y="40" textAnchor="middle" fill="#fff" fontSize="10">Start Screening</text>

                                        <path d="M200 50 V 80" stroke="rgba(255,255,255,0.2)" />

                                        <polygon points="200,80 250,110 200,140 150,110" fill="#1e293b" stroke="#3b82f6" />
                                        <text x="200" y="115" textAnchor="middle" fill="#fff" fontSize="8">High Risk?</text>

                                        <path d="M250 110 H 300" stroke="rgba(255,255,255,0.2)" />
                                        <text x="275" y="105" textAnchor="middle" fill="#14b8a6" fontSize="8">Yes</text>

                                        <rect x="300" y="95" width="80" height="30" rx="5" fill="#1e293b" stroke="#f43f5e" />
                                        <text x="340" y="115" textAnchor="middle" fill="#fff" fontSize="8">Referral</text>

                                        <path d="M200 140 V 170" stroke="rgba(255,255,255,0.2)" />
                                        <text x="215" y="155" textAnchor="middle" fill="#3b82f6" fontSize="8">No</text>

                                        <rect x="150" y="170" width="100" height="30" rx="5" fill="#1e293b" stroke="#14b8a6" />
                                        <text x="200" y="190" textAnchor="middle" fill="#fff" fontSize="8">Follow-up Plan</text>
                                    </svg>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="glass-card p-8 rounded-2xl border border-white/5 bg-slate-900/40"
                            >
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                    <div className="w-2 h-8 bg-orange-500 rounded-full" />
                                    3-Tier Architecture
                                </h3>
                                <div className="aspect-[4/3] bg-slate-950/50 rounded-xl border border-white/5 flex items-center justify-center p-4">
                                    <div className="w-full flex flex-col gap-4">
                                        <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-center">
                                            <div className="text-xs uppercase tracking-widest text-teal-500 font-bold mb-1">Presentation Layer</div>
                                            <div className="text-sm text-white">React PWA (Vite + TS)</div>
                                        </div>
                                        <div className="flex justify-center text-slate-600">
                                            <ArrowDown className="h-4 w-4" />
                                        </div>
                                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
                                            <div className="text-xs uppercase tracking-widest text-blue-500 font-bold mb-1">Application Layer</div>
                                            <div className="text-sm text-white">Django REST API + AI Service (Gemini)</div>
                                        </div>
                                        <div className="flex justify-center text-slate-600">
                                            <ArrowDown className="h-4 w-4" />
                                        </div>
                                        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center">
                                            <div className="text-xs uppercase tracking-widest text-purple-500 font-bold mb-1">Data Layer</div>
                                            <div className="text-sm text-white">Firestore / PostgreSQL + Local Cache</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Tech Stack */}
                <div className="mb-24">
                    <h2 className="text-3xl font-bold text-white text-center mb-12">Built with Modern Tech Stack</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { icon: Globe, label: "Frontend", desc: "React + Vite + TS" },
                            { icon: Server, label: "Backend", desc: "Django REST Framework" },
                            { icon: Database, label: "Database", desc: "PostgreSQL / SQLite" },
                            { icon: Brain, label: "AI Core", desc: "Google Gemini AI" },
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
                    <h2 className="text-2xl font-bold text-white mb-4">Empower Your Health Center</h2>
                    <p className="text-slate-400 mb-8">
                        Ready to deploy RuralHealthAI in your district? Join our mission to bring intelligent healthcare to remote communities.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button
                            variant="outline"
                            className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10 gap-2 h-12 px-6"
                            onClick={() => window.location.href = 'mailto:alishasshad@gmail.com'}
                        >
                            <Mail className="h-4 w-4" /> Get in Touch
                        </Button>
                        <Button
                            variant="outline"
                            className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10 gap-2 h-12 px-6"
                            onClick={() => window.open('https://www.linkedin.com/in/alisha-shad-983456380/', '_blank')}
                        >
                            <Linkedin className="h-4 w-4" /> Professional Profile
                        </Button>
                        <Button
                            className="bg-teal-500 hover:bg-teal-600 text-white gap-2 h-12 px-6"
                            onClick={() => window.open('https://www.github.com/alishashad', '_blank')}
                        >
                            <Github className="h-4 w-4" /> View Open Source
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

