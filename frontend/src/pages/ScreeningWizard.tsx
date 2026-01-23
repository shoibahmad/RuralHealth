import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { WizardSteppers } from "../components/ui/wizard-steppers";
import { PatientDemographicsForm } from "../components/screening/PatientDemographicsForm";
import { VitalsEntryForm } from "../components/screening/VitalsEntryForm";
import { LifestyleSurveyForm } from "../components/screening/LifestyleSurveyForm";
import { LabResultsUploadForm } from "../components/screening/LabResultsUploadForm";



const STEPS = [
    { label: "Patient Identity", description: "Demographics & Location" },
    { label: "Vitals Check", description: "BP, BMI, Heart Rate" },
    { label: "Lifestyle Survey", description: "Habits & History" },
    { label: "Lab Reports", description: "OCR Upload" },
    { label: "Risk Assessment", description: "Final Analysis" }
];

export function ScreeningWizard() {
    const [currentStep, setCurrentStep] = useState(0);
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
    });
    const navigate = useNavigate();
    // const { token } = useAuth(); // for API calls

    const updateFormData = (newData: any) => {
        setFormData(newData);
    };

    const nextStep = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(c => c + 1);
        } else {
            // Submit
        }
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
    };

    // Render Step Content
    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return <PatientDemographicsForm data={formData} updateData={updateFormData} />;
            case 1:
                return <VitalsEntryForm data={formData} updateData={updateFormData} />;
            case 2:
                return <LifestyleSurveyForm data={formData} updateData={updateFormData} />;
            case 3:
                return <LabResultsUploadForm data={formData} updateData={updateFormData} />;
            default:
                return <div className="p-8 text-center text-slate-500">Coming Soon... Step {currentStep + 1}</div>;
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">New Screening</h1>
                    <p className="text-slate-500">Complete the workflow to assess health risk.</p>
                </div>
            </div>

            <Card className="border-none shadow-md">
                <CardHeader>
                    <WizardSteppers steps={STEPS} currentStep={currentStep} />
                </CardHeader>
                <CardContent className="min-h-[400px]">
                    {renderStep()}
                </CardContent>
                <div className="p-6 border-t bg-slate-50 flex justify-between rounded-b-lg">
                    <Button
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 0}
                    >
                        Back
                    </Button>
                    <Button onClick={nextStep} className="min-w-[120px]">
                        {currentStep === STEPS.length - 1 ? (
                            <>
                                <Save className="mr-2 h-4 w-4" /> Finish
                            </>
                        ) : (
                            <>
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    )
}
