
"use client";
import { useEffect, useState } from 'react';
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

  // Effect for handling redirection or actions based on auth state
  useEffect(() => {
    // Wait until the component has mounted on the client and auth loading is complete
    if (!isClient || authLoading) {
      return; // Do nothing until client is ready and auth state is definitive
    }

    // If, after client readiness and auth completion, there's still no user,
    // it means the user is not authenticated, so redirect to login.
    if (!user) {
      router.push('/login');
    }
    // If 'user' is present, this page will render its content based on 'currentStep'.
    // No explicit router.push('/examiner') here as we are already on this page.
  }, [user, authLoading, router, isClient]);

  useEffect(() => {
    if (!isClient) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = ''; // Standard for most browsers to show a confirmation dialog
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isClient]);

  // Render a loader if the component hasn't mounted yet or if auth is still loading
  if (!isClient || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
        <p className="ml-4 text-lg text-white">Cargando aplicación...</p>
      </div>
    );
  }

  // At this point, isClient is true and authLoading is false.
  // If there is no user, it means the useEffect above is (or will be) redirecting.
  // Show a "Verificando sesión..." loader in this transient state.
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
        <p className="text-lg ml-3 text-white">Verificando sesión...</p>
      </div>
    );
  }

  // If user is authenticated, render the content based on the current step from AppContext.
  const renderStepContent = () => {
    switch (currentStep) {
      case ExamStep.INITIAL_INFO:
        return <InitialInfoForm />;
      case ExamStep.PRODUCT_LIST:
        return <ProductListScreen />;
      case ExamStep.PREVIEW:
        return <PreviewScreen />;
      case ExamStep.SUCCESS:
        // When in SUCCESS step, typically you show the success modal.
        // If PreviewScreen should be visible underneath the modal, include it.
        return <> <PreviewScreen /> <SuccessModal /> </>;
      default:
        // Fallback to the initial step if currentStep is somehow invalid.
        return <InitialInfoForm />;
    }
  };

  return (
    <AppShell>
      <div className="py-2 md:py-5">
         {renderStepContent()}
      </div>
      {/* Conditionally render SuccessModal based on currentStep,
          This is slightly redundant if handled within renderStepContent,
          but can be kept if SuccessModal is meant to be a global overlay for this step.
      */}
      {currentStep === ExamStep.SUCCESS && <SuccessModal />}
    </AppShell>
  );
}
