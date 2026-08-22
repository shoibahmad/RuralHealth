import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { TermsConditionsPage } from "./TermsConditionsPage";

describe("TermsConditionsPage", () => {
    it("renders terms and conditions policy sections", () => {
        render(
            <BrowserRouter>
                <TermsConditionsPage />
            </BrowserRouter>,
        );

        expect(screen.getByRole("heading", { name: /Terms & Conditions/i })).toBeInTheDocument();
        expect(screen.getByText(/1. Acceptance of Terms/i)).toBeInTheDocument();
        expect(screen.getByText(/2. Description of Service/i)).toBeInTheDocument();
    });
});
