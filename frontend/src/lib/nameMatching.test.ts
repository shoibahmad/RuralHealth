import { describe, expect, it } from "vitest";

import { buildNameNotice, filesOnBehalfOfOthers, namesMatch, normalizeName } from "./nameMatching";

describe("normalizeName", () => {
    it("lowercases and collapses whitespace", () => {
        expect(normalizeName("  Ramesh   KUMAR ")).toBe("ramesh kumar");
    });

    it.each([null, undefined, ""])("returns an empty string for %s", (value) => {
        expect(normalizeName(value)).toBe("");
    });
});

describe("namesMatch", () => {
    it.each([
        ["Ramesh Kumar", "ramesh kumar"],
        ["Ramesh  Kumar", "Ramesh Kumar"],
        [" Ramesh Kumar ", "Ramesh Kumar"],
    ])("treats %s and %s as the same person", (a, b) => {
        expect(namesMatch(a, b)).toBe(true);
    });

    it("distinguishes genuinely different names", () => {
        expect(namesMatch("Ramesh Kumar", "Sunita Devi")).toBe(false);
    });
});

describe("buildNameNotice", () => {
    it("returns null when no name was extracted", () => {
        expect(buildNameNotice({ extracted: "", expected: "Ramesh Kumar" })).toBeNull();
    });

    it("returns null when the names agree for a self-screening patient", () => {
        expect(buildNameNotice({ extracted: "Ramesh Kumar", expected: "ramesh kumar" })).toBeNull();
    });

    it("warns when the extracted name differs from the record", () => {
        const notice = buildNameNotice({
            extracted: "Sunita Devi",
            expected: "Ramesh Kumar",
        });

        expect(notice).toEqual({ extracted: "Sunita Devi", expected: "Ramesh Kumar" });
    });

    it("asks a health worker to confirm even when the names agree", () => {
        const notice = buildNameNotice({
            extracted: "Ramesh Kumar",
            expected: "Ramesh Kumar",
            requireExplicitConfirmation: true,
        });

        expect(notice).toEqual({ extracted: "Ramesh Kumar", expected: "" });
    });

    it("asks a health worker to confirm before any name is typed", () => {
        const notice = buildNameNotice({
            extracted: "Ramesh Kumar",
            expected: "",
            requireExplicitConfirmation: true,
        });

        expect(notice).toEqual({ extracted: "Ramesh Kumar", expected: "" });
    });

    it("still warns a health worker about a genuine mismatch", () => {
        const notice = buildNameNotice({
            extracted: "Sunita Devi",
            expected: "Ramesh Kumar",
            requireExplicitConfirmation: true,
        });

        expect(notice).toEqual({ extracted: "Sunita Devi", expected: "Ramesh Kumar" });
    });

    it("returns null for a patient with no name on file to compare against", () => {
        expect(buildNameNotice({ extracted: "Ramesh", expected: "" })).toBeNull();
    });

    it("trims the names it reports", () => {
        const notice = buildNameNotice({
            extracted: "  Sunita Devi  ",
            expected: "  Ramesh Kumar  ",
        });

        expect(notice).toEqual({ extracted: "Sunita Devi", expected: "Ramesh Kumar" });
    });
});

describe("filesOnBehalfOfOthers", () => {
    it.each(["health_worker", "health_officer"])("is true for %s", (role) => {
        expect(filesOnBehalfOfOthers(role)).toBe(true);
    });

    it.each(["patient", "admin", undefined])("is false for %s", (role) => {
        expect(filesOnBehalfOfOthers(role)).toBe(false);
    });
});
