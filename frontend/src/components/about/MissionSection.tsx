import { motion } from "framer-motion";

export function MissionSection() {
    return (
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
                Empowering Frontline Workers with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                    Intelligent Tools
                </span>
            </motion.h1>
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-slate-300 leading-relaxed font-light"
            >
                "RuralHealthAI is a production-ready Digital Health Survey & Risk Screening
                Tool designed to democratize access to preventative healthcare."
            </motion.p>
        </div>
    );
}
