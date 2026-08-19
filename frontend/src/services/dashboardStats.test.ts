import { describe, expect, it } from "vitest";

import {
    ageDistribution,
    buildDashboardStats,
    genderDistribution,
    geographicDistribution,
    riskDistribution,
    riskFactorPrevalence,
    workerCaseload,
    workerPerformance,
} from "./dashboardStats";
import type { Appointment, HealthWorkerWithStats, Patient, Screening } from "./types";

const patient = (overrides: Partial<Patient> = {}): Patient => ({
    id: "p1",
    full_name: "Ramesh Kumar",
    age: 52,
    gender: "Male",
    village: "Chandpur",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
});

const screening = (overrides: Partial<Screening> = {}): Screening => ({
    id: "s1",
    patient_id: "p1",
    risk_score: 0,
    risk_level: "Low",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
});

const worker = (overrides: Partial<HealthWorkerWithStats> = {}): HealthWorkerWithStats => ({
    id: "w1",
    uid: "w1",
    email: "worker@example.com",
    full_name: "Worker One",
    role: "health_worker",
    stats: { total_patients: 0, total_screenings: 0, high_risk_patients: 0 },
    ...overrides,
});

describe("riskDistribution", () => {
    it("counts each band", () => {
        expect(
            riskDistribution([
                screening({ risk_level: "Low" }),
                screening({ risk_level: "High" }),
                screening({ risk_level: "High" }),
            ]),
        ).toEqual({ Low: 1, Medium: 0, High: 2 });
    });

    it("reports all three bands for an empty set", () => {
        expect(riskDistribution([])).toEqual({ Low: 0, Medium: 0, High: 0 });
    });
});

describe("ageDistribution", () => {
    it("places each patient in exactly one band", () => {
        const distribution = ageDistribution([
            patient({ age: 10 }),
            patient({ age: 25 }),
            patient({ age: 40 }),
            patient({ age: 55 }),
            patient({ age: 70 }),
            patient({ age: 90 }),
        ]);

        expect(distribution).toEqual({
            "0-18": 1,
            "19-30": 1,
            "31-45": 1,
            "46-60": 1,
            "61-75": 1,
            "75+": 1,
        });
    });

    it.each([
        [18, "0-18"],
        [19, "19-30"],
        [30, "19-30"],
        [31, "31-45"],
        [75, "61-75"],
        [76, "75+"],
    ])("puts age %s in the %s band", (age, band) => {
        expect(ageDistribution([patient({ age })])[band]).toBe(1);
    });

    it("returns every band at zero for no patients", () => {
        expect(Object.values(ageDistribution([]))).toEqual([0, 0, 0, 0, 0, 0]);
    });
});

describe("genderDistribution", () => {
    it("tallies each gender", () => {
        expect(
            genderDistribution([
                patient({ gender: "Male" }),
                patient({ gender: "Female" }),
                patient({ gender: "Female" }),
            ]),
        ).toEqual([
            { gender: "Male", count: 1 },
            { gender: "Female", count: 2 },
        ]);
    });

    it("labels a missing gender as Unknown", () => {
        expect(genderDistribution([patient({ gender: "" })])).toEqual([
            { gender: "Unknown", count: 1 },
        ]);
    });
});

describe("geographicDistribution", () => {
    it("counts patients and high-risk screenings per village", () => {
        const result = geographicDistribution(
            [
                patient({ id: "p1", village: "Chandpur" }),
                patient({ id: "p2", village: "Rampur" }),
                patient({ id: "p3", village: "Chandpur" }),
            ],
            [
                screening({ patient_id: "p1", risk_level: "High" }),
                screening({ patient_id: "p2", risk_level: "Low" }),
            ],
        );

        expect(result).toEqual([
            { village: "Chandpur", total: 2, high_risk: 1 },
            { village: "Rampur", total: 1, high_risk: 0 },
        ]);
    });

    it("sorts the busiest village first", () => {
        const result = geographicDistribution(
            [
                patient({ id: "p1", village: "Small" }),
                patient({ id: "p2", village: "Big" }),
                patient({ id: "p3", village: "Big" }),
            ],
            [],
        );

        expect(result[0].village).toBe("Big");
    });

    it("trims village names so spacing does not split a village in two", () => {
        const result = geographicDistribution(
            [
                patient({ id: "p1", village: " Chandpur " }),
                patient({ id: "p2", village: "Chandpur" }),
            ],
            [],
        );

        expect(result).toEqual([{ village: "Chandpur", total: 2, high_risk: 0 }]);
    });

    it("ignores a screening whose patient is not in the set", () => {
        const result = geographicDistribution(
            [patient({ id: "p1", village: "Chandpur" })],
            [screening({ patient_id: "ghost", risk_level: "High" })],
        );

        expect(result[0].high_risk).toBe(0);
    });

    it("returns an empty list when there are no patients", () => {
        expect(geographicDistribution([], [])).toEqual([]);
    });
});

describe("riskFactorPrevalence", () => {
    it("reports whole percentages", () => {
        const result = riskFactorPrevalence([
            screening({ systolic_bp: 160 }),
            screening({ systolic_bp: 110 }),
        ]);

        expect(result.Hypertension).toBe(50);
    });

    it("counts hypertension from either pressure", () => {
        expect(riskFactorPrevalence([screening({ diastolic_bp: 95 })]).Hypertension).toBe(100);
    });

    it("counts obesity from height and weight", () => {
        // 100kg at 160cm is a BMI of 39.
        expect(riskFactorPrevalence([screening({ height_cm: 160, weight_kg: 100 })]).Obesity).toBe(
            100,
        );
    });

    it("does not treat a missing height as obese", () => {
        expect(riskFactorPrevalence([screening({ weight_kg: 100 })]).Obesity).toBe(0);
    });

    it("returns zeroes rather than dividing by zero", () => {
        const result = riskFactorPrevalence([]);

        expect(result.Hypertension).toBe(0);
        expect(result.Obesity).toBe(0);
    });
});

describe("workerCaseload", () => {
    it("counts only the worker's own patients and their screenings", () => {
        const stats = workerCaseload(
            "w1",
            [
                patient({ id: "p1", health_worker_id: "w1" }),
                patient({ id: "p2", health_worker_id: "w1" }),
                patient({ id: "p3", health_worker_id: "w2" }),
            ],
            [
                screening({ patient_id: "p1", risk_level: "High" }),
                screening({ patient_id: "p2", risk_level: "Low" }),
                screening({ patient_id: "p3", risk_level: "High" }),
            ],
        );

        expect(stats).toEqual({
            total_patients: 2,
            total_screenings: 2,
            high_risk_patients: 1,
        });
    });

    it("returns zeroes for a worker with no caseload", () => {
        expect(workerCaseload("nobody", [], [])).toEqual({
            total_patients: 0,
            total_screenings: 0,
            high_risk_patients: 0,
        });
    });
});

describe("workerPerformance", () => {
    it("computes a completion rate per worker", () => {
        const result = workerPerformance(
            [worker({ uid: "w1" })],
            [
                patient({ id: "p1", health_worker_id: "w1" }),
                patient({ id: "p2", health_worker_id: "w1" }),
            ],
            [screening({ patient_id: "p1" })],
        );

        expect(result).toEqual([
            { worker_name: "Worker One", patients: 2, screenings: 1, completion_rate: 50 },
        ]);
    });

    it("does not divide by zero for a worker with no patients", () => {
        const result = workerPerformance([worker({ uid: "w1" })], [], []);

        expect(result[0].completion_rate).toBe(0);
    });
});

describe("buildDashboardStats", () => {
    const appointment = (overrides: Partial<Appointment> = {}): Appointment => ({
        id: "a1",
        patient_id: "p1",
        health_worker_id: "w1",
        scheduled_date: "2026-09-01T00:00:00Z",
        reason: "Follow-up",
        status: "scheduled",
        created_at: "2026-01-01T00:00:00Z",
        ...overrides,
    });

    it("assembles every section", () => {
        const stats = buildDashboardStats({
            patients: [patient({ id: "p1", health_worker_id: "w1" })],
            screenings: [screening({ patient_id: "p1", risk_level: "High" })],
            appointments: [appointment(), appointment({ status: "completed" })],
            workers: [worker({ uid: "w1" })],
        });

        expect(stats.total_patients).toBe(1);
        expect(stats.total_screenings).toBe(1);
        expect(stats.high_risk_count).toBe(1);
        expect(stats.pending_appointments).toBe(1);
        expect(stats.risk_distribution.High).toBe(1);
        expect(stats.worker_performance).toHaveLength(1);
    });

    it("caps recent screenings at five", () => {
        const stats = buildDashboardStats({
            patients: [],
            screenings: Array.from({ length: 9 }, (_, i) => screening({ id: `s${i}` })),
            appointments: [],
            workers: [],
        });

        expect(stats.recent_screenings).toHaveLength(5);
    });

    it("produces a well-formed payload for an empty system", () => {
        const stats = buildDashboardStats({
            patients: [],
            screenings: [],
            appointments: [],
            workers: [],
        });

        expect(stats.total_patients).toBe(0);
        expect(stats.risk_distribution).toEqual({ Low: 0, Medium: 0, High: 0 });
        expect(stats.geographic_distribution).toEqual([]);
        expect(stats.worker_performance).toEqual([]);
    });
});
