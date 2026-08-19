import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "./LoginPage";

const mockNavigate = vi.fn();
const mockShowToast = vi.fn();
const authState: { user: { role: string } | null } = { user: null };

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock("../context/useAuth", () => ({
    useAuth: () => authState,
}));

vi.mock("../context/useToast", () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock("firebase/auth", () => ({
    signInWithEmailAndPassword: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
}));

vi.mock("../lib/firebase", () => ({
    auth: {},
}));

import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

describe("LoginPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.user = null;
    });

    it("renders login form with inputs and sign in button", () => {
        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>,
        );

        expect(screen.getByText("Welcome Back")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("name@clinic.com")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
        expect(screen.getByText(/Forgot Password\?/i)).toBeInTheDocument();
    });

    it("redirects authenticated health worker to /dashboard", () => {
        authState.user = { role: "health_worker" };

        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>,
        );

        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    it("redirects authenticated officer to /officer/dashboard", () => {
        authState.user = { role: "health_officer" };

        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>,
        );

        expect(mockNavigate).toHaveBeenCalledWith("/officer/dashboard");
    });

    it("handles login submission successfully", async () => {
        vi.mocked(signInWithEmailAndPassword).mockResolvedValue({} as never);
        const user = userEvent.setup();

        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>,
        );

        const emailInput = screen.getByPlaceholderText("name@clinic.com");
        const passwordInput = screen.getByLabelText(/^Password/i);
        const submitBtn = screen.getByRole("button", { name: /Sign In/i });

        await user.type(emailInput, "worker@example.com");
        await user.type(passwordInput, "password123");
        await user.click(submitBtn);

        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
            expect.anything(),
            "worker@example.com",
            "password123",
        );
    });

    it("displays error message when login credentials fail", async () => {
        vi.mocked(signInWithEmailAndPassword).mockRejectedValue({
            code: "auth/invalid-credential",
        });
        const user = userEvent.setup();

        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>,
        );

        const emailInput = screen.getByPlaceholderText("name@clinic.com");
        const passwordInput = screen.getByLabelText(/^Password/i);
        const submitBtn = screen.getByRole("button", { name: /Sign In/i });

        await user.type(emailInput, "wrong@example.com");
        await user.type(passwordInput, "wrongpass");
        await user.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
        });
    });

    it("handles forgot password click with email validation", async () => {
        vi.mocked(sendPasswordResetEmail).mockResolvedValue(undefined);
        const user = userEvent.setup();

        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>,
        );

        const forgotBtn = screen.getByText(/Forgot Password\?/i);
        await user.click(forgotBtn);

        expect(mockShowToast).toHaveBeenCalledWith(
            "Please enter your email address first.",
            "error",
        );

        const emailInput = screen.getByPlaceholderText("name@clinic.com");
        await user.type(emailInput, "user@example.com");
        await user.click(forgotBtn);

        expect(sendPasswordResetEmail).toHaveBeenCalled();
    });
});
