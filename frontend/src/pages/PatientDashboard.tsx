import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Calendar, AlertCircle, CheckCircle, PlusCircle, TrendingUp } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

interface DashboardData {
    patient: {
        id: number;
        full_name: string;
        age: number;
        gender: string;
        village: string;
        phone: string;
    };
    total_screenings: number;
    latest_screening: {
        id: number;
        risk_level: string;
        risk_score: number;
        created_at: string;
        systolic_bp?: number;
        diastolic_bp?: number;
        heart_rate?: number;
    } | null;
    upcoming_appointments: Array<{
        id: number;
        scheduled_date: string;
        reason: string;
        status: string;
    }>;
    active_recommendations: Array<{
        id: number;
        title: string;
        description: string;
        category: string;
        priority: string;
    }>;
}

// import { useAuth } from "../context/AuthContext"; // Already imported
import { useAuth } from "../context/AuthContext";
import { firestoreService } from "../services/firestoreService";

export function PatientDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    // Appointment Modal State
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [newAppointment, setNewAppointment] = useState({
        date: '',
        reason: 'Regular Checkup',
        notes: ''
    });

    const handleRequestAppointment = async () => {
        if (!user || !newAppointment.date) return;
        try {
            await firestoreService.addAppointment({
                patient_id: user.uid,
                health_worker_id: 'pending_assignment', // Logic to assign to specific HW could be added
                scheduled_date: new Date(newAppointment.date).toISOString(),
                reason: newAppointment.reason,
                notes: newAppointment.notes,
                status: 'scheduled'
            });
            setShowAppointmentModal(false);
            setNewAppointment({ date: '', reason: 'Regular Checkup', notes: '' });
            fetchDashboard(); // Refresh data
        } catch (err) {
            console.error("Failed to request appointment:", err);
            alert("Failed to request appointment. Please try again.");
        }
    };

    useEffect(() => {
        if (user) {
            fetchDashboard();
        }
    }, [user]);

    const fetchDashboard = async () => {
        if (!user) return;
        try {
            const [patientProfile, screenings, appointments] = await Promise.all([
                firestoreService.getPatient(user.uid),
                firestoreService.getScreenings(user.uid),
                firestoreService.getAppointmentsForPatient(user.uid)
            ]);

            // If getPatient(user.uid) returns null (because user is in 'users' not 'patients'), uses AuthContext
            const patientData = patientProfile || {
                id: user.uid,
                full_name: user.displayName || user.full_name || 'Patient',
                age: 0, // 0 indicates not set
                gender: 'Not Set',
                village: 'Not Set',
                phone: user.phone || ''
            };

            const upcoming = appointments
                .filter(a => a.status === 'scheduled')
                .map(a => ({
                    id: a.id,
                    scheduled_date: a.scheduled_date,
                    reason: a.reason,
                    status: a.status
                }));

            // Derive active recommendations
            const latest = screenings[0] || null;
            const recommendations = [];

            if (latest) {
                if (latest.risk_level === 'High') {
                    recommendations.push({
                        id: 1,
                        title: 'Consult Health Officer',
                        description: 'Your screening indicates high risk. Please visit a health center immediately.',
                        category: 'Medical',
                        priority: 'high'
                    });
                }
                if (latest.risk_level === 'Medium' || latest.risk_level === 'High') {
                    recommendations.push({
                        id: 2,
                        title: 'Lifestyle Modification',
                        description: 'Consider reducing salt intake and increasing physical activity.',
                        category: 'Lifestyle',
                        priority: 'medium'
                    });
                }
            }

            // Default recommendation if none
            if (recommendations.length === 0) {
                recommendations.push({
                    id: 3,
                    title: 'Regular Screening',
                    description: 'Schedule your next health screening in 3 months.',
                    category: 'Prevention',
                    priority: 'low'
                });
            }

            setData({
                patient: patientData as any,
                total_screenings: screenings.length,
                latest_screening: latest as any,
                upcoming_appointments: upcoming as any,
                active_recommendations: recommendations as any
            });

        } catch (err) {
            console.error(err);
            if (err instanceof Error) {
                setError(`Failed to load dashboard: ${err.message}`);
            } else {
                setError("Failed to load dashboard: Unknown error");
            }
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case "High":
                return "text-red-400 bg-red-500/10 border-red-500/20";
            case "Medium":
                return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
            default:
                return "text-green-400 bg-green-500/10 border-green-500/20";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "text-red-400";
            case "medium":
                return "text-yellow-400";
            default:
                return "text-blue-400";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading your dashboard...</p>
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

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="glass-card p-6 rounded-xl border border-white/5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Welcome, {data.patient.full_name}!
                        </h1>
                        <p className="text-slate-400">
                            {data.patient.age} years • {data.patient.gender} • {data.patient.village}
                        </p>
                    </div>
                    <Link to="/patient/screening">
                        <Button className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Screening
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Screenings */}
                <Card className="glass-card p-6 border border-white/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm mb-1">Total Screenings</p>
                            <p className="text-3xl font-bold text-white">{data.total_screenings}</p>
                        </div>
                        <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Activity className="h-6 w-6 text-blue-400" />
                        </div>
                    </div>
                </Card>

                {/* Latest Risk Level */}
                <Card className="glass-card p-6 border border-white/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm mb-1">Current Risk Level</p>
                            {data.latest_screening ? (
                                <p className={`text-2xl font-bold ${getRiskColor(data.latest_screening.risk_level).split(' ')[0]}`}>
                                    {data.latest_screening.risk_level}
                                </p>
                            ) : (
                                <p className="text-slate-500">No screenings yet</p>
                            )}
                        </div>
                        <div className="h-12 w-12 rounded-lg bg-pink-500/10 flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-pink-400" />
                        </div>
                    </div>
                </Card>

                {/* Upcoming Appointments */}
                <Card className="glass-card p-6 border border-white/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm mb-1">Upcoming Appointments</p>
                            <p className="text-3xl font-bold text-white">{data.upcoming_appointments.length}</p>
                        </div>
                        <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-purple-400" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Latest Screening */}
            {data.latest_screening && (
                <Card className="glass-card p-6 border border-white/5">
                    <h2 className="text-xl font-bold text-white mb-4">Latest Screening Results</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="glass-card p-4 rounded-lg border border-white/5">
                            <p className="text-slate-400 text-sm mb-1">Risk Level</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(data.latest_screening.risk_level)}`}>
                                {data.latest_screening.risk_level}
                            </span>
                        </div>
                        <div className="glass-card p-4 rounded-lg border border-white/5">
                            <p className="text-slate-400 text-sm mb-1">Risk Score</p>
                            <p className="text-2xl font-bold text-white">{data.latest_screening.risk_score?.toFixed(1) || "N/A"}</p>
                        </div>
                        {data.latest_screening.systolic_bp && (
                            <div className="glass-card p-4 rounded-lg border border-white/5">
                                <p className="text-slate-400 text-sm mb-1">Blood Pressure</p>
                                <p className="text-xl font-bold text-white">
                                    {data.latest_screening.systolic_bp}/{data.latest_screening.diastolic_bp}
                                </p>
                            </div>
                        )}
                        {data.latest_screening.heart_rate && (
                            <div className="glass-card p-4 rounded-lg border border-white/5">
                                <p className="text-slate-400 text-sm mb-1">Heart Rate</p>
                                <p className="text-xl font-bold text-white">{data.latest_screening.heart_rate} bpm</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-4">
                        <Link to="/patient/history">
                            <Button variant="ghost" className="text-pink-400 hover:text-pink-300 hover:bg-pink-500/10">
                                View Full History →
                            </Button>
                        </Link>
                    </div>
                </Card>
            )}

            {/* Recommendations */}
            {data.active_recommendations.length > 0 && (
                <Card className="glass-card p-6 border border-white/5">
                    <h2 className="text-xl font-bold text-white mb-4">Active Recommendations</h2>
                    <div className="space-y-3">
                        {data.active_recommendations.map((rec) => (
                            <div key={rec.id} className="glass-card p-4 rounded-lg border border-white/5 flex items-start gap-3">
                                <CheckCircle className={`h-5 w-5 mt-0.5 ${getPriorityColor(rec.priority)}`} />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-white">{rec.title}</h3>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400 capitalize">
                                            {rec.category}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400">{rec.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Upcoming Appointments */}
            {data.upcoming_appointments.length > 0 && (
                <Card className="glass-card p-6 border border-white/5">
                    <h2 className="text-xl font-bold text-white mb-4">Upcoming Appointments</h2>
                    <div className="space-y-3">
                        {data.upcoming_appointments.map((apt) => (
                            <div key={apt.id} className="glass-card p-4 rounded-lg border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">{apt.reason}</p>
                                        <p className="text-sm text-slate-400">
                                            {new Date(apt.scheduled_date).toLocaleDateString()} at{" "}
                                            {new Date(apt.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 capitalize">
                                    {apt.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
