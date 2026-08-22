import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import DataSecurityPage from "./DataSecurityPage";

describe("DataSecurityPage", () => {
    it("renders security standards and encryption features", () => {
        render(
            <BrowserRouter>
                <DataSecurityPage />
            </BrowserRouter>,
        );

        expect(screen.getByRole("heading", { name: /Data Security & Privacy/i })).toBeInTheDocument();
        expect(screen.getByText(/End-to-End Encryption/i)).toBeInTheDocument();
        expect(screen.getByText(/HIPAA Compliant Standard/i)).toBeInTheDocument();
        expect(screen.getByText(/Role-Based Access/i)).toBeInTheDocument();
    });
});
