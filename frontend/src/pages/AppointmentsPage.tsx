import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Calendar,
    Plus,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    User,
    X
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";

interface Appointment {
    id: number;
    patient: number;
    patient_name: string;
    health_worker: number;
    health_worker_name: string;
    scheduled_date: string;
    reason: string;
    notes: string | null;
    status: string;
    created_at: string;
}

interface Patient {
    id: number;
    full_name: string;
}

export function AppointmentsPage() {
    const { token } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("scheduled");

    const [newAppointment, setNewAppointment] = useState({
        patient: "",
        scheduled_date: "",
        reason: "",
        notes: ""
    });

    useEffect(() => {
        fetchAppointments();
        fetchPatients();
    }, [statusFilter]);

    const fetchAppointments = async () => {
        try {
            let url = "/api/appointments";
            if (statusFilter) url += `?status=${statusFilter}`;

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setAppointments(data);
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPatients = async () => {
        try {
            const response = await fetch("/api/screening/patients", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setPatients(data);
            }
        } catch (error) {
            console.error("Error fetching patients:", error);
        }
    };

    const createAppointment = async () => {
        try {
            const response = await fetch("/api/appointments", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    patient: parseInt(newAppointment.patient),
                    scheduled_date: newAppointment.scheduled_date,
                    reason: newAppointment.reason,
                    notes: newAppointment.notes || null
                })
            });
            if (response.ok) {
                setShowCreateModal(false);
                setNewAppointment({ patient: "", scheduled_date: "", reason: "", notes: "" });
                fetchAppointments();
            }
        } catch (error) {
            console.error("Error creating appointment:", error);
        }
    };

    const updateStatus = async (id: number, status: string) => {
        try {
            const response = await fetch(`/api/appointments/${id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                fetchAppointments();
            }
        } catch (error) {
            console.error("Error updating appointment:", error);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'scheduled': return <Clock className="h-4 w-4 text-blue-400" />;
            case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
            case 'cancelled': return <XCircle className="h-4 w-4 text-red-400" />;
            case 'missed': return <AlertCircle className="h-4 w-4 text-amber-400" />;
            default: return null;
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            completed: "bg-green-500/10 text-green-400 border-green-500/20",
            cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
            missed: "bg-amber-500/10 text-amber-400 border-amber-500/20"
        };
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || ""}`}>
                {getStatusIcon(status)}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Calendar className="h-7 w-7 text-teal-400" />
                        Appointments
                    </h1>
                    <p className="text-slate-400 mt-1">Manage follow-up appointments for patients</p>
                </div>
                <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Appointment
                </Button>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-2">
                {['scheduled', 'completed', 'cancelled', 'missed', ''].map((status) => (
                    <Button
                        key={status}
                        variant={statusFilter === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter(status)}
                        className={statusFilter === status
                            ? "bg-teal-500 text-white"
                            : "border-white/10 text-slate-300 hover:bg-white/5"
                        }
                    >
                        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
                    </Button>
                ))}
            </div>

            {/* Appointments List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl border border-white/5 overflow-hidden"
            >
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading appointments...</div>
                ) : appointments.length === 0 ? (
                    <div className="p-8 text-center">
                        <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">No appointments found</p>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4"
                            variant="outline"
                        >
                            Schedule Your First Appointment
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {appointments.map((appointment) => (
                            <motion.div
                                key={appointment.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-6 hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center text-teal-400 border border-teal-500/20">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">{appointment.patient_name}</h3>
                                            <p className="text-slate-400 text-sm mt-1">{appointment.reason}</p>
                                            <div className="flex items-center gap-4 mt-3">
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(appointment.scheduled_date).toLocaleString()}
                                                </span>
                                                {getStatusBadge(appointment.status)}
                                            </div>
                                            {appointment.notes && (
                                                <p className="text-slate-500 text-sm mt-2">
                                                    Notes: {appointment.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {appointment.status === 'scheduled' && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => updateStatus(appointment.id, 'completed')}
                                                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                Complete
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => updateStatus(appointment.id, 'cancelled')}
                                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                            >
                                                <XCircle className="h-4 w-4 mr-1" />
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Create Appointment Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card rounded-2xl border border-white/10 w-full max-w-md"
                    >
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Schedule Appointment</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowCreateModal(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Patient</label>
                                <select
                                    value={newAppointment.patient}
                                    onChange={(e) => setNewAppointment(prev => ({ ...prev, patient: e.target.value }))}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                                >
                                    <option value="">Select a patient</option>
                                    {patients.map((p) => (
                                        <option key={p.id} value={p.id}>{p.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Date & Time</label>
                                <Input
                                    type="datetime-local"
                                    value={newAppointment.scheduled_date}
                                    onChange={(e) => setNewAppointment(prev => ({ ...prev, scheduled_date: e.target.value }))}
                                    className="bg-slate-900/50 border-white/10 text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Reason</label>
                                <Input
                                    value={newAppointment.reason}
                                    onChange={(e) => setNewAppointment(prev => ({ ...prev, reason: e.target.value }))}
                                    placeholder="e.g., Follow-up for high blood pressure"
                                    className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Notes (optional)</label>
                                <textarea
                                    value={newAppointment.notes}
                                    onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Additional notes..."
                                    rows={3}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-slate-600 resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/5 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={createAppointment}
                                disabled={!newAppointment.patient || !newAppointment.scheduled_date || !newAppointment.reason}
                                className="bg-gradient-to-r from-teal-500 to-cyan-500"
                            >
                                Schedule
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
