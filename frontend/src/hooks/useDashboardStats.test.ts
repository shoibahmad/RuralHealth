import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authState: { user: { uid: string; role: string } | null } = { user: null };

vi.mock("../context/useAuth", () => ({
    useAuth: () => authState,
}));

vi.mock("../services/firestoreService", () => ({
    firestoreService: {
        getDashboardStats: vi.fn(),
    },
}));

import { firestoreService } from "../services/firestoreService";
import { useDashboardStats } from "./useDashboardStats";
import type { DashboardStats } from "../services/types";

const mockStats: DashboardStats = {
    total_patients: 120,
    total_screenings: 250,
    high_risk_count: 15,
    pending_appointments: 8,
    risk_distribution: { Low: 150, Medium: 85, High: 15 },
    age_distribution: { "0-18": 10, "19-45": 100, "46+": 140 },
    gender_distribution: [
        { gender: "Male", count: 120 },
        { gender: "Female", count: 130 },
    ],
    geographic_distribution: [{ village: "Rampur", total: 50, high_risk: 5 }],
    risk_factor_prevalence: { Hypertension: 30, Diabetes: 20 },
    worker_performance: [{ worker_name: "Worker 1", patients: 50, screenings: 100, completion_rate: 95 }],
    recent_screenings: [
        {
            id: "s1",
            patient_id: "p1",
            patient_name: "Amit Sharma",
            risk_level: "High",
            created_at: "2026-02-01",
        } as DashboardStats["recent_screenings"][0],
        {
            id: "s2",
            patient_id: "p2",
            patient_name: "Pooja Verma",
            risk_level: "Low",
            created_at: "2026-02-02",
        } as DashboardStats["recent_screenings"][0],
    ],
    weekly_screenings: [{ name: "Mon", date: "2026-W01", screenings: 25, highRisk: 2 }],
};

describe("useDashboardStats", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.user = { uid: "w1", role: "health_worker" };
        vi.mocked(firestoreService.getDashboardStats).mockResolvedValue(mockStats);
    });

    it("fetches dashboard stats on mount and formats cards & risk distribution", async () => {
        const { result } = renderHook(() => useDashboardStats());

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(firestoreService.getDashboardStats).toHaveBeenCalledWith("w1");
        expect(result.current.stats).toEqual(mockStats);
        expect(result.current.totalRisk).toBe(250);
        expect(result.current.statCards.length).toBe(4);
        expect(result.current.statCards[0].value).toBe("120");
        expect(result.current.riskDistribution).toEqual([
            { name: "Low Risk", value: 150, color: "#10b981" },
            { name: "Medium", value: 85, color: "#f59e0b" },
            { name: "High Risk", value: 15, color: "#ef4444" },
        ]);
        expect(result.current.filteredRecentScreenings.length).toBe(2);
    });

    it("filters recent screenings by search term", async () => {
        const { result } = renderHook(() => useDashboardStats());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        act(() => {
            result.current.setSearchTerm("Amit");
        });

        expect(result.current.filteredRecentScreenings.length).toBe(1);
        expect(result.current.filteredRecentScreenings[0].patient_name).toBe("Amit Sharma");
    });

    it("handles error gracefully when fetch fails", async () => {
        vi.mocked(firestoreService.getDashboardStats).mockRejectedValue(new Error("Network fail"));

        const { result } = renderHook(() => useDashboardStats());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.stats).toBeNull();
        expect(result.current.statCards).toEqual([]);
        expect(result.current.riskDistribution).toEqual([]);
    });
});
