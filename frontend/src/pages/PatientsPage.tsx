import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Users,
    Search,
    Filter,
    Plus,
    Eye,
    Trash2,
    X,
    AlertTriangle,
    Activity,
    Calendar
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";

interface Patient {
    id: number;
    full_name: string;
    age: number;
    gender: string;
    village: string;
    phone: string | null;
    created_at: string;
    screening_count: number;
    latest_risk_level: string | null;
}

interface PatientDetail extends Patient {
    screenings: any[];
    appointments: any[];
    recommendations: any[];
}

export function PatientsPage() {
    const { token } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [riskFilter, setRiskFilter] = useState<string>("");

    useEffect(() => {
        fetchPatients();
    }, [searchTerm, riskFilter]);

    const fetchPatients = async () => {
        try {
            let url = "/api/screening/patients";
            const params = new URLSearchParams();
            if (searchTerm) params.append("search", searchTerm);
            if (riskFilter) params.append("risk", riskFilter);
            if (params.toString()) url += `?${params.toString()}`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setPatients(data);
            }
        } catch (error) {
            console.error("Error fetching patients:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPatientDetail = async (id: number) => {
        try {
            const response = await fetch(`/api/screening/patients/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setSelectedPatient(data);
                setShowDetailModal(true);
            }
        } catch (error) {
            console.error("Error fetching patient detail:", error);
        }
    };

    const deletePatient = async (id: number) => {
        if (!confirm("Are you sure you want to delete this patient?")) return;

        try {
            const response = await fetch(`/api/screening/patients/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                fetchPatients();
            }
        } catch (error) {
            console.error("Error deleting patient:", error);
        }
    };

    const getRiskBadge = (risk: string | null) => {
        if (!risk) return null;
        const colors: Record<string, string> = {
            High: "bg-red-500/10 text-red-400 border-red-500/20",
            Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            Low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[risk] || ""}`}>
                {risk}
            </span>
        );
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Users className="h-7 w-7 text-teal-400" />
                        Patients
                    </h1>
                    <p className="text-slate-400 mt-1">Manage and view all registered patients</p>
                </div>
                <Button
                    onClick={() => window.location.href = '/dashboard/screen'}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Screening
                </Button>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 rounded-xl border border-white/5 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search by name, village, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <select
                        value={riskFilter}
                        onChange={(e) => setRiskFilter(e.target.value)}
                        className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    >
                        <option value="">All Risk Levels</option>
                        <option value="High">High Risk</option>
                        <option value="Medium">Medium Risk</option>
                        <option value="Low">Low Risk</option>
                    </select>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Patients", value: patients.length, color: "text-blue-400" },
                    { label: "High Risk", value: patients.filter(p => p.latest_risk_level === "High").length, color: "text-red-400" },
                    { label: "Medium Risk", value: patients.filter(p => p.latest_risk_level === "Medium").length, color: "text-amber-400" },
                    { label: "Low Risk", value: patients.filter(p => p.latest_risk_level === "Low").length, color: "text-emerald-400" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass-card p-4 rounded-xl border border-white/5"
                    >
                        <p className="text-slate-400 text-sm">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Patients Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl border border-white/5 overflow-hidden"
            >
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading patients...</div>
                ) : patients.length === 0 ? (
                    <div className="p-8 text-center">
                        <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">No patients found</p>
                        <Button
                            onClick={() => window.location.href = '/dashboard/screen'}
                            className="mt-4"
                            variant="outline"
                        >
                            Add Your First Patient
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    <th className="p-4">Patient</th>
                                    <th className="p-4">Age/Gender</th>
                                    <th className="p-4">Village</th>
                                    <th className="p-4">Phone</th>
                                    <th className="p-4">Screenings</th>
                                    <th className="p-4">Risk Level</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-300 divide-y divide-white/5">
                                {patients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-medium text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center text-sm text-teal-400 border border-teal-500/20">
                                                    {patient.full_name.charAt(0)}
                                                </div>
                                                {patient.full_name}
                                            </div>
                                        </td>
                                        <td className="p-4">{patient.age} / {patient.gender}</td>
                                        <td className="p-4">{patient.village}</td>
                                        <td className="p-4 text-slate-500">{patient.phone || "-"}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-slate-800 rounded text-xs">
                                                {patient.screening_count}
                                            </span>
                                        </td>
                                        <td className="p-4">{getRiskBadge(patient.latest_risk_level)}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => fetchPatientDetail(patient.id)}
                                                    className="text-teal-400 hover:text-white hover:bg-teal-500/10"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => deletePatient(patient.id)}
                                                    className="text-red-400 hover:text-white hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* Patient Detail Modal */}
            {showDetailModal && selectedPatient && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card rounded-2xl border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-auto"
                    >
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">{selectedPatient.full_name}</h2>
                                <p className="text-slate-400 text-sm">{selectedPatient.age} years, {selectedPatient.gender} • {selectedPatient.village}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDetailModal(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Screenings */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-teal-400" />
                                    Screening History
                                </h3>
                                {selectedPatient.screenings.length === 0 ? (
                                    <p className="text-slate-400 text-sm">No screenings recorded</p>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedPatient.screenings.map((s: any) => (
                                            <div key={s.id} className="bg-slate-800/50 rounded-lg p-4 border border-white/5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm text-slate-400">
                                                        {new Date(s.created_at).toLocaleDateString()}
                                                    </span>
                                                    {getRiskBadge(s.risk_level)}
                                                </div>
                                                <p className="text-white text-sm">
                                                    BP: {s.systolic_bp || '-'}/{s.diastolic_bp || '-'} mmHg |
                                                    Glucose: {s.glucose_level || '-'} mg/dL |
                                                    Score: {s.risk_score}
                                                </p>
                                                {s.risk_notes && (
                                                    <p className="text-slate-400 text-xs mt-2">{s.risk_notes}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Recommendations */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                                    Health Recommendations
                                </h3>
                                {selectedPatient.recommendations.length === 0 ? (
                                    <p className="text-slate-400 text-sm">No recommendations</p>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedPatient.recommendations.map((r: any) => (
                                            <div key={r.id} className={`p-3 rounded-lg border ${r.priority === 'high'
                                                ? 'bg-red-500/10 border-red-500/20'
                                                : r.priority === 'medium'
                                                    ? 'bg-amber-500/10 border-amber-500/20'
                                                    : 'bg-slate-800/50 border-white/5'
                                                }`}>
                                                <p className="text-white text-sm font-medium">{r.title}</p>
                                                <p className="text-slate-400 text-xs mt-1">{r.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Appointments */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-cyan-400" />
                                    Appointments
                                </h3>
                                {selectedPatient.appointments.length === 0 ? (
                                    <p className="text-slate-400 text-sm">No appointments scheduled</p>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedPatient.appointments.map((a: any) => (
                                            <div key={a.id} className="bg-slate-800/50 rounded-lg p-3 border border-white/5 flex items-center justify-between">
                                                <div>
                                                    <p className="text-white text-sm">{a.reason}</p>
                                                    <p className="text-slate-400 text-xs">
                                                        {new Date(a.scheduled_date).toLocaleString()}
                                                    </p>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded ${a.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                                                    a.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                        'bg-slate-700 text-slate-400'
                                                    }`}>
                                                    {a.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
