
"use client";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAppContext, SolicitudStep } from '@/context/AppContext'; // Renamed SolicitudStep
import { CheckCircle, FilePlus, RotateCcw, Save } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { SolicitudRecord, InitialDataContext } from '@/types'; // Added InitialDataContext

export function SuccessModal() {
  const { currentStep, setCurrentStep, resetApp, initialContextData, solicitudes } = useAppContext(); // Renamed examData
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSaveToDatabase = async () => {
    if (!initialContextData || !user || !user.email || !solicitudes || solicitudes.length === 0) { // Renamed examData
      toast({
        title: "Error al guardar",
        description: "Faltan datos iniciales, información del usuario o no hay solicitudes para guardar.",
        variant: "destructive",
      });
      return;
    }

    if (!initialContextData.ne) { // Renamed examData
      toast({
        title: "Error al guardar",
        description: "El número NE es requerido para guardar.",
        variant: "destructive",
      });
      return;
    }
    if (!(initialContextData.date instanceof Date) || isNaN(initialContextData.date.getTime())) { // Renamed examData
        toast({
            title: "Error en Fecha de Solicitud",
            description: "La fecha de la solicitud no es válida.",
            variant: "destructive",
        });
        return;
    }


    let allSavedSuccessfully = true;
    try {
      for (const solicitud of solicitudes) {
        if (!solicitud.id) {
          console.error("Solicitud sin ID encontrada, omitiendo:", solicitud);
          allSavedSuccessfully = false;
          continue;
        }

        const montoAsNumber = typeof solicitud.monto === 'string'
          ? parseFloat(solicitud.monto.replace(/,/g, ''))
          : solicitud.monto;

        if (montoAsNumber === undefined || isNaN(montoAsNumber)) {
            console.error("Monto inválido o no definido para solicitud:", solicitud.id);
        }

        const docData: SolicitudRecord = {
          examNe: initialContextData.ne, // Field name in DB remains examNe
          examReference: initialContextData.reference || null,
          examManager: initialContextData.manager,
          examDate: Timestamp.fromDate(initialContextData.date),
          examRecipient: initialContextData.recipient,

          solicitudId: solicitud.id,
          monto: montoAsNumber ?? null,
          montoMoneda: solicitud.montoMoneda || null,
          cantidadEnLetras: solicitud.cantidadEnLetras || null,
          consignatario: solicitud.consignatario || null,
          declaracionNumero: solicitud.declaracionNumero || null,
          unidadRecaudadora: solicitud.unidadRecaudadora || null,
          codigo1: solicitud.codigo1 || null,
          codigo2: solicitud.codigo2 || null,
          banco: solicitud.banco || null,
          bancoOtros: solicitud.bancoOtros || null,
          numeroCuenta: solicitud.numeroCuenta || null,
          monedaCuenta: solicitud.monedaCuenta || null,
          monedaCuentaOtros: solicitud.monedaCuentaOtros || null,
          elaborarChequeA: solicitud.elaborarChequeA || null,
          elaborarTransferenciaA: solicitud.elaborarTransferenciaA || null,

          impuestosPagadosCliente: solicitud.impuestosPagadosCliente ?? false,
          impuestosPagadosRC: solicitud.impuestosPagadosRC || null,
          impuestosPagadosTB: solicitud.impuestosPagadosTB || null,
          impuestosPagadosCheque: solicitud.impuestosPagadosCheque || null,
          impuestosPendientesCliente: solicitud.impuestosPendientesCliente ?? false,
          documentosAdjuntos: solicitud.documentosAdjuntos ?? false,
          constanciasNoRetencion: solicitud.constanciasNoRetencion ?? false,
          constanciasNoRetencion1: solicitud.constanciasNoRetencion1 ?? false,
          constanciasNoRetencion2: solicitud.constanciasNoRetencion2 ?? false,

          correo: solicitud.correo || null,
          observation: solicitud.observation || null,

          savedAt: Timestamp.fromDate(new Date()),
          savedBy: user.email,
        };

        const solicitudDocRef = doc(db, "SolicitudCheques", solicitud.id);
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
          variant: "default"
        });
      }

    } catch (error: any) {
      console.error("Error saving solicituds to Firestore: ", error);
      allSavedSuccessfully = false;
      toast({
        title: "Error al Guardar",
        description: `No se pudieron guardar una o más solicitudes. Error: ${error.message}`,
        variant: "destructive",
      });
    }
  };


  if (currentStep !== SolicitudStep.SUCCESS) { // Renamed Step
    return null;
  }

  return (
    <Dialog open={currentStep === SolicitudStep.SUCCESS} onOpenChange={() => { /* Controlled by AppContext */ }}> {/* Renamed Step */}
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <DialogTitle className="text-xl font-semibold text-foreground">¡Operación Exitosa!</DialogTitle>
        </DialogHeader>
        <DialogDescription asChild>
           <div className="text-center text-muted-foreground space-y-3">
              <div>La solicitud de cheque ha sido registrada correctamente.</div>
              {initialContextData?.manager && <div>Gracias por tu desempeño, {initialContextData.manager}.</div>} {/* Renamed examData */}
              {/*
              <div className="text-sm mt-4 mb-2">
                 Puedes añadir imágenes/soportes del predio/solicitud (enlace a configurar).
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
          <Button onClick={() => setCurrentStep(SolicitudStep.PREVIEW)} variant="outline" size="default" className="w-full sm:w-auto"> {/* Renamed Step */}
             <RotateCcw className="mr-2 h-4 w-4" /> Revisar Solicitud        
          </Button>
          <Button onClick={() => resetApp()} className="btn-primary w-full sm:w-auto" size="default">
            <FilePlus className="mr-2 h-4 w-4" /> Empezar Nuevo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
