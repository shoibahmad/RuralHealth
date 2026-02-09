import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-16">
            <div className="container mx-auto px-4 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 rounded-2xl border border-white/5"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                            <Shield className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
                            <p className="text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none space-y-6 text-slate-300">
                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">1. Introduction</h2>
                            <p>
                                RuralHealthAI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our health screening platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">2. Information We Collect</h2>
                            <h3 className="text-lg font-semibold text-white mb-2">2.1 Personal Information</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Name, age, gender, and contact information</li>
                                <li>Village/location data</li>
                                <li>Health worker credentials and role information</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-white mb-2 mt-4">2.2 Health Information</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Vital signs (blood pressure, heart rate, BMI)</li>
                                <li>Lab results (glucose, cholesterol levels)</li>
                                <li>Lifestyle information (smoking, alcohol, physical activity)</li>
                                <li>Risk assessment scores and health recommendations</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-white mb-2 mt-4">2.3 Technical Information</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Device information and IP address</li>
                                <li>Browser type and version</li>
                                <li>Usage data and analytics</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">3. How We Use Your Information</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>To provide health screening and risk assessment services</li>
                                <li>To generate personalized health recommendations</li>
                                <li>To enable health workers to track and manage patient care</li>
                                <li>To generate aggregate health statistics and analytics</li>
                                <li>To improve our services and develop new features</li>
                                <li>To comply with legal and regulatory requirements</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">4. Data Security</h2>
                            <p>
                                We implement industry-standard security measures to protect your information:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>End-to-end encryption for data transmission</li>
                                <li>Secure authentication using JWT tokens</li>
                                <li>Role-based access control</li>
                                <li>Regular security audits and updates</li>
                                <li>Encrypted database storage</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">5. Data Sharing and Disclosure</h2>
                            <p>We do not sell your personal information. We may share your data only in the following circumstances:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>With your assigned health worker for care coordination</li>
                                <li>With health officers for population health management</li>
                                <li>With healthcare providers for referrals (with your consent)</li>
                                <li>When required by law or legal process</li>
                                <li>To protect rights, property, or safety</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">6. Your Rights</h2>
                            <p>You have the right to:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Access your personal and health information</li>
                                <li>Request correction of inaccurate data</li>
                                <li>Request deletion of your data (subject to legal requirements)</li>
                                <li>Opt-out of non-essential data collection</li>
                                <li>Receive a copy of your data in a portable format</li>
                                <li>Withdraw consent at any time</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">7. Data Retention</h2>
                            <p>
                                We retain your information for as long as necessary to provide services and comply with legal obligations. Health records are typically retained for 7 years as per healthcare regulations.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">8. Children's Privacy</h2>
                            <p>
                                Our services are not directed to children under 13. We do not knowingly collect information from children without parental consent.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">9. International Data Transfers</h2>
                            <p>
                                Your data is stored on secure servers located in India. If you access our services from outside India, your data may be transferred internationally.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">10. Changes to This Policy</h2>
                            <p>
                                We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notification.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">11. Contact Us</h2>
                            <p>
                                If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
                            </p>
                            <div className="bg-slate-800/50 p-4 rounded-lg mt-3">
                                <p className="mb-1"><strong>Email:</strong> privacy@ruralhealthai.org</p>
                                <p className="mb-1"><strong>Phone:</strong> +1 (555) 123-4567</p>
                                <p><strong>Address:</strong> Rural Health Initiative, New Delhi, India</p>
                            </div>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
