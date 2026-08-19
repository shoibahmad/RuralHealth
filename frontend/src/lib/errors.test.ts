import { describe, expect, it } from "vitest";

import { errorCode, errorMessage } from "./errors";

describe("errorMessage", () => {
    it("reads the message off an Error", () => {
        expect(errorMessage(new Error("boom"))).toBe("boom");
    });

    it("reads a subclassed Error", () => {
        expect(errorMessage(new TypeError("bad type"))).toBe("bad type");
    });

    it("returns a thrown string as-is", () => {
        expect(errorMessage("plain failure")).toBe("plain failure");
    });

    it.each(["message", "detail", "error"])("reads the %s key off a thrown object", (key) => {
        expect(errorMessage({ [key]: "from object" })).toBe("from object");
    });

    it("prefers message over detail when both are present", () => {
        expect(errorMessage({ message: "first", detail: "second" })).toBe("first");
    });

    it.each([undefined, null, 42, {}, [], "", "   "])(
        "falls back for the unusable value %s",
        (value) => {
            expect(errorMessage(value)).toBe("An unexpected error occurred");
        },
    );

    it("uses a caller-supplied fallback", () => {
        expect(errorMessage(null, "could not save")).toBe("could not save");
    });

    it("ignores a non-string message field", () => {
        expect(errorMessage({ message: 500 }, "fallback")).toBe("fallback");
    });
});

describe("errorCode", () => {
    it("reads a Firebase-style code", () => {
        expect(errorCode({ code: "auth/wrong-password" })).toBe("auth/wrong-password");
    });

    it.each([undefined, null, "string", new Error("no code"), { code: 42 }])(
        "returns undefined for %s",
        (value) => {
            expect(errorCode(value)).toBeUndefined();
        },
    );
});
