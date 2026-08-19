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
    setDoc,
} from "firebase/firestore";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import { db } from "../lib/firebase";
import { buildDashboardStats, workerCaseload } from "./dashboardStats";
import type {
    Appointment,
    DashboardStats,
    HealthWorkerInput,
    HealthWorkerWithStats,
    Patient,
    Screening,
    User,
} from "./types";

// Re-exported so consumers can keep importing types alongside the service.
export type {
    AiInsights,
    Appointment,
    DashboardStats,
    HealthWorkerInput,
    HealthWorkerWithStats,
    Patient,
    PatientDetail,
    Recommendation,
    Screening,
    User,
    VillageStats,
    WeeklyScreeningPoint,
    WorkerCaseloadStats,
    WorkerPerformance,
} from "./types";

/**
 * Drop keys whose value is `undefined`.
 *
 * Firestore rejects documents containing undefined, but optional screening
 * measurements legitimately end up undefined when they were not taken.
 */
const sanitizeData = <T extends Record<string, unknown>>(data: T): Partial<T> =>
    Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
            acc[key as keyof T] = value as T[keyof T];
        }
        return acc;
    }, {} as Partial<T>);

/** Attach a Firestore document's id to its data. */
const withId = <T>(snapshot: QueryDocumentSnapshot<DocumentData>): T =>
    ({ id: snapshot.id, ...snapshot.data() }) as T;

/** Sort newest-first on a date field, avoiding the need for a composite index. */
const byDateDescending = <T>(items: T[], field: keyof T): T[] =>
    items.sort(
        (a, b) => new Date(b[field] as string).getTime() - new Date(a[field] as string).getTime(),
    );

export const firestoreService = {
    // --- Users (Health Workers) ---
    async getHealthWorkers(): Promise<HealthWorkerWithStats[]> {
        try {
            const snapshot = await getDocs(
                query(collection(db, "users"), where("role", "==", "health_worker")),
            );
            const workers = snapshot.docs.map(
                (workerDoc) =>
                    ({
                        ...workerDoc.data(),
                        id: workerDoc.id,
                        uid: workerDoc.id,
                    }) as User & { id: string },
            );

            let allPatients: Patient[] = [];
            let allScreenings: Screening[] = [];

            try {
                const [patientsSnap, screeningsSnap] = await Promise.all([
                    getDocs(collection(db, "patients")),
                    getDocs(collection(db, "screenings")),
                ]);
                allPatients = patientsSnap.docs.map((d) => withId<Patient>(d));
                allScreenings = screeningsSnap.docs.map((d) => withId<Screening>(d));
            } catch (err) {
                // A worker without permission to aggregate should still see the
                // roster, just without the counters.
                console.warn(
                    "Permission denied for stats aggregation. Showing workers without full metrics.",
                    err,
                );
            }

            return workers.map((worker) => ({
                ...worker,
                stats: workerCaseload(worker.uid, allPatients, allScreenings),
            }));
        } catch (error) {
            console.error("Failed to fetch health workers with stats:", error);
            throw error;
        }
    },

    async createHealthWorker(data: HealthWorkerInput) {
        // Authentication accounts are created separately, via RegisterPage or
        // the Admin SDK; this only writes the profile document.
        const docRef = await addDoc(collection(db, "users"), {
            ...sanitizeData(data),
            role: "health_worker",
            created_at: new Date().toISOString(),
            is_active: true,
        });
        return { uid: docRef.id, ...data };
    },

    async toggleUserStatus(uid: string, isActive: boolean) {
        await updateDoc(doc(db, "users", uid), { is_active: isActive });
    },

    // --- Patients ---
    async getPatients(healthWorkerId?: string): Promise<Patient[]> {
        const patientQuery = healthWorkerId
            ? query(
                  collection(db, "patients"),
                  where("health_worker_id", "==", healthWorkerId),
              )
            : query(collection(db, "patients"), orderBy("created_at", "desc"));

        const snapshot = await getDocs(patientQuery);
        const patients = snapshot.docs.map((patientDoc) => withId<Patient>(patientDoc));

        if (healthWorkerId) {
            // Sorting client-side avoids needing a composite index.
            return byDateDescending(patients, "created_at");
        }

        // Officers also see patients who registered themselves and therefore
        // exist only in the users collection.
        try {
            const usersSnapshot = await getDocs(
                query(collection(db, "users"), where("role", "==", "patient")),
            );

            const merged = new Map<string, Patient>();
            for (const patient of patients) {
                if (patient.id) merged.set(patient.id, patient);
            }

            for (const userDoc of usersSnapshot.docs) {
                if (merged.has(userDoc.id)) continue;

                const data = userDoc.data() as Partial<Patient>;
                merged.set(userDoc.id, {
                    id: userDoc.id,
                    full_name: data.full_name || "Patient",
                    age: data.age || 0,
                    gender: data.gender || "Not Set",
                    village: data.village || "Not Set",
                    phone: data.phone || "",
                    health_worker_id: data.health_worker_id || undefined,
                    created_at: data.created_at || new Date().toISOString(),
                });
            }

            return byDateDescending(Array.from(merged.values()), "created_at");
        } catch (err) {
            console.error("Error fetching self-registered patient users:", err);
            return patients;
        }
    },

    async getPatient(id: string): Promise<Patient | null> {
        const docSnap = await getDoc(doc(db, "patients", id));
        return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Patient) : null;
    },

    async addPatient(patient: Omit<Patient, "id" | "created_at">): Promise<Patient> {
        const sanitized = sanitizeData(patient);
        const docRef = await addDoc(collection(db, "patients"), {
            ...sanitized,
            created_at: new Date().toISOString(),
        });
        return { id: docRef.id, ...sanitized } as Patient;
    },

    async updatePatient(id: string, data: Partial<Patient>) {
        await updateDoc(doc(db, "patients", id), sanitizeData(data));
        return { id, ...data };
    },

    /** Update the patient document, creating it when it does not exist yet. */
    async setPatient(id: string, data: Partial<Patient>) {
        const docRef = doc(db, "patients", id);
        const docSnap = await getDoc(docRef);
        const sanitized = sanitizeData(data);

        if (docSnap.exists()) {
            await updateDoc(docRef, { ...sanitized, updated_at: new Date().toISOString() });
        } else {
            await setDoc(docRef, {
                ...sanitized,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
        }
        return { id, ...data };
    },

    async deletePatient(id: string) {
        await deleteDoc(doc(db, "patients", id));
    },

    // --- Screenings ---
    async getScreenings(patientId?: string): Promise<Screening[]> {
        const screeningQuery = patientId
            ? query(collection(db, "screenings"), where("patient_id", "==", patientId))
            : query(collection(db, "screenings"), orderBy("created_at", "desc"));

        const snapshot = await getDocs(screeningQuery);
        const screenings = snapshot.docs.map((s) => withId<Screening>(s));

        return patientId ? byDateDescending(screenings, "created_at") : screenings;
    },

    async addScreening(screening: Omit<Screening, "id" | "created_at">): Promise<Screening> {
        const sanitized = sanitizeData(screening);
        const docRef = await addDoc(collection(db, "screenings"), {
            ...sanitized,
            created_at: new Date().toISOString(),
        });
        return { id: docRef.id, ...sanitized } as Screening;
    },

    async updateScreening(id: string, data: Partial<Screening>) {
        await updateDoc(doc(db, "screenings", id), sanitizeData(data));
        return { id, ...data };
    },

    async getScreening(id: string): Promise<Screening | null> {
        const docSnap = await getDoc(doc(db, "screenings", id));
        return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Screening) : null;
    },

    // --- Appointments ---
    async getAppointments(userId: string, role: string): Promise<Appointment[]> {
        const appointmentQuery =
            role === "health_worker"
                ? query(
                      collection(db, "appointments"),
                      where("health_worker_id", "==", userId),
                  )
                : query(collection(db, "appointments"), orderBy("scheduled_date", "desc"));

        const snapshot = await getDocs(appointmentQuery);
        const appointments = snapshot.docs.map((a) => withId<Appointment>(a));

        return byDateDescending(appointments, "scheduled_date");
    },

    async getAppointmentsForPatient(patientId: string): Promise<Appointment[]> {
        const snapshot = await getDocs(
            query(collection(db, "appointments"), where("patient_id", "==", patientId)),
        );
        const appointments = snapshot.docs.map((a) => withId<Appointment>(a));

        return byDateDescending(appointments, "scheduled_date");
    },

    async addAppointment(
        appointment: Omit<Appointment, "id" | "created_at">,
    ): Promise<Appointment> {
        const sanitized = sanitizeData(appointment);
        const docRef = await addDoc(collection(db, "appointments"), {
            ...sanitized,
            created_at: new Date().toISOString(),
        });
        return { id: docRef.id, ...sanitized } as Appointment;
    },

    // --- Stats / Dashboard ---
    /**
     * Fetch everything the dashboard needs and aggregate it.
     *
     * At production volume this should move to distributed counters or a
     * pre-aggregated stats document rather than reading whole collections.
     */
    async getDashboardStats(healthWorkerId?: string): Promise<DashboardStats> {
        const [patients, screenings, appointments] = await Promise.all([
            this.getPatients(healthWorkerId),
            this.getScreenings(),
            healthWorkerId
                ? this.getAppointments(healthWorkerId, "health_worker")
                : getDocs(collection(db, "appointments")).then((s) =>
                      s.docs.map((d) => withId<Appointment>(d)),
                  ),
        ]);

        const workers = await this.getHealthWorkers();

        return buildDashboardStats({ patients, screenings, appointments, workers });
    },
};
