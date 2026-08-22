import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { SystemAnalyticsPage } from "./SystemAnalyticsPage";
import { firestoreService, type DashboardStats } from "../services/firestoreService";

vi.mock("../services/firestoreService", () => ({
    firestoreService: {
        getDashboardStats: vi.fn(),
    },
}));

vi.mock("recharts", async () => {
    const actual = await vi.importActual<Record<string, unknown>>("recharts");
    return {
        ...actual,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
            <div data-testid="responsive-container" style={{ width: 400, height: 300 }}>
                {children}
            </div>
        ),
    };
});

const mockStats: DashboardStats = {
    total_patients: 120,
    screenings_today: 15,
    high_risk_cases: 8,
    follow_ups_needed: 12,
    village_coverage: 6,
    active_health_workers: 4,
    monthly_trend: [{ month: "Jan", count: 45 }],
    risk_distribution: { High: 8, Medium: 22, Low: 90 },
    age_distribution: { "20-29": 30, "30-39": 40 },
    gender_distribution: [{ gender: "Female", count: 70 }, { gender: "Male", count: 50 }],
    village_stats: [{ village: "Rampur", patient_count: 50, screening_count: 60, high_risk_count: 3 }],
};

describe("SystemAnalyticsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(firestoreService.getDashboardStats).mockResolvedValue(mockStats);
    });

    it("renders system analytics overview and summary metrics", async () => {
        render(
            <BrowserRouter>
                <SystemAnalyticsPage />
            </BrowserRouter>,
        );

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: /System Analytics/i })).toBeInTheDocument();
            expect(screen.getByText("Age Distribution")).toBeInTheDocument();
            expect(screen.getByText("Gender Distribution")).toBeInTheDocument();
            expect(screen.getByText("Worker Performance")).toBeInTheDocument();
        });
    });
});
