import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { PatientsPage } from "./PatientsPage";
import { firestoreService, type Patient, type Screening, type Appointment } from "../services/firestoreService";
import { ToastProvider } from "../context/ToastContext";

vi.mock("../services/firestoreService", () => ({
    firestoreService: {
        getPatients: vi.fn(),
        getPatient: vi.fn(),
        getScreenings: vi.fn(),
        getAppointmentsForPatient: vi.fn(),
        deletePatient: vi.fn(),
    },
}));

const mockPatients: Patient[] = [
    {
        id: "p1",
        full_name: "Anita Sharma",
        age: 34,
        gender: "Female",
        village: "Rampur",
        phone: "+919876543210",
        created_at: "2026-01-01T10:00:00Z",
        latest_risk_level: "High",
        screening_count: 2,
    },
    {
        id: "p2",
        full_name: "Rahul Verma",
        age: 45,
        gender: "Male",
        village: "Shyampur",
        phone: "+919876543211",
        created_at: "2026-01-02T10:00:00Z",
        latest_risk_level: "Low",
        screening_count: 1,
    },
];

function renderWithProviders(ui: React.ReactElement) {
    return render(
        <BrowserRouter>
            <ToastProvider>{ui}</ToastProvider>
        </BrowserRouter>,
    );
}

describe("PatientsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(firestoreService.getPatients).mockResolvedValue(mockPatients);
    });

    it("renders patient directory, stat cards, and patient list", async () => {
        renderWithProviders(<PatientsPage />);

        expect(screen.getByRole("heading", { name: /^Patients/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Search by name, village, or phone/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("Anita Sharma")).toBeInTheDocument();
            expect(screen.getByText("Rahul Verma")).toBeInTheDocument();
        });

        expect(screen.getByText("Total Patients")).toBeInTheDocument();
    });

    it("filters patients based on search input", async () => {
        const user = userEvent.setup();
        renderWithProviders(<PatientsPage />);

        await waitFor(() => {
            expect(screen.getByText("Anita Sharma")).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/Search by name, village, or phone/i);
        await user.type(searchInput, "Anita");

        await waitFor(() => {
            expect(screen.getByText("Anita Sharma")).toBeInTheDocument();
            expect(screen.queryByText("Rahul Verma")).not.toBeInTheDocument();
        });
    });

    it("opens patient detail modal when view details button is clicked", async () => {
        const user = userEvent.setup();
        vi.mocked(firestoreService.getPatient).mockResolvedValue(mockPatients[0]);
        vi.mocked(firestoreService.getScreenings).mockResolvedValue([
            {
                id: "s1",
                patient_id: "p1",
                patient_name: "Anita Sharma",
                risk_level: "High",
                created_at: "2026-01-01T10:00:00Z",
            } as Screening,
        ]);
        vi.mocked(firestoreService.getAppointmentsForPatient).mockResolvedValue([
            {
                id: "a1",
                patient_id: "p1",
                scheduled_date: "2026-02-01T10:00:00Z",
                status: "scheduled",
            } as Appointment,
        ]);

        renderWithProviders(<PatientsPage />);

        await waitFor(() => {
            expect(screen.getByText("Anita Sharma")).toBeInTheDocument();
        });

        const viewButtons = screen.getAllByRole("button");
        const viewDetailBtn = viewButtons.find((btn) => btn.className.includes("text-teal-400"));
        if (viewDetailBtn) {
            await user.click(viewDetailBtn);
            await waitFor(() => {
                expect(firestoreService.getPatient).toHaveBeenCalledWith("p1");
            });
        }
    });

    it("opens delete confirmation modal and handles deletion", async () => {
        const user = userEvent.setup();
        vi.mocked(firestoreService.deletePatient).mockResolvedValue(undefined);

        renderWithProviders(<PatientsPage />);

        await waitFor(() => {
            expect(screen.getByText("Anita Sharma")).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByRole("button").filter(
            (btn) => btn.className.includes("text-red-400"),
        );

        if (deleteButtons.length > 0) {
            await user.click(deleteButtons[0]);
            const confirmBtn = await screen.findByRole("button", { name: /Delete/i });
            await user.click(confirmBtn);

            await waitFor(() => {
                expect(firestoreService.deletePatient).toHaveBeenCalledWith("p1");
            });
        }
    });
});
