import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { PrivacyPolicyPage } from "./PrivacyPolicyPage";

describe("PrivacyPolicyPage", () => {
    it("renders privacy policy sections and content", () => {
        render(
            <BrowserRouter>
                <PrivacyPolicyPage />
            </BrowserRouter>,
        );

        expect(screen.getByRole("heading", { name: /Privacy Policy/i })).toBeInTheDocument();
        expect(screen.getByText(/1. Introduction/i)).toBeInTheDocument();
        expect(screen.getByText(/2. Information We Collect/i)).toBeInTheDocument();
        expect(screen.getByText(/2.1 Personal Information/i)).toBeInTheDocument();
    });
});
