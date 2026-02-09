import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Activity, Calendar, FileText, TrendingUp } from "lucide-react";
import { Button } from "../components/ui/button";
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

export function PatientHistoryPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchPatientHistory();
    }, [id]);

    const fetchPatientHistory = async () => {
        try {
            if (!id) return;
            const patient = await firestoreService.getPatient(id);

            if (patient) {
                const screenings = await firestoreService.getScreenings(id);
                const appointments = await firestoreService.getAppointmentsForPatient(id);

                // Construct Data Object matching implicit interface
                const historyData = {
                    patient,
                    screenings,
                    appointments,
                    recommendations: [],
                    total_screenings: screenings.length,
                    latest_screening: screenings[0] // Assumes sorted desc
                };
                setData(historyData);
            }
        } catch (error) {
            console.error('Failed to fetch patient history:', error);
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

    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-400">Patient not found</p>
            </div>
        );
    }

    const patient = data.patient;
    const screenings = data.screenings || [];

    // Prepare chart data
    const chartData = screenings.slice().reverse().map((s: any) => ({
        date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        risk_score: s.risk_score || 0,
        systolic_bp: s.systolic_bp || 0,
        glucose: s.glucose_level || 0
    }));

    return (
        <div className="space-y-8 pb-8">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="text-slate-300 hover:text-white hover:bg-white/10"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-white">{patient.full_name}</h1>
                    <p className="text-slate-400">
                        {patient.age} years • {patient.gender} • {patient.village}
                    </p>
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

            {/* Screening History */}
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
                                    onClick={() => navigate(user?.role === 'patient' || !user ? `/patient/screenings/${screening.id}` : `/dashboard/screenings/${screening.id}`)}
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

            {/* Recommendations */}
            {data.recommendations && data.recommendations.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass-card p-6 rounded-2xl border border-white/5"
                >
                    <h2 className="text-lg font-bold text-white mb-4">Health Recommendations</h2>
                    <div className="space-y-3">
                        {data.recommendations.slice(0, 5).map((rec: any) => (
                            <div key={rec.id} className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-white mb-1">{rec.title}</h3>
                                        <p className="text-sm text-slate-400">{rec.description}</p>
                                    </div>
                                    <span className={`ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rec.priority === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                        rec.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        }`}>
                                        {rec.priority}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
