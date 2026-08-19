import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "../components/ui/button";
import { WizardSteppers } from "../components/ui/wizard-steppers";
import { InitialScanStep } from "../components/screening/InitialScanStep";
import { PatientDemographicsForm } from "../components/screening/PatientDemographicsForm";
import { VitalsEntryForm } from "../components/screening/VitalsEntryForm";
import { LifestyleSurveyForm } from "../components/screening/LifestyleSurveyForm";
import { LabResultsUploadForm } from "../components/screening/LabResultsUploadForm";
import { RiskAssessmentReview } from "../components/screening/RiskAssessmentReview";
import { AIAnalysisModal } from "../components/screening/AIAnalysisModal";
import { NameVerificationBanner } from "../components/screening/NameVerificationBanner";
import { translations } from "../lib/translations";
import { useScreeningWizard } from "./screening/useScreeningWizard";

const REDIRECT_DELAY_MS = 3000;

export function ScreeningWizard() {
    const navigate = useNavigate();
    const [language, setLanguage] = useState<"en" | "hi">("hi");
    const wizard = useScreeningWizard();

    const t = translations[language];

    const wizardSteps = [
        { label: t.step_ai_scan, description: t.desc_ai_scan },
        { label: t.step_identity, description: t.desc_identity },
        { label: t.step_vitals, description: t.desc_vitals },
        { label: t.step_lifestyle, description: t.desc_lifestyle },
        { label: t.step_lab, description: t.desc_lab },
        { label: t.step_risk, description: t.desc_risk },
    ];

    const handleAdvance = async () => {
        if (!wizard.isLastStep) {
            wizard.nextStep();
            return;
        }

        const openedAiModal = await wizard.submit();
        // The modal redirects on close; without it, fall back to a timed redirect.
        if (!openedAiModal) {
            setTimeout(() => navigate("/dashboard"), REDIRECT_DELAY_MS);
        }
    };

    const renderStep = () => {
        if (wizard.isSuccess) {
            return (
                <div className="flex flex-col items-center justify-center h-full py-12 animate-in fade-in zoom-in duration-500">
                    <div className="h-20 w-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Screening Completed!</h2>
                    <p className="text-slate-400 mb-6">
                        Patient and screening data saved successfully.
                    </p>

                    {wizard.aiAnalysis && (
                        <div className="w-full max-w-md glass-card rounded-xl p-6 border border-white/10 mt-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="h-5 w-5 text-teal-400" />
                                <h3 className="font-semibold text-white">AI Analysis Summary</h3>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Risk Level:</span>
                                    <span
                                        className={`font-medium ${
                                            wizard.aiAnalysis.risk_level === "High"
                                                ? "text-red-400"
                                                : wizard.aiAnalysis.risk_level === "Medium"
                                                  ? "text-amber-400"
                                                  : "text-green-400"
                                        }`}
                                    >
                                        {wizard.aiAnalysis.risk_level}
                                    </span>
                                </div>
                                {wizard.aiAnalysis.summary && (
                                    <p className="text-slate-300">
                                        {wizard.aiAnalysis.summary.substring(0, 200)}...
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <p className="text-slate-500 text-sm mt-6">Redirecting to dashboard...</p>
                </div>
            );
        }

        if (wizard.isSubmitting) {
            return (
                <div className="flex flex-col items-center justify-center h-full py-12 animate-in fade-in zoom-in duration-500">
                    <div className="h-20 w-20 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mb-6">
                        <Loader2 className="h-10 w-10 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Saving &amp; Analyzing...
                    </h2>
                    <p className="text-slate-400 mb-8">
                        Gemini AI is analyzing patient vitals and lab reports...
                    </p>
                    <div className="w-full max-w-md h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-teal-500 to-blue-500 animate-progress-indeterminate" />
                    </div>
                </div>
            );
        }

        if (wizard.error) {
            return (
                <div className="flex flex-col items-center justify-center h-full py-12">
                    <div className="h-20 w-20 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Error Occurred</h2>
                    <p className="text-red-400 mb-4">{wizard.error}</p>
                    <Button onClick={wizard.clearError} variant="outline">
                        Try Again
                    </Button>
                </div>
            );
        }

        switch (wizard.currentStep) {
            case 0:
                return (
                    <InitialScanStep
                        onDataExtracted={(data: unknown) => wizard.handleOcrData(data, language)}
                        onSkip={wizard.skipInitialScan}
                        language={language}
                    />
                );
            case 1:
                return (
                    <PatientDemographicsForm
                        data={wizard.formData}
                        updateData={wizard.updateFormData}
                        language={language}
                    />
                );
            case 2:
                return (
                    <VitalsEntryForm
                        data={wizard.formData}
                        updateData={wizard.updateFormData}
                        language={language}
                    />
                );
            case 3:
                return (
                    <LifestyleSurveyForm
                        data={wizard.formData}
                        updateData={wizard.updateFormData}
                        language={language}
                    />
                );
            case 4:
                return (
                    <LabResultsUploadForm
                        data={wizard.formData}
                        updateData={wizard.updateFormData}
                        language={language}
                        patientName={wizard.formData.full_name}
                        onNameMismatch={(extracted: string) =>
                            wizard.checkLabReportName(extracted, language)
                        }
                    />
                );
            case 5:
                return <RiskAssessmentReview data={wizard.formData} language={language} />;
            default:
                return null;
        }
    };

    const fieldErrorMessages = Object.entries(wizard.fieldErrors);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto space-y-6"
        >
            <div className="flex items-center gap-4 mb-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="text-slate-300 hover:text-white hover:bg-white/10"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-xl md:text-2xl font-bold text-white">{t.wizard_title}</h1>
                    <p className="text-sm md:text-base text-slate-400">{t.wizard_subtitle}</p>
                </div>
                <div className="flex items-center bg-slate-800/50 rounded-xl p-1 border border-white/5">
                    <Button
                        variant={language === "en" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setLanguage("en")}
                        className={`text-xs h-8 px-3 rounded-lg transition-all ${
                            language === "en"
                                ? "bg-teal-500 text-white shadow-lg"
                                : "text-slate-400"
                        }`}
                    >
                        EN
                    </Button>
                    <Button
                        variant={language === "hi" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setLanguage("hi")}
                        className={`text-xs h-8 px-3 rounded-lg transition-all ${
                            language === "hi"
                                ? "bg-teal-500 text-white shadow-lg"
                                : "text-slate-400"
                        }`}
                    >
                        हिन्दी
                    </Button>
                </div>
            </div>

            <div className="glass-card rounded-2xl shadow-xl overflow-hidden border border-white/5">
                <div className="p-6">
                    <WizardSteppers steps={wizardSteps} currentStep={wizard.currentStep} />
                </div>
                <div className="p-6 min-h-[400px]">
                    <NameVerificationBanner
                        notice={wizard.nameNotice}
                        language={language}
                        onDismiss={wizard.dismissNameNotice}
                    />

                    {fieldErrorMessages.length > 0 && (
                        <div
                            role="alert"
                            className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm"
                        >
                            <p className="font-semibold text-red-300 mb-2">
                                {language === "en"
                                    ? "Please correct these entries"
                                    : "कृपया इन प्रविष्टियों को ठीक करें"}
                            </p>
                            <ul className="list-disc list-inside text-red-400/80 space-y-1">
                                {fieldErrorMessages.map(([field, message]) => (
                                    <li key={field}>{message}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {renderStep()}
                </div>
                <div className="p-6 border-t border-white/5 flex justify-between bg-black/20">
                    {!wizard.isSubmitting && !wizard.isSuccess && !wizard.error && (
                        <>
                            <Button
                                variant="ghost"
                                onClick={wizard.prevStep}
                                disabled={wizard.currentStep === 0}
                                className="text-slate-300 hover:text-white hover:bg-white/10"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleAdvance}
                                className="min-w-[120px] bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white border-0 shadow-lg shadow-teal-500/25 transition-all duration-300"
                            >
                                {wizard.isLastStep ? (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {t.finish}
                                    </>
                                ) : (
                                    <>
                                        {t.next} <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <AIAnalysisModal
                isOpen={wizard.isAiModalOpen}
                onClose={() => {
                    wizard.closeAiModal();
                    navigate("/dashboard");
                }}
                analysis={wizard.aiAnalysis}
                patientName={wizard.formData.full_name}
                language={language}
            />
        </motion.div>
    );
}
