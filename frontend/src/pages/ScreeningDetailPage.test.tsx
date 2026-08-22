import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ScreeningDetailPage } from "./ScreeningDetailPage";
import { firestoreService, type Screening } from "../services/firestoreService";

vi.mock("../services/firestoreService", () => ({
    firestoreService: {
        getScreening: vi.fn(),
    },
}));

const mockScreening: Screening = {
    id: "s1",
    patient_id: "p1",
    patient_name: "Anita Sharma",
    created_at: "2026-01-10T10:00:00Z",
    risk_level: "High",
    systolic_bp: 150,
    diastolic_bp: 95,
    heart_rate: 80,
    glucose_level: 160,
    cholesterol_level: 220,
    bmi: 28.5,
    ai_insights: "Patient shows elevated cardiovascular risk markers.",
};

describe("ScreeningDetailPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(firestoreService.getScreening).mockResolvedValue(mockScreening);
    });

    it("renders screening details, vitals cards, and AI insights", async () => {
        render(
            <MemoryRouter initialEntries={["/screening/s1"]}>
                <Routes>
                    <Route path="/screening/:id" element={<ScreeningDetailPage />} />
                </Routes>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: /Screening Report/i })).toBeInTheDocument();
            expect(screen.getByText("High")).toBeInTheDocument();
            expect(screen.getByText(/Patient shows elevated cardiovascular risk markers/i)).toBeInTheDocument();
        });
    });

    it("renders not found state when screening is missing", async () => {
        vi.mocked(firestoreService.getScreening).mockResolvedValue(null);

        render(
            <MemoryRouter initialEntries={["/screening/nonexistent"]}>
                <Routes>
                    <Route path="/screening/:id" element={<ScreeningDetailPage />} />
                </Routes>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText(/Screening not found/i)).toBeInTheDocument();
        });
    });
});
