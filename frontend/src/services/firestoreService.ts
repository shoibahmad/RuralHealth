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
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { RiskLevel } from "../lib/schemas";

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

/** A health worker plus the caseload counters shown on the workers page. */
export interface HealthWorkerWithStats extends User {
    id: string;
    stats: {
        total_patients: number;
        total_screenings: number;
        high_risk_patients: number;
    };
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
    /** Denormalised counters maintained when a screening is recorded. */
    screening_count?: number;
    latest_risk_level?: RiskLevel;
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
    hemoglobin?: number;
    rbc_count?: number;
    wbc_count?: number;
    platelet_count?: number;
    blood_urea_nitrogen?: number;
    creatinine?: number;
    sodium?: number;
    potassium?: number;
    chloride?: number;
    calcium?: number;
    alt_sgpt?: number;
    ast_sgot?: number;
    albumin?: number;
    total_bilirubin?: number;
    risk_score: number;
    risk_level: RiskLevel;
    risk_notes?: string;
    ai_insights?: string | AiInsights;
    created_at: string | Timestamp;
}

/** The structured analysis returned by the backend's /api/ai/analyze endpoint. */
export interface AiInsights {
    summary?: string;
    summary_hi?: string;
    concerns?: string[];
    concerns_hi?: string[];
    recommendations?: string[];
    recommendations_hi?: string[];
    formatted_insights?: string;
    formatted_insights_hi?: string;
    risk_level?: RiskLevel;
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

export interface VillageStats {
    village: string;
    total: number;
    high_risk: number;
}

export interface WorkerPerformance {
    worker_name: string;
    patients: number;
    screenings: number;
    completion_rate: number;
}

export interface DashboardStats {
    total_patients: number;
    total_screenings: number;
    high_risk_count: number;
    pending_appointments: number;
    risk_distribution: Record<RiskLevel, number>;
    age_distribution: Record<string, number>;
    gender_distribution: { gender: string; count: number }[];
    geographic_distribution: VillageStats[];
    risk_factor_prevalence: Record<string, number>;
    worker_performance: WorkerPerformance[];
    recent_screenings: Screening[];
    weekly_screenings: unknown[];
}

/** Payload for creating a health worker's Firestore profile document. */
export type HealthWorkerInput = Pick<User, 'email' | 'full_name'> &
    Partial<Pick<User, 'village' | 'phone'>>;

/**
 * Drop keys whose value is `undefined`.
 *
 * Firestore rejects documents containing undefined, but optional screening
 * measurements legitimately end up undefined when they were not taken.
 */
const sanitizeData = <T extends Record<string, unknown>>(data: T): Partial<T> => {
    return Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
            acc[key as keyof T] = value as T[keyof T];
        }
        return acc;
    }, {} as Partial<T>);
};

/** Attach a Firestore document's id to its data. */
const withId = <T>(snapshot: QueryDocumentSnapshot<DocumentData>): T =>
    ({ id: snapshot.id, ...snapshot.data() }) as T;

/** Sort newest-first on a date field, avoiding the need for a composite index. */
const byDateDescending = <T>(items: T[], field: keyof T): T[] =>
    items.sort(
        (a, b) =>
            new Date(b[field] as string).getTime() - new Date(a[field] as string).getTime(),
    );

export const firestoreService = {
    // --- Users (Health Workers) ---
    async getHealthWorkers(): Promise<HealthWorkerWithStats[]> {
        try {
            // 1. Fetch Workers
            const q = query(
                collection(db, "users"),
                where("role", "==", "health_worker")
            );
            const snapshot = await getDocs(q);
            const workers = snapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
                uid: doc.id,
            }) as User & { id: string });

            // 2. Concurrently fetch Patients and Screenings with error fallback
            let allPatients: Patient[] = [];
            let allScreenings: Screening[] = [];

            try {
                const [patientsSnap, screeningsSnap] = await Promise.all([
                    getDocs(collection(db, "patients")),
                    getDocs(collection(db, "screenings"))
                ]);
                allPatients = patientsSnap.docs.map((d) => withId<Patient>(d));
                allScreenings = screeningsSnap.docs.map((d) => withId<Screening>(d));
            } catch (err) {
                console.warn("Permission denied for stats aggregation. Showing workers without full metrics.", err);
                // Continue with 0 stats if we can't read those specific collections (permission error)
            }

            // 3. Build lookup maps for O(N) performance
            // patientId -> workerId
            const patientToWorkerId = new Map<string, string>();
            allPatients.forEach(p => {
                if (p.id && p.health_worker_id) {
                    patientToWorkerId.set(p.id, p.health_worker_id);
                }
            });

            // workerId -> count
            const workerPatientCounts = new Map<string, number>();
            const workerScreeningCounts = new Map<string, number>();
            const workerHighRiskCounts = new Map<string, number>();

            // Calculate patients per worker
            allPatients.forEach(p => {
                if (p.health_worker_id) {
                    const current = workerPatientCounts.get(p.health_worker_id) || 0;
                    workerPatientCounts.set(p.health_worker_id, current + 1);
                }
            });

            // Calculate screenings per worker via patient map
            allScreenings.forEach(s => {
                const workerId = patientToWorkerId.get(s.patient_id);
                if (workerId) {
                    const sCount = workerScreeningCounts.get(workerId) || 0;
                    workerScreeningCounts.set(workerId, sCount + 1);

                    if (s.risk_level === 'High') {
                        const hCount = workerHighRiskCounts.get(workerId) || 0;
                        workerHighRiskCounts.set(workerId, hCount + 1);
                    }
                }
            });

            // 4. Final enrichment
            return workers.map((worker) => ({
                ...worker,
                stats: {
                    total_patients: workerPatientCounts.get(worker.uid) || 0,
                    total_screenings: workerScreeningCounts.get(worker.uid) || 0,
                    high_risk_patients: workerHighRiskCounts.get(worker.uid) || 0
                }
            }));

        } catch (error) {
            console.error('Failed to fetch health workers with stats:', error);
            throw error;
        }
    },

    async createHealthWorker(data: HealthWorkerInput) {
        // Creates a Firestore document for the Health Worker.
        // Note: Actual authentication creation is handled separately (e.g., via RegisterPage or Admin SDK).

        const docRef = await addDoc(collection(db, "users"), {
            ...sanitizeData(data),
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
    async getPatients(healthWorkerId?: string): Promise<Patient[]> {
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
        const patients = snapshot.docs.map((doc) => withId<Patient>(doc));

        // If getting all patients, also include self-registered patient users from users collection
        if (!healthWorkerId) {
            try {
                const usersQ = query(
                    collection(db, "users"),
                    where("role", "==", "patient")
                );
                const usersSnapshot = await getDocs(usersQ);

                const patientsMap = new Map<string, Patient>();
                patients.forEach(p => {
                    if (p.id) patientsMap.set(p.id, p);
                });

                usersSnapshot.docs.forEach((doc) => {
                    if (!patientsMap.has(doc.id)) {
                        const uData = doc.data() as Partial<Patient>;
                        patientsMap.set(doc.id, {
                            id: doc.id,
                            full_name: uData.full_name || 'Patient',
                            age: uData.age || 0,
                            gender: uData.gender || 'Not Set',
                            village: uData.village || 'Not Set',
                            phone: uData.phone || '',
                            health_worker_id: uData.health_worker_id || undefined,
                            created_at: uData.created_at || new Date().toISOString()
                        });
                    }
                });

                return byDateDescending(Array.from(patientsMap.values()), 'created_at');
            } catch (err) {
                console.error("Error fetching self-registered patient users:", err);
            }
        }

        // Client-side sort if healthWorkerId was used (to avoid composite index)
        if (healthWorkerId) {
            byDateDescending(patients, 'created_at');
        }

        return patients;
    },

    async getPatient(id: string): Promise<Patient | null> {
        const docRef = doc(db, "patients", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Patient;
        }
        return null;
    },

    async addPatient(patient: Omit<Patient, "id" | "created_at">): Promise<Patient> {
        const sanitized = sanitizeData(patient);
        const docRef = await addDoc(collection(db, "patients"), {
            ...sanitized,
            created_at: new Date().toISOString()
        });
        return { id: docRef.id, ...sanitized } as Patient;
    },

    async updatePatient(id: string, data: Partial<Patient>) {
        const docRef = doc(db, "patients", id);
        await updateDoc(docRef, sanitizeData(data));
        return { id, ...data };
    },

    async setPatient(id: string, data: Partial<Patient>) {
        const docRef = doc(db, "patients", id);
        const docSnap = await getDoc(docRef);
        const sanitized = sanitizeData(data);

        if (docSnap.exists()) {
            await updateDoc(docRef, {
                ...sanitized,
                updated_at: new Date().toISOString()
            });
        } else {
            await setDoc(docRef, {
                ...sanitized,
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
    async getScreenings(patientId?: string): Promise<Screening[]> {
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
        const screenings = snapshot.docs.map((doc) => withId<Screening>(doc));

        // Client-side sort if patientId was used
        if (patientId) {
            byDateDescending(screenings, 'created_at');
        }

        return screenings;
    },

    async addScreening(screening: Omit<Screening, "id" | "created_at">): Promise<Screening> {
        const sanitized = sanitizeData(screening);
        const docRef = await addDoc(collection(db, "screenings"), {
            ...sanitized,
            created_at: new Date().toISOString()
        });
        return { id: docRef.id, ...sanitized } as Screening;
    },

    async updateScreening(id: string, data: Partial<Screening>) {
        const docRef = doc(db, "screenings", id);
        await updateDoc(docRef, sanitizeData(data));
        return { id, ...data };
    },

    async getScreening(id: string): Promise<Screening | null> {
        const docRef = doc(db, "screenings", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Screening;
        }
        return null;
    },

    // --- Appointments ---
    async getAppointments(userId: string, role: string): Promise<Appointment[]> {
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
        const appointments = snapshot.docs.map((doc) => withId<Appointment>(doc));

        // Client-side sort to avoid needing a composite index
        return byDateDescending(appointments, 'scheduled_date');
    },

    async getAppointmentsForPatient(patientId: string): Promise<Appointment[]> {
        const q = query(
            collection(db, "appointments"),
            where("patient_id", "==", patientId)
        );
        const snapshot = await getDocs(q);
        const appointments = snapshot.docs.map((doc) => withId<Appointment>(doc));

        return byDateDescending(appointments, 'scheduled_date');
    },

    async addAppointment(appointment: Omit<Appointment, "id" | "created_at">): Promise<Appointment> {
        const sanitized = sanitizeData(appointment);
        const docRef = await addDoc(collection(db, "appointments"), {
            ...sanitized,
            created_at: new Date().toISOString()
        });
        return { id: docRef.id, ...sanitized } as Appointment;
    },

    // --- Stats / Dashboard ---
    async getDashboardStats(healthWorkerId?: string): Promise<DashboardStats> {
        // Fetch stats for dashboard.
        // Optimization Note: In production, use Distributed Counters or aggregated stats documents.

        const [patients, screenings, appointments] = await Promise.all([
            this.getPatients(healthWorkerId),
            this.getScreenings(), // Filtering by HW would require composite index or client filter
            healthWorkerId
                ? this.getAppointments(healthWorkerId, 'health_worker')
                : getDocs(collection(db, "appointments")).then((s) =>
                    s.docs.map((d) => withId<Appointment>(d))
                )
        ]);

        const highRisk = screenings.filter(s => s.risk_level === 'High').length;
        const pendingAppointments = appointments.filter(a => a.status === 'scheduled').length;

        // Risk Distribution
        const riskDist: Record<RiskLevel, number> = { Low: 0, Medium: 0, High: 0 };
        screenings.forEach((s) => {
            if (s.risk_level && riskDist[s.risk_level] !== undefined) {
                riskDist[s.risk_level]++;
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

        // 1. Initialize villages from patients
        patients.forEach(p => {
            const v = (p.village || 'Unknown').trim();
            if (!villageStats[v]) villageStats[v] = { total: 0, high_risk: 0 };
            villageStats[v].total++;
        });

        // 2. Map screenings to villages via patient lookup
        screenings.forEach(s => {
            const patient = patients.find(p => p.id === s.patient_id);
            const v = (patient?.village || 'Unknown').trim();

            if (villageStats[v] && s.risk_level === 'High') {
                villageStats[v].high_risk++;
            }
        });

        // 3. Convert to array and sort by total patients descending
        const geographicDist: VillageStats[] = Object.entries(villageStats)
            .map(([village, stats]) => ({ village, ...stats }))
            .sort((a, b) => b.total - a.total);

        // Risk Factor Prevalence (%)
        const riskFactors = {
            "Hypertension": screenings.filter(s => (s.systolic_bp || 0) >= 140 || (s.diastolic_bp || 0) >= 90).length,
            "Diabetes": screenings.filter(s => (s.glucose_level || 0) >= 200).length,
            "Smoking": screenings.filter(s => s.smoking_status === 'Current').length,
            "Obesity": screenings.filter(s => (s.weight_kg || 0) / (Math.pow((s.height_cm || 0) / 100, 2) || 1) >= 30).length,
            "Alcohol": screenings.filter(s => s.alcohol_usage === 'Frequent').length
        };
        const riskFactorPrevalence = Object.fromEntries(
            Object.entries(riskFactors).map(([key, count]) => [key, screenings.length > 0 ? Math.round((count / screenings.length) * 100) : 0])
        );

        // Worker Performance
        const workers = await this.getHealthWorkers();
        const workerPerformance: WorkerPerformance[] = workers.map(worker => {
            const workerPatients = patients.filter(p => p.health_worker_id === worker.uid);
            // Screenings are linked to patients, who are in turn linked to workers.
            const workerScreenings = screenings.filter(s => {
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
            total_screenings: screenings.length,
            high_risk_count: highRisk,
            pending_appointments: pendingAppointments,
            risk_distribution: riskDist,
            age_distribution: ageDist,
            gender_distribution: genderDist,
            geographic_distribution: geographicDist,
            risk_factor_prevalence: riskFactorPrevalence,
            worker_performance: workerPerformance,
            recent_screenings: screenings.slice(0, 5),
            weekly_screenings: []
        };
    }
};
