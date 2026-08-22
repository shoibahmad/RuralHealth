import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PatientHistoryPage } from "./PatientHistoryPage";
import { firestoreService, type Patient, type Screening } from "../services/firestoreService";
import { useAuth } from "../context/useAuth";

vi.mock("../context/useAuth", () => ({
    useAuth: vi.fn(),
}));

vi.mock("../services/firestoreService", () => ({
    firestoreService: {
        getPatient: vi.fn(),
        getScreenings: vi.fn(),
        getAppointmentsForPatient: vi.fn(),
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

const mockPatient: Patient = {
    id: "p1",
    full_name: "Anita Sharma",
    age: 34,
    gender: "Female",
    village: "Rampur",
    phone: "+919876543210",
    created_at: "2026-01-01T10:00:00Z",
};

const mockScreenings: Screening[] = [
    {
        id: "s1",
        patient_id: "p1",
        created_at: "2026-01-10T10:00:00Z",
        risk_level: "High",
        systolic_bp: 140,
        diastolic_bp: 90,
        heart_rate: 78,
        glucose_level: 120,
    } as Screening,
];

describe("PatientHistoryPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuth).mockReturnValue({
            user: { uid: "u1", email: "worker@example.com", role: "health_worker" },
            loading: false,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        } as unknown as ReturnType<typeof useAuth>);
        vi.mocked(firestoreService.getPatient).mockResolvedValue(mockPatient);
        vi.mocked(firestoreService.getScreenings).mockResolvedValue(mockScreenings);
        vi.mocked(firestoreService.getAppointmentsForPatient).mockResolvedValue([]);
    });

    it("renders patient history, profile info, and vitals trend", async () => {
        render(
            <MemoryRouter initialEntries={["/patient/p1/history"]}>
                <Routes>
                    <Route path="/patient/:id/history" element={<PatientHistoryPage />} />
                </Routes>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText("Anita Sharma")).toBeInTheDocument();
            expect(screen.getByText(/Total Screenings/i)).toBeInTheDocument();
            expect(screen.getByText(/Risk Score Trend/i)).toBeInTheDocument();
        });
    });
});
