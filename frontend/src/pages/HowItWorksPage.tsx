import { motion } from "framer-motion";
import { Stethoscope, Activity, FileText, Smartphone, Cloud, ShieldCheck } from "lucide-react";

const STEPS = [
    {
        title: "1. Rapid Screening",
        desc: "Health workers collect basic vitals (BP, BMI, Heart Rate) using standard field equipment.",
        icon: Stethoscope,
        color: "text-blue-400",
        bg: "bg-blue-500/10"
    },
    {
        title: "2. Voice-Assisted Entry",
        desc: "Use the AI-powered voice interface to record patient data hands-free, even in noisy environments.",
        icon: Smartphone,
        color: "text-purple-400",
        bg: "bg-purple-500/10"
    },
    {
        title: "3. Lab Report Analysis",
        desc: "Simply take a photo of any paper lab report. Gemini vision AI extracts values automatically.",
        icon: FileText,
        color: "text-amber-400",
        bg: "bg-amber-500/10"
    },
    {
        title: "4. Instant Risk Scoring",
        desc: "Our model calculates WHO CVD risk scores offline, identifying high-risk patients immediately.",
        icon: Activity,
        color: "text-teal-400",
        bg: "bg-teal-500/10"
    },
    {
        title: "5. Data Sync",
        desc: "All encrypted records automatically sync to the cloud once internet connectivity is restored.",
        icon: Cloud,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10"
    },
    {
        title: "6. Care Coordination",
        desc: "Doctors at the central hub review high-risk cases and schedule follow-up interventions.",
        icon: ShieldCheck,
        color: "text-green-400",
        bg: "bg-green-500/10"
    }
];

export function HowItWorksPage() {
    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-16">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold text-white mb-6"
                    >
                        How <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">RuralHealthAI</span> Works
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 text-lg max-w-2xl mx-auto"
                    >
                        A seamless, end-to-end workflow designed for community health workers in low-resource settings.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {STEPS.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-8 rounded-2xl border border-white/5 hover:bg-white/5 transition-all group"
                        >
                            <div className={`h-14 w-14 rounded-xl ${step.bg} ${step.color} flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform`}>
                                <step.icon className="h-7 w-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                            <p className="text-slate-400 leading-relaxed">
                                {step.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
