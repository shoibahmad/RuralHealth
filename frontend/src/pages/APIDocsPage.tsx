import { useState } from "react";
import { motion } from "framer-motion";
import { Code, Lock, Zap, Server, Shield, Database, Activity, Menu, X, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

// API Documentation Data
const sections = [
    { id: "intro", title: "Introduction", icon: Server },
    { id: "auth", title: "Authentication", icon: Lock },
    { id: "patients", title: "Patients", icon: UsersIcon },
    { id: "screening", title: "Screening & AI", icon: Activity },
    { id: "officer", title: "Health Officer", icon: Shield },
    { id: "errors", title: "Errors & Limits", icon: Zap },
];

function UsersIcon({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
}

export function APIDocsPage() {
    const [activeSection, setActiveSection] = useState("intro");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setIsSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex pt-16">

            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-lg hover:bg-teal-600 transition-colors"
            >
                {isSidebarOpen ? <X /> : <Menu />}
            </button>

            {/* Sidebar Navigation */}
            <aside className={cn(
                "fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-slate-900 border-r border-white/5 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-8 text-teal-400">
                        <Code className="h-6 w-6" />
                        <span className="font-bold text-lg">API Reference</span>
                    </div>
                    <nav className="space-y-1">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    activeSection === section.id
                                        ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <section.icon className="h-4 w-4" />
                                {section.title}
                                {activeSection === section.id && (
                                    <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
                                )}
                            </button>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-5xl mx-auto p-6 lg:p-12 space-y-24">

                {/* Introduction */}
                <section id="intro" className="scroll-mt-24 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-4xl font-bold text-white mb-4">RuralHealthAI API</h1>
                        <p className="text-xl text-slate-400 leading-relaxed">
                            Welcome to the developer documentation. This REST API allows you to integrate health screening, patient management, and AI analysis features into your own applications.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-slate-900 border border-white/5 flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                            <span className="text-slate-300 font-mono text-sm">Base URL:</span>
                            <code className="text-emerald-400 font-mono bg-emerald-950/30 px-2 py-1 rounded">https://api.ruralhealth.ai/api</code>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900 border border-white/5 flex items-center gap-3">
                            <Database className="h-4 w-4 text-blue-400" />
                            <span className="text-slate-300 font-mono text-sm">Version:</span>
                            <span className="text-blue-400 font-mono">v1.0.0</span>
                        </div>
                    </div>
                </section>

                {/* Authentication */}
                <section id="auth" className="scroll-mt-24 space-y-8">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                        <Lock className="h-6 w-6 text-teal-400" />
                        <h2 className="text-2xl font-bold text-white">Authentication</h2>
                    </div>

                    <div className="prose prose-invert max-w-none text-slate-400">
                        <p>
                            The API uses <span className="text-white font-medium">JWT (JSON Web Tokens)</span> for authentication. You must include the token in the Authorization header of every request.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Endpoint
                            method="POST"
                            path="/auth/login"
                            title="Obtain Access Token"
                            description="Exchange user credentials for a JWT access token."
                        />
                        <CodeBlock
                            language="bash"
                            code={`curl -X POST https://api.ruralhealth.ai/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "worker@example.com",
    "password": "secure_password"
  }'`}
                        />
                        <CodeBlock
                            language="json"
                            title="Response"
                            code={`{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600
}`}
                        />
                    </div>
                </section>

                {/* Patients */}
                <section id="patients" className="scroll-mt-24 space-y-8">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                        <UsersIcon className="h-6 w-6 text-blue-400" />
                        <h2 className="text-2xl font-bold text-white">Patients</h2>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <Endpoint
                                method="GET"
                                path="/screening/patients"
                                title="List Patients"
                                description="Retrieve a paginated list of patients. Uses filtering by village or risk."
                            />
                            <CodeBlock
                                language="bash"
                                code={`curl -X GET "https://api.ruralhealth.ai/api/screening/patients?risk=High" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
                            />
                        </div>

                        <div>
                            <Endpoint
                                method="POST"
                                path="/screening/patients"
                                title="Create Patient"
                                description="Register a new patient in the system."
                            />
                            <div className="grid lg:grid-cols-2 gap-6">
                                <div className="space-y-4 text-sm text-slate-400">
                                    <h4 className="text-white font-medium">Body Parameters</h4>
                                    <ul className="space-y-2">
                                        <Param name="full_name" type="string" required>Full legal name</Param>
                                        <Param name="age" type="integer" required>Age in years</Param>
                                        <Param name="gender" type="string" required>Male, Female, or Other</Param>
                                        <Param name="village" type="string" required>Village name</Param>
                                    </ul>
                                </div>
                                <CodeBlock
                                    language="json"
                                    code={`{
  "full_name": "Ramesh Kumar",
  "age": 45,
  "gender": "Male",
  "village": "Rampur",
  "phone": "+919876543210"
}`}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Screening & AI */}
                <section id="screening" className="scroll-mt-24 space-y-8">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                        <Activity className="h-6 w-6 text-purple-400" />
                        <h2 className="text-2xl font-bold text-white">Screening & AI Analysis</h2>
                    </div>

                    <p className="text-slate-400">
                        When you submit a screening, the system automatically triggers the <span className="text-purple-400 font-medium">Gemini AI Engine</span> to analyze the vitals and generate a risk assessment.
                    </p>

                    <Endpoint
                        method="POST"
                        path="/screening/screenings"
                        title="Submit Screening"
                        description="Records patient vitals and returns immediate AI analysis."
                    />

                    <div className="grid lg:grid-cols-2 gap-6">
                        <CodeBlock
                            language="json"
                            title="Request Body"
                            code={`{
  "patient_id": 123,
  "systolic_bp": 145,
  "diastolic_bp": 95,
  "heart_rate": 88,
  "glucose_level": 160,
  "smoking_status": "Current",
  "physical_activity": "Low"
}`}
                        />
                        <CodeBlock
                            language="json"
                            title="AI Response"
                            code={`{
  "id": 456,
  "risk_level": "High",
  "risk_score": 85,
  "risk_notes": "Hypertensive crisis risk combined with elevated glucose.",
  "ai_analysis": {
    "summary": "Patient exhibits signs of Stage 2 Hypertension...",
    "recommendations": [
      "Immediate medical consultation required",
      "Reduce sodium intake to <2g/day"
    ]
  }
}`}
                        />
                    </div>
                </section>

                {/* Errors */}
                <section id="errors" className="scroll-mt-24 space-y-8 pb-32">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                        <Zap className="h-6 w-6 text-amber-400" />
                        <h2 className="text-2xl font-bold text-white">Errors & Rate Limits</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { code: 400, text: "Bad Request - Invalid inputs" },
                            { code: 401, text: "Unauthorized - Invalid token" },
                            { code: 403, text: "Forbidden - Insufficient permissions" },
                            { code: 429, text: "Too Many Requests - Rate limit exceeded" },
                        ].map((err) => (
                            <div key={err.code} className="p-4 rounded-lg bg-slate-900/50 border border-white/5 flex justify-between items-center">
                                <span className="text-slate-400">{err.text}</span>
                                <span className={cn(
                                    "font-mono font-bold px-2 py-0.5 rounded text-sm",
                                    err.code === 429 ? "text-amber-400 bg-amber-950/30" : "text-red-400 bg-red-950/30"
                                )}>{err.code}</span>
                            </div>
                        ))}
                    </div>
                </section>

            </main>
        </div>
    );
}

// Helper Components
function Endpoint({ method, path, title, description }: { method: string, path: string, title: string, description: string }) {
    const color = method === "GET" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
        method === "POST" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
            "text-amber-400 bg-amber-500/10 border-amber-500/20";

    return (
        <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <div className="flex items-center gap-3 font-mono text-sm">
                <span className={cn("px-2.5 py-0.5 rounded border font-bold", color)}>{method}</span>
                <span className="text-slate-300">{path}</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        </div>
    )
}

function CodeBlock({ language, code, title }: { language: string, code: string, title?: string }) {
    return (
        <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0d1117]">
            {title && <div className="px-4 py-2 border-b border-white/5 text-xs text-slate-500 font-medium uppercase tracking-wider bg-white/5">{title}</div>}
            <pre className="p-4 overflow-x-auto text-sm text-slate-300 font-mono leading-relaxed">
                <code className={`language-${language}`}>{code}</code>
            </pre>
        </div>
    )
}

function Param({ name, type, required, children }: { name: string, type: string, required?: boolean, children: React.ReactNode }) {
    return (
        <li className="flex gap-2 text-sm">
            <code className="text-teal-400 font-mono">{name}</code>
            <span className="text-slate-600 font-mono text-xs mt-0.5">({type})</span>
            {required && <span className="text-amber-500 text-xs mt-0.5 font-medium">required</span>}
            <span className="text-slate-400">- {children}</span>
        </li>
    )
}

