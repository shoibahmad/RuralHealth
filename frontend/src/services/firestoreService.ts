import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    setDoc
} from "firebase/firestore";
import { db } from "../lib/firebase";

// Helper to sanitize data (remove undefined fields)
const sanitizeData = (data: any) => {
    return Object.entries(data).reduce((acc: any, [key, value]) => {
        if (value !== undefined) {
            acc[key] = value;
        }
        return acc;
    }, {});
};

// Types matching existing interfaces where possible
export interface User {
    uid: string;
    email: string;
    full_name: string;
    role: string;
    village?: string;
    phone?: string;
    is_active?: boolean;
    created_at?: string;
    last_login?: string;
}

export interface Patient {
    id?: string;
    full_name: string;
    age: number;
    gender: string;
    village: string;
    phone?: string;
    health_worker_id?: string; // Reference to User ID
    created_at: string | Timestamp;
}

export interface Screening {
    id?: string;
    patient_id: string;
    patient_name?: string; // Denormalized for easier display
    height_cm?: number;
    weight_kg?: number;
    systolic_bp?: number;
    diastolic_bp?: number;
    heart_rate?: number;
    glucose_level?: number;
    cholesterol_level?: number;
    smoking_status?: string;
    alcohol_usage?: string;
    physical_activity?: string;
    risk_score: number;
    risk_level: 'Low' | 'Medium' | 'High';
    risk_notes?: string;
    ai_insights?: string;
    created_at: string | Timestamp;
}

export interface Appointment {
    id?: string;
    patient_id: string;
    health_worker_id: string;
    scheduled_date: string; // ISO string
    reason: string;
    notes?: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
    created_at: string | Timestamp;
}

export const firestoreService = {
    // --- Users (Health Workers) ---
    async getHealthWorkers() {
        const q = query(
            collection(db, "users"),
            where("role", "==", "health_worker")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc: any) => ({ uid: doc.id, ...doc.data() } as User));
    },

    async createHealthWorker(data: any) {
        // Creates a Firestore document for the Health Worker.
        // Note: Actual authentication creation is handled separately (e.g., via RegisterPage or Admin SDK).

        const docRef = await addDoc(collection(db, "users"), {
            ...data,
            role: 'health_worker',
            created_at: new Date().toISOString(),
            is_active: true
        });
        return { uid: docRef.id, ...data };
    },

    async toggleUserStatus(uid: string, isActive: boolean) {
        await updateDoc(doc(db, "users", uid), { is_active: isActive });
    },

    // --- Patients ---
    async getPatients(healthWorkerId?: string) {
        let q;
        if (healthWorkerId) {
            // Health workers only see their own patients
            q = query(
                collection(db, "patients"),
                where("health_worker_id", "==", healthWorkerId)
            );
        } else {
            // Admin/Officers see all
            q = query(collection(db, "patients"), orderBy("created_at", "desc"));
        }

        const snapshot = await getDocs(q);
        const patients = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Patient));

        // Client-side sort if healthWorkerId was used (to avoid composite index)
        if (healthWorkerId) {
            patients.sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime());
        }

        return patients;
    },

    async getPatient(id: string) {
        const docRef = doc(db, "patients", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Patient;
        }
        return null;
    },

    async addPatient(patient: Omit<Patient, "id" | "created_at">) {
        const sanitized = sanitizeData(patient);
        const docRef = await addDoc(collection(db, "patients"), {
            ...sanitized,
            created_at: new Date().toISOString()
        });
        return { id: docRef.id, ...sanitized } as Patient;
    },

    async updatePatient(id: string, data: Partial<Patient>) {
        const docRef = doc(db, "patients", id);
        await updateDoc(docRef, { ...data } as any);
        return { id, ...data };
    },

    async setPatient(id: string, data: Partial<Patient>) {
        const docRef = doc(db, "patients", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            await updateDoc(docRef, {
                ...data,
                updated_at: new Date().toISOString()
            } as any);
        } else {
            await setDoc(docRef, {
                ...data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }
        return { id, ...data };
    },

    async deletePatient(id: string) {
        await deleteDoc(doc(db, "patients", id));
    },

    // --- Screenings ---
    async getScreenings(patientId?: string) {
        let q;
        if (patientId) {
            q = query(
                collection(db, "screenings"),
                where("patient_id", "==", patientId)
            );
        } else {
            q = query(collection(db, "screenings"), orderBy("created_at", "desc"));
        }

        const snapshot = await getDocs(q);
        const screenings = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Screening));

        // Client-side sort if patientId was used
        if (patientId) {
            screenings.sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime());
        }

        return screenings;
    },

    async addScreening(screening: Omit<Screening, "id" | "created_at">) {
        const sanitized = sanitizeData(screening);
        const docRef = await addDoc(collection(db, "screenings"), {
            ...sanitized,
            created_at: new Date().toISOString()
        });
        return { id: docRef.id, ...sanitized } as Screening;
    },

    async updateScreening(id: string, data: Partial<Screening>) {
        const docRef = doc(db, "screenings", id);
        await updateDoc(docRef, { ...data } as any);
        return { id, ...data };
    },

    async getScreening(id: string) {
        const docRef = doc(db, "screenings", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Screening;
        }
        return null;
    },

    // --- Appointments ---
    async getAppointments(userId: string, role: string) {
        let q;
        if (role === 'health_worker') {
            q = query(
                collection(db, "appointments"),
                where("health_worker_id", "==", userId)
            );
        } else {
            // For now, officers see all, or filter by other means
            q = query(collection(db, "appointments"), orderBy("scheduled_date", "desc"));
        }

        const snapshot = await getDocs(q);
        const appointments = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Appointment));

        // Client-side sort to avoid needing a composite index
        appointments.sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

        return appointments;
    },

    async getAppointmentsForPatient(patientId: string) {
        const q = query(
            collection(db, "appointments"),
            where("patient_id", "==", patientId)
        );
        const snapshot = await getDocs(q);
        const appointments = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Appointment));

        // Client-side sort
        appointments.sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

        return appointments;
    },

    async addAppointment(appointment: Omit<Appointment, "id" | "created_at">) {
        const sanitized = sanitizeData(appointment);
        const docRef = await addDoc(collection(db, "appointments"), {
            ...sanitized,
            created_at: new Date().toISOString()
        });
        return { id: docRef.id, ...sanitized } as Appointment;
    },

    // --- Stats / Dashboard ---
    async getDashboardStats(healthWorkerId?: string) {
        // Fetch stats for dashboard. 
        // Optimization Note: In production, use Distributed Counters or aggregated stats documents.

        const [patients, screenings, appointments] = await Promise.all([
            this.getPatients(healthWorkerId),
            this.getScreenings(), // Filtering by HW would require composite index or client filter
            healthWorkerId
                ? this.getAppointments(healthWorkerId, 'health_worker')
                : getDocs(collection(db, "appointments")).then((s: any) => s.docs.map((d: any) => ({ id: d.id, ...d.data() } as Appointment)))
        ]);

        // Filter screenings if HW is strictly managed (can also filter in query if index exists)
        // For MVP, we'll assume we can view all or filter in memory
        const relevantScreenings = healthWorkerId
            ? screenings // In a real app, join with patients or store HW ID on screening
            : screenings;

        const highRisk = relevantScreenings.filter(s => s.risk_level === 'High').length;
        const pendingAppointments = appointments.filter((a: Appointment) => a.status === 'scheduled').length;

        // Risk Distribution
        // Risk Distribution
        const riskDist: Record<'Low' | 'Medium' | 'High', number> = { Low: 0, Medium: 0, High: 0 };
        relevantScreenings.forEach((s: Screening) => {
            if (s.risk_level && riskDist[s.risk_level as keyof typeof riskDist] !== undefined) {
                riskDist[s.risk_level as keyof typeof riskDist]++;
            }
        });

        // Age Distribution
        const ageDist: Record<string, number> = { "0-18": 0, "19-30": 0, "31-45": 0, "46-60": 0, "61-75": 0, "75+": 0 };
        patients.forEach(p => {
            if (p.age <= 18) ageDist["0-18"]++;
            else if (p.age <= 30) ageDist["19-30"]++;
            else if (p.age <= 45) ageDist["31-45"]++;
            else if (p.age <= 60) ageDist["46-60"]++;
            else if (p.age <= 75) ageDist["61-75"]++;
            else ageDist["75+"]++;
        });

        // Gender Distribution
        const genderCounts: Record<string, number> = {};
        patients.forEach(p => {
            const g = p.gender || 'Unknown';
            genderCounts[g] = (genderCounts[g] || 0) + 1;
        });
        const genderDist = Object.entries(genderCounts).map(([gender, count]) => ({ gender, count }));

        // Geographic Distribution
        const villageStats: Record<string, { total: number, high_risk: number }> = {};
        patients.forEach(p => {
            const v = p.village || 'Unknown';
            if (!villageStats[v]) villageStats[v] = { total: 0, high_risk: 0 };
            villageStats[v].total++;
        });
        relevantScreenings.forEach(s => {
            const patient = patients.find(p => p.id === s.patient_id);
            const v = patient?.village || 'Unknown';
            if (villageStats[v] && s.risk_level === 'High') {
                villageStats[v].high_risk++;
            }
        });
        const geographicDist = Object.entries(villageStats).map(([village, stats]) => ({ village, ...stats }));

        // Risk Factor Prevalence (%)
        const riskFactors = {
            "Hypertension": relevantScreenings.filter(s => (s.systolic_bp || 0) >= 140 || (s.diastolic_bp || 0) >= 90).length,
            "Diabetes": relevantScreenings.filter(s => (s.glucose_level || 0) >= 200).length,
            "Smoking": relevantScreenings.filter(s => s.smoking_status === 'Current').length,
            "Obesity": relevantScreenings.filter(s => (s.weight_kg || 0) / (Math.pow((s.height_cm || 0) / 100, 2) || 1) >= 30).length,
            "Alcohol": relevantScreenings.filter(s => s.alcohol_usage === 'Frequent').length
        };
        const riskFactorPrevalence = Object.fromEntries(
            Object.entries(riskFactors).map(([key, count]) => [key, relevantScreenings.length > 0 ? Math.round((count / relevantScreenings.length) * 100) : 0])
        );

        // Worker Performance
        const workers = await this.getHealthWorkers();
        const workerPerformance = workers.map(worker => {
            const workerPatients = patients.filter(p => p.health_worker_id === worker.uid);
            // This is a simplification; in a real app, screenings would have worker_id
            // For now, assume screenings are linked to patients who are linked to workers
            const workerScreenings = relevantScreenings.filter(s => {
                const p = patients.find(pat => pat.id === s.patient_id);
                return p?.health_worker_id === worker.uid;
            });
            return {
                worker_name: worker.full_name,
                patients: workerPatients.length,
                screenings: workerScreenings.length,
                completion_rate: workerPatients.length > 0 ? Math.round((workerScreenings.length / workerPatients.length) * 100) : 0
            };
        });

        return {
            total_patients: patients.length,
            total_screenings: relevantScreenings.length,
            high_risk_count: highRisk,
            pending_appointments: pendingAppointments,
            risk_distribution: riskDist,
            age_distribution: ageDist,
            gender_distribution: genderDist,
            geographic_distribution: geographicDist,
            risk_factor_prevalence: riskFactorPrevalence,
            worker_performance: workerPerformance,
            recent_screenings: relevantScreenings.slice(0, 5),
            weekly_screenings: []
        };
    }
};
