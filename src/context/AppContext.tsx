
"use client";
import type React from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ExamData, SolicitudData, AppUser as AuthAppUser } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';

export enum ExamStep {
  INITIAL_INFO = 1,
  PRODUCT_LIST = 2, // This step now manages a list of SolicitudData
  PREVIEW = 3,
  SUCCESS = 4,
}

interface AppContextType {
  examData: ExamData | null;
  solicitudes: SolicitudData[]; // Renamed from products
  currentStep: ExamStep;
  editingSolicitud: SolicitudData | null; // Renamed from editingProduct
  isAddProductModalOpen: boolean; // Modal name kept generic, as it's for adding items
  isProductDetailModalOpen: boolean; // Modal name kept generic
  solicitudToView: SolicitudData | null; // Renamed from productToView
  setExamData: (data: ExamData) => void;
  addSolicitud: (solicitud: Omit<SolicitudData, 'id'>) => void; // Renamed from addProduct
  updateSolicitud: (updatedSolicitud: SolicitudData) => void; // Renamed from updateProduct
  deleteSolicitud: (solicitudId: string) => void; // Renamed from deleteProduct
  setCurrentStep: (step: ExamStep) => void;
  setEditingSolicitud: (solicitud: SolicitudData | null) => void; // Renamed from setEditingProduct
  openAddProductModal: (solicitudToEdit?: SolicitudData | null) => void; // Parameter renamed
  closeAddProductModal: () => void;
  openProductDetailModal: (solicitud: SolicitudData) => void; // Parameter renamed
  closeProductDetailModal: () => void;
  resetApp: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [examData, setExamDataState] = useState<ExamData | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudData[]>([]); // Renamed from products
  const [currentStep, setCurrentStepState] = useState<ExamStep>(ExamStep.INITIAL_INFO);
  const [editingSolicitud, setEditingSolicitudState] = useState<SolicitudData | null>(null); // Renamed
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isProductDetailModalOpen, setIsProductDetailModalOpen] = useState(false);
  const [solicitudToView, setSolicitudToView] = useState<SolicitudData | null>(null); // Renamed

  const { user: authUser } = useAuth(); 
  const [internalUser, setInternalUser] = useState<AuthAppUser | null>(authUser);

  const { user } = useAuth(); // For pre-filling email

  const resetApp = useCallback(() => {
    setExamDataState(null);
    setSolicitudes([]); // Use renamed state setter
    setCurrentStepState(ExamStep.INITIAL_INFO);
    setEditingSolicitudState(null); // Use renamed state setter
    setIsAddProductModalOpen(false);
    setIsProductDetailModalOpen(false);
    setSolicitudToView(null); // Use renamed state setter
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
    setEditingSolicitudState(solicitudToEdit); // Use renamed state setter
    setIsAddProductModalOpen(true);
  }, []);

  const closeAddProductModal = useCallback(() => {
    setIsAddProductModalOpen(false);
    setTimeout(() => setEditingSolicitudState(null), 100); // Use renamed state setter
  }, []);

  const openProductDetailModal = useCallback((solicitud: SolicitudData) => {
    setSolicitudToView(solicitud); // Use renamed state setter
    setIsProductDetailModalOpen(true);
  }, []);

  const closeProductDetailModal = useCallback(() => {
    setIsProductDetailModalOpen(false);
    setSolicitudToView(null); // Use renamed state setter
  }, []);

  return (
    <AppContext.Provider
      value={{
        examData,
        solicitudes, // Use renamed state
        currentStep,
        editingSolicitud, // Use renamed state
        isAddProductModalOpen,
        isProductDetailModalOpen,
        solicitudToView, // Use renamed state
        setExamData,
        addSolicitud, // Use renamed function
        updateSolicitud, // Use renamed function
        deleteSolicitud, // Use renamed function
        setCurrentStep,
        setEditingSolicitud, // Use renamed function
        openAddProductModal,
        closeAddProductModal,
        openProductDetailModal,
        closeProductDetailModal,
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
