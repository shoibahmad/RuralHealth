import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { LandingPage } from "./LandingPage";
import { useAuth } from "../context/useAuth";

vi.mock("../context/useAuth", () => ({
    useAuth: vi.fn(),
}));

describe("LandingPage", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: false,
            isHealthWorker: false,
            isHealthOfficer: false,
            isPatient: false,
            user: null,
            loading: false,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        } as unknown as ReturnType<typeof useAuth>);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("renders splash loading screen initially and transitions to landing content", () => {
        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>,
        );

        // Initial splash screen
        expect(screen.getByText("Empowering Rural Healthcare...")).toBeInTheDocument();

        // Advance timers past the 4000ms splash screen
        act(() => {
            vi.advanceTimersByTime(4500);
        });

        expect(screen.getByText(/Smart Health Screening for/i)).toBeInTheDocument();
        expect(screen.getByText(/Start Your Survey/i)).toBeInTheDocument();
    });

    it("renders dashboard link when user is authenticated", () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
            isHealthWorker: true,
            isHealthOfficer: false,
            isPatient: false,
            user: { uid: "u1", email: "worker@example.com", role: "health_worker" },
            loading: false,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        } as unknown as ReturnType<typeof useAuth>);

        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>,
        );

        act(() => {
            vi.advanceTimersByTime(4500);
        });

        expect(screen.getByText(/Go to Dashboard/i)).toBeInTheDocument();
    });
});
