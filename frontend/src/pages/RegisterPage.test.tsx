import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterPage } from "./RegisterPage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock("firebase/auth", () => ({
    createUserWithEmailAndPassword: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
    doc: vi.fn(),
    setDoc: vi.fn(),
}));

vi.mock("../lib/firebase", () => ({
    auth: {},
    db: {},
}));

import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc } from "firebase/firestore";

describe("RegisterPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders registration form with all fields and role selector", () => {
        render(
            <BrowserRouter>
                <RegisterPage />
            </BrowserRouter>,
        );

        expect(screen.getByRole("heading", { name: "Create Account" })).toBeInTheDocument();
        expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Create Account/i })).toBeInTheDocument();
    });

    it("handles successful health worker registration and redirects to /dashboard", async () => {
        vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
            user: { uid: "new-user-123" },
        } as never);
        vi.mocked(setDoc).mockResolvedValue(undefined);

        const user = userEvent.setup();
        render(
            <BrowserRouter>
                <RegisterPage />
            </BrowserRouter>,
        );

        const nameInput = screen.getByLabelText(/Full Name/i);
        const emailInput = screen.getByLabelText(/Email Address/i);
        const passwordInput = screen.getByLabelText(/^Password/i);
        const submitBtn = screen.getByRole("button", { name: /Create Account/i });

        await user.type(nameInput, "Amit Kumar");
        await user.type(emailInput, "amit@example.com");
        await user.type(passwordInput, "securePassword123");
        await user.click(submitBtn);

        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
            expect.anything(),
            "amit@example.com",
            "securePassword123",
        );
        expect(setDoc).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    it("handles role selection for Patient and redirects to /patient/dashboard", async () => {
        vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
            user: { uid: "patient-user-123" },
        } as never);
        vi.mocked(setDoc).mockResolvedValue(undefined);

        const user = userEvent.setup();
        render(
            <BrowserRouter>
                <RegisterPage />
            </BrowserRouter>,
        );

        const roleSelect = screen.getByLabelText(/Select Role/i);
        await user.selectOptions(roleSelect, "patient");

        const nameInput = screen.getByLabelText(/Full Name/i);
        const emailInput = screen.getByLabelText(/Email Address/i);
        const passwordInput = screen.getByLabelText(/^Password/i);
        const submitBtn = screen.getByRole("button", { name: /Create Account/i });

        await user.type(nameInput, "Patient User");
        await user.type(emailInput, "patient@example.com");
        await user.type(passwordInput, "patientPass123");
        await user.click(submitBtn);

        expect(mockNavigate).toHaveBeenCalledWith("/patient/dashboard");
    });

    it("shows error message on duplicate email registration", async () => {
        vi.mocked(createUserWithEmailAndPassword).mockRejectedValue({
            code: "auth/email-already-in-use",
        });

        const user = userEvent.setup();
        render(
            <BrowserRouter>
                <RegisterPage />
            </BrowserRouter>,
        );

        const nameInput = screen.getByLabelText(/Full Name/i);
        const emailInput = screen.getByLabelText(/Email Address/i);
        const passwordInput = screen.getByLabelText(/^Password/i);
        const submitBtn = screen.getByRole("button", { name: /Create Account/i });

        await user.type(nameInput, "Existing User");
        await user.type(emailInput, "existing@example.com");
        await user.type(passwordInput, "password123");
        await user.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText(/Email is already registered/i)).toBeInTheDocument();
        });
    });
});
