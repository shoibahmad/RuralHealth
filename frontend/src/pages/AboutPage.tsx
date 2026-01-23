import { motion } from "framer-motion";
import { Github, Linkedin, Mail } from "lucide-react";
import { Button } from "../components/ui/button";

export function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-16">
            <div className="container mx-auto px-6">

                {/* Mission Section */}
                <div className="max-w-4xl mx-auto text-center mb-20">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold text-white mb-8"
                    >
                        Our Mission
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-slate-300 leading-relaxed font-light"
                    >
                        "To democratize access to preventative healthcare by equipping frontline workers with intelligent, easy-to-use digital tools."
                    </motion.p>
                </div>

                {/* Story Grid */}
                <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-6"
                    >
                        <h2 className="text-3xl font-bold text-white">Why RuralHealthAI?</h2>
                        <p className="text-slate-400">
                            Rural India faces a critical shortage of medical specialists. Non-Communicable Diseases (NCDs) like Diabetes and Hypertension often go undetected until it's too late.
                        </p>
                        <p className="text-slate-400">
                            We believe that technology can bridge this gap. By empowering Accredited Social Health Activists (ASHAs) with AI-powered screening capabilities, we can bring hospital-grade diagnostics to the doorstep of every villager.
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="glass-card p-2 rounded-2xl border border-white/5 bg-gradient-to-tr from-teal-500/10 to-blue-500/10"
                    >
                        <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative">
                            {/* Placeholder for Team/Mission Image */}
                            <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                                [Mission Image Placeholder]
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Contact/CTA */}
                <div className="max-w-2xl mx-auto text-center glass-card p-10 rounded-2xl border border-white/5">
                    <h2 className="text-2xl font-bold text-white mb-4">Get in Touch</h2>
                    <p className="text-slate-400 mb-8">
                        Interested in partnering with us or piloting RuralHealthAI in your district?
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button variant="outline" className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10 gap-2">
                            <Mail className="h-4 w-4" /> Contact Sales
                        </Button>
                        <Button variant="outline" className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10 gap-2">
                            <Linkedin className="h-4 w-4" /> Connect on LinkedIn
                        </Button>
                        <Button variant="outline" className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10 gap-2">
                            <Github className="h-4 w-4" /> Open Source
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
