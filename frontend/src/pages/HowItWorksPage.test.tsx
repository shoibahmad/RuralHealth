import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { HowItWorksPage } from "./HowItWorksPage";

describe("HowItWorksPage", () => {
    it("renders the 6-step screening workflow", () => {
        render(
            <BrowserRouter>
                <HowItWorksPage />
            </BrowserRouter>,
        );

        expect(screen.getByRole("heading", { name: /How RuralHealthAI Works/i })).toBeInTheDocument();
        expect(screen.getByText(/1. Rapid Screening/i)).toBeInTheDocument();
        expect(screen.getByText(/2. Voice-Assisted Entry/i)).toBeInTheDocument();
        expect(screen.getByText(/3. Lab Report Analysis/i)).toBeInTheDocument();
        expect(screen.getByText(/4. Instant Risk Scoring/i)).toBeInTheDocument();
        expect(screen.getByText(/5. Data Sync/i)).toBeInTheDocument();
        expect(screen.getByText(/6. Care Coordination/i)).toBeInTheDocument();
    });
});
