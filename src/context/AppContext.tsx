
"use client";
import type React from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ExamData, SolicitudData, AppUser as AuthAppUser } from '@/types';
// Removed uuidv4 import as ID is now custom generated
import { useAuth } from './AuthContext';
import { format } from 'date-fns'; // For formatting date in ID

export enum ExamStep {
  INITIAL_INFO = 1,
  PRODUCT_LIST = 2,
  PREVIEW = 3,
  SUCCESS = 4,
}

interface AppContextType {
  examData: ExamData | null;
  solicitudes: SolicitudData[];
  currentStep: ExamStep;
  editingSolicitud: SolicitudData | null;
  // Removed product detail modal states as per previous change
  isAddProductModalOpen: boolean;
  setExamData: (data: ExamData) => void;
  addSolicitud: (solicitudData: Omit<SolicitudData, 'id'>) => void; // ID will be generated internally
  updateSolicitud: (updatedSolicitud: SolicitudData) => void;
  deleteSolicitud: (solicitudId: string) => void;
  setCurrentStep: (step: ExamStep) => void;
  setEditingSolicitud: (solicitud: SolicitudData | null) => void;
  openAddProductModal: (solicitudToEdit?: SolicitudData | null) => void;
  closeAddProductModal: () => void;
  resetApp: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [examData, setExamDataState] = useState<ExamData | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudData[]>([]);
  const [currentStep, setCurrentStepState] = useState<ExamStep>(ExamStep.INITIAL_INFO);
  const [editingSolicitud, setEditingSolicitudState] = useState<SolicitudData | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  const { user: authUser } = useAuth();
  const [internalUser, setInternalUser] = useState<AuthAppUser | null>(authUser);

  const resetApp = useCallback(() => {
    setExamDataState(null);
    setSolicitudes([]);
    setCurrentStepState(ExamStep.INITIAL_INFO);
    setEditingSolicitudState(null);
    setIsAddProductModalOpen(false);
  }, []);


  useEffect(() => {
    const authUserChanged = authUser?.uid !== internalUser?.uid ||
                           (authUser && !internalUser) ||
                           (!authUser && internalUser);

    if (authUserChanged) {
      resetApp();
      setInternalUser(authUser);
    }
  }, [authUser, internalUser, resetApp]);


  const setExamData = useCallback((data: ExamData) => {
    setExamDataState(prevExamData => ({ ...prevExamData, ...data }));
  }, []);

  const addSolicitud = useCallback((solicitudData: Omit<SolicitudData, 'id'>) => {
    if (!examData || !examData.ne) {
      console.error("NE from examData is missing. Cannot generate Solicitud ID.");
      // Consider showing a user-facing error toast here
      return;
    }
    const now = new Date();
    const datePart = format(now, 'yyyyMMdd');
    const timePart = format(now, 'HHmmss');
    const newId = `${examData.ne}-${datePart}-${timePart}`;

    const newSolicitud: SolicitudData = { ...solicitudData, id: newId };
    setSolicitudes((prevSolicitudes) => [...prevSolicitudes, newSolicitud]);
  }, [examData]); // examData is a dependency

  const updateSolicitud = useCallback((updatedSolicitud: SolicitudData) => {
    setSolicitudes((prevSolicitudes) =>
      prevSolicitudes.map((s) => (s.id === updatedSolicitud.id ? updatedSolicitud : s))
    );
    setEditingSolicitudState(null); // Clear editing state after update
  }, []);

  const deleteSolicitud = useCallback((solicitudId: string) => {
    setSolicitudes((prevSolicitudes) => prevSolicitudes.filter((s) => s.id !== solicitudId));
  }, []);

  const setCurrentStep = useCallback((step: ExamStep) => {
    setCurrentStepState(step);
  }, []);

  const setEditingSolicitud = useCallback((solicitud: SolicitudData | null) => {
    setEditingSolicitudState(solicitud);
  }, []);

  const openAddProductModal = useCallback((solicitudToEdit: SolicitudData | null = null) => {
    setEditingSolicitudState(solicitudToEdit);
    setIsAddProductModalOpen(true);
  }, []);

  const closeAddProductModal = useCallback(() => {
    setIsAddProductModalOpen(false);
    // Delay clearing editingSolicitud to allow modal to close gracefully if needed for animations
    setTimeout(() => setEditingSolicitudState(null), 150);
  }, []);


  return (
    <AppContext.Provider
      value={{
        examData,
        solicitudes,
        currentStep,
        editingSolicitud,
        isAddProductModalOpen,
        setExamData,
        addSolicitud,
        updateSolicitud,
        deleteSolicitud,
        setCurrentStep,
        setEditingSolicitud,
        openAddProductModal,
        closeAddProductModal,
        resetApp,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
