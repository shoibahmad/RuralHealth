import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { APIDocsPage } from "./APIDocsPage";

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe("APIDocsPage", () => {
    it("renders the API documentation header and sections", () => {
        render(
            <BrowserRouter>
                <APIDocsPage />
            </BrowserRouter>,
        );

        expect(screen.getByRole("heading", { name: /RuralHealthAI API/i })).toBeInTheDocument();
        expect(screen.getAllByText(/Introduction/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Authentication/i).length).toBeGreaterThan(0);
    });

    it("allows switching active sections on click", async () => {
        const user = userEvent.setup();
        render(
            <BrowserRouter>
                <APIDocsPage />
            </BrowserRouter>,
        );

        const authButtons = screen.getAllByRole("button", { name: /Authentication/i });
        if (authButtons.length > 0) {
            await user.click(authButtons[0]);
            expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
        }
    });
});
