import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AboutPage } from "./AboutPage";

describe("AboutPage", () => {
    it("renders all major sections of the about page", () => {
        render(<AboutPage />);

        expect(screen.getByText("Bridging the Rural Healthcare Gap")).toBeInTheDocument();
        expect(screen.getByText("The Challenge")).toBeInTheDocument();
        expect(screen.getByText("Key Capabilities")).toBeInTheDocument();
        expect(screen.getByText("Project Modules")).toBeInTheDocument();
        expect(screen.getByText("System Design & Architecture")).toBeInTheDocument();
        expect(screen.getByText("Built with Modern Tech Stack")).toBeInTheDocument();
        expect(screen.getByText("Empower Your Health Center")).toBeInTheDocument();
    });
});
