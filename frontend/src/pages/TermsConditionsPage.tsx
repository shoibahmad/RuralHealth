import { motion } from "framer-motion";
import { FileText } from "lucide-react";

export function TermsConditionsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-16">
            <div className="container mx-auto px-4 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 rounded-2xl border border-white/5"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Terms & Conditions</h1>
                            <p className="text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none space-y-6 text-slate-300">
                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
                            <p>
                                By accessing and using RuralHealthAI ("the Platform"), you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">2. Description of Service</h2>
                            <p>
                                RuralHealthAI provides a digital health screening platform designed for community health workers to assess and manage health risks in rural populations. The Platform includes:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Patient registration and demographic data collection</li>
                                <li>Vital signs recording and health screening</li>
                                <li>AI-powered risk assessment for chronic diseases</li>
                                <li>Health recommendations and referral pathways</li>
                                <li>Population health analytics and reporting</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">3. User Eligibility</h2>
                            <h3 className="text-lg font-semibold text-white mb-2">3.1 Health Workers</h3>
                            <p>
                                To register as a health worker, you must be a qualified healthcare professional or community health worker authorized to provide health screening services.
                            </p>
                            <h3 className="text-lg font-semibold text-white mb-2 mt-4">3.2 Health Officers</h3>
                            <p>
                                Health officer accounts are restricted to authorized supervisory personnel responsible for population health management.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">4. User Responsibilities</h2>
                            <h3 className="text-lg font-semibold text-white mb-2">4.1 Account Security</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Maintain confidentiality of your login credentials</li>
                                <li>Notify us immediately of any unauthorized access</li>
                                <li>Use strong passwords and change them regularly</li>
                                <li>Do not share your account with others</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-white mb-2 mt-4">4.2 Data Accuracy</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Provide accurate and complete patient information</li>
                                <li>Record vital signs and health data correctly</li>
                                <li>Update information promptly when changes occur</li>
                                <li>Verify patient identity before data entry</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-white mb-2 mt-4">4.3 Professional Conduct</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Maintain patient confidentiality at all times</li>
                                <li>Use the Platform only for legitimate healthcare purposes</li>
                                <li>Follow applicable healthcare regulations and guidelines</li>
                                <li>Obtain informed consent before collecting patient data</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">5. Medical Disclaimer</h2>
                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
                                <p className="font-semibold text-amber-400 mb-2">IMPORTANT NOTICE:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>The Platform provides risk assessment tools, not medical diagnosis</li>
                                    <li>AI-generated recommendations are for guidance only</li>
                                    <li>Always consult qualified healthcare professionals for medical decisions</li>
                                    <li>The Platform does not replace professional medical judgment</li>
                                    <li>In emergencies, seek immediate medical attention</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">6. Prohibited Activities</h2>
                            <p>You agree not to:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Use the Platform for any unlawful purpose</li>
                                <li>Attempt to gain unauthorized access to systems or data</li>
                                <li>Interfere with or disrupt the Platform's operation</li>
                                <li>Upload malicious code or viruses</li>
                                <li>Scrape, mine, or harvest data without permission</li>
                                <li>Impersonate another user or entity</li>
                                <li>Share patient data without proper authorization</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">7. Intellectual Property</h2>
                            <p>
                                All content, features, and functionality of the Platform are owned by RuralHealthAI and protected by copyright, trademark, and other intellectual property laws. You may not:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Copy, modify, or distribute Platform content</li>
                                <li>Reverse engineer or decompile the software</li>
                                <li>Remove copyright or proprietary notices</li>
                                <li>Use our trademarks without permission</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">8. Data Ownership and Usage</h2>
                            <h3 className="text-lg font-semibold text-white mb-2">8.1 Patient Data</h3>
                            <p>
                                Patient health data remains the property of the patient. We act as a data processor on behalf of healthcare providers.
                            </p>
                            <h3 className="text-lg font-semibold text-white mb-2 mt-4">8.2 Aggregate Data</h3>
                            <p>
                                We may use anonymized, aggregate data for research, analytics, and service improvement purposes.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">9. Limitation of Liability</h2>
                            <p>
                                To the maximum extent permitted by law, RuralHealthAI shall not be liable for:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Indirect, incidental, or consequential damages</li>
                                <li>Loss of data, profits, or business opportunities</li>
                                <li>Medical outcomes or treatment decisions</li>
                                <li>Third-party actions or content</li>
                                <li>Service interruptions or technical failures</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">10. Indemnification</h2>
                            <p>
                                You agree to indemnify and hold harmless RuralHealthAI from any claims, damages, or expenses arising from your use of the Platform or violation of these Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">11. Service Availability</h2>
                            <p>
                                While we strive for 99.9% uptime, we do not guarantee uninterrupted service. We may suspend or terminate services for maintenance, updates, or security reasons.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">12. Termination</h2>
                            <p>
                                We reserve the right to suspend or terminate your account if you violate these Terms or engage in prohibited activities. You may terminate your account at any time by contacting us.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">13. Governing Law</h2>
                            <p>
                                These Terms are governed by the laws of India. Any disputes shall be resolved in the courts of New Delhi, India.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">14. Changes to Terms</h2>
                            <p>
                                We may modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the modified Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">15. Contact Information</h2>
                            <div className="bg-slate-800/50 p-4 rounded-lg mt-3">
                                <p className="mb-1"><strong>Email:</strong> legal@ruralhealthai.org</p>
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
