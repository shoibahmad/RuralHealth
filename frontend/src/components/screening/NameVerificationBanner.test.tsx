import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NameVerificationBanner } from "./NameVerificationBanner";

describe("NameVerificationBanner", () => {
    it("renders nothing when there is no notice", () => {
        const { container } = render(
            <NameVerificationBanner notice={null} language="en" onDismiss={vi.fn()} />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    it("asks the worker to verify the extracted name", () => {
        render(
            <NameVerificationBanner
                notice={{ extracted: "Ramesh Kumar", expected: "" }}
                language="en"
                onDismiss={vi.fn()}
            />,
        );

        expect(screen.getByText("Verify Patient Name")).toBeInTheDocument();
        expect(screen.getByText(/Ramesh Kumar/)).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /proceed anyway/i })).toBeNull();
    });

    it("warns about a mismatch and offers to proceed", () => {
        render(
            <NameVerificationBanner
                notice={{ extracted: "Sunita Devi", expected: "Ramesh Kumar" }}
                language="en"
                onDismiss={vi.fn()}
            />,
        );

        expect(screen.getByText("Report Mismatch Detected")).toBeInTheDocument();
        expect(screen.getByText(/Sunita Devi/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /proceed anyway/i })).toBeInTheDocument();
    });

    it("dismisses via the close control", async () => {
        const onDismiss = vi.fn();
        render(
            <NameVerificationBanner
                notice={{ extracted: "Ramesh Kumar", expected: "" }}
                language="en"
                onDismiss={onDismiss}
            />,
        );

        await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));

        expect(onDismiss).toHaveBeenCalledOnce();
    });

    it("dismisses via Proceed Anyway on a mismatch", async () => {
        const onDismiss = vi.fn();
        render(
            <NameVerificationBanner
                notice={{ extracted: "Sunita Devi", expected: "Ramesh Kumar" }}
                language="en"
                onDismiss={onDismiss}
            />,
        );

        await userEvent.click(screen.getByRole("button", { name: /proceed anyway/i }));

        expect(onDismiss).toHaveBeenCalledOnce();
    });

    it("renders the Hindi copy when that language is selected", () => {
        render(
            <NameVerificationBanner
                notice={{ extracted: "Ramesh Kumar", expected: "" }}
                language="hi"
                onDismiss={vi.fn()}
            />,
        );

        expect(screen.getByText("मरीज़ का नाम सत्यापित करें")).toBeInTheDocument();
    });
});
