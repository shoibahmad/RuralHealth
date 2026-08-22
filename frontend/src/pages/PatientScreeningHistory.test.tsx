import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { PatientScreeningHistory } from "./PatientScreeningHistory";
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
    } as Screening,
];

describe("PatientScreeningHistory", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuth).mockReturnValue({
            user: { uid: "p1", email: "anita@example.com", full_name: "Anita Sharma", role: "patient" },
            loading: false,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        } as unknown as ReturnType<typeof useAuth>);
        vi.mocked(firestoreService.getPatient).mockResolvedValue(mockPatient);
        vi.mocked(firestoreService.getScreenings).mockResolvedValue(mockScreenings);
        vi.mocked(firestoreService.getAppointmentsForPatient).mockResolvedValue([]);
    });

    it("renders patient screening history, vitals chart, and records", async () => {
        render(
            <BrowserRouter>
                <PatientScreeningHistory />
            </BrowserRouter>,
        );

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: /My Health History/i })).toBeInTheDocument();
            expect(screen.getByText(/Total Screenings/i)).toBeInTheDocument();
            expect(screen.getByText(/Screening History/i)).toBeInTheDocument();
        });
    });
});
