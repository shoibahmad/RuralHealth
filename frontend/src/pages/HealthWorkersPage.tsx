import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Activity, AlertTriangle, Search, Eye } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { firestoreService } from "../services/firestoreService";
import { useNavigate } from "react-router-dom";

export function HealthWorkersPage() {
    const navigate = useNavigate();
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchWorkers();
    }, []);

    const fetchWorkers = async () => {
        try {
            const data = await firestoreService.getHealthWorkers();
            setWorkers(data);
        } catch (error) {
            console.error('Failed to fetch workers:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredWorkers = workers.filter(worker =>
        worker.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Health Workers</h1>
                    <p className="text-slate-400">Manage and monitor health worker performance</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">{workers.length}</h3>
                            <p className="text-sm text-slate-400">Total Workers</p>
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
                        <div className="h-12 w-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">
                                {workers.reduce((sum, w) => sum + (w.stats?.total_screenings || 0), 0)}
                            </h3>
                            <p className="text-sm text-slate-400">Total Screenings</p>
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
                        <div className="h-12 w-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">
                                {workers.reduce((sum, w) => sum + (w.stats?.high_risk_patients || 0), 0)}
                            </h3>
                            <p className="text-sm text-slate-400">High Risk Cases</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Workers Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card rounded-2xl border border-white/5 overflow-hidden"
            >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">All Health Workers</h2>
                        <p className="text-sm text-slate-400">View detailed performance metrics</p>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search workers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <th className="p-6">Worker</th>
                                <th className="p-6">Email</th>
                                <th className="p-6">Patients</th>
                                <th className="p-6">Screenings</th>
                                <th className="p-6">High Risk</th>
                                <th className="p-6">Status</th>
                                <th className="p-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300 divide-y divide-white/5">
                            {filteredWorkers.map((worker) => (
                                <tr key={worker.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-6 font-medium text-white flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm border border-white/10">
                                            {worker.full_name?.charAt(0) || worker.email.charAt(0).toUpperCase()}
                                        </div>
                                        {worker.full_name || 'N/A'}
                                    </td>
                                    <td className="p-6 text-slate-400">{worker.email}</td>
                                    <td className="p-6">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                            {worker.stats?.total_patients || 0}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                            {worker.stats?.total_screenings || 0}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                            {worker.stats?.high_risk_patients || 0}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${worker.is_active
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                            }`}>
                                            {worker.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-teal-400 hover:text-white hover:bg-teal-500/10"
                                            onClick={() => navigate(`/officer/workers/${worker.id}`)}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Details
                                        </Button>
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
