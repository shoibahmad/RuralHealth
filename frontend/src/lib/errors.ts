/**
 * Helpers for handling values thrown from `catch` blocks.
 *
 * TypeScript types a caught value as `unknown` because anything can be thrown,
 * so reading `.message` off it needs a narrowing step. These helpers do that
 * once instead of every call site annotating the parameter as `any`.
 */

/** Best-effort human-readable message for any thrown value. */
export function errorMessage(error: unknown, fallback = "An unexpected error occurred"): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string" && error.trim() !== "") return error;

    if (error && typeof error === "object") {
        const record = error as Record<string, unknown>;
        // Firebase and DRF both surface a message under one of these keys.
        for (const key of ["message", "detail", "error"]) {
            const value = record[key];
            if (typeof value === "string" && value.trim() !== "") return value;
        }
    }

    return fallback;
}

/** The provider-specific code carried by Firebase auth errors, when present. */
export function errorCode(error: unknown): string | undefined {
    if (error && typeof error === "object") {
        const code = (error as Record<string, unknown>).code;
        if (typeof code === "string") return code;
    }
    return undefined;
}
