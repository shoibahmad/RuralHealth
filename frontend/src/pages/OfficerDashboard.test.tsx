import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OfficerDashboard } from "./OfficerDashboard";

const officerStatsState = {
    stats: {
        overview: {
            total_patients: 150,
            total_screenings: 320,
            high_risk_count: 22,
            total_workers: 12,
            active_workers: 10,
        },
        risk_distribution: { Low: 180, Medium: 118, High: 22 },
        monthly_trend: [
            { month: "Jan", screenings: 120, patients: 60 },
            { month: "Feb", screenings: 200, patients: 90 },
        ],
        village_stats: [
            { village: "Rampur", patient_count: 80 },
            { village: "Chandpur", patient_count: 70 },
        ],
        top_workers: [
            { name: "Anita Sharma", screenings: 95 },
            { name: "Suresh Patel", screenings: 82 },
        ],
    },
    loading: false,
    villageStats: [
        { village: "Rampur", patient_count: 80 },
        { village: "Chandpur", patient_count: 70 },
    ],
    riskData: [
        { name: "Low Risk", value: 180, color: "#10b981" },
        { name: "Medium Risk", value: 118, color: "#f59e0b" },
        { name: "High Risk", value: 22, color: "#ef4444" },
    ],
};

vi.mock("../hooks/useOfficerDashboardStats", () => ({
    useOfficerDashboardStats: () => officerStatsState,
}));

vi.mock("recharts", async () => {
    const actual = await vi.importActual("recharts");
    return {
        ...actual,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
            <div style={{ width: 400, height: 300 }}>{children}</div>
        ),
    };
});

describe("OfficerDashboard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        officerStatsState.loading = false;
    });

    it("renders loading spinner when officer data is loading", () => {
        officerStatsState.loading = true;

        render(<OfficerDashboard />);
        expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("renders officer metrics, village coverage, and top workers", () => {
        render(<OfficerDashboard />);

        expect(screen.getByText("Health Officer Dashboard")).toBeInTheDocument();
        expect(screen.getByText("System-wide overview and health worker management")).toBeInTheDocument();
        expect(screen.getByText("Total Patients")).toBeInTheDocument();
        expect(screen.getByText("150")).toBeInTheDocument();
        expect(screen.getByText("Total Screenings")).toBeInTheDocument();
        expect(screen.getByText("320")).toBeInTheDocument();
        expect(screen.getByText("High Risk Cases")).toBeInTheDocument();
        expect(screen.getByText("22")).toBeInTheDocument();
        expect(screen.getByText("Active Workers")).toBeInTheDocument();
        expect(screen.getByText("10/12")).toBeInTheDocument();
        expect(screen.getByText("Top Performing Workers")).toBeInTheDocument();
        expect(screen.getByText("Village Coverage")).toBeInTheDocument();
        expect(screen.getByText("Rampur")).toBeInTheDocument();
        expect(screen.getByText("Chandpur")).toBeInTheDocument();
    });
});
