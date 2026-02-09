import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Users,
    Activity,
    AlertTriangle,
    UserCheck
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar
} from "recharts";
// import { useAuth } from "../context/AuthContext";
import { firestoreService } from "../services/firestoreService";

export function OfficerDashboard() {
    // const { token } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const [patients, screenings, workers] = await Promise.all([
                firestoreService.getPatients(),
                firestoreService.getScreenings(),
                firestoreService.getHealthWorkers()
            ]);

            // Overview
            const highRisk = screenings.filter(s => s.risk_level === 'High').length;
            const overview = {
                total_patients: patients.length,
                total_screenings: screenings.length,
                high_risk_count: highRisk,
                total_workers: workers.length,
                active_workers: workers.filter(w => w.is_active).length
            };

            // Risk Dist
            const riskDist = { Low: 0, Medium: 0, High: 0 };
            screenings.forEach(s => {
                if (s.risk_level && s.risk_level in riskDist) riskDist[s.risk_level as keyof typeof riskDist]++;
            });

            // Monthly Trend
            const trendMap: Record<string, { screenings: number, patients: number }> = {};
            screenings.forEach(s => {
                const m = new Date(s.created_at as string).toLocaleString('default', { month: 'short' });
                if (!trendMap[m]) trendMap[m] = { screenings: 0, patients: 0 };
                trendMap[m].screenings++;
            });
            patients.forEach(p => {
                const m = new Date(p.created_at as string).toLocaleString('default', { month: 'short' });
                if (!trendMap[m]) trendMap[m] = { screenings: 0, patients: 0 };
                trendMap[m].patients++;
            });
            const monthly_trend = Object.entries(trendMap).map(([k, v]) => ({ month: k, ...v }));

            // Village Stats
            const villageMap: Record<string, number> = {};
            patients.forEach(p => {
                const v = p.village || 'Unknown';
                villageMap[v] = (villageMap[v] || 0) + 1;
            });
            const village_stats = Object.entries(villageMap)
                .map(([k, v]) => ({ village: k, patient_count: v }))
                .sort((a, b) => b.patient_count - a.patient_count)
                .slice(0, 10);

            // Top Workers 
            const workerMap: Record<string, number> = {};
            patients.forEach(p => {
                if (p.health_worker_id) {
                    const pScreenings = screenings.filter(s => s.patient_id === p.id).length;
                    workerMap[p.health_worker_id] = (workerMap[p.health_worker_id] || 0) + pScreenings;
                }
            });
            const top_workers = workers.map(w => ({
                name: w.full_name,
                screenings: workerMap[w.uid] || 0
            })).sort((a, b) => b.screenings - a.screenings).slice(0, 5);

            setStats({
                overview,
                risk_distribution: riskDist,
                monthly_trend,
                village_stats,
                top_workers
            });

        } catch (error) {
            console.error('Failed to fetch stats:', error);
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

    const RISK_COLORS = {
        Low: '#10b981',
        Medium: '#f59e0b',
        High: '#ef4444'
    };

    const riskData = stats?.risk_distribution ? [
        { name: 'Low Risk', value: stats.risk_distribution.Low, color: RISK_COLORS.Low },
        { name: 'Medium Risk', value: stats.risk_distribution.Medium, color: RISK_COLORS.Medium },
        { name: 'High Risk', value: stats.risk_distribution.High, color: RISK_COLORS.High }
    ] : [];

    return (
        <div className="space-y-8 pb-8">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Health Officer Dashboard</h1>
                <p className="text-slate-400">System-wide overview and health worker management</p>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        label: "Total Patients",
                        value: stats?.overview?.total_patients || 0,
                        icon: Users,
                        color: "text-blue-400",
                        bg: "bg-blue-500/10"
                    },
                    {
                        label: "Total Screenings",
                        value: stats?.overview?.total_screenings || 0,
                        icon: Activity,
                        color: "text-teal-400",
                        bg: "bg-teal-500/10"
                    },
                    {
                        label: "High Risk Cases",
                        value: stats?.overview?.high_risk_count || 0,
                        icon: AlertTriangle,
                        color: "text-red-400",
                        bg: "bg-red-500/10"
                    },
                    {
                        label: "Active Workers",
                        value: `${stats?.overview?.active_workers || 0}/${stats?.overview?.total_workers || 0}`,
                        icon: UserCheck,
                        color: "text-emerald-400",
                        bg: "bg-emerald-500/10"
                    }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card p-6 rounded-2xl border border-white/5 relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500 ${stat.color}`}>
                            <stat.icon className="h-24 w-24" />
                        </div>
                        <div className="relative z-10">
                            <div className={`h-12 w-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                            <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Monthly Trend Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-white">Monthly Trend</h2>
                            <p className="text-sm text-slate-400">Screenings and patient registrations</p>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.monthly_trend || []}>
                                <defs>
                                    <linearGradient id="colorScreenings" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="screenings"
                                    stroke="#2dd4bf"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorScreenings)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="patients"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorPatients)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Risk Distribution */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col"
                >
                    <h2 className="text-lg font-bold text-white mb-2">Risk Distribution</h2>
                    <p className="text-sm text-slate-400 mb-6">System-wide patient risk levels</p>

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
            </div>

            {/* Top Workers Performance */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-card p-6 rounded-2xl border border-white/5"
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-white">Top Performing Workers</h2>
                        <p className="text-sm text-slate-400">Based on screening volume</p>
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.top_workers || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                            />
                            <Bar dataKey="screenings" fill="#2dd4bf" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Village Statistics */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="glass-card rounded-2xl border border-white/5 overflow-hidden"
            >
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-lg font-bold text-white">Village Coverage</h2>
                    <p className="text-sm text-slate-400">Top 10 villages by patient count</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <th className="p-6">Village</th>
                                <th className="p-6">Patient Count</th>
                                <th className="p-6">Coverage</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300 divide-y divide-white/5">
                            {stats?.village_stats?.map((village: any, index: number) => {
                                const maxCount = stats.village_stats[0]?.patient_count || 1;
                                const percentage = (village.patient_count / maxCount) * 100;
                                return (
                                    <tr key={index} className="hover:bg-white/5 transition-colors">
                                        <td className="p-6 font-medium text-white">{village.village}</td>
                                        <td className="p-6">{village.patient_count}</td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-500 w-12">{percentage.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
