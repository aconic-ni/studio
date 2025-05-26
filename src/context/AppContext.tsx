
"use client";
import type React from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ExamData, SolicitudData, AppUser as AuthAppUser } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';

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
  isAddProductModalOpen: boolean;
  isProductDetailModalOpen: boolean; // Restored
  solicitudToView: SolicitudData | null; // Restored
  setExamData: (data: ExamData) => void;
  addSolicitud: (solicitud: Omit<SolicitudData, 'id'>) => void;
  updateSolicitud: (updatedSolicitud: SolicitudData) => void;
  deleteSolicitud: (solicitudId: string) => void;
  setCurrentStep: (step: ExamStep) => void;
  setEditingSolicitud: (solicitud: SolicitudData | null) => void;
  openAddProductModal: (solicitudToEdit?: SolicitudData | null) => void;
  closeAddProductModal: () => void;
  openProductDetailModal: (solicitud: SolicitudData) => void; // Restored
  closeProductDetailModal: () => void; // Restored
  resetApp: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [examData, setExamDataState] = useState<ExamData | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudData[]>([]);
  const [currentStep, setCurrentStepState] = useState<ExamStep>(ExamStep.INITIAL_INFO);
  const [editingSolicitud, setEditingSolicitudState] = useState<SolicitudData | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isProductDetailModalOpen, setIsProductDetailModalOpen] = useState(false); // Restored
  const [solicitudToView, setSolicitudToView] = useState<SolicitudData | null>(null); // Restored

  const { user: authUser } = useAuth(); 
  const [internalUser, setInternalUser] = useState<AuthAppUser | null>(authUser);

  const resetApp = useCallback(() => {
    setExamDataState(null);
    setSolicitudes([]);
    setCurrentStepState(ExamStep.INITIAL_INFO);
    setEditingSolicitudState(null);
    setIsAddProductModalOpen(false);
    setIsProductDetailModalOpen(false); // Reset restored state
    setSolicitudToView(null); // Reset restored state
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
    setExamDataState(data);
  }, []);

  const addSolicitud = useCallback((solicitudData: Omit<SolicitudData, 'id'>) => {
    const newSolicitud: SolicitudData = { ...solicitudData, id: uuidv4() };
    setSolicitudes((prevSolicitudes) => [...prevSolicitudes, newSolicitud]);
  }, []);

  const updateSolicitud = useCallback((updatedSolicitud: SolicitudData) => {
    setSolicitudes((prevSolicitudes) =>
      prevSolicitudes.map((s) => (s.id === updatedSolicitud.id ? updatedSolicitud : s))
    );
    setEditingSolicitudState(null); 
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
    setTimeout(() => setEditingSolicitudState(null), 100); 
  }, []);

  // Restored functions for ProductDetailModal
  const openProductDetailModal = useCallback((solicitud: SolicitudData) => {
    setSolicitudToView(solicitud);
    setIsProductDetailModalOpen(true);
  }, []);

  const closeProductDetailModal = useCallback(() => {
    setIsProductDetailModalOpen(false);
    // It's good practice to clear solicitudToView after a delay to avoid content flicker during closing animation
    setTimeout(() => setSolicitudToView(null), 300);
  }, []);

  return (
    <AppContext.Provider
      value={{
        examData,
        solicitudes,
        currentStep,
        editingSolicitud,
        isAddProductModalOpen,
        isProductDetailModalOpen, // Restored
        solicitudToView, // Restored
        setExamData,
        addSolicitud,
        updateSolicitud,
        deleteSolicitud,
        setCurrentStep,
        setEditingSolicitud,
        openAddProductModal,
        closeAddProductModal,
        openProductDetailModal, // Restored
        closeProductDetailModal, // Restored
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
