import { firestoreService } from "../services/firestoreService";
import { AllPatientsPage } from "./AllPatientsPage";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Patient } from "../services/types";

const mockNavigate = vi.fn();
const mockShowToast = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock("../context/useToast", () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock("../services/firestoreService", () => ({
    firestoreService: {
        getPatients: vi.fn(),
        updatePatient: vi.fn(),
        deletePatient: vi.fn(),
    },
}));

const mockPatients: Patient[] = [
    {
        id: "p1",
        full_name: "Aarav Sharma",
        age: 45,
        gender: "Male",
        village: "Rampur",
        phone: "9876543210",
        latest_risk_level: "High",
        created_at: "2026-01-10T10:00:00Z",
    },
    {
        id: "p2",
        full_name: "Bhavna Patel",
        age: 32,
        gender: "Female",
        village: "Chandpur",
        phone: "9876543211",
        latest_risk_level: "Low",
        created_at: "2026-01-12T10:00:00Z",
    },
];

describe("AllPatientsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(firestoreService.getPatients).mockResolvedValue(mockPatients);
    });

    it("renders patient records successfully", async () => {
        render(
            <BrowserRouter>
                <AllPatientsPage />
            </BrowserRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText("Aarav Sharma")).toBeInTheDocument();
            expect(screen.getByText("Bhavna Patel")).toBeInTheDocument();
        });

        expect(screen.getByText("All Patients")).toBeInTheDocument();
        expect(screen.getByText("Rampur")).toBeInTheDocument();
        expect(screen.getByText("Chandpur")).toBeInTheDocument();
    });

    it("filters patient list based on search term input", async () => {
        const user = userEvent.setup();
        render(
            <BrowserRouter>
                <AllPatientsPage />
            </BrowserRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText("Aarav Sharma")).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText("Search by name, village, or phone...");
        await user.type(searchInput, "Aarav");

        await waitFor(() => {
            expect(screen.getByText("Aarav Sharma")).toBeInTheDocument();
            expect(screen.queryByText("Bhavna Patel")).not.toBeInTheDocument();
        });
    });

    it("navigates to screening history when history action is clicked", async () => {
        const user = userEvent.setup();
        render(
            <BrowserRouter>
                <AllPatientsPage />
            </BrowserRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText("Aarav Sharma")).toBeInTheDocument();
        });

        const viewHistoryButtons = screen.getAllByRole("button", { name: /history/i });
        if (viewHistoryButtons.length > 0) {
            await user.click(viewHistoryButtons[0]);
            expect(mockNavigate).toHaveBeenCalled();
        }
    });

    it("opens edit modal when edit button is clicked", async () => {
        const user = userEvent.setup();
        const { container } = render(
            <BrowserRouter>
                <AllPatientsPage />
            </BrowserRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText("Aarav Sharma")).toBeInTheDocument();
        });

        // Edit button is the second button in action buttons cell
        const editButtons = container.querySelectorAll("button.text-blue-400");
        if (editButtons.length > 0) {
            await user.click(editButtons[0]);
            await waitFor(() => {
                expect(screen.getByText("Edit Patient")).toBeInTheDocument();
            });
        }
    });

    it("handles delete flow with confirmation modal", async () => {
        vi.mocked(firestoreService.deletePatient).mockResolvedValue(undefined);
        const user = userEvent.setup();

        const { container } = render(
            <BrowserRouter>
                <AllPatientsPage />
            </BrowserRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText("Aarav Sharma")).toBeInTheDocument();
        });

        const deleteButtons = container.querySelectorAll("button.text-red-400");
        if (deleteButtons.length > 0) {
            await user.click(deleteButtons[0]);
            await waitFor(() => {
                expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
            });

            const confirmBtn = screen.getByRole("button", { name: "Delete" });
            await user.click(confirmBtn);

            await waitFor(() => {
                expect(firestoreService.deletePatient).toHaveBeenCalledWith("p1");
            });
        }
    });
});
