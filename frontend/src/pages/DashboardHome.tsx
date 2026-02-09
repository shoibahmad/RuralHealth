import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Users,
    Activity,
    AlertTriangle,
    TrendingUp,
    ArrowUpRight,
    Search,
    Calendar,
    Plus,
    Cloud,
    WifiOff,
    RefreshCw
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
    Cell
} from "recharts";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";
import { firestoreService } from "../services/firestoreService";
import { useOffline } from "../context/OfflineContext";

interface DashboardStats {
    total_patients: number;
    total_screenings: number;
    high_risk_count: number;
    pending_appointments: number;
    risk_distribution: Record<string, number>;
    weekly_screenings: { name: string; date: string; screenings: number; highRisk: number }[];
    recent_screenings: any[];
}

export function DashboardHome() {
    const { user } = useAuth();
    const { isOnline, pendingSyncCount, syncStatus, syncNow } = useOffline();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);

    // Mock local stats for now
    const localStats = { localPatients: 0, localScreenings: 0 };
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const loadStats = async () => {
            // Pass user ID only if it's a health worker to filter data
            // If user is Admin/Officer, they see global stats (conceptually)
            // For now, firestoreService.getDashboardStats handles some of this logic
            try {
                const data: any = await firestoreService.getDashboardStats(
                    user?.role === 'health_worker' ? user.uid : undefined
                );
                setStats(data);
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    const riskDistribution = stats ? [
        { name: 'Low Risk', value: stats.risk_distribution.Low || 0, color: '#10b981' },
        { name: 'Medium', value: stats.risk_distribution.Medium || 0, color: '#f59e0b' },
        { name: 'High Risk', value: stats.risk_distribution.High || 0, color: '#ef4444' },
    ] : [];

    const totalRisk = riskDistribution.reduce((sum, item) => sum + item.value, 0);

    const statCards = stats ? [
        { label: "Total Patients", value: stats.total_patients.toLocaleString(), icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: "Total Screenings", value: stats.total_screenings.toLocaleString(), icon: Activity, color: "text-teal-400", bg: "bg-teal-500/10" },
        { label: "High Risk Cases", value: stats.high_risk_count.toLocaleString(), icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
        { label: "Pending Appointments", value: stats.pending_appointments.toLocaleString(), icon: Calendar, color: "text-amber-400", bg: "bg-amber-500/10" }
    ] : [];

    const filteredRecentScreenings = stats?.recent_screenings.filter(s =>
        s.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-8 pb-8">
            {/* Offline/Sync Status Banner */}
            {(!isOnline || pendingSyncCount > 0) && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border ${!isOnline
                        ? 'bg-amber-500/10 border-amber-500/20'
                        : 'bg-blue-500/10 border-blue-500/20'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {!isOnline ? (
                                <WifiOff className="h-5 w-5 text-amber-400" />
                            ) : (
                                <Cloud className="h-5 w-5 text-blue-400" />
                            )}
                            <div>
                                <p className={`font-medium ${!isOnline ? 'text-amber-400' : 'text-blue-400'}`}>
                                    {!isOnline ? 'You\'re Offline' : `${pendingSyncCount} items pending sync`}
                                </p>
                                <p className="text-sm text-slate-400">
                                    {!isOnline
                                        ? `${localStats.localPatients} patients, ${localStats.localScreenings} screenings saved locally`
                                        : 'Data will sync automatically or click Sync Now'
                                    }
                                </p>
                            </div>
                        </div>
                        {isOnline && pendingSyncCount > 0 && (
                            <Button
                                onClick={syncNow}
                                size="sm"
                                disabled={syncStatus === 'syncing'}
                                className="bg-blue-500 hover:bg-blue-600"
                            >
                                {syncStatus === 'syncing' ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Cloud className="h-4 w-4 mr-2" />
                                        Sync Now
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Welcome Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white">Dashboard Overview</h1>
                    <p className="text-slate-400 mt-1 text-sm md:text-base">Welcome back! Here's what's happening today.</p>
                </div>
                <Button
                    onClick={() => navigate('/dashboard/screen')}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Screening
                </Button>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
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
                {/* Main Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 glass-card p-4 md:p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                        <div>
                            <h2 className="text-base md:text-lg font-bold text-white">Screening Activity</h2>
                            <p className="text-xs md:text-sm text-slate-400">Weekly screening volume (last 7 days)</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/dashboard/analytics')}
                            className="text-teal-400 hover:text-white hover:bg-teal-500/10 w-full sm:w-auto"
                        >
                            View Analytics <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                    <div className="h-[250px] md:h-[300px] w-full">
                        {stats?.weekly_screenings && stats.weekly_screenings.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.weekly_screenings}>
                                    <defs>
                                        <linearGradient id="colorScreenings" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#2dd4bf' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="screenings"
                                        stroke="#2dd4bf"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorScreenings)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-sm text-center px-4">
                                No screening data yet. Start by creating a new screening.
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Risk Distribution Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card p-4 md:p-6 rounded-2xl border border-white/5 flex flex-col"
                >
                    <h2 className="text-base md:text-lg font-bold text-white mb-2">Risk Distribution</h2>
                    <p className="text-xs md:text-sm text-slate-400 mb-6">Current patient risk levels</p>

                    <div className="flex-1 min-h-[200px] relative">
                        {totalRisk > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={riskDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {riskDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                                No risk data available
                            </div>
                        )}
                        {totalRisk > 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl md:text-3xl font-bold text-white">{totalRisk}</span>
                                <span className="text-xs text-slate-400 uppercase tracking-widest">Screenings</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 md:gap-4 mt-6">
                        {riskDistribution.map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                <span className="text-xs text-slate-300">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Recent Screenings Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-card rounded-2xl border border-white/5 overflow-hidden"
            >
                <div className="p-4 md:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-white">Recent Screenings</h2>
                        <p className="text-sm text-slate-400">Latest health assessments performed</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search patients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {filteredRecentScreenings.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            {stats?.recent_screenings.length === 0
                                ? "No screenings yet. Create your first screening to see data here."
                                : "No matching patients found."
                            }
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[640px]">
                            <thead>
                                <tr className="border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    <th className="p-4 md:p-6">Patient Name</th>
                                    <th className="p-4 md:p-6">Blood Pressure</th>
                                    <th className="p-4 md:p-6">Glucose</th>
                                    <th className="p-4 md:p-6">Risk Score</th>
                                    <th className="p-4 md:p-6">Risk Category</th>
                                    <th className="p-4 md:p-6">Date</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-300 divide-y divide-white/5">
                                {filteredRecentScreenings.map((screening: any) => (
                                    <tr key={screening.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 md:p-6 font-medium text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs border border-white/10 flex-shrink-0">
                                                    {screening.patient_name?.charAt(0) || '?'}
                                                </div>
                                                <span className="truncate">{screening.patient_name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 md:p-6 whitespace-nowrap">
                                            {screening.systolic_bp && screening.diastolic_bp
                                                ? `${screening.systolic_bp}/${screening.diastolic_bp}`
                                                : '-'
                                            }
                                        </td>
                                        <td className="p-4 md:p-6 whitespace-nowrap">{screening.glucose_level || '-'} mg/dL</td>
                                        <td className="p-4 md:p-6">{screening.risk_score || 0}</td>
                                        <td className="p-4 md:p-6">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${screening.risk_level === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                screening.risk_level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                }`}>
                                                {screening.risk_level || 'Low'}
                                            </span>
                                        </td>
                                        <td className="p-4 md:p-6 text-slate-500 whitespace-nowrap">
                                            {new Date(screening.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    onClick={() => navigate('/dashboard/patients')}
                    className="glass-card p-6 rounded-xl border border-white/5 cursor-pointer hover:border-teal-500/30 transition-colors group"
                >
                    <Users className="h-8 w-8 text-teal-400 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-white font-medium">View All Patients</h3>
                    <p className="text-slate-400 text-sm mt-1">Browse and manage patient records</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    onClick={() => navigate('/dashboard/appointments')}
                    className="glass-card p-6 rounded-xl border border-white/5 cursor-pointer hover:border-cyan-500/30 transition-colors group"
                >
                    <Calendar className="h-8 w-8 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-white font-medium">Appointments</h3>
                    <p className="text-slate-400 text-sm mt-1">Schedule and manage follow-ups</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    onClick={() => navigate('/dashboard/analytics')}
                    className="glass-card p-6 rounded-xl border border-white/5 cursor-pointer hover:border-purple-500/30 transition-colors group"
                >
                    <TrendingUp className="h-8 w-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-white font-medium">View Analytics</h3>
                    <p className="text-slate-400 text-sm mt-1">Detailed insights and trends</p>
                </motion.div>
            </div>
        </div>
    );
}
