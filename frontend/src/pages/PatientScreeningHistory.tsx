import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Calendar, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { firestoreService } from "../services/firestoreService";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

export function PatientScreeningHistory() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            fetchHistory();
        }
    }, [user]);

    const fetchHistory = async () => {
        if (!user) return;
        try {
            const [patientProfile, screenings, appointments] = await Promise.all([
                firestoreService.getPatient(user.uid),
                firestoreService.getScreenings(user.uid),
                firestoreService.getAppointmentsForPatient(user.uid)
            ]);

            // Robustly handle patient profile (fallback to AuthContext if not in 'patients' collection)
            const patient = patientProfile || {
                id: user.uid,
                full_name: user.displayName || user.full_name || 'Patient',
                age: 0,
                gender: 'Not Set',
                village: 'Not Set'
            };

            const historyData = {
                patient,
                screenings,
                appointments,
                recommendations: [], // Add recommendation fetching if available in logic
                total_screenings: screenings.length,
                latest_screening: screenings[0]
            };

            setData(historyData);
        } catch (err) {
            console.error(err);
            setError("Failed to load history");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading your history...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-card p-8 rounded-xl border border-red-500/20">
                <div className="flex items-center gap-3 text-red-400">
                    <AlertCircle className="h-6 w-6" />
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { screenings } = data;

    // Prepare chart data
    const chartData = screenings.slice().reverse().map((s: any) => ({
        date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        risk_score: s.risk_score || 0,
        systolic_bp: s.systolic_bp || 0,
        glucose: s.glucose_level || 0
    }));

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Health History</h1>
                    <p className="text-slate-400">Complete record of your screenings and health data</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">{data.total_screenings}</h3>
                            <p className="text-sm text-slate-400">Total Screenings</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${data.latest_screening?.risk_level === 'High' ? 'bg-red-500/10 text-red-400' :
                            data.latest_screening?.risk_level === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                                'bg-emerald-500/10 text-emerald-400'
                            }`}>
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">
                                {data.latest_screening?.risk_level || 'N/A'}
                            </h3>
                            <p className="text-sm text-slate-400">Latest Risk Level</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">{data.appointments?.length || 0}</h3>
                            <p className="text-sm text-slate-400">Appointments</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">{data.recommendations?.length || 0}</h3>
                            <p className="text-sm text-slate-400">Recommendations</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Risk Score Trend */}
            {chartData.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card p-6 rounded-2xl border border-white/5"
                >
                    <h2 className="text-lg font-bold text-white mb-6">Risk Score Trend</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="risk_score"
                                    stroke="#2dd4bf"
                                    strokeWidth={3}
                                    dot={{ fill: '#2dd4bf', r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            )}

            {/* Screening History Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card rounded-2xl border border-white/5 overflow-hidden"
            >
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-lg font-bold text-white">Screening History</h2>
                    <p className="text-sm text-slate-400">Complete screening records</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <th className="p-6">Date</th>
                                <th className="p-6">BP (Systolic/Diastolic)</th>
                                <th className="p-6">Heart Rate</th>
                                <th className="p-6">Glucose</th>
                                <th className="p-6">Risk Score</th>
                                <th className="p-6">Risk Level</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300 divide-y divide-white/5">
                            {screenings.map((screening: any) => (
                                <tr
                                    key={screening.id}
                                    onClick={() => navigate(`/patient/screenings/${screening.id}`)}
                                    className="hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                    <td className="p-6 font-medium text-white">
                                        {new Date(screening.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </td>
                                    <td className="p-6">
                                        {screening.systolic_bp && screening.diastolic_bp
                                            ? `${screening.systolic_bp}/${screening.diastolic_bp}`
                                            : 'N/A'}
                                    </td>
                                    <td className="p-6">{screening.heart_rate || 'N/A'}</td>
                                    <td className="p-6">{screening.glucose_level || 'N/A'}</td>
                                    <td className="p-6">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                            {screening.risk_score?.toFixed(1) || '0'}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${screening.risk_level === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                            screening.risk_level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            }`}>
                                            {screening.risk_level}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
