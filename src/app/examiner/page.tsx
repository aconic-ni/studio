
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAppContext, SolicitudStep } from '@/context/AppContext'; // Renamed SolicitudStep
import { AppShell } from '@/components/layout/AppShell';
import { InitialDataForm } from '@/components/examiner/InitialInfoForm'; // Renamed component
import { ProductListScreen } from '@/components/examiner/ProductListScreen';
import { PreviewScreen } from '@/components/examiner/PreviewScreen';
import { SuccessModal } from '@/components/examiner/SuccessModal';
import { Loader2 } from 'lucide-react';

// Renamed component function for internal consistency, though file route remains /examiner
export default function SolicitudPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentStep } = useAppContext();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || authLoading) {
      return;
    }

    if (!user) {
      router.push('/login');
    }
  }, [user, authLoading, router, isClient]);

  useEffect(() => {
    if (!isClient) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = ''; 
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isClient]);

  if (!isClient || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
        <p className="ml-4 text-lg text-white">Cargando aplicación...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
        <p className="text-lg ml-3 text-white">Verificando sesión...</p>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case SolicitudStep.INITIAL_DATA: // Renamed step
        return <InitialDataForm />; // Renamed component
      case SolicitudStep.PRODUCT_LIST:
        return <ProductListScreen />;
      case SolicitudStep.PREVIEW:
        return <PreviewScreen />;
      case SolicitudStep.SUCCESS:
        return <> <PreviewScreen /> <SuccessModal /> </>;
      default:
        return <InitialDataForm />; // Renamed component
    }
  };

  return (
    <AppShell>
      <div className="py-2 md:py-5">
         {renderStepContent()}
      </div>
      {currentStep === SolicitudStep.SUCCESS && <SuccessModal />}
    </AppShell>
  );
}
