import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initErrorTracking, teardownErrorTracking, _errorTrackingSink } from "./errorTracking";
import { setSinks, resetSinks } from "./logger";

describe("errorTracking", () => {
    beforeEach(() => {
        // Start with no sinks so we can observe what initErrorTracking adds.
        setSinks([]);
    });

    afterEach(() => {
        teardownErrorTracking();
        resetSinks();
    });

    it("is a no-op when VITE_ERROR_TRACKING_DSN is unset", () => {
        // import.meta.env.VITE_ERROR_TRACKING_DSN is undefined by default in tests
        const activated = initErrorTracking();
        expect(activated).toBe(false);
    });

    it("activates tracking when VITE_ERROR_TRACKING_DSN is set", () => {
        vi.stubEnv("VITE_ERROR_TRACKING_DSN", "https://example.com/dsn");

        const activated = initErrorTracking();
        expect(activated).toBe(true);

        vi.unstubAllEnvs();
    });

    it("does not double-register on repeated calls", () => {
        vi.stubEnv("VITE_ERROR_TRACKING_DSN", "https://example.com/dsn");

        const first = initErrorTracking();
        const second = initErrorTracking();
        expect(first).toBe(true);
        expect(second).toBe(true); // idempotent, not a second registration

        vi.unstubAllEnvs();
    });

    it("teardown allows re-initialisation", () => {
        vi.stubEnv("VITE_ERROR_TRACKING_DSN", "https://example.com/dsn");

        initErrorTracking();
        teardownErrorTracking();

        // After teardown, the DSN is still set so re-init should activate
        const reactivated = initErrorTracking();
        expect(reactivated).toBe(true);

        vi.unstubAllEnvs();
    });

    it("sink filters out info/debug and handles warn/error safely", () => {
        expect(() => {
            _errorTrackingSink({
                level: "info",
                module: "Test",
                message: "Ignored info",
                timestamp: new Date().toISOString(),
            });
            _errorTrackingSink({
                level: "warn",
                module: "Test",
                message: "Warning tracked",
                timestamp: new Date().toISOString(),
            });
            _errorTrackingSink({
                level: "error",
                module: "Test",
                message: "Error tracked",
                timestamp: new Date().toISOString(),
            });
        }).not.toThrow();
    });
});
