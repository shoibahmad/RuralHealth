import { motion } from "framer-motion";
import { Shield, Wifi, Brain, Activity, Database, Users } from "lucide-react";

const MODULES = [
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
    },
] as const;

export function ProjectModules() {
    return (
        <div className="mb-24">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white mb-4">Project Modules</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                    The core components that power RuralHealthAI's intelligent screening
                    platform.
                </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                {MODULES.map((module, i) => (
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
                        <h3 className="text-xl font-bold text-white mb-3">
                            {module.title}
                        </h3>
                        <p className="text-slate-400 leading-relaxed text-sm">
                            {module.desc}
                        </p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
