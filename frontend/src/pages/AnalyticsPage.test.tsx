import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AnalyticsPage } from "./AnalyticsPage";
import { firestoreService, type Patient, type Screening } from "../services/firestoreService";

vi.mock("../services/firestoreService", () => ({
    firestoreService: {
        getPatients: vi.fn(),
        getScreenings: vi.fn(),
    },
}));

// Mock recharts responsive container for jsdom
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

const mockPatients: Patient[] = [
    {
        id: "p1",
        full_name: "Anita Sharma",
        age: 34,
        gender: "Female",
        village: "Rampur",
        created_at: "2026-01-01T10:00:00Z",
    },
    {
        id: "p2",
        full_name: "Rahul Verma",
        age: 45,
        gender: "Male",
        village: "Shyampur",
        created_at: "2026-01-02T10:00:00Z",
    },
];

const mockScreenings: Screening[] = [
    {
        id: "s1",
        patient_id: "p1",
        created_at: "2026-01-10T10:00:00Z",
        risk_level: "High",
        symptoms: ["Chest pain"],
        risk_factors: ["Hypertension"],
    } as Screening,
];

describe("AnalyticsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(firestoreService.getPatients).mockResolvedValue(mockPatients);
        vi.mocked(firestoreService.getScreenings).mockResolvedValue(mockScreenings);
    });

    it("renders analytics dashboard and summary stats", async () => {
        render(
            <BrowserRouter>
                <AnalyticsPage />
            </BrowserRouter>,
        );

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: /Analytics Dashboard/i })).toBeInTheDocument();
            expect(screen.getByText("Monthly Screening Trend")).toBeInTheDocument();
            expect(screen.getByText("Patients by Village")).toBeInTheDocument();
        });
    });

    it("renders charts and distribution sections", async () => {
        render(
            <BrowserRouter>
                <AnalyticsPage />
            </BrowserRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText(/Patients by Village/i)).toBeInTheDocument();
            expect(screen.getByText(/Age Distribution/i)).toBeInTheDocument();
            expect(screen.getByText(/Gender Distribution/i)).toBeInTheDocument();
        });
    });
});
