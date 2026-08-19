import { motion } from "framer-motion";
import { Activity, Users, ArrowDown } from "lucide-react";

/** DFD Level 0 context diagram. */
function ContextDiagram() {
    return (
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
                    <g transform="translate(60, 155)">
                        <Activity className="h-10 w-10 text-slate-500 opacity-20" x="-20" y="-40" />
                        <text textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">
                            Health Worker
                        </text>
                    </g>
                    <g transform="translate(340, 155)">
                        <Users className="h-10 w-10 text-slate-500 opacity-20" x="-20" y="-40" />
                        <text textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">
                            Medical Officer
                        </text>
                    </g>
                    <rect x="150" y="110" width="100" height="80" rx="16"
                        fill="rgba(20, 184, 166, 0.05)" stroke="#14b8a6" strokeWidth="1.5"
                        className="blur-[1px]" />
                    <text x="200" y="145" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
                        RuralHealthAI
                    </text>
                    <text x="200" y="162" textAnchor="middle" fill="#14b8a6" fontSize="9" letterSpacing="1">
                        CORE SYSTEM
                    </text>
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
    );
}

/** DFD Level 1 data flow diagram. */
function DataFlowDiagram() {
    return (
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
                    {[
                        { cx: 200, cy: 50, label: "Screening", color: "#14b8a6" },
                        { cx: 100, cy: 150, label: "AI Analysis", color: "#3b82f6" },
                        { cx: 300, cy: 150, label: "Risk Logic", color: "#a855f7" },
                        { cx: 200, cy: 250, label: "Insights", color: "#f43f5e" },
                    ].map((node) => (
                        <g key={node.label} transform={`translate(${node.cx}, ${node.cy})`}>
                            <circle r="30" fill={`${node.color}0D`} stroke={node.color}
                                strokeWidth="1" strokeDasharray="2 2" />
                            <text y="5" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="600">
                                {node.label}
                            </text>
                        </g>
                    ))}
                    <path d="M178 72 L 122 128" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <path d="M130 150 H 270" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <path d="M278 172 L 222 228" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <path d="M200 80 V 220" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                </svg>
            </div>
        </motion.div>
    );
}

/** Patient journey flowchart. */
function PatientJourneyFlowchart() {
    return (
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
    );
}

/** 3-tier architecture diagram. */
function ArchitectureDiagram() {
    return (
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
                        <div className="text-xs uppercase tracking-widest text-teal-500 font-bold mb-1">
                            Presentation Layer
                        </div>
                        <div className="text-sm text-white">React PWA (Vite + TS)</div>
                    </div>
                    <div className="flex justify-center text-slate-600">
                        <ArrowDown className="h-4 w-4" />
                    </div>
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
                        <div className="text-xs uppercase tracking-widest text-blue-500 font-bold mb-1">
                            Application Layer
                        </div>
                        <div className="text-sm text-white">
                            Django REST API + AI Service (Gemini)
                        </div>
                    </div>
                    <div className="flex justify-center text-slate-600">
                        <ArrowDown className="h-4 w-4" />
                    </div>
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center">
                        <div className="text-xs uppercase tracking-widest text-purple-500 font-bold mb-1">
                            Data Layer
                        </div>
                        <div className="text-sm text-white">
                            Firestore / PostgreSQL + Local Cache
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export function SystemDesignDiagram() {
    return (
        <div className="mb-24">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white mb-4">
                    System Design & Architecture
                </h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                    Visual breakdown of how RuralHealthAI processes data and facilitates
                    healthcare delivery.
                </p>
            </div>

            <div className="space-y-16">
                <div className="grid lg:grid-cols-2 gap-12">
                    <ContextDiagram />
                    <DataFlowDiagram />
                </div>
                <div className="grid lg:grid-cols-2 gap-12">
                    <PatientJourneyFlowchart />
                    <ArchitectureDiagram />
                </div>
            </div>
        </div>
    );
}
