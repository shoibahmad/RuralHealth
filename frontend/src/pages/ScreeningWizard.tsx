import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Save, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { firestoreService } from "../services/firestoreService";
import { riskUtils } from "../lib/riskUtils";

import { WizardSteppers } from "../components/ui/wizard-steppers";
import { PatientDemographicsForm } from "../components/screening/PatientDemographicsForm";
import { VitalsEntryForm } from "../components/screening/VitalsEntryForm";
import { LifestyleSurveyForm } from "../components/screening/LifestyleSurveyForm";
import { LabResultsUploadForm } from "../components/screening/LabResultsUploadForm";
import { RiskAssessmentReview } from "../components/screening/RiskAssessmentReview";
import { AIAnalysisModal } from "../components/screening/AIAnalysisModal";
import { motion } from "framer-motion";



const STEPS = [
    { label: "Patient Identity", description: "Demographics & Location" },
    { label: "Vitals Check", description: "BP, BMI, Heart Rate" },
    { label: "Lifestyle Survey", description: "Habits & History" },
    { label: "Lab Reports", description: "OCR Upload" },
    { label: "Risk Assessment", description: "Final Analysis" }
];

import { useToast } from "../context/ToastContext";

export function ScreeningWizard() {
    const { showToast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [formData, setFormData] = useState<any>({
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
    });
    const navigate = useNavigate();
    const { user } = useAuth();
    const isOnline = true; // Force online for UI rendering during migration

    const updateFormData = (newData: any) => {
        setFormData(newData);
    };

    const handleSubmitOnline = async () => {
        try {
            // Step 1: Handle Patient Identity
            let patientId = user?.uid;
            let patientName = formData.full_name;

            // If user is a health worker, they are creating a NEW patient record
            // If user is a patient, they are screening THEMSELVES (use their own UID)
            if (user?.role !== 'patient') {
                const patientData = {
                    full_name: formData.full_name,
                    age: parseInt(formData.age) || 0,
                    gender: formData.gender,
                    village: formData.village,
                    phone: formData.phone || undefined,
                    health_worker_id: user?.uid
                };
                const newPatient = await firestoreService.addPatient(patientData);
                patientId = newPatient.id;
                console.log("New patient created:", newPatient);
            } else {
                console.log("Self-screening for patient:", patientId);
                // Optionally update patient profile in 'users' or 'patients' here if needed
            }

            // Step 2: Calculate Risk (Client-side)
            const riskResult = riskUtils.calculateRisk({
                age: parseInt(formData.age) || 0,
                systolic_bp: parseInt(formData.systolic_bp) || undefined,
                diastolic_bp: parseInt(formData.diastolic_bp) || undefined,
                smoking_status: formData.smoking_status
            });

            // BMI calculation removed as unused variable 'bmi'

            // Step 3: Create screening in Firestore
            const screeningData = {
                patient_id: patientId!,
                patient_name: patientName, // Denormalized
                height_cm: parseFloat(formData.height_cm) || undefined,
                weight_kg: parseFloat(formData.weight_kg) || undefined,
                systolic_bp: parseInt(formData.systolic_bp) || undefined,
                diastolic_bp: parseInt(formData.diastolic_bp) || undefined,
                heart_rate: parseInt(formData.heart_rate) || undefined,
                smoking_status: formData.smoking_status || undefined,
                alcohol_usage: formData.alcohol_usage || undefined,
                physical_activity: formData.physical_activity || undefined,
                glucose_level: parseFloat(formData.glucose_level) || undefined,
                cholesterol_level: parseFloat(formData.cholesterol_level) || undefined,
                risk_score: riskResult.score,
                risk_level: riskResult.level,
                risk_notes: riskResult.notes,
                // ai_insights: insights // Will be updated via backend API
            };

            const screening = await firestoreService.addScreening(screeningData);
            console.log("Screening created:", screening);

            // --- CRITICAL FIXES FOR DISPLAY & AI ---

            // 1. Update Patient Stats (so they show up in Patient List)
            try {
                const currentPatient = await firestoreService.getPatient(patientId!);
                const currentCount = (currentPatient as any)?.screening_count || 0;

                await firestoreService.updatePatient(patientId!, {
                    // @ts-ignore
                    screening_count: currentCount + 1,
                    latest_risk_level: riskResult.level
                });
            } catch (updateErr) {
                console.error("Failed to update patient stats:", updateErr);
            }

            // 2. Trigger Real Gemini AI Analysis via Backend
            let finalInsights = "Analysis queued...";
            try {
                // Prepare data for backend analysis
                const analysisPayload = {
                    ...screeningData,
                    age: parseInt(formData.age) || 0,
                    gender: formData.gender
                };

                const aiResponse = await fetch('/api/ai/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(analysisPayload)
                });

                if (aiResponse.ok) {
                    const aiResult = await aiResponse.json();
                    if (aiResult.success && aiResult.analysis) {
                        const analysis = aiResult.analysis;
                        finalInsights = analysis.formatted_insights || analysis.summary;

                        setAiAnalysis({
                            ...analysis,
                            risk_level: riskResult.level // Ensure client side risk is preserved or use AI's
                        });
                        setIsAiModalOpen(true);

                        // Update the screening in Firestore with real insights
                        if (screening.id) {
                            try {
                                await firestoreService.updateScreening(screening.id, {
                                    ai_insights: analysis
                                });
                            } catch (err) {
                                console.error("Failed to save AI insights to Firestore:", err);
                            }
                        }
                    }
                }
            } catch (aiErr) {
                console.error("AI Analysis failed:", aiErr);
            }

            // Update UI with real analysis
            if (finalInsights !== "Analysis queued...") {
                // If we got real structured data back (depends on how we updated backend)
                // Ideally backend returns full object. For now we might just have formatted text.
                // NOTE: We should check if we can parse it or if backend returns it structurally.
            }

            // Allow time for async updates (a bit hacky but ensures firestore syncs before redirect)
            await new Promise(r => setTimeout(r, 500));

            return true;
        } catch (err: any) {
            throw err;
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            await handleSubmitOnline();

            setIsSuccess(true);
            showToast("Screening submitted successfully", "success");

            // Redirect after showing success
            // Only redirect if modal is NOT open (i.e. if AI failed or user closed it)
            // But we want them to see the modal. So we won't auto-redirect immediately if AI success.
            if (!isAiModalOpen) {
                setTimeout(() => {
                    navigate("/dashboard");
                }, 3000);
            }
        } catch (err: any) {
            console.error("Submission error:", err);
            const msg = err.message || "An error occurred while saving data";
            setError(msg);
            showToast(msg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(c => c + 1);
        } else {
            handleSubmit();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
    };

    // Render Step Content
    const renderStep = () => {
        if (isSuccess) {
            return (
                <div className="flex flex-col items-center justify-center h-full py-12 animate-in fade-in zoom-in duration-500">
                    <div className="h-20 w-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Screening Completed!
                    </h2>
                    <p className="text-slate-400 mb-6">
                        Patient and screening data saved successfully.
                    </p>

                    {aiAnalysis && (
                        <div className="w-full max-w-md glass-card rounded-xl p-6 border border-white/10 mt-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="h-5 w-5 text-teal-400" />
                                <h3 className="font-semibold text-white">AI Analysis Summary</h3>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Risk Level:</span>
                                    <span className={`font-medium ${aiAnalysis.risk_level === 'High' ? 'text-red-400' :
                                        aiAnalysis.risk_level === 'Medium' ? 'text-amber-400' :
                                            'text-green-400'
                                        }`}>{aiAnalysis.risk_level}</span>
                                </div>
                                {aiAnalysis.summary && (
                                    <p className="text-slate-300">{aiAnalysis.summary.substring(0, 200)}...</p>
                                )}
                            </div>
                        </div>
                    )}

                    <p className="text-slate-500 text-sm mt-6">Redirecting to dashboard...</p>
                </div>
            )
        }

        if (isSubmitting) {
            return (
                <div className="flex flex-col items-center justify-center h-full py-12 animate-in fade-in zoom-in duration-500">
                    <div className="h-20 w-20 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mb-6">
                        <Loader2 className="h-10 w-10 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {isOnline ? 'Saving & Analyzing...' : 'Saving Locally...'}
                    </h2>
                    <p className="text-slate-400 mb-8">
                        {isOnline
                            ? 'Gemini AI is analyzing patient vitals and lab reports...'
                            : 'Saving data to your device for offline access...'}
                    </p>

                    <div className="w-full max-w-md h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-teal-500 to-blue-500 animate-progress-indeterminate" />
                    </div>
                </div>
            )
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full py-12">
                    <div className="h-20 w-20 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Error Occurred</h2>
                    <p className="text-red-400 mb-4">{error}</p>
                    <Button onClick={() => setError(null)} variant="outline">
                        Try Again
                    </Button>
                </div>
            )
        }

        switch (currentStep) {
            case 0:
                return <PatientDemographicsForm data={formData} updateData={updateFormData} />;
            case 1:
                return <VitalsEntryForm data={formData} updateData={updateFormData} />;
            case 2:
                return <LifestyleSurveyForm data={formData} updateData={updateFormData} />;
            case 3:
                return <LabResultsUploadForm data={formData} updateData={updateFormData} />;
            case 4:
                return <RiskAssessmentReview data={formData} />;
            default:
                return <div className="p-8 text-center text-slate-500">Coming Soon... Step {currentStep + 1}</div>;
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto space-y-6"
        >
            <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-slate-300 hover:text-white hover:bg-white/10">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-xl md:text-2xl font-bold text-white">New Screening</h1>
                    <p className="text-sm md:text-base text-slate-400">Complete the workflow to assess health risk.</p>
                </div>
                {/* Offline indicator */}
                {/* Offline indicator */}
            </div>

            <div className="glass-card rounded-2xl shadow-xl overflow-hidden border border-white/5">
                <div className="p-6">
                    <WizardSteppers steps={STEPS} currentStep={currentStep} />
                </div>
                <div className="p-6 min-h-[400px]">
                    {renderStep()}
                </div>
                <div className="p-6 border-t border-white/5 flex justify-between bg-black/20">
                    {!isSubmitting && !isSuccess && !error && (
                        <>
                            <Button
                                variant="ghost"
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                className="text-slate-300 hover:text-white hover:bg-white/10"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={nextStep}
                                className="min-w-[120px] bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white border-0 shadow-lg shadow-teal-500/25 transition-all duration-300"
                            >
                                {currentStep === STEPS.length - 1 ? (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {isOnline ? 'Finish' : 'Save Offline'}
                                    </>
                                ) : (
                                    <>
                                        Next <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </div>


            <AIAnalysisModal
                isOpen={isAiModalOpen}
                onClose={() => {
                    setIsAiModalOpen(false);
                    navigate("/dashboard");
                }}
                analysis={aiAnalysis}
                patientName={formData.full_name}
            />
        </motion.div >
    )
}
