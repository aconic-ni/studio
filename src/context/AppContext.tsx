
"use client";
import type React from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { InitialDataContext, SolicitudData, AppUser as AuthAppUser } from '@/types';
import { useAuth } from './AuthContext';
import { format } from 'date-fns';

export enum SolicitudStep { // Renamed from ExamStep
  INITIAL_DATA = 1, // Renamed from INITIAL_INFO
  PRODUCT_LIST = 2, // Conceptually, this is now SolicitudList
  PREVIEW = 3,
  SUCCESS = 4,
}

interface AppContextType {
  initialContextData: InitialDataContext | null; // Renamed from examData
  solicitudes: SolicitudData[];
  currentStep: SolicitudStep; // Renamed from ExamStep
  editingSolicitud: SolicitudData | null;
  isAddProductModalOpen: boolean;
  setInitialContextData: (data: InitialDataContext) => void; // Renamed from setExamData
  addSolicitud: (solicitudData: Omit<SolicitudData, 'id'>) => void;
  updateSolicitud: (updatedSolicitud: SolicitudData) => void;
  deleteSolicitud: (solicitudId: string) => void;
  setCurrentStep: (step: SolicitudStep) => void; // Renamed from ExamStep
  setEditingSolicitud: (solicitud: SolicitudData | null) => void;
  openAddProductModal: (solicitudToEdit?: SolicitudData | null) => void;
  closeAddProductModal: () => void;
  resetApp: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [initialContextData, setInitialContextDataState] = useState<InitialDataContext | null>(null); // Renamed
  const [solicitudes, setSolicitudes] = useState<SolicitudData[]>([]);
  const [currentStep, setCurrentStepState] = useState<SolicitudStep>(SolicitudStep.INITIAL_DATA); // Renamed
  const [editingSolicitud, setEditingSolicitudState] = useState<SolicitudData | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  const { user: authUser } = useAuth();
  const [internalUser, setInternalUser] = useState<AuthAppUser | null>(authUser);

  const resetApp = useCallback(() => {
    setInitialContextDataState(null); // Renamed
    setSolicitudes([]);
    setCurrentStepState(SolicitudStep.INITIAL_DATA); // Renamed
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


  const setInitialContextData = useCallback((data: InitialDataContext) => { // Renamed
    setInitialContextDataState(prevData => ({ ...prevData, ...data }));
  }, []);

  const addSolicitud = useCallback((solicitudData: Omit<SolicitudData, 'id'>) => {
    if (!initialContextData || !initialContextData.ne) { // Renamed
      console.error("NE from initialContextData is missing. Cannot generate Solicitud ID.");
      return;
    }
    const now = new Date();
    const datePart = format(now, 'yyyyMMdd');
    const timePart = format(now, 'HHmmss');
    const newId = `${initialContextData.ne}-${datePart}-${timePart}`; // Renamed

    const newSolicitud: SolicitudData = { ...solicitudData, id: newId };
    setSolicitudes((prevSolicitudes) => [...prevSolicitudes, newSolicitud]);
  }, [initialContextData]); // Renamed

  const updateSolicitud = useCallback((updatedSolicitud: SolicitudData) => {
    setSolicitudes((prevSolicitudes) =>
      prevSolicitudes.map((s) => (s.id === updatedSolicitud.id ? updatedSolicitud : s))
    );
    setEditingSolicitudState(null);
  }, []);

  const deleteSolicitud = useCallback((solicitudId: string) => {
    setSolicitudes((prevSolicitudes) => prevSolicitudes.filter((s) => s.id !== solicitudId));
  }, []);

  const setCurrentStep = useCallback((step: SolicitudStep) => { // Renamed
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
    setTimeout(() => setEditingSolicitudState(null), 150);
  }, []);


  return (
    <AppContext.Provider
      value={{
        initialContextData, // Renamed
        solicitudes,
        currentStep,
        editingSolicitud,
        isAddProductModalOpen,
        setInitialContextData, // Renamed
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
