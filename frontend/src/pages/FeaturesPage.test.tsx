import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { FeaturesPage } from "./FeaturesPage";

describe("FeaturesPage", () => {
    it("renders core features list and capabilities", () => {
        render(
            <BrowserRouter>
                <FeaturesPage />
            </BrowserRouter>,
        );

        expect(screen.getByRole("heading", { name: /Pioneering Rural Healthcare AI/i })).toBeInTheDocument();
        expect(screen.getByText(/Offline-First Architecture/i)).toBeInTheDocument();
        expect(screen.getByText(/Voice AI Input/i)).toBeInTheDocument();
        expect(screen.getByText(/Smart OCR Scanner/i)).toBeInTheDocument();
        expect(screen.getByText(/Population Analytics/i)).toBeInTheDocument();
    });
});
