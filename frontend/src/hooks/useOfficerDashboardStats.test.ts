import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/firestoreService", () => ({
    firestoreService: {
        getPatients: vi.fn(),
        getScreenings: vi.fn(),
        getHealthWorkers: vi.fn(),
    },
}));

import { firestoreService } from "../services/firestoreService";
import { useOfficerDashboardStats } from "./useOfficerDashboardStats";
import type { HealthWorkerWithStats, Patient, Screening } from "../services/types";

const mockPatients: Patient[] = [
    {
        id: "p1",
        full_name: "Patient One",
        village: "Rampur",
        health_worker_id: "w1",
        created_at: "2026-01-15T10:00:00Z",
    } as Patient,
    {
        id: "p2",
        full_name: "Patient Two",
        village: "Rampur",
        health_worker_id: "w2",
        created_at: "2026-01-20T10:00:00Z",
    } as Patient,
    {
        id: "p3",
        full_name: "Patient Three",
        village: "Shyampur",
        health_worker_id: "w1",
        created_at: "2026-02-10T10:00:00Z",
    } as Patient,
];

const mockScreenings: Screening[] = [
    {
        id: "s1",
        patient_id: "p1",
        risk_level: "High",
        created_at: "2026-01-16T10:00:00Z",
    } as Screening,
    {
        id: "s2",
        patient_id: "p2",
        risk_level: "Low",
        created_at: "2026-01-21T10:00:00Z",
    } as Screening,
    {
        id: "s3",
        patient_id: "p3",
        risk_level: "Medium",
        created_at: "2026-02-11T10:00:00Z",
    } as Screening,
];

const mockWorkers: HealthWorkerWithStats[] = [
    { uid: "w1", full_name: "Worker One", is_active: true } as unknown as HealthWorkerWithStats,
    { uid: "w2", full_name: "Worker Two", is_active: false } as unknown as HealthWorkerWithStats,
];

describe("useOfficerDashboardStats", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(firestoreService.getPatients).mockResolvedValue(mockPatients);
        vi.mocked(firestoreService.getScreenings).mockResolvedValue(mockScreenings);
        vi.mocked(firestoreService.getHealthWorkers).mockResolvedValue(mockWorkers);
    });

    it("aggregates officer dashboard metrics correctly", async () => {
        const { result } = renderHook(() => useOfficerDashboardStats());

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.stats?.overview).toEqual({
            total_patients: 3,
            total_screenings: 3,
            high_risk_count: 1,
            total_workers: 2,
            active_workers: 1,
        });

        expect(result.current.stats?.risk_distribution).toEqual({
            Low: 1,
            Medium: 1,
            High: 1,
        });

        expect(result.current.villageStats).toEqual([
            { village: "Rampur", patient_count: 2 },
            { village: "Shyampur", patient_count: 1 },
        ]);

        expect(result.current.riskData.length).toBe(3);
    });

    it("handles errors gracefully", async () => {
        vi.mocked(firestoreService.getPatients).mockRejectedValue(new Error("Fetch failed"));

        const { result } = renderHook(() => useOfficerDashboardStats());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.stats).toBeNull();
        expect(result.current.villageStats).toEqual([]);
        expect(result.current.riskData).toEqual([]);
    });
});
