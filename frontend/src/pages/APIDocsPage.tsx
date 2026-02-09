import { motion } from "framer-motion";
import { Code, Lock, Zap } from "lucide-react";

export function APIDocsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-16">
            <div className="container mx-auto px-4 max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* Header */}
                    <div className="glass-card p-8 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                                <Code className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">API Documentation</h1>
                                <p className="text-slate-400">RESTful API for RuralHealthAI Platform</p>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-6">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                                <span className="text-xs text-emerald-400 font-medium">v1.0.0</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                                <span className="text-xs text-blue-400 font-medium">Base URL: /api</span>
                            </div>
                        </div>
                    </div>

                    {/* Authentication */}
                    <div className="glass-card p-8 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                            <Lock className="h-6 w-6 text-teal-400" />
                            <h2 className="text-2xl font-bold text-white">Authentication</h2>
                        </div>
                        <p className="text-slate-300 mb-4">
                            All API requests require authentication using JWT Bearer tokens.
                        </p>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5 font-mono text-sm">
                            <span className="text-slate-500">Authorization:</span> <span className="text-teal-400">Bearer YOUR_JWT_TOKEN</span>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">POST /auth/register</h3>
                                <p className="text-slate-400 text-sm mb-3">Register a new user account</p>
                                <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                                    <pre className="text-xs text-slate-300 overflow-x-auto">
{`{
  "email": "worker@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "role": "health_worker"
}`}
                                    </pre>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">POST /auth/login</h3>
                                <p className="text-slate-400 text-sm mb-3">Login and receive JWT token</p>
                                <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                                    <pre className="text-xs text-slate-300 overflow-x-auto">
{`Form Data:
username: worker@example.com
password: securepassword

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}`}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Patient Endpoints */}
                    <div className="glass-card p-8 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                            <Zap className="h-6 w-6 text-blue-400" />
                            <h2 className="text-2xl font-bold text-white">Patient Management</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">GET</span>
                                    <code className="text-slate-300">/screening/patients</code>
                                </div>
                                <p className="text-slate-400 text-sm mb-3">List all patients (filtered by health worker)</p>
                                <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                                    <pre className="text-xs text-slate-300 overflow-x-auto">
{`Query Parameters:
- search: string (optional)
- village: string (optional)
- risk: "Low" | "Medium" | "High" (optional)

Response: Array of Patient objects`}
                                    </pre>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-bold">POST</span>
                                    <code className="text-slate-300">/screening/patients</code>
                                </div>
                                <p className="text-slate-400 text-sm mb-3">Create a new patient</p>
                                <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                                    <pre className="text-xs text-slate-300 overflow-x-auto">
{`{
  "full_name": "Jane Smith",
  "age": 45,
  "gender": "Female",
  "village": "Rampur",
  "phone": "+91-9876543210"
}`}
                                    </pre>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">GET</span>
                                    <code className="text-slate-300">/screening/patients/:id/history</code>
                                </div>
                                <p className="text-slate-400 text-sm">Get complete patient screening history</p>
                            </div>
                        </div>
                    </div>

                    {/* Screening Endpoints */}
                    <div className="glass-card p-8 rounded-2xl border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-6">Health Screening</h2>

                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-bold">POST</span>
                                    <code className="text-slate-300">/screening/screenings</code>
                                </div>
                                <p className="text-slate-400 text-sm mb-3">Submit new screening data with automatic risk calculation</p>
                                <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                                    <pre className="text-xs text-slate-300 overflow-x-auto">
{`{
  "patient_id": 1,
  "height_cm": 165,
  "weight_kg": 70,
  "systolic_bp": 140,
  "diastolic_bp": 90,
  "heart_rate": 75,
  "glucose_level": 120,
  "cholesterol_level": 200,
  "smoking_status": "Never",
  "alcohol_usage": "Occasional",
  "physical_activity": "Moderate"
}

Response includes:
- risk_score: 0-100
- risk_level: "Low" | "Medium" | "High"
- risk_notes: Detailed analysis
- Auto-generated recommendations`}
                                    </pre>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">GET</span>
                                    <code className="text-slate-300">/screening/screenings</code>
                                </div>
                                <p className="text-slate-400 text-sm">List all screenings (filtered by health worker)</p>
                            </div>
                        </div>
                    </div>

                    {/* Health Officer Endpoints */}
                    <div className="glass-card p-8 rounded-2xl border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-6">Health Officer Endpoints</h2>
                        <p className="text-amber-400 text-sm mb-4">⚠️ Requires health_officer or admin role</p>

                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">GET</span>
                                    <code className="text-slate-300">/officer/dashboard</code>
                                </div>
                                <p className="text-slate-400 text-sm">Get system-wide dashboard statistics</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">GET</span>
                                    <code className="text-slate-300">/officer/workers</code>
                                </div>
                                <p className="text-slate-400 text-sm">List all health workers with performance stats</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs font-bold">PATCH</span>
                                    <code className="text-slate-300">/officer/patients/:id/update</code>
                                </div>
                                <p className="text-slate-400 text-sm">Update patient information</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">GET</span>
                                    <code className="text-slate-300">/officer/analytics</code>
                                </div>
                                <p className="text-slate-400 text-sm">Get comprehensive system analytics</p>
                            </div>
                        </div>
                    </div>

                    {/* Response Codes */}
                    <div className="glass-card p-8 rounded-2xl border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-6">HTTP Response Codes</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-emerald-400 font-bold">200</span>
                                    <span className="text-slate-300">OK</span>
                                </div>
                                <p className="text-slate-400 text-xs">Request successful</p>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-emerald-400 font-bold">201</span>
                                    <span className="text-slate-300">Created</span>
                                </div>
                                <p className="text-slate-400 text-xs">Resource created successfully</p>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-amber-400 font-bold">400</span>
                                    <span className="text-slate-300">Bad Request</span>
                                </div>
                                <p className="text-slate-400 text-xs">Invalid request data</p>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-red-400 font-bold">401</span>
                                    <span className="text-slate-300">Unauthorized</span>
                                </div>
                                <p className="text-slate-400 text-xs">Authentication required</p>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-red-400 font-bold">403</span>
                                    <span className="text-slate-300">Forbidden</span>
                                </div>
                                <p className="text-slate-400 text-xs">Insufficient permissions</p>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-red-400 font-bold">404</span>
                                    <span className="text-slate-300">Not Found</span>
                                </div>
                                <p className="text-slate-400 text-xs">Resource not found</p>
                            </div>
                        </div>
                    </div>

                    {/* Rate Limiting */}
                    <div className="glass-card p-8 rounded-2xl border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4">Rate Limiting</h2>
                        <p className="text-slate-300 mb-4">
                            API requests are limited to prevent abuse:
                        </p>
                        <ul className="space-y-2 text-slate-300">
                            <li>• <strong>Standard users:</strong> 100 requests per minute</li>
                            <li>• <strong>Health officers:</strong> 500 requests per minute</li>
                            <li>• <strong>Bulk operations:</strong> 10 requests per minute</li>
                        </ul>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
