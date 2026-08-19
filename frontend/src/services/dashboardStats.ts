import type { RiskLevel } from "../lib/schemas";
import type {
    Appointment,
    DashboardStats,
    HealthWorkerWithStats,
    Patient,
    Screening,
    VillageStats,
    WorkerCaseloadStats,
    WorkerPerformance,
} from "./types";

/**
 * Dashboard aggregation, expressed over plain arrays.
 *
 * Reading from Firestore is the caller's job; keeping the arithmetic here means
 * the counters, distributions and prevalence percentages can be tested without
 * standing up a database or mocking the SDK.
 */

const AGE_BANDS: [string, (age: number) => boolean][] = [
    ["0-18", (age) => age <= 18],
    ["19-30", (age) => age <= 30],
    ["31-45", (age) => age <= 45],
    ["46-60", (age) => age <= 60],
    ["61-75", (age) => age <= 75],
    ["75+", () => true],
];

const OBESE_BMI = 30;

/** Count screenings per risk band, always returning all three keys. */
export function riskDistribution(screenings: Screening[]): Record<RiskLevel, number> {
    const distribution: Record<RiskLevel, number> = { Low: 0, Medium: 0, High: 0 };

    for (const screening of screenings) {
        if (screening.risk_level && distribution[screening.risk_level] !== undefined) {
            distribution[screening.risk_level]++;
        }
    }

    return distribution;
}

/** Bucket patients into the reporting age bands. */
export function ageDistribution(patients: Patient[]): Record<string, number> {
    const distribution: Record<string, number> = Object.fromEntries(
        AGE_BANDS.map(([label]) => [label, 0]),
    );

    for (const patient of patients) {
        const band = AGE_BANDS.find(([, matches]) => matches(patient.age ?? 0));
        if (band) distribution[band[0]]++;
    }

    return distribution;
}

export function genderDistribution(patients: Patient[]): { gender: string; count: number }[] {
    const counts: Record<string, number> = {};

    for (const patient of patients) {
        const gender = patient.gender || "Unknown";
        counts[gender] = (counts[gender] || 0) + 1;
    }

    return Object.entries(counts).map(([gender, count]) => ({ gender, count }));
}

/** Patients and high-risk screenings per village, busiest village first. */
export function geographicDistribution(
    patients: Patient[],
    screenings: Screening[],
): VillageStats[] {
    const stats: Record<string, { total: number; high_risk: number }> = {};

    for (const patient of patients) {
        const village = (patient.village || "Unknown").trim();
        stats[village] ??= { total: 0, high_risk: 0 };
        stats[village].total++;
    }

    const villageByPatientId = new Map(
        patients.map((patient) => [patient.id, (patient.village || "Unknown").trim()]),
    );

    for (const screening of screenings) {
        if (screening.risk_level !== "High") continue;
        const village = villageByPatientId.get(screening.patient_id);
        if (village && stats[village]) stats[village].high_risk++;
    }

    return Object.entries(stats)
        .map(([village, counts]) => ({ village, ...counts }))
        .sort((a, b) => b.total - a.total);
}

const bmiOf = (screening: Screening): number => {
    const heightM = (screening.height_cm || 0) / 100;
    if (heightM <= 0) return 0;
    return (screening.weight_kg || 0) / (heightM * heightM);
};

/** Share of screenings showing each risk factor, as whole percentages. */
export function riskFactorPrevalence(screenings: Screening[]): Record<string, number> {
    const counts = {
        Hypertension: screenings.filter(
            (s) => (s.systolic_bp || 0) >= 140 || (s.diastolic_bp || 0) >= 90,
        ).length,
        Diabetes: screenings.filter((s) => (s.glucose_level || 0) >= 200).length,
        Smoking: screenings.filter((s) => s.smoking_status === "Current").length,
        Obesity: screenings.filter((s) => bmiOf(s) >= OBESE_BMI).length,
        Alcohol: screenings.filter((s) => s.alcohol_usage === "Frequent").length,
    };

    return Object.fromEntries(
        Object.entries(counts).map(([factor, count]) => [
            factor,
            screenings.length > 0 ? Math.round((count / screenings.length) * 100) : 0,
        ]),
    );
}

/** Caseload counters for one worker, given the full patient and screening sets. */
export function workerCaseload(
    workerId: string,
    patients: Patient[],
    screenings: Screening[],
): WorkerCaseloadStats {
    const ownPatientIds = new Set(
        patients.filter((p) => p.health_worker_id === workerId).map((p) => p.id),
    );
    const ownScreenings = screenings.filter((s) => ownPatientIds.has(s.patient_id));

    return {
        total_patients: ownPatientIds.size,
        total_screenings: ownScreenings.length,
        high_risk_patients: ownScreenings.filter((s) => s.risk_level === "High").length,
    };
}

/** Screenings recorded per registered patient, per worker. */
export function workerPerformance(
    workers: HealthWorkerWithStats[],
    patients: Patient[],
    screenings: Screening[],
): WorkerPerformance[] {
    return workers.map((worker) => {
        const caseload = workerCaseload(worker.uid, patients, screenings);
        return {
            worker_name: worker.full_name,
            patients: caseload.total_patients,
            screenings: caseload.total_screenings,
            completion_rate:
                caseload.total_patients > 0
                    ? Math.round((caseload.total_screenings / caseload.total_patients) * 100)
                    : 0,
        };
    });
}

/** Assemble the full dashboard payload from already-fetched collections. */
export function buildDashboardStats({
    patients,
    screenings,
    appointments,
    workers,
}: {
    patients: Patient[];
    screenings: Screening[];
    appointments: Appointment[];
    workers: HealthWorkerWithStats[];
}): DashboardStats {
    return {
        total_patients: patients.length,
        total_screenings: screenings.length,
        high_risk_count: screenings.filter((s) => s.risk_level === "High").length,
        pending_appointments: appointments.filter((a) => a.status === "scheduled").length,
        risk_distribution: riskDistribution(screenings),
        age_distribution: ageDistribution(patients),
        gender_distribution: genderDistribution(patients),
        geographic_distribution: geographicDistribution(patients, screenings),
        risk_factor_prevalence: riskFactorPrevalence(screenings),
        worker_performance: workerPerformance(workers, patients, screenings),
        recent_screenings: screenings.slice(0, 5),
        weekly_screenings: [],
    };
}
