import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    BarChart3,
    TrendingUp,
    MapPin,
    Users,
    Activity,
    AlertTriangle
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Area,
    AreaChart
} from "recharts";
import { useAuth } from "../context/AuthContext";

interface AnalyticsData {
    village_stats: { village: string; patient_count: number }[];
    age_distribution: Record<string, number>;
    gender_distribution: { gender: string; count: number }[];
    monthly_trend: { month: string; count: number }[];
    risk_factor_counts: Record<string, number>;
}

const COLORS = ['#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

export function AnalyticsPage() {
    const { token } = useAuth();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch("/api/stats/analytics", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center text-slate-400 py-8">
                Failed to load analytics data
            </div>
        );
    }

    const ageData = Object.entries(analytics.age_distribution).map(([age, count]) => ({
        name: age,
        value: count
    }));

    const genderData = analytics.gender_distribution.map(g => ({
        name: g.gender,
        value: g.count
    }));

    const riskFactorData = Object.entries(analytics.risk_factor_counts).map(([factor, count]) => ({
        name: factor,
        count: count
    }));

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <BarChart3 className="h-7 w-7 text-teal-400" />
                    Analytics Dashboard
                </h1>
                <p className="text-slate-400 mt-1">Comprehensive health screening insights and trends</p>
            </div>

            {/* Monthly Trend Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-2xl border border-white/5"
            >
                <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="h-5 w-5 text-teal-400" />
                    <h2 className="text-lg font-bold text-white">Monthly Screening Trend</h2>
                </div>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.monthly_trend}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
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
                                dataKey="count"
                                stroke="#14b8a6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorCount)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Village Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <MapPin className="h-5 w-5 text-cyan-400" />
                        <h2 className="text-lg font-bold text-white">Patients by Village</h2>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.village_stats} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} horizontal={false} />
                                <XAxis type="number" stroke="#64748b" fontSize={12} />
                                <YAxis type="category" dataKey="village" stroke="#64748b" fontSize={12} width={100} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                                />
                                <Bar dataKey="patient_count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Age Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <Users className="h-5 w-5 text-blue-400" />
                        <h2 className="text-lg font-bold text-white">Age Distribution</h2>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ageData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Gender Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <Activity className="h-5 w-5 text-purple-400" />
                        <h2 className="text-lg font-bold text-white">Gender Distribution</h2>
                    </div>
                    <div className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={genderData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                >
                                    {genderData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Risk Factors */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                        <h2 className="text-lg font-bold text-white">Common Risk Factors</h2>
                    </div>
                    <div className="space-y-4">
                        {riskFactorData.map((factor, i) => (
                            <div key={factor.name} className="flex items-center gap-4">
                                <div className="w-32 text-sm text-slate-300">{factor.name}</div>
                                <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((factor.count / Math.max(...riskFactorData.map(f => f.count))) * 100, 100)}%` }}
                                        transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                    />
                                </div>
                                <div className="w-12 text-right text-sm text-slate-400">{factor.count}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
