import { motion } from "framer-motion";
import { Globe, Server, Database, Brain, Shield, Activity, Users, FileText } from "lucide-react";

const TECH_ITEMS = [
    { icon: Globe, label: "Frontend", desc: "React + Vite + TS" },
    { icon: Server, label: "Backend", desc: "Django REST Framework" },
    { icon: Database, label: "Database", desc: "PostgreSQL / SQLite" },
    { icon: Brain, label: "AI Core", desc: "Google Gemini AI" },
    { icon: Shield, label: "Auth", desc: "Firebase Identity" },
    { icon: Activity, label: "UI Library", desc: "ShadCN + Tailwind" },
    { icon: Users, label: "Deployment", desc: "Render Cloud" },
    { icon: FileText, label: "Docs", desc: "Swagger / OpenAPI" },
] as const;

export function TechStack() {
    return (
        <div className="mb-24">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
                Built with Modern Tech Stack
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {TECH_ITEMS.map((tech, i) => (
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
    );
}
