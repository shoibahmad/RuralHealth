import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { AppointmentsPage } from "./AppointmentsPage";
import { firestoreService, type Appointment, type Patient } from "../services/firestoreService";
import { useAuth } from "../context/useAuth";

vi.mock("../context/useAuth", () => ({
    useAuth: vi.fn(),
}));

vi.mock("../services/firestoreService", () => ({
    firestoreService: {
        getAppointments: vi.fn(),
        getPatients: vi.fn(),
        createAppointment: vi.fn(),
    },
}));

vi.mock("firebase/firestore", async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        doc: vi.fn(),
        updateDoc: vi.fn(),
    };
});

const mockAppointments: Appointment[] = [
    {
        id: "a1",
        patient_id: "p1",
        patient_name: "Anita Sharma",
        scheduled_date: "2026-03-01T10:00:00Z",
        reason: "Follow-up blood pressure check",
        status: "scheduled",
        created_at: "2026-01-01T10:00:00Z",
    },
];

const mockPatients: Patient[] = [
    {
        id: "p1",
        full_name: "Anita Sharma",
        age: 34,
        gender: "Female",
        village: "Rampur",
    },
];

describe("AppointmentsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuth).mockReturnValue({
            user: { uid: "u1", email: "worker@example.com", role: "health_worker" },
            loading: false,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        } as unknown as ReturnType<typeof useAuth>);
        vi.mocked(firestoreService.getAppointments).mockResolvedValue(mockAppointments);
        vi.mocked(firestoreService.getPatients).mockResolvedValue(mockPatients);
    });

    it("renders appointments list and filter buttons", async () => {
        render(
            <BrowserRouter>
                <AppointmentsPage />
            </BrowserRouter>,
        );

        expect(screen.getByRole("heading", { name: /Appointments/i })).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("Anita Sharma")).toBeInTheDocument();
            expect(screen.getByText("Follow-up blood pressure check")).toBeInTheDocument();
        });
    });

    it("opens create appointment modal when new appointment button is clicked", async () => {
        const user = userEvent.setup();
        render(
            <BrowserRouter>
                <AppointmentsPage />
            </BrowserRouter>,
        );

        const newBtn = screen.getByRole("button", { name: /Schedule Appointment/i });
        await user.click(newBtn);

        await waitFor(() => {
            expect(screen.getByText("Select a patient")).toBeInTheDocument();
        });
    });
});
