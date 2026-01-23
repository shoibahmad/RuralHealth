import { useMemo } from "react";
import { motion } from "framer-motion";
import {
    Users,
    Activity,
    AlertTriangle,
    TrendingUp,
    Calendar,
    ArrowUpRight,
    Search
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

// Dummy Data
const SCREENING_DATA = [
    { name: 'Mon', screenings: 12, highRisk: 2 },
    { name: 'Tue', screenings: 19, highRisk: 4 },
    { name: 'Wed', screenings: 15, highRisk: 3 },
    { name: 'Thu', screenings: 22, highRisk: 6 },
    { name: 'Fri', screenings: 28, highRisk: 8 },
    { name: 'Sat', screenings: 18, highRisk: 4 },
    { name: 'Sun', screenings: 10, highRisk: 1 },
];

const RISK_DISTRIBUTION = [
    { name: 'Low Risk', value: 65, color: '#10b981' }, // emerald-500
    { name: 'Moderate', value: 25, color: '#f59e0b' }, // amber-500
    { name: 'High Risk', value: 10, color: '#ef4444' }, // red-500
];

const RECENT_PATIENTS = [
    { id: 1, name: "Rahul Sharma", age: 45, risk: "High", time: "2 hrs ago", avatar: "R" },
    { id: 2, name: "Priya Patel", age: 32, risk: "Low", time: "3 hrs ago", avatar: "P" },
    { id: 3, name: "Amit Kumar", age: 58, risk: "Moderate", time: "5 hrs ago", avatar: "A" },
    { id: 4, name: "Sunita Devi", age: 62, risk: "High", time: "Yesterday", avatar: "S" },
    { id: 5, name: "Vikram Singh", age: 28, risk: "Low", time: "Yesterday", avatar: "V" },
];

export function DashboardHome() {
    return (
        <div className="space-y-8 pb-8">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Screenings", value: "1,248", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", trend: "+12%" },
                    { label: "High Risk Detected", value: "86", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", trend: "+4%" },
                    { label: "Pending Referrals", value: "12", icon: Activity, color: "text-amber-400", bg: "bg-amber-500/10", trend: "-2%" },
                    { label: "Avg. Daily Screenings", value: "24", icon: TrendingUp, color: "text-teal-400", bg: "bg-teal-500/10", trend: "+8%" }
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
                            <div className="flex items-center gap-1 mt-3 px-2 py-1 rounded-full bg-slate-800/50 w-fit border border-white/5">
                                <span className={`text-xs font-bold ${stat.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                                    {stat.trend}
                                </span>
                                <span className="text-[10px] text-slate-500 uppercase font-semibold">from last month</span>
                            </div>
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
                    className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-white">Screening Activity</h2>
                            <p className="text-sm text-slate-400">Weekly screening volume statistics</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-teal-400 hover:text-white hover:bg-teal-500/10">
                            View Report <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={SCREENING_DATA}>
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
                    </div>
                </motion.div>

                {/* Risk Distribution Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col"
                >
                    <h2 className="text-lg font-bold text-white mb-2">Population Risk</h2>
                    <p className="text-sm text-slate-400 mb-6">Current active patient distribution</p>

                    <div className="flex-1 min-h-[200px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={RISK_DISTRIBUTION}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {RISK_DISTRIBUTION.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Legend */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold text-white">1,248</span>
                            <span className="text-xs text-slate-400 uppercase tracking-widest">Patients</span>
                        </div>
                    </div>
                    <div className="flex justify-center gap-4 mt-6">
                        {RISK_DISTRIBUTION.map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
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
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Recent Screenings</h2>
                        <p className="text-sm text-slate-400">Latest assessments performed today</p>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search patients..."
                            className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <th className="p-6">Patient Name</th>
                                <th className="p-6">Age</th>
                                <th className="p-6">Risk Category</th>
                                <th className="p-6">Time</th>
                                <th className="p-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300 divide-y divide-white/5">
                            {RECENT_PATIENTS.map((patient) => (
                                <tr key={patient.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-6 font-medium text-white flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs border border-white/10">
                                            {patient.avatar}
                                        </div>
                                        {patient.name}
                                    </td>
                                    <td className="p-6">{patient.age}</td>
                                    <td className="p-6">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${patient.risk === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                patient.risk === 'Moderate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}>
                                            {patient.risk}
                                        </span>
                                    </td>
                                    <td className="p-6 text-slate-500">{patient.time}</td>
                                    <td className="p-6 text-right">
                                        <Button variant="ghost" size="sm" className="text-teal-400 hover:text-white hover:bg-teal-500/10">View Details</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    )
}
