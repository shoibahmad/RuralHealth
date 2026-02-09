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
        // Use setDoc with merge to create if not exists or update if exists
        await setDoc(docRef, {
            ...data,
            updated_at: new Date().toISOString()
        }, { merge: true });
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

        // Weekly Activity (Mock or Calculate)
        // Calculating properly would require bucketing dates

        return {
            total_patients: patients.length,
            total_screenings: relevantScreenings.length,
            high_risk_count: highRisk,
            pending_appointments: pendingAppointments,
            risk_distribution: riskDist,
            recent_screenings: relevantScreenings.slice(0, 5),
            weekly_screenings: [] // Todo: implement date bucketing if needed
        };
    }
};
