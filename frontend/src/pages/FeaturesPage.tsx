import { motion } from "framer-motion";
import {
    WifiOff,
    Mic,
    ScanText,
    BarChart3,
    Lock,
    Globe,
    Zap,
    Users
} from "lucide-react";

const FEATURES = [
    {
        title: "Offline-First Architecture",
        desc: "Fully functional without internet. Data syncs automatically when connectivity returns.",
        icon: WifiOff,
        color: "text-rose-400"
    },
    {
        title: "Voice AI Input",
        desc: "Dictate patient vitals and notes in local languages using Gemini 1.5 Pro multimodal capabilities.",
        icon: Mic,
        color: "text-purple-400"
    },
    {
        title: "Smart OCR Scanner",
        desc: "Extract data from handwritten or printed lab reports tailored for non-standard formats.",
        icon: ScanText,
        color: "text-blue-400"
    },
    {
        title: "Population Analytics",
        desc: "Real-time dashboard for medical officers to track disease hotspots and screening progress.",
        icon: BarChart3,
        color: "text-teal-400"
    },
    {
        title: "Enterprise Security",
        desc: "HIPAA-compliant data encryption at rest and in transit. Role-based access control.",
        icon: Lock,
        color: "text-emerald-400"
    },
    {
        title: "Multi-Language Support",
        desc: "Interface available in 10+ regional languages to empower local health workers.",
        icon: Globe,
        color: "text-indigo-400"
    },
    {
        title: "Instant Risk Stratification",
        desc: "WHO-verified algorithms to classify patients into Low, Moderate, or High risk categories.",
        icon: Zap,
        color: "text-amber-400"
    },
    {
        title: "Community Management",
        desc: "Longitudinal tracking of patient health records across villages and families.",
        icon: Users,
        color: "text-pink-400"
    }
];

export function FeaturesPage() {
    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-16">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold text-white mb-6"
                    >
                        Pioneering <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Rural Healthcare</span> AI
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 text-xl max-w-2xl mx-auto font-light"
                    >
                        Our platform combines offline reliability with state-of-the-art AI to transform how healthcare is delivered in remote regions.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                    {FEATURES.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group"
                        >
                            <div className="mb-4 bg-slate-900/50 w-12 h-12 rounded-lg flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-colors">
                                <feature.icon className={`h-6 w-6 ${feature.color}`} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
