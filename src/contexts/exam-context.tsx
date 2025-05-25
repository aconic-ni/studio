
"use client";

import type { InitialInfoFormData, ExamData } from "@/lib/schemas/exam-schemas";
import { useRouter } from "next/navigation";
import React, { createContext, useState, useContext, ReactNode, useCallback } from "react";

export enum ExamStep {
  INITIAL_INFO = "INITIAL_INFO",
  PRODUCT_LIST = "PRODUCT_LIST",
  PREVIEW = "PREVIEW",
  // Add more steps as needed
}

interface ExamContextType {
  examData: Partial<ExamData>;
  setExamData: (data: Partial<ExamData>) => void;
  currentStep: ExamStep;
  setCurrentStep: (step: ExamStep) => void;
  resetExam: () => void;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

const initialExamData: Partial<ExamData> = {};

export const ExamProvider = ({ children }: { children: ReactNode }) => {
  const [examData, setExamDataState] = useState<Partial<ExamData>>(initialExamData);
  const [currentStep, setCurrentStepState] = useState<ExamStep>(ExamStep.INITIAL_INFO);
  const router = useRouter();

  const setExamData = useCallback((data: Partial<ExamData>) => {
    setExamDataState((prevData) => ({ ...prevData, ...data }));
  }, []);

  const setCurrentStep = useCallback((step: ExamStep) => {
    setCurrentStepState(step);
    // Handle navigation based on step
    if (step === ExamStep.PRODUCT_LIST) {
      router.push('/'); // Navigate to dashboard/product list
    } else if (step === ExamStep.PREVIEW) {
      router.push('/preview'); // Navigate to preview page
    } else if (step === ExamStep.INITIAL_INFO) {
      router.push('/new-exam');
    }
    // Add other navigation logic as needed
  }, [router]);

  const resetExam = useCallback(() => {
    setExamDataState(initialExamData);
    setCurrentStepState(ExamStep.INITIAL_INFO);
    router.push('/new-exam');
  }, [router]);

  return (
    <ExamContext.Provider value={{ examData, setExamData, currentStep, setCurrentStep, resetExam }}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExamContext = () => {
  const context = useContext(ExamContext);
  if (context === undefined) {
    throw new Error("useExamContext must be used within an ExamProvider");
  }
  return context;
};
