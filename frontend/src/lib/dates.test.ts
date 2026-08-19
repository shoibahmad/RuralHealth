import { describe, expect, it } from "vitest";

import { formatDate, formatDateTime, toDate, toEpoch } from "./dates";

/** Stand-in for a Firestore Timestamp, which exposes toDate(). */
const timestamp = (iso: string) => ({ toDate: () => new Date(iso) });

describe("toDate", () => {
    it("parses an ISO string", () => {
        expect(toDate("2026-03-01T00:00:00Z")?.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    });

    it("converts a Firestore Timestamp", () => {
        expect(toDate(timestamp("2026-03-01T00:00:00Z") as never)?.toISOString()).toBe(
            "2026-03-01T00:00:00.000Z",
        );
    });

    it("passes a Date through", () => {
        const date = new Date("2026-03-01T00:00:00Z");
        expect(toDate(date)).toBe(date);
    });

    it("accepts epoch milliseconds", () => {
        expect(toDate(0)?.toISOString()).toBe("1970-01-01T00:00:00.000Z");
    });

    it.each([null, undefined, "", "not a date"])(
        "returns null for the unusable value %s",
        (value) => {
            expect(toDate(value)).toBeNull();
        },
    );

    it("returns null for an Invalid Date instance", () => {
        expect(toDate(new Date("nonsense"))).toBeNull();
    });
});

describe("formatDate", () => {
    it("formats a usable value", () => {
        expect(formatDate("2026-03-01T00:00:00Z")).not.toBe("—");
    });

    it("returns the placeholder for an unusable value", () => {
        expect(formatDate(null)).toBe("—");
    });

    it("accepts a custom placeholder", () => {
        expect(formatDate(undefined, "not recorded")).toBe("not recorded");
    });

    it("never renders the string Invalid Date", () => {
        expect(formatDate("garbage")).toBe("—");
    });
});

describe("formatDateTime", () => {
    it("includes a time component", () => {
        const formatted = formatDateTime("2026-03-01T13:45:00Z");
        expect(formatted).not.toBe("—");
        expect(formatted.length).toBeGreaterThan(formatDate("2026-03-01T13:45:00Z").length);
    });

    it("returns the placeholder for an unusable value", () => {
        expect(formatDateTime("garbage")).toBe("—");
    });
});

describe("toEpoch", () => {
    it("returns milliseconds for a usable value", () => {
        expect(toEpoch("1970-01-01T00:00:01Z")).toBe(1000);
    });

    it("returns 0 for an unusable value so sorting stays stable", () => {
        expect(toEpoch(null)).toBe(0);
        expect(toEpoch("garbage")).toBe(0);
    });

    it("orders mixed string and Timestamp values correctly", () => {
        const values = [
            "2026-06-01T00:00:00Z",
            timestamp("2026-01-01T00:00:00Z") as never,
            "2026-03-01T00:00:00Z",
        ];

        const sorted = [...values].sort((a, b) => toEpoch(a) - toEpoch(b));
        expect(toEpoch(sorted[0])).toBeLessThan(toEpoch(sorted[2]));
    });
});
