
"use client";
import { useEffect, useState } from 'react'; // Added useState
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAppContext, ExamStep } from '@/context/AppContext';
import { AppShell } from '@/components/layout/AppShell';
import { InitialInfoForm } from '@/components/examiner/InitialInfoForm';
import { ProductListScreen } from '@/components/examiner/ProductListScreen';
import { PreviewScreen } from '@/components/examiner/PreviewScreen';
import { SuccessModal } from '@/components/examiner/SuccessModal';
import { Loader2 } from 'lucide-react';

export default function ExaminerPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentStep } = useAppContext();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return; 

    if (!authLoading && !user) {
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
      <div className="min-h-screen flex items-center justify-center grid-bg"> {/* Ensure grid-bg for consistency */}
        <Loader2 className="h-12 w-12 animate-spin text-white" /> {/* text-white for grid-bg */}
        <p className="ml-4 text-lg text-white">Cargando aplicación...</p> {/* text-white for grid-bg */}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg"> {/* Ensure grid-bg for consistency */}
        <Loader2 className="h-12 w-12 animate-spin text-white" /> {/* text-white for grid-bg */}
        <p className="text-lg ml-3 text-white">Verificando sesión...</p> {/* text-white for grid-bg */}
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case ExamStep.INITIAL_INFO:
        return <InitialInfoForm />;
      case ExamStep.PRODUCT_LIST:
        return <ProductListScreen />;
      case ExamStep.PREVIEW:
        return <PreviewScreen />;
      case ExamStep.SUCCESS:
        return <> <PreviewScreen /> <SuccessModal /> </>;
      default:
        return <InitialInfoForm />;
    }
  };

  return (
    <AppShell>
      <div className="py-2 md:py-5">
         {renderStepContent()}
      </div>
      {currentStep === ExamStep.SUCCESS && <SuccessModal />}
    </AppShell>
  );
}
