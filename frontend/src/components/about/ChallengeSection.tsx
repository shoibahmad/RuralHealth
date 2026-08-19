import { motion } from "framer-motion";
import { Wifi, Brain, Globe, Shield } from "lucide-react";

export function ChallengeSection() {
    return (
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
                        <strong className="text-white">The Gap:</strong> Rural regions face
                        a critical shortage of medical specialists. Non-Communicable
                        Diseases (NCDs) like Diabetes and Hypertension often go undetected
                        until major complications arise.
                    </p>
                    <p>
                        <strong className="text-white">Our Solution:</strong> By equipping
                        Accredited Social Health Activists (ASHAs) with AI-powered screening
                        tools, we bring hospital-grade diagnostics to the doorstep of every
                        villager.
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
                            { icon: Shield, text: "Secure & Private Patient Data" },
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
    );
}
