import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Activity, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "../components/ui/button";
import { firestoreService } from "../services/firestoreService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from "recharts";

export function WorkerDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [workerData, setWorkerData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWorkerDetails();
    }, [id]);

    const fetchWorkerDetails = async () => {
        if (!id) return;
        try {
            // 1. Get Worker Info
            const workerDocRef = doc(db, "users", id);
            const workerSnap = await getDoc(workerDocRef);

            if (!workerSnap.exists()) {
                setWorkerData(null);
                setLoading(false);
                return;
            }
            const worker = workerSnap.data();

            // 2. Get Stats
            const stats = await firestoreService.getDashboardStats(id);

            // 3. Get Patients
            const patients = await firestoreService.getPatients(id);

            setWorkerData({
                worker: { ...worker, uid: id },
                stats: {
                    ...stats,
                    average_risk_score: 3.2 // Mock average for now
                },
                patients: patients
            });
        } catch (error) {
            console.error('Failed to fetch worker details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    if (!workerData) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-400">Worker not found</p>
            </div>
        );
    }

    const RISK_COLORS = {
        Low: '#10b981',
        Medium: '#f59e0b',
        High: '#ef4444'
    };

    const riskData = [
        { name: 'Low Risk', value: workerData.stats.risk_distribution.Low, color: RISK_COLORS.Low },
        { name: 'Medium Risk', value: workerData.stats.risk_distribution.Medium, color: RISK_COLORS.Medium },
        { name: 'High Risk', value: workerData.stats.risk_distribution.High, color: RISK_COLORS.High }
    ];

    return (
        <div className="space-y-8 pb-8">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/officer/workers')}
                    className="text-slate-300 hover:text-white hover:bg-white/10"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-white">{workerData.worker.full_name || 'Health Worker'}</h1>
                    <p className="text-slate-400">{workerData.worker.email}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        label: "Total Patients",
                        value: workerData.stats.total_patients,
                        icon: Users,
                        color: "text-blue-400",
                        bg: "bg-blue-500/10"
                    },
                    {
                        label: "Total Screenings",
                        value: workerData.stats.total_screenings,
                        icon: Activity,
                        color: "text-teal-400",
                        bg: "bg-teal-500/10"
                    },
                    {
                        label: "High Risk Cases",
                        value: workerData.stats.risk_distribution.High,
                        icon: AlertTriangle,
                        color: "text-red-400",
                        bg: "bg-red-500/10"
                    },
                    {
                        label: "Avg Risk Score",
                        value: workerData.stats.average_risk_score,
                        icon: TrendingUp,
                        color: "text-amber-400",
                        bg: "bg-amber-500/10"
                    }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card p-6 rounded-2xl border border-white/5"
                    >
                        <div className={`h-12 w-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                        <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Risk Distribution */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col"
                >
                    <h2 className="text-lg font-bold text-white mb-2">Risk Distribution</h2>
                    <p className="text-sm text-slate-400 mb-6">Patient risk breakdown</p>

                    <div className="flex-1 min-h-[200px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={riskData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {riskData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-6">
                        {riskData.map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-xs text-slate-300">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/5"
                >
                    <h2 className="text-lg font-bold text-white mb-2">Recent Patients</h2>
                    <p className="text-sm text-slate-400 mb-6">Latest patient registrations</p>

                    <div className="space-y-3">
                        {workerData.patients.map((patient: any) => (
                            <div key={patient.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-white/5 hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm border border-white/10">
                                        {patient.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{patient.full_name}</p>
                                        <p className="text-xs text-slate-400">{patient.village} • Age {patient.age}</p>
                                    </div>
                                </div>
                                {patient.latest_risk_level && (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${patient.latest_risk_level === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                        patient.latest_risk_level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        }`}>
                                        {patient.latest_risk_level}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
