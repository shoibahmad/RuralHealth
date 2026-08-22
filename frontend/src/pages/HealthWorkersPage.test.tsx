import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { HealthWorkersPage } from "./HealthWorkersPage";
import { firestoreService, type HealthWorkerWithStats } from "../services/firestoreService";

vi.mock("../services/firestoreService", () => ({
    firestoreService: {
        getHealthWorkers: vi.fn(),
    },
}));

const mockWorkers: HealthWorkerWithStats[] = [
    {
        id: "w1",
        full_name: "Priya Sharma",
        email: "priya@example.com",
        role: "health_worker",
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
        stats: {
            total_patients: 15,
            total_screenings: 42,
            high_risk_patients: 5,
        },
    } as unknown as HealthWorkerWithStats,
];

describe("HealthWorkersPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(firestoreService.getHealthWorkers).mockResolvedValue(mockWorkers);
    });

    it("renders health workers list and summary statistics", async () => {
        render(
            <BrowserRouter>
                <HealthWorkersPage />
            </BrowserRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
            expect(screen.getByText("priya@example.com")).toBeInTheDocument();
        });

        expect(screen.getByText(/Total Workers/i)).toBeInTheDocument();
    });

    it("filters health workers by search term", async () => {
        const user = userEvent.setup();
        render(
            <BrowserRouter>
                <HealthWorkersPage />
            </BrowserRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/Search workers.../i);
        await user.type(searchInput, "Nonexistent");

        await waitFor(() => {
            expect(screen.queryByText("Priya Sharma")).not.toBeInTheDocument();
        });
    });
});
