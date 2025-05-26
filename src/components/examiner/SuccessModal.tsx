
"use client";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAppContext, ExamStep } from '@/context/AppContext';
import { CheckCircle, FilePlus, RotateCcw, Save } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { SolicitudRecord } from '@/types'; // Import the new type

export function SuccessModal() {
  const { currentStep, setCurrentStep, resetApp, examData, solicitudes } = useAppContext();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSaveToDatabase = async () => {
    if (!examData || !user || !user.email || !solicitudes || solicitudes.length === 0) {
      toast({
        title: "Error al guardar",
        description: "Faltan datos del examen, información del usuario o no hay solicitudes para guardar.",
        variant: "destructive",
      });
      return;
    }

    if (!examData.ne) {
      toast({
        title: "Error al guardar",
        description: "El número NE del examen es requerido para guardar.",
        variant: "destructive",
      });
      return;
    }
    if (!(examData.date instanceof Date) || isNaN(examData.date.getTime())) {
        toast({
            title: "Error en Fecha de Examen",
            description: "La fecha del examen no es válida.",
            variant: "destructive",
        });
        return;
    }


    let allSavedSuccessfully = true;
    try {
      for (const solicitud of solicitudes) {
        if (!solicitud.id) {
          console.error("Solicitud sin ID encontrada, omitiendo:", solicitud);
          allSavedSuccessfully = false; // Mark as not all saved if one is missing ID
          continue; // Skip this solicitud
        }

        const montoAsNumber = typeof solicitud.monto === 'string'
          ? parseFloat(solicitud.monto.replace(/,/g, ''))
          : solicitud.monto;

        if (montoAsNumber === undefined || isNaN(montoAsNumber)) {
            console.error("Monto inválido o no definido para solicitud:", solicitud.id);
            // Decide if you want to skip or save with monto as undefined/null
            // For now, let's skip if critical, or save with it undefined
        }

        const docData: SolicitudRecord = {
          // ExamData fields (prefixed to avoid conflicts if SolicitudData had same names)
          examNe: examData.ne,
          examReference: examData.reference,
          examManager: examData.manager,
          examDate: Timestamp.fromDate(examData.date), // examData.date should be a Date object
          examRecipient: examData.recipient,

          // SolicitudData fields
          solicitudId: solicitud.id, // This is the Firestore document ID
          monto: montoAsNumber, // Ensure it's a number
          montoMoneda: solicitud.montoMoneda,
          cantidadEnLetras: solicitud.cantidadEnLetras,
          consignatario: solicitud.consignatario,
          declaracionNumero: solicitud.declaracionNumero,
          unidadRecaudadora: solicitud.unidadRecaudadora,
          codigo1: solicitud.codigo1,
          codigo2: solicitud.codigo2,
          banco: solicitud.banco,
          bancoOtros: solicitud.bancoOtros,
          numeroCuenta: solicitud.numeroCuenta,
          monedaCuenta: solicitud.monedaCuenta,
          monedaCuentaOtros: solicitud.monedaCuentaOtros,
          elaborarChequeA: solicitud.elaborarChequeA,
          elaborarTransferenciaA: solicitud.elaborarTransferenciaA,
          impuestosPagadosCliente: solicitud.impuestosPagadosCliente,
          impuestosPagadosRC: solicitud.impuestosPagadosRC,
          impuestosPagadosTB: solicitud.impuestosPagadosTB,
          impuestosPagadosCheque: solicitud.impuestosPagadosCheque,
          impuestosPendientesCliente: solicitud.impuestosPendientesCliente,
          documentosAdjuntos: solicitud.documentosAdjuntos,
          constanciasNoRetencion: solicitud.constanciasNoRetencion,
          constanciasNoRetencion1: solicitud.constanciasNoRetencion1,
          constanciasNoRetencion2: solicitud.constanciasNoRetencion2,
          correo: solicitud.correo,
          observation: solicitud.observation,

          // Metadata
          savedAt: Timestamp.fromDate(new Date()),
          savedBy: user.email,
        };

        const solicitudDocRef = doc(db, "Solicitudes de Cheque", solicitud.id);
        await setDoc(solicitudDocRef, docData);
      }

      if (allSavedSuccessfully) {
        toast({
          title: "Solicitudes Guardadas",
          description: `Todas las solicitudes (${solicitudes.length}) han sido guardadas en la base de datos.`,
        });
      } else {
        toast({
          title: "Guardado Parcial",
          description: "Algunas solicitudes no pudieron ser guardadas (ej. faltaba ID). Revise la consola.",
          variant: "default" // Or "warning" if you have such variant
        });
      }

    } catch (error) {
      console.error("Error saving solicituds to Firestore: ", error);
      allSavedSuccessfully = false;
      toast({
        title: "Error al Guardar",
        description: "No se pudieron guardar una o más solicitudes en la base de datos.",
        variant: "destructive",
      });
    }
  };


  if (currentStep !== ExamStep.SUCCESS) {
    return null;
  }

  return (
    <Dialog open={currentStep === ExamStep.SUCCESS} onOpenChange={() => { /* Controlled by AppContext */ }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <DialogTitle className="text-xl font-semibold text-foreground">¡Operación Exitosa!</DialogTitle>
        </DialogHeader>
        <DialogDescription asChild>
           <div className="text-center text-muted-foreground space-y-3">
              <div>La solicitud de cheque ha sido registrada correctamente.</div>
              {examData?.manager && <div>Gracias por tu desempeño, {examData.manager}.</div>}
              
              {/* Commented out SharePoint Link 
              <div className="text-sm mt-4 mb-2"> 
                 Puedes añadir imágenes/soportes del predio/solicitud (enlace a configurar).
                 {/* <Link
                  href="YOUR_SHAREPOINT_LINK_HERE" // Replace with actual link
                  target="_blank"
                  className="text-primary underline hover:text-primary/80"
                >
                  aquí
                </Link>  * /}
              </div>
              */}
           </div>
        </DialogDescription>
        
        <div className="mt-6 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:gap-3 sm:justify-center items-center">
          <Button
            onClick={handleSaveToDatabase}
            variant="destructive"
            size="icon"
            aria-label="Guardar en Base de Datos"
          >
            <Save className="h-5 w-5 text-destructive-foreground" />
          </Button>
          <Button onClick={() => setCurrentStep(ExamStep.PREVIEW)} variant="outline" size="default" className="w-full sm:w-auto">
             <RotateCcw className="mr-2 h-4 w-4" /> Revisar Solicitud      
          </Button>
          <Button onClick={() => resetApp()} size="default" className="btn-primary w-full sm:w-auto">
            <FilePlus className="mr-2 h-4 w-4" /> Empezar Nuevo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
