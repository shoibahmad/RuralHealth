import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { PatientSelfScreening } from "./PatientSelfScreening";
import { firestoreService } from "../services/firestoreService";
import { useAuth } from "../context/useAuth";

vi.mock("../context/useAuth", () => ({
    useAuth: vi.fn(),
}));

vi.mock("../services/firestoreService", () => ({
    firestoreService: {
        addScreening: vi.fn(),
    },
}));

describe("PatientSelfScreening", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuth).mockReturnValue({
            user: { uid: "p1", email: "anita@example.com", full_name: "Anita Sharma", role: "patient" },
            loading: false,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        } as unknown as ReturnType<typeof useAuth>);
        vi.mocked(firestoreService.addScreening).mockResolvedValue({
            id: "s1",
            patient_id: "p1",
            risk_level: "Low",
        } as never);
    });

    it("renders wizard step 1 (Vitals) with inputs", () => {
        render(
            <BrowserRouter>
                <PatientSelfScreening />
            </BrowserRouter>,
        );

        expect(screen.getByRole("heading", { name: /New Health Screening/i })).toBeInTheDocument();
        expect(screen.getByText(/Vital Signs/i)).toBeInTheDocument();
        expect(screen.getByText(/Height \(cm\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Weight \(kg\)/i)).toBeInTheDocument();
    });

    it("navigates between steps when Next and Back are clicked", async () => {
        const user = userEvent.setup();
        render(
            <BrowserRouter>
                <PatientSelfScreening />
            </BrowserRouter>,
        );

        const nextBtn = screen.getByRole("button", { name: /^Next/i });
        await user.click(nextBtn);

        await waitFor(() => {
            expect(screen.getByText(/Smoking Status/i)).toBeInTheDocument();
        });

        const backBtn = screen.getByRole("button", { name: /^Back/i });
        await user.click(backBtn);

        await waitFor(() => {
            expect(screen.getByText(/Vital Signs/i)).toBeInTheDocument();
        });
    });
});
