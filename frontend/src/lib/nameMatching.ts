/**
 * Patient-name reconciliation between an uploaded report and the record it is
 * being filed against.
 *
 * A lab report attached to the wrong patient is a clinical safety problem, so
 * the wizard compares the OCR-extracted name with the name on the record and
 * warns before the screening is saved.
 */

/** Case- and whitespace-insensitive comparison key for a name. */
export function normalizeName(value: string | null | undefined): string {
    return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** True when two names refer to the same person, ignoring case and spacing. */
export function namesMatch(
    a: string | null | undefined,
    b: string | null | undefined,
): boolean {
    return normalizeName(a) === normalizeName(b);
}

export interface NameNotice {
    /** The name read off the uploaded report. */
    extracted: string;
    /**
     * The name on the record being filed against.
     *
     * Empty means "verify only": a name was extracted but there is nothing to
     * compare it against yet, so the UI asks the worker to confirm it.
     */
    expected: string;
}

/**
 * Decide which banner, if any, the wizard should show.
 *
 * Returns `null` when there is nothing to say — either no name was extracted,
 * or the two names agree for a role that only needs a mismatch warning.
 */
export function buildNameNotice({
    extracted,
    expected,
    requireExplicitConfirmation = false,
}: {
    extracted: string | null | undefined;
    expected: string | null | undefined;
    /**
     * When true, a matching name still produces a verify notice. Health workers
     * and officers file reports on someone else's behalf, so they are asked to
     * confirm the identity even when nothing looks wrong.
     */
    requireExplicitConfirmation?: boolean;
}): NameNotice | null {
    const extractedName = (extracted ?? "").trim();
    if (!extractedName) return null;

    const expectedName = (expected ?? "").trim();

    if (requireExplicitConfirmation && !expectedName) {
        return { extracted: extractedName, expected: "" };
    }

    if (!expectedName) return null;

    if (namesMatch(extractedName, expectedName)) {
        return requireExplicitConfirmation
            ? { extracted: extractedName, expected: "" }
            : null;
    }

    return { extracted: extractedName, expected: expectedName };
}

/** Roles that file screenings on behalf of someone else. */
export function filesOnBehalfOfOthers(role: string | undefined): boolean {
    return role === "health_worker" || role === "health_officer";
}
