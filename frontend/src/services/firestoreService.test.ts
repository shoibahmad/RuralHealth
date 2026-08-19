import { beforeEach, describe, expect, it, vi } from "vitest";

// The Firestore SDK is replaced wholesale: these tests exercise this module's
// own aggregation and sorting logic, not Google's client.
vi.mock("firebase/firestore", () => ({
    collection: vi.fn((_db, name: string) => ({ __collection: name })),
    doc: vi.fn((_db, name: string, id: string) => ({ __doc: `${name}/${id}` })),
    addDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    setDoc: vi.fn(),
    query: vi.fn((base, ...clauses) => ({ ...base, clauses })),
    where: vi.fn((field, op, value) => ({ type: "where", field, op, value })),
    orderBy: vi.fn((field, dir) => ({ type: "orderBy", field, dir })),
    Timestamp: class {},
}));

vi.mock("../lib/firebase", () => ({ db: { __db: true } }));

import {
    addDoc,
    deleteDoc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
} from "firebase/firestore";

import { firestoreService } from "./firestoreService";

/** Build a fake Firestore query snapshot from plain objects. */
const snapshotOf = (rows: Row[]) => ({
    docs: rows.map(({ id, ...data }) => ({ id, data: () => data })),
});

type Row = { id: string; [key: string]: unknown };
type CollectionFixtures = Partial<Record<string, Row[] | Error>>;

/**
 * Route getDocs by collection name rather than call order.
 *
 * getDashboardStats fires several reads inside a Promise.all, so the order in
 * which getDocs is reached is an implementation detail; keying off the
 * collection keeps these tests stable when that changes. `where('role', ...)`
 * clauses are honoured so the users collection can serve both the health-worker
 * and self-registered-patient queries.
 */
const mockCollections = (fixtures: CollectionFixtures) => {
    vi.mocked(getDocs).mockReset();
    // @ts-expect-error - the mock resolves to our minimal snapshot shape
    vi.mocked(getDocs).mockImplementation(async (ref: unknown) => {
        const target = ref as { __collection?: string; clauses?: unknown[] };
        const name = target.__collection ?? "";
        const fixture = fixtures[name];

        if (fixture instanceof Error) throw fixture;

        let rows = fixture ?? [];
        for (const clause of target.clauses ?? []) {
            const where = clause as { type?: string; field?: string; value?: unknown };
            if (where.type === "where" && where.field === "role") {
                rows = rows.filter((row) => row.role === where.value);
            }
        }

        return snapshotOf(rows);
    });
};

/** Stub the next getDoc call with a minimal document snapshot. */
const mockDocSnapshot = ({
    exists,
    id = "doc-id",
    data = {},
}: {
    exists: boolean;
    id?: string;
    data?: Record<string, unknown>;
}) => {
    vi.mocked(getDoc).mockResolvedValue({
        exists: () => exists,
        id,
        data: () => data,
    } as unknown as Awaited<ReturnType<typeof getDoc>>);
};

beforeEach(() => {
    vi.mocked(getDocs).mockReset();
    vi.mocked(addDoc).mockReset();
    vi.mocked(updateDoc).mockReset();
    vi.mocked(setDoc).mockReset();
    vi.mocked(getDoc).mockReset();
    vi.mocked(deleteDoc).mockReset();
    // @ts-expect-error - only the id is read back from the write result
    vi.mocked(addDoc).mockResolvedValue({ id: "generated-id" });
});

describe("getPatients", () => {
    it("returns a worker's own patients newest first", async () => {
        mockCollections({
            patients: [
                { id: "p1", full_name: "Older", created_at: "2026-01-01T00:00:00Z" },
                { id: "p2", full_name: "Newer", created_at: "2026-06-01T00:00:00Z" },
            ],
        });

        const patients = await firestoreService.getPatients("worker-1");

        expect(patients.map((p) => p.full_name)).toEqual(["Newer", "Older"]);
        expect(patients[0].id).toBe("p2");
    });

    it("merges self-registered patient users into the officer-wide list", async () => {
        mockCollections({
            patients: [
                { id: "p1", full_name: "Registered", created_at: "2026-01-01T00:00:00Z" },
            ],
            users: [
                {
                    id: "u9",
                    full_name: "Self Signup",
                    role: "patient",
                    created_at: "2026-05-01T00:00:00Z",
                },
            ],
        });

        const patients = await firestoreService.getPatients();

        expect(patients.map((p) => p.full_name)).toEqual(["Self Signup", "Registered"]);
    });

    it("does not duplicate a patient present in both collections", async () => {
        mockCollections({
            patients: [
                { id: "shared", full_name: "From patients", created_at: "2026-01-01T00:00:00Z" },
            ],
            users: [
                {
                    id: "shared",
                    full_name: "From users",
                    role: "patient",
                    created_at: "2026-05-01T00:00:00Z",
                },
            ],
        });

        const patients = await firestoreService.getPatients();

        expect(patients).toHaveLength(1);
        expect(patients[0].full_name).toBe("From patients");
    });

    it("fills in placeholders for incomplete self-registered profiles", async () => {
        mockCollections({ patients: [], users: [{ id: "u9", role: "patient" }] });

        const [patient] = await firestoreService.getPatients();

        expect(patient.full_name).toBe("Patient");
        expect(patient.age).toBe(0);
        expect(patient.gender).toBe("Not Set");
        expect(patient.village).toBe("Not Set");
    });

    it("still returns registered patients when the users read is denied", async () => {
        mockCollections({
            patients: [
                { id: "p1", full_name: "Registered", created_at: "2026-01-01T00:00:00Z" },
            ],
            users: new Error("permission-denied"),
        });

        const patients = await firestoreService.getPatients();

        expect(patients.map((p) => p.full_name)).toEqual(["Registered"]);
    });
});

describe("addPatient", () => {
    it("stamps created_at and returns the generated id", async () => {
        const result = await firestoreService.addPatient({
            full_name: "Anita",
            age: 41,
            gender: "Female",
            village: "Basantpur",
        });

        expect(result.id).toBe("generated-id");

        const [, written] = vi.mocked(addDoc).mock.calls[0];
        expect(written).toMatchObject({ full_name: "Anita", age: 41 });
        expect(written).toHaveProperty("created_at");
    });

    it("strips undefined fields that Firestore would reject", async () => {
        await firestoreService.addPatient({
            full_name: "Anita",
            age: 41,
            gender: "Female",
            village: "Basantpur",
            phone: undefined,
        });

        const [, written] = vi.mocked(addDoc).mock.calls[0];
        expect(written).not.toHaveProperty("phone");
    });
});

describe("addScreening", () => {
    it("omits measurements that were not taken", async () => {
        await firestoreService.addScreening({
            patient_id: "p1",
            systolic_bp: 130,
            diastolic_bp: undefined,
            glucose_level: undefined,
            risk_score: 10,
            risk_level: "Low",
        });

        const [, written] = vi.mocked(addDoc).mock.calls[0];
        expect(written).toMatchObject({ patient_id: "p1", systolic_bp: 130 });
        expect(written).not.toHaveProperty("diastolic_bp");
        expect(written).not.toHaveProperty("glucose_level");
    });

    it("keeps a zero reading, which is a real value", async () => {
        await firestoreService.addScreening({
            patient_id: "p1",
            risk_score: 0,
            risk_level: "Low",
        });

        const [, written] = vi.mocked(addDoc).mock.calls[0];
        expect(written).toMatchObject({ risk_score: 0 });
    });
});

describe("getPatient", () => {
    it("returns the document with its id when it exists", async () => {
        mockDocSnapshot({ exists: true, id: "p1", data: { full_name: "Ramesh" } });

        const patient = await firestoreService.getPatient("p1");

        expect(patient).toEqual({ id: "p1", full_name: "Ramesh" });
    });

    it("returns null when the document is missing", async () => {
        mockDocSnapshot({ exists: false });

        expect(await firestoreService.getPatient("nope")).toBeNull();
    });
});

describe("setPatient", () => {
    it("updates an existing profile rather than replacing it", async () => {
        mockDocSnapshot({ exists: true });

        await firestoreService.setPatient("p1", { village: "Moved" });

        expect(updateDoc).toHaveBeenCalledOnce();
        expect(setDoc).not.toHaveBeenCalled();
        expect(vi.mocked(updateDoc).mock.calls[0][1]).toHaveProperty("updated_at");
    });

    it("creates the profile when it does not exist yet", async () => {
        mockDocSnapshot({ exists: false });

        await firestoreService.setPatient("p1", { village: "New" });

        expect(setDoc).toHaveBeenCalledOnce();
        expect(updateDoc).not.toHaveBeenCalled();
        expect(vi.mocked(setDoc).mock.calls[0][1]).toHaveProperty("created_at");
    });
});

describe("deletePatient", () => {
    it("deletes the addressed document", async () => {
        await firestoreService.deletePatient("p1");

        expect(deleteDoc).toHaveBeenCalledWith({ __doc: "patients/p1" });
    });
});

describe("getScreenings", () => {
    it("sorts a patient's screenings newest first", async () => {
        mockCollections({
            screenings: [
                { id: "s1", patient_id: "p1", created_at: "2026-01-01T00:00:00Z" },
                { id: "s2", patient_id: "p1", created_at: "2026-08-01T00:00:00Z" },
            ],
        });

        const screenings = await firestoreService.getScreenings("p1");

        expect(screenings.map((s) => s.id)).toEqual(["s2", "s1"]);
    });
});

describe("getAppointments", () => {
    it("sorts by scheduled date, newest first", async () => {
        mockCollections({
            appointments: [
                { id: "a1", scheduled_date: "2026-02-01T00:00:00Z" },
                { id: "a2", scheduled_date: "2026-09-01T00:00:00Z" },
            ],
        });

        const appointments = await firestoreService.getAppointments("w1", "health_worker");

        expect(appointments.map((a) => a.id)).toEqual(["a2", "a1"]);
    });
});

describe("getHealthWorkers", () => {
    it("aggregates each worker's patient, screening and high-risk counts", async () => {
        mockCollections({
            users: [
                { id: "w1", full_name: "Worker One", role: "health_worker" },
                { id: "w2", full_name: "Worker Two", role: "health_worker" },
            ],
            patients: [
                { id: "p1", health_worker_id: "w1" },
                { id: "p2", health_worker_id: "w1" },
                { id: "p3", health_worker_id: "w2" },
            ],
            screenings: [
                { id: "s1", patient_id: "p1", risk_level: "High" },
                { id: "s2", patient_id: "p2", risk_level: "Low" },
                { id: "s3", patient_id: "p3", risk_level: "High" },
            ],
        });

        const workers = await firestoreService.getHealthWorkers();

        const first = workers.find((w) => w.uid === "w1");
        expect(first?.stats).toEqual({
            total_patients: 2,
            total_screenings: 2,
            high_risk_patients: 1,
        });

        const second = workers.find((w) => w.uid === "w2");
        expect(second?.stats).toEqual({
            total_patients: 1,
            total_screenings: 1,
            high_risk_patients: 1,
        });
    });

    it("ignores screenings whose patient has no worker", async () => {
        mockCollections({
            users: [{ id: "w1", full_name: "Worker One", role: "health_worker" }],
            patients: [{ id: "p1" }],
            screenings: [{ id: "s1", patient_id: "p1", risk_level: "High" }],
        });

        const [worker] = await firestoreService.getHealthWorkers();

        expect(worker.stats.total_screenings).toBe(0);
    });

    it("falls back to zeroed stats when the aggregation reads are denied", async () => {
        mockCollections({
            users: [{ id: "w1", full_name: "Worker One", role: "health_worker" }],
            patients: new Error("permission-denied"),
            screenings: new Error("permission-denied"),
        });

        const [worker] = await firestoreService.getHealthWorkers();

        expect(worker.stats).toEqual({
            total_patients: 0,
            total_screenings: 0,
            high_risk_patients: 0,
        });
    });
});

describe("getDashboardStats", () => {
    const seedDashboard = () =>
        mockCollections({
            patients: [
                { id: "p1", full_name: "A", age: 52, gender: "Male", village: "Chandpur", health_worker_id: "w1", created_at: "2026-01-01T00:00:00Z" },
                { id: "p2", full_name: "B", age: 25, gender: "Female", village: "Rampur", health_worker_id: "w1", created_at: "2026-02-01T00:00:00Z" },
            ],
            screenings: [
                { id: "s1", patient_id: "p1", risk_level: "High", systolic_bp: 160, smoking_status: "Current", created_at: "2026-03-01T00:00:00Z" },
                { id: "s2", patient_id: "p2", risk_level: "Low", systolic_bp: 110, created_at: "2026-04-01T00:00:00Z" },
            ],
            appointments: [
                { id: "a1", status: "scheduled" },
                { id: "a2", status: "completed" },
            ],
            // The role filter in the mock keeps this worker out of the
            // self-registered-patient merge inside getPatients.
            users: [{ id: "w1", full_name: "Worker One", role: "health_worker" }],
        });

    it("counts patients, screenings and high-risk cases", async () => {
        seedDashboard();

        const stats = await firestoreService.getDashboardStats();

        expect(stats.total_patients).toBe(2);
        expect(stats.total_screenings).toBe(2);
        expect(stats.high_risk_count).toBe(1);
    });

    it("counts only scheduled appointments as pending", async () => {
        seedDashboard();

        const stats = await firestoreService.getDashboardStats();

        expect(stats.pending_appointments).toBe(1);
    });

    it("always reports all three risk bands", async () => {
        seedDashboard();

        const stats = await firestoreService.getDashboardStats();

        expect(stats.risk_distribution).toEqual({ Low: 1, Medium: 0, High: 1 });
    });

    it("buckets patients by age", async () => {
        seedDashboard();

        const stats = await firestoreService.getDashboardStats();

        expect(stats.age_distribution["46-60"]).toBe(1);
        expect(stats.age_distribution["19-30"]).toBe(1);
        expect(stats.age_distribution["0-18"]).toBe(0);
    });

    it("attributes high-risk screenings to the patient's village", async () => {
        seedDashboard();

        const stats = await firestoreService.getDashboardStats();

        const chandpur = stats.geographic_distribution.find((v) => v.village === "Chandpur");
        expect(chandpur).toEqual({ village: "Chandpur", total: 1, high_risk: 1 });
    });

    it("reports risk factor prevalence as whole percentages", async () => {
        seedDashboard();

        const stats = await firestoreService.getDashboardStats();

        expect(stats.risk_factor_prevalence.Hypertension).toBe(50);
        expect(stats.risk_factor_prevalence.Smoking).toBe(50);
    });

    it("computes a worker completion rate", async () => {
        seedDashboard();

        const stats = await firestoreService.getDashboardStats();

        expect(stats.worker_performance[0]).toEqual({
            worker_name: "Worker One",
            patients: 2,
            screenings: 2,
            completion_rate: 100,
        });
    });

    it("does not divide by zero when there are no screenings", async () => {
        mockCollections({ patients: [], screenings: [], appointments: [], users: [] });

        const stats = await firestoreService.getDashboardStats();

        expect(stats.total_screenings).toBe(0);
        expect(stats.risk_factor_prevalence.Hypertension).toBe(0);
        expect(stats.geographic_distribution).toEqual([]);
    });
});
