import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PatientDashboard } from "./PatientDashboard";

const authState: { user: { uid: string; full_name: string; displayName?: string } | null } = {
    user: null,
};

vi.mock("../context/useAuth", () => ({
    useAuth: () => authState,
}));

vi.mock("../services/firestoreService", () => ({
    firestoreService: {
        getPatient: vi.fn(),
        getScreenings: vi.fn(),
        getAppointmentsForPatient: vi.fn(),
    },
}));

import { firestoreService } from "../services/firestoreService";

describe("PatientDashboard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.user = {
            uid: "patient-1",
            full_name: "Kavita Devi",
            displayName: "Kavita Devi",
        };

        vi.mocked(firestoreService.getPatient).mockResolvedValue({
            id: "patient-1",
            full_name: "Kavita Devi",
            age: 42,
            gender: "Female",
            village: "Chandpur",
            phone: "9876543210",
            created_at: "2026-01-01T00:00:00Z",
        });

        vi.mocked(firestoreService.getScreenings).mockResolvedValue([
            {
                id: "sc-1",
                patient_id: "patient-1",
                blood_pressure_systolic: 120,
                blood_pressure_diastolic: 80,
                blood_glucose: 95,
                risk_level: "Low",
                created_at: "2026-02-01T10:00:00Z",
            } as never,
        ]);

        vi.mocked(firestoreService.getAppointmentsForPatient).mockResolvedValue([
            {
                id: "app-1",
                patient_id: "patient-1",
                scheduled_date: "2026-03-01T10:00:00Z",
                reason: "Routine Follow-up",
                status: "scheduled",
                created_at: "2026-02-01T10:00:00Z",
                health_worker_id: "hw-1",
            },
        ]);
    });

    it("renders patient dashboard header and vital cards", async () => {
        render(
            <BrowserRouter>
                <PatientDashboard />
            </BrowserRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText("Welcome, Kavita Devi!")).toBeInTheDocument();
            expect(screen.getByText(/42 years • Female • Chandpur/i)).toBeInTheDocument();
        });

        expect(screen.getByText("Total Screenings")).toBeInTheDocument();
        expect(screen.getByText("Current Risk Level")).toBeInTheDocument();
        expect(screen.getAllByText("Upcoming Appointments").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Routine Follow-up")).toBeInTheDocument();
    });

    it("renders new screening action button", async () => {
        render(
            <BrowserRouter>
                <PatientDashboard />
            </BrowserRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText("Welcome, Kavita Devi!")).toBeInTheDocument();
        });

        expect(screen.getByRole("button", { name: /New Screening/i })).toBeInTheDocument();
    });
});
