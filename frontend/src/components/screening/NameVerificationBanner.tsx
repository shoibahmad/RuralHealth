import { AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import type { NameNotice } from "../../lib/nameMatching";

interface NameVerificationBannerProps {
    notice: NameNotice | null;
    language: "en" | "hi";
    onDismiss: () => void;
}

/**
 * Warn about the patient name read off an uploaded report.
 *
 * Two states: a red "verify this name" prompt when there is nothing to compare
 * against, and an amber mismatch warning when the extracted name disagrees with
 * the record. The mismatch is advisory — a worker may legitimately proceed.
 */
export function NameVerificationBanner({
    notice,
    language,
    onDismiss,
}: NameVerificationBannerProps) {
    if (!notice) return null;

    const isMismatch = notice.expected !== "";

    if (!isMismatch) {
        return (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-semibold text-red-300">
                            {language === "en"
                                ? "Verify Patient Name"
                                : "मरीज़ का नाम सत्यापित करें"}
                        </p>
                        <p className="text-red-400/80 mt-1">
                            {language === "en"
                                ? `Report detected patient name: "${notice.extracted}". Please confirm this matches the intended patient.`
                                : `रिपोर्ट में मरीज़ का नाम मिला: "${notice.extracted}"। कृपया पुष्टि करें कि यह सही मरीज़ है।`}
                        </p>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="text-red-500 hover:text-red-300 transition-colors text-lg leading-none shrink-0"
                        aria-label="Dismiss"
                    >
                        ×
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm">
            <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="font-semibold text-amber-300">
                        {language === "en" ? "Report Mismatch Detected" : "रिपोर्ट मेल नहीं खाती"}
                    </p>
                    <p className="text-amber-400/80 mt-1">
                        {language === "en"
                            ? `Report is for "${notice.extracted}" but patient is "${notice.expected}". You may still proceed if this is intentional.`
                            : `रिपोर्ट "${notice.extracted}" के लिए है, लेकिन मरीज़ "${notice.expected}" हैं। यदि यह जानबूझकर है तो आप आगे बढ़ सकते हैं।`}
                    </p>
                </div>
                <button
                    onClick={onDismiss}
                    className="text-amber-500 hover:text-amber-300 transition-colors text-lg leading-none shrink-0"
                    aria-label="Dismiss"
                >
                    ×
                </button>
            </div>
            <div className="flex gap-2 mt-3 ml-8">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={onDismiss}
                    className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 text-xs h-7"
                >
                    {language === "en" ? "Proceed Anyway" : "फिर भी आगे बढ़ें"}
                </Button>
            </div>
        </div>
    );
}
