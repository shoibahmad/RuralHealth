import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { firestoreService } from "../services/firestoreService";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { TrendingUp, Users, Activity, MapPin } from "lucide-react";

export function SystemAnalyticsPage() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const stats = await firestoreService.getDashboardStats();

            // Mocking detailed distributions as they require complex aggregation not available in simple client-side stats yet
            const mockData = {
                age_distribution: { "18-30": 15, "31-50": 45, "51-70": 30, "70+": 10 },
                gender_distribution: [
                    { gender: "Male", count: 45 },
                    { gender: "Female", count: 55 },
                    { gender: "Other", count: 2 }
                ],
                risk_factor_prevalence: {
                    "Hypertension": 35,
                    "Diabetes": 28,
                    "Smoking": 22,
                    "Obesity": 40,
                    "Alcohol": 15
                },
                worker_performance: [
                    { worker_name: "John Doe", patients: 120, screenings: 350, completion_rate: 95 },
                    { worker_name: "Jane Smith", patients: 98, screenings: 280, completion_rate: 88 },
                    { worker_name: "Bob Wilson", patients: 150, screenings: 410, completion_rate: 92 }
                ],
                geographic_distribution: [
                    { village: "North Village", total: 150, high_risk: 45 },
                    { village: "South Hamlet", total: 80, high_risk: 12 },
                    { village: "East District", total: 200, high_risk: 60 },
                    { village: "West Coast", total: 120, high_risk: 30 }
                ],
                // Merge real stats where possible
                real_stats: stats
            };

            setAnalytics(mockData);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
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

    if (!analytics) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-400">Failed to load analytics</p>
            </div>
        );
    }

    // Prepare data for charts
    const ageData = Object.entries(analytics.age_distribution || {}).map(([key, value]) => ({
        name: key,
        value: value as number
    }));

    const genderData = (analytics.gender_distribution || []).map((item: any) => ({
        name: item.gender,
        value: item.count
    }));

    const riskFactorData = Object.entries(analytics.risk_factor_prevalence || {}).map(([key, value]) => ({
        name: key,
        percentage: value as number
    }));

    const COLORS = ['#2dd4bf', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="space-y-8 pb-8">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">System Analytics</h1>
                <p className="text-slate-400">Comprehensive health insights and population statistics</p>
            </div>

            {/* Age Distribution */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-2xl border border-white/5"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                        <Users className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Age Distribution</h2>
                        <p className="text-sm text-slate-400">Patient demographics by age group</p>
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ageData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                            />
                            <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gender Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 rounded-2xl border border-white/5"
                >
                    <h2 className="text-lg font-bold text-white mb-6">Gender Distribution</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={genderData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {genderData.map((_entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Risk Factor Prevalence */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Risk Factor Prevalence</h2>
                            <p className="text-sm text-slate-400">Percentage of population affected</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {riskFactorData.map((factor, index) => (
                            <div key={index}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-300">{factor.name}</span>
                                    <span className="text-sm font-bold text-white">{factor.percentage}%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500"
                                        style={{ width: `${factor.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Worker Performance */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6 rounded-2xl border border-white/5"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Worker Performance</h2>
                        <p className="text-sm text-slate-400">Screening completion rates by health worker</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <th className="p-4">Worker Name</th>
                                <th className="p-4">Patients</th>
                                <th className="p-4">Screenings</th>
                                <th className="p-4">Completion Rate</th>
                                <th className="p-4">Performance</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300 divide-y divide-white/5">
                            {(analytics.worker_performance || []).map((worker: any, index: number) => (
                                <tr key={index} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium text-white">{worker.worker_name}</td>
                                    <td className="p-4">{worker.patients}</td>
                                    <td className="p-4">{worker.screenings}</td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                            {worker.completion_rate}%
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden max-w-[200px]">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${worker.completion_rate >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                                        worker.completion_rate >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                                                            'bg-gradient-to-r from-red-500 to-pink-500'
                                                        }`}
                                                    style={{ width: `${Math.min(worker.completion_rate, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Geographic Distribution */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card p-6 rounded-2xl border border-white/5"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                        <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Geographic Distribution</h2>
                        <p className="text-sm text-slate-400">Patient and risk distribution by village</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <th className="p-4">Village</th>
                                <th className="p-4">Total Patients</th>
                                <th className="p-4">High Risk Cases</th>
                                <th className="p-4">Risk Percentage</th>
                                <th className="p-4">Coverage</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300 divide-y divide-white/5">
                            {(analytics.geographic_distribution || []).map((village: any, index: number) => {
                                const riskPercentage = village.total > 0 ? ((village.high_risk / village.total) * 100).toFixed(1) : 0;
                                return (
                                    <tr key={index} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-medium text-white">{village.village}</td>
                                        <td className="p-4">{village.total}</td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                {village.high_risk}
                                            </span>
                                        </td>
                                        <td className="p-4">{riskPercentage}%</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden max-w-[200px]">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.min((village.total / (analytics.geographic_distribution[0]?.total || 1)) * 100, 100)}%` }}
                                                    />
                                                </div>
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
