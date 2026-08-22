import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { WorkerDetailPage } from "./WorkerDetailPage";
import { firestoreService, type Patient, type DashboardStats } from "../services/firestoreService";
import { getDoc } from "firebase/firestore";

vi.mock("../services/firestoreService", () => ({
    firestoreService: {
        getDashboardStats: vi.fn(),
        getPatients: vi.fn(),
    },
}));

vi.mock("firebase/firestore", async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        doc: vi.fn(),
        getDoc: vi.fn(),
    };
});

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
    total_patients: 25,
    total_screenings: 30,
    high_risk_patients: 3,
    pending_sync: 0,
    risk_distribution: { High: 3, Medium: 7, Low: 15 },
    age_distribution: {},
    gender_distribution: [],
} as unknown as DashboardStats;

const mockPatients: Patient[] = [
    {
        id: "p1",
        full_name: "Anita Sharma",
        age: 34,
        gender: "Female",
        village: "Rampur",
        created_at: "2026-01-01T10:00:00Z",
        latest_risk_level: "High",
        screening_count: 3,
    },
];

describe("WorkerDetailPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getDoc).mockResolvedValue({
            exists: () => true,
            data: () => ({ full_name: "Priya Sharma", email: "priya@example.com" }),
        } as never);
        vi.mocked(firestoreService.getDashboardStats).mockResolvedValue(mockStats);
        vi.mocked(firestoreService.getPatients).mockResolvedValue(mockPatients);
    });

    it("renders worker details, metrics, and patient list", async () => {
        render(
            <MemoryRouter initialEntries={["/officer/workers/w1"]}>
                <Routes>
                    <Route path="/officer/workers/:id" element={<WorkerDetailPage />} />
                </Routes>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
            expect(screen.getByText("priya@example.com")).toBeInTheDocument();
            expect(screen.getByText("Total Patients")).toBeInTheDocument();
            expect(screen.getByText("Anita Sharma")).toBeInTheDocument();
        });
    });

    it("handles worker not found", async () => {
        vi.mocked(getDoc).mockResolvedValue({
            exists: () => false,
        } as never);

        render(
            <MemoryRouter initialEntries={["/officer/workers/missing"]}>
                <Routes>
                    <Route path="/officer/workers/:id" element={<WorkerDetailPage />} />
                </Routes>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText(/Worker not found/i)).toBeInTheDocument();
        });
    });
});
