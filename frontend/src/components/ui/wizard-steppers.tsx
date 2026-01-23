import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface WizardSteppersProps {
    steps: { label: string; description: string }[];
    currentStep: number;
}

export function WizardSteppers({ steps, currentStep }: WizardSteppersProps) {
    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between relative">
                {/* Progress Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10" />
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 transition-all duration-500 ease-in-out"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <div key={index} className="flex flex-col items-center bg-white px-2">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                    isCompleted ? "bg-primary border-primary text-white" :
                                        isCurrent ? "bg-white border-primary text-primary" : "bg-white border-slate-300 text-slate-300"
                                )}
                            >
                                {isCompleted ? <Check className="h-6 w-6" /> : <span>{index + 1}</span>}
                            </div>
                            <div className="absolute top-12 w-32 text-center mt-2">
                                <p className={cn("text-sm font-semibold", isCurrent ? "text-slate-900" : "text-slate-500")}>
                                    {step.label}
                                </p>
                                <p className="text-xs text-slate-400 hidden sm:block">{step.description}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="h-12" /> {/* Spacer for absolute text */}
        </div>
    )
}
