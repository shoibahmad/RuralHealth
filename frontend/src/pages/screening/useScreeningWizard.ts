import { useCallback, useState } from "react";

import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";
import {
    applyOcrData,
    extractPatientName,
    flattenObject,
    unwrapExtractionResponse,
} from "../../lib/ocrMapping";
import { buildNameNotice, filesOnBehalfOfOthers, type NameNotice } from "../../lib/nameMatching";
import { riskUtils } from "../../lib/riskUtils";
import { validateScreeningForm } from "../../lib/schemas";
import {
    buildAnalysisPayload,
    buildPatientPayload,
    buildScreeningPayload,
} from "../../lib/screeningPayload";
import { firestoreService, type AiInsights } from "../../services/firestoreService";

/** Every wizard field starts as an empty string; the schema coerces on submit. */
export const EMPTY_FORM: Record<string, string> = {
    // Patient
    full_name: "",
    age: "",
    gender: "",
    village: "",
    phone: "",
    // Vitals
    height_cm: "",
    weight_kg: "",
    systolic_bp: "",
    diastolic_bp: "",
    heart_rate: "",
    // Lifestyle
    smoking_status: "",
    alcohol_usage: "",
    physical_activity: "",
    // Lab
    glucose_level: "",
    cholesterol_level: "",
    // Hematology
    hemoglobin: "",
    rbc_count: "",
    wbc_count: "",
    platelet_count: "",
    // Metabolic
    blood_urea_nitrogen: "",
    creatinine: "",
    sodium: "",
    potassium: "",
    chloride: "",
    calcium: "",
    // Liver
    alt_sgpt: "",
    ast_sgot: "",
    albumin: "",
    total_bilirubin: "",
};

export const STEP_COUNT = 6;

export type WizardFormData = Record<string, string>;

/**
 * State and submission flow for the screening wizard.
 *
 * The component owns layout; this hook owns validation, the Firestore writes and
 * the AI hand-off, so each can be reasoned about (and tested) on its own.
 */
export function useScreeningWizard() {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<WizardFormData>({ ...EMPTY_FORM });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<AiInsights | null>(null);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [nameNotice, setNameNotice] = useState<NameNotice | null>(null);
    const [ocrExtractedName, setOcrExtractedName] = useState("");

    const dismissNameNotice = useCallback(() => setNameNotice(null), []);

    /** Merge a step's edits and re-check the OCR name against the typed name. */
    const updateFormData = useCallback(
        (next: WizardFormData) => {
            setFormData(next);
            setFieldErrors({});

            if (!ocrExtractedName || !filesOnBehalfOfOthers(user?.role)) return;

            setNameNotice(
                buildNameNotice({
                    extracted: ocrExtractedName,
                    expected: next.full_name,
                    requireExplicitConfirmation: true,
                }),
            );
        },
        [ocrExtractedName, user?.role],
    );

    /** Apply an extraction response to the form and advance to verification. */
    const handleOcrData = useCallback(
        (response: unknown, language: "en" | "hi") => {
            const { ok, payload, error: extractionError } = unwrapExtractionResponse(response);

            if (!ok) {
                showToast(
                    language === "en"
                        ? `Extraction failed: ${extractionError ?? "Please try again"}`
                        : `निकाल विफल: ${extractionError ?? "कृपया पुनः प्रयास करें"}`,
                    "error",
                );
                return;
            }

            const { data, applied } = applyOcrData(formData, payload);
            setFormData(data);

            if (!applied) {
                showToast(
                    language === "en"
                        ? "No readable fields were found in that document."
                        : "उस दस्तावेज़ में कोई पठनीय फ़ील्ड नहीं मिली।",
                    "error",
                );
            } else {
                showToast(
                    language === "en"
                        ? "Data extracted successfully! Please verify details."
                        : "डेटा सफलतापूर्वक निकाला गया! कृपया विवरण सत्यापित करें।",
                    "success",
                );
            }

            const extractedName = extractPatientName(flattenObject(payload));
            if (extractedName) {
                setOcrExtractedName(extractedName);

                const onBehalf = filesOnBehalfOfOthers(user?.role);
                const notice = buildNameNotice({
                    extracted: extractedName,
                    expected: onBehalf ? data.full_name : user?.full_name,
                    requireExplicitConfirmation: onBehalf,
                });
                setNameNotice(notice);

                if (notice && notice.expected !== "") {
                    showToast(
                        language === "en"
                            ? `Report mismatch! Report is for "${notice.extracted}" but you are logged in as "${notice.expected}".`
                            : `रिपोर्ट मेल नहीं खाती! रिपोर्ट "${notice.extracted}" के लिए है, लेकिन आप "${notice.expected}" के रूप में लॉग इन हैं।`,
                        "error",
                    );
                }
            }

            setCurrentStep(1);
        },
        [formData, showToast, user?.full_name, user?.role],
    );

    /** Compare a lab-report name against the name already on the form. */
    const checkLabReportName = useCallback(
        (extracted: string, language: "en" | "hi") => {
            const notice = buildNameNotice({
                extracted,
                expected: formData.full_name,
            });
            setNameNotice(notice);

            if (notice) {
                showToast(
                    language === "en"
                        ? `Report mismatch! Report is for "${notice.extracted}" but patient is "${notice.expected}".`
                        : `रिपोर्ट मेल नहीं खाती! रिपोर्ट "${notice.extracted}" के लिए है, लेकिन मरीज़ "${notice.expected}" हैं।`,
                    "error",
                );
            }
        },
        [formData.full_name, showToast],
    );

    const skipInitialScan = useCallback(() => {
        setNameNotice(null);
        setOcrExtractedName("");
        setCurrentStep(1);
    }, []);

    /**
     * Persist the screening.
     *
     * @returns true when the AI modal was opened, so the caller knows whether to
     * redirect on its own.
     */
    const persistScreening = useCallback(async (): Promise<boolean> => {
        const validation = validateScreeningForm(formData);

        if (!validation.success || !validation.data) {
            setFieldErrors(validation.errors);
            throw new Error(
                Object.values(validation.errors)[0] ?? "Please correct the highlighted fields",
            );
        }

        const form = validation.data;
        const isSelfScreening = user?.role === "patient";
        let patientId = user?.uid;

        if (!isSelfScreening) {
            const created = await firestoreService.addPatient(buildPatientPayload(form, user?.uid));
            patientId = created.id;
        } else {
            await firestoreService.setPatient(patientId!, buildPatientPayload(form));
        }

        const risk = riskUtils.calculateRisk({
            age: form.age,
            systolic_bp: form.systolic_bp,
            diastolic_bp: form.diastolic_bp,
            smoking_status: form.smoking_status,
        });

        const screeningPayload = buildScreeningPayload(form, patientId!, risk);
        const screening = await firestoreService.addScreening(screeningPayload);

        // Denormalised counters power the patient list; a failure here must not
        // lose the screening that was just recorded.
        try {
            const existing = await firestoreService.getPatient(patientId!);
            await firestoreService.updatePatient(patientId!, {
                screening_count: (existing?.screening_count ?? 0) + 1,
                latest_risk_level: risk.level,
            });
        } catch (updateErr) {
            console.error("Failed to update patient stats:", updateErr);
        }

        try {
            const response = await fetch("/api/ai/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildAnalysisPayload(form, screeningPayload)),
            });

            if (!response.ok) return false;

            const result = await response.json();
            if (!result.success || !result.analysis) return false;

            setAiAnalysis({ ...result.analysis, risk_level: risk.level });
            setIsAiModalOpen(true);

            if (screening.id) {
                await firestoreService.updateScreening(screening.id, {
                    ai_insights: result.analysis,
                });
            }

            return true;
        } catch (aiErr) {
            console.error("AI Analysis failed:", aiErr);
            return false;
        }
    }, [formData, user?.role, user?.uid]);

    const submit = useCallback(async (): Promise<boolean> => {
        setIsSubmitting(true);
        setError(null);

        try {
            const hasAi = await persistScreening();
            setIsSuccess(true);
            showToast("Screening submitted successfully", "success");
            return hasAi;
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "An error occurred while saving data";
            console.error("Submission error:", err);
            setError(message);
            showToast(message, "error");
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [persistScreening, showToast]);

    const nextStep = useCallback(() => {
        setCurrentStep((step) => Math.min(step + 1, STEP_COUNT - 1));
    }, []);

    const prevStep = useCallback(() => {
        setCurrentStep((step) => Math.max(step - 1, 0));
    }, []);

    return {
        currentStep,
        setCurrentStep,
        formData,
        updateFormData,
        fieldErrors,
        isSubmitting,
        isSuccess,
        error,
        clearError: () => setError(null),
        aiAnalysis,
        isAiModalOpen,
        closeAiModal: () => setIsAiModalOpen(false),
        nameNotice,
        dismissNameNotice,
        handleOcrData,
        checkLabReportName,
        skipInitialScan,
        submit,
        nextStep,
        prevStep,
        isLastStep: currentStep === STEP_COUNT - 1,
    };
}
