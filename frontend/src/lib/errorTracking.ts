/**
 * Error-tracking integration layer.
 *
 * In development and test the module is a no-op. In production, when
 * `VITE_ERROR_TRACKING_DSN` is set, it registers a {@link LogSink} that
 * forwards `error` and `warn` records to the configured provider.
 *
 * The architecture is provider-agnostic: swap the `reportToProvider` function
 * to switch from (e.g.) Sentry to Datadog without changing any call site.
 */
import { addSink, type LogRecord, type LogSink } from "./logger";

/** Severity levels that are forwarded to the tracking provider. */
const FORWARDED_LEVELS = new Set(["error", "warn"]);

/**
 * Placeholder provider transport.
 *
 * Replace this body with your real SDK call, for example:
 * ```ts
 * Sentry.captureException(record.error ?? record.message, {
 *     tags: { module: record.module },
 *     extra: record.context,
 * });
 * ```
 */
function reportToProvider(record: LogRecord): void {
    // No-op placeholder — wire to your error-tracking SDK here.
    // This function is only called when the DSN is set, so tests and
    // local development are unaffected.
    void record;
}

/** The sink that bridges the logger to the tracking provider. */
const errorTrackingSink: LogSink = (record) => {
    if (!FORWARDED_LEVELS.has(record.level)) return;
    try {
        reportToProvider(record);
    } catch {
        // The tracking layer must never break the application.
    }
};

let teardown: (() => void) | null = null;

/**
 * Initialise error tracking.
 *
 * Call this once during app bootstrap (e.g. in `main.tsx`). When the DSN
 * environment variable is unset the function is a no-op.
 *
 * @returns `true` if tracking was activated, `false` otherwise.
 */
export function initErrorTracking(): boolean {
    const dsn = import.meta.env?.VITE_ERROR_TRACKING_DSN;
    if (!dsn) return false;

    // Avoid double-registration if called more than once.
    if (teardown) return true;

    teardown = addSink(errorTrackingSink);
    return true;
}

/**
 * Tear down the error-tracking sink.
 * Primarily useful in tests to restore a clean logger state.
 */
export function teardownErrorTracking(): void {
    teardown?.();
    teardown = null;
}

// Re-export for testing.
export { errorTrackingSink as _errorTrackingSink };
