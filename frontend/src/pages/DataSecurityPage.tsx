import { Shield, Lock, FileKey, Server } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";

export default function DataSecurityPage() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-white pt-20 pb-16">
            <div className="container mx-auto px-4 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <div className="text-center space-y-4 mb-12">
                        <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 text-teal-400 mb-4">
                            <Shield className="h-12 w-12" />
                        </div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
                            Data Security & Privacy
                        </h1>
                        <p className="text-xl text-slate-400">
                            Your health data is sensitive. We use state-of-the-art encryption to keep it safe.
                        </p>
                    </div>

                    {/* Core Security Features */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card p-6 rounded-2xl border border-white/5">
                            <Lock className="h-8 w-8 text-amber-400 mb-4" />
                            <h3 className="text-xl font-bold mb-2">End-to-End Encryption</h3>
                            <p className="text-slate-400">
                                All data transmitted between your device and our servers is encrypted using industry-standard TLS 1.3 protocols.
                            </p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl border border-white/5">
                            <FileKey className="h-8 w-8 text-purple-400 mb-4" />
                            <h3 className="text-xl font-bold mb-2">HIPAA Compliant Standard</h3>
                            <p className="text-slate-400">
                                Our data handling practices align with HIPAA guidelines to ensure patient confidentiality and data integrity.
                            </p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl border border-white/5">
                            <Server className="h-8 w-8 text-blue-400 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Secure Cloud Storage</h3>
                            <p className="text-slate-400">
                                Patient records are stored in secured, isolated database instances with strict access controls and regular backups.
                            </p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl border border-white/5">
                            <Shield className="h-8 w-8 text-emerald-400 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Role-Based Access</h3>
                            <p className="text-slate-400">
                                Strictly enforced access controls ensure that only authorized health workers can view patient data.
                            </p>
                        </div>
                    </div>

                    {/* Detailed Policy Section */}
                    <div className="glass-card p-8 rounded-2xl border border-white/5 space-y-6">
                        <h2 className="text-2xl font-bold">Our Commitment</h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>
                                At RuralHealthAI, we understand that trust is the foundation of healthcare. We are committed to transparency in how we handle your data.
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>We never sell your personal health data to third parties.</li>
                                <li>We use data solely for the purpose of providing health screenings and connecting you with care.</li>
                                <li>You have the right to request deletion of your data at any time.</li>
                                <li>We regularly audit our systems for vulnerabilities.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex justify-center pt-8">
                        <Link to="/">
                            <Button className="bg-white/10 hover:bg-white/20 text-white">
                                Return to Home
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
