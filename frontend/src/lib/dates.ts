import type { Timestamp } from "firebase/firestore";

/**
 * Date helpers for values that may arrive as either an ISO string or a
 * Firestore Timestamp.
 *
 * Documents written by this app store ISO strings, but anything written by the
 * Firebase console or an older client comes back as a Timestamp. `new Date(x)`
 * silently produces an Invalid Date for the latter, which renders as
 * "Invalid Date" in the UI rather than failing loudly.
 */

export type DateLike = string | number | Date | Timestamp | null | undefined;

const isTimestamp = (value: unknown): value is Timestamp =>
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toDate?: unknown }).toDate === "function";

/** Convert any supported representation to a Date, or null when unusable. */
export function toDate(value: DateLike): Date | null {
    if (value === null || value === undefined || value === "") return null;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (isTimestamp(value)) {
        return value.toDate();
    }

    const parsed = new Date(value as string | number);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Locale date string, or a placeholder when the value is unusable. */
export function formatDate(value: DateLike, placeholder = "—"): string {
    const date = toDate(value);
    return date ? date.toLocaleDateString() : placeholder;
}

/** Locale date and time string, or a placeholder when unusable. */
export function formatDateTime(value: DateLike, placeholder = "—"): string {
    const date = toDate(value);
    return date ? date.toLocaleString() : placeholder;
}

/** Milliseconds since the epoch, or 0 so sorts stay stable. */
export function toEpoch(value: DateLike): number {
    return toDate(value)?.getTime() ?? 0;
}
