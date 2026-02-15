import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Activity, Edit, X, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
// import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { ConfirmationModal } from "../components/ui/confirmation-modal";
import { firestoreService } from "../services/firestoreService";

export function AllPatientsPage() {
    // const { user } = useAuth(); // Unused
    const navigate = useNavigate();
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [riskFilter, setRiskFilter] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [editingPatient, setEditingPatient] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [patientToDelete, setPatientToDelete] = useState<any>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchPatients();
    }, [page, riskFilter]);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            // Fetch all patients (Officer view)
            const allPatients = await firestoreService.getPatients();

            // Client-side Filter
            let filtered = allPatients;
            if (searchTerm) {
                const lower = searchTerm.toLowerCase();
                filtered = filtered.filter(p =>
                    p.full_name.toLowerCase().includes(lower) ||
                    p.village.toLowerCase().includes(lower) ||
                    (p.phone && p.phone.includes(lower))
                );
            }

            if (riskFilter) {
                filtered = filtered.filter((p: any) => p.latest_risk_level === riskFilter);
            }

            setTotal(filtered.length);

            // Pagination
            const start = (page - 1) * 20;
            const paginated = filtered.slice(start, start + 20);

            setPatients(paginated);
        } catch (error) {
            console.error('Failed to fetch patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        fetchPatients();
    };

    const handleEditPatient = (patient: any) => {
        setEditingPatient({ ...patient });
        setShowEditModal(true);
    };

    const handleUpdatePatient = async () => {
        if (!editingPatient) return;

        try {
            await firestoreService.updatePatient(editingPatient.id, {
                full_name: editingPatient.full_name,
                age: editingPatient.age,
                gender: editingPatient.gender,
                village: editingPatient.village,
                phone: editingPatient.phone
            });

            setShowEditModal(false);
            fetchPatients();
        } catch (error) {
            console.error('Failed to update patient:', error);
        }
    };

    const handleConfirmDelete = async () => {
        if (!patientToDelete) return;
        setLoading(true);
        try {
            await firestoreService.deletePatient(patientToDelete.id);
            showToast("Patient deleted successfully", "success");
            setIsDeleteModalOpen(false);
            setPatientToDelete(null);
            fetchPatients();
        } catch (error: any) {
            console.error("Failed to delete patient:", error);
            showToast(error.message || "Failed to delete patient", "error");
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(total / 20);

    return (
        <div className="space-y-8 pb-8">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">All Patients</h1>
                <p className="text-slate-400">System-wide patient database</p>
            </div>

            {/* Filters */}
            <div className="glass-card p-6 rounded-2xl border border-white/5">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search by name, village, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={riskFilter}
                            onChange={(e) => setRiskFilter(e.target.value)}
                            className="px-4 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-teal-500/50 focus:outline-none"
                        >
                            <option value="">All Risk Levels</option>
                            <option value="Low">Low Risk</option>
                            <option value="Medium">Medium Risk</option>
                            <option value="High">High Risk</option>
                        </select>
                        <Button
                            onClick={handleSearch}
                            className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Apply
                        </Button>
                    </div>
                </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between">
                <p className="text-slate-400">
                    Showing {patients.length} of {total} patients
                </p>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="text-slate-400 hover:text-white"
                    >
                        Previous
                    </Button>
                    <span className="px-4 py-2 text-sm text-slate-300">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="text-slate-400 hover:text-white"
                    >
                        Next
                    </Button>
                </div>
            </div>

            {/* Patients Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl border border-white/5 overflow-hidden"
            >
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    <th className="p-6">Patient Name</th>
                                    <th className="p-6">Age</th>
                                    <th className="p-6">Gender</th>
                                    <th className="p-6">Village</th>
                                    <th className="p-6">Phone</th>
                                    <th className="p-6">Screenings</th>
                                    <th className="p-6">Latest Risk</th>
                                    <th className="p-6">Registered</th>
                                    <th className="p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-300 divide-y divide-white/5">
                                {patients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-6 font-medium text-white flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm border border-white/10">
                                                {patient.full_name.charAt(0)}
                                            </div>
                                            {patient.full_name}
                                        </td>
                                        <td className="p-6">{patient.age}</td>
                                        <td className="p-6">{patient.gender}</td>
                                        <td className="p-6">{patient.village}</td>
                                        <td className="p-6 text-slate-400">{patient.phone || 'N/A'}</td>
                                        <td className="p-6">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                                {patient.screening_count || 0}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            {patient.latest_risk_level ? (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${patient.latest_risk_level === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                    patient.latest_risk_level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    }`}>
                                                    {patient.latest_risk_level}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 text-xs">No screening</span>
                                            )}
                                        </td>
                                        <td className="p-6 text-slate-500 text-xs">
                                            {new Date(patient.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/officer/patients/${patient.id}/history`)}
                                                    className="text-teal-400 hover:text-white hover:bg-teal-500/10"
                                                >
                                                    <Activity className="h-4 w-4 mr-1" />
                                                    History
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditPatient(patient)}
                                                    className="text-blue-400 hover:text-white hover:bg-blue-500/10"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setPatientToDelete(patient);
                                                        setIsDeleteModalOpen(true);
                                                    }}
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

            {/* Edit Patient Modal */}
            {showEditModal && editingPatient && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card rounded-2xl border border-white/10 w-full max-w-md"
                    >
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Edit Patient</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowEditModal(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Full Name</Label>
                                <Input
                                    value={editingPatient.full_name}
                                    onChange={(e) => setEditingPatient({ ...editingPatient, full_name: e.target.value })}
                                    className="bg-slate-900/50 border-white/10 text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Age</Label>
                                    <Input
                                        type="number"
                                        value={editingPatient.age}
                                        onChange={(e) => setEditingPatient({ ...editingPatient, age: parseInt(e.target.value) })}
                                        className="bg-slate-900/50 border-white/10 text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-300">Gender</Label>
                                    <select
                                        value={editingPatient.gender}
                                        onChange={(e) => setEditingPatient({ ...editingPatient, gender: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-teal-500/50 focus:outline-none"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">Village</Label>
                                <Input
                                    value={editingPatient.village}
                                    onChange={(e) => setEditingPatient({ ...editingPatient, village: e.target.value })}
                                    className="bg-slate-900/50 border-white/10 text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">Phone</Label>
                                <Input
                                    value={editingPatient.phone || ''}
                                    onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                                    className="bg-slate-900/50 border-white/10 text-white"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    onClick={handleUpdatePatient}
                                    className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500"
                                >
                                    Save Changes
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowEditModal(false)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Patient"
                message={`Are you sure you want to delete ${patientToDelete?.full_name}? This action cannot be undone and will remove all their health history.`}
                confirmText="Delete"
                variant="danger"
                isLoading={loading}
            />
        </div>
    );
}
