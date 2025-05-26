
"use client";
import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search, Download, Banknote, User, FileText, Landmark, Hash, Building, Code, MessageSquare, Mail, CalendarDays, Info, Send } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import type { SolicitudRecord } from '@/types'; // Use SolicitudRecord
import { downloadExcelFile } from '@/lib/fileExporter';
import { CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const FetchedDetailItem: React.FC<{ label: string; value?: string | number | null | boolean | Date; icon?: React.ElementType }> = ({ label, value, icon: Icon }) => {
  let displayValue: string;
  if (typeof value === 'boolean') {
    displayValue = value ? 'Sí' : 'No';
  } else if (value instanceof Date) {
    displayValue = format(value, "PPP 'a las' HH:mm", { locale: es });
  } else {
    displayValue = String(value ?? 'N/A');
  }

  return (
    <div className="py-1">
      <p className="text-xs font-medium text-muted-foreground flex items-center">
        {Icon && <Icon className="h-3.5 w-3.5 mr-1.5 text-primary/70" />}
        {label}
      </p>
      <p className="text-sm text-foreground">{displayValue}</p>
    </div>
  );
};

const CheckboxDetailItemFetched: React.FC<{ label: string; checked?: boolean; subLabel?: string }> = ({ label, checked, subLabel }) => (
  <div className="flex items-center py-1">
    {checked ? <CheckSquare className="h-4 w-4 text-green-600 mr-2" /> : <Square className="h-4 w-4 text-muted-foreground mr-2" />}
    <span className="text-sm text-foreground">{label}</span>
    {subLabel && <span className="text-xs text-muted-foreground ml-1">{subLabel}</span>}
  </div>
);

const formatCurrencyFetched = (amount?: number | string, currency?: string) => {
    if (amount === undefined || amount === null || amount === '') return 'N/A';
    const num = Number(amount);
    if (isNaN(num)) return String(amount);
    let prefix = '';
    if (currency === 'cordoba') prefix = 'C$';
    else if (currency === 'dolar') prefix = 'US$';
    else if (currency === 'euro') prefix = '€';
    return `${prefix}${num.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getBancoDisplayFetched = (solicitud: SolicitudRecord) => {
    if (solicitud.banco === 'ACCION POR CHEQUE/NO APLICA BANCO') return 'Acción por Cheque / No Aplica Banco';
    if (solicitud.banco === 'Otros') return solicitud.bancoOtros || 'Otros (No especificado)';
    return solicitud.banco;
};
  
const getMonedaCuentaDisplayFetched = (solicitud: SolicitudRecord) => {
    if (solicitud.monedaCuenta === 'Otros') return solicitud.monedaCuentaOtros || 'Otros (No especificado)';
    return solicitud.monedaCuenta;
};

const FetchedExamDisplay: React.FC<{ solicitudes: SolicitudRecord[] }> = ({ solicitudes }) => {
  if (!solicitudes || solicitudes.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No se encontraron solicitudes para este NE.</p>;
  }

  const firstSolicitud = solicitudes[0]; // Common exam data can be taken from the first record

  return (
    <Card className="mt-6 w-full custom-shadow">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-semibold text-foreground">Detalles del Examen: {firstSolicitud.examNe}</CardTitle>
        <CardDescription className="text-muted-foreground">
          Información recuperada de la base de datos "Solicitudes de Cheque".
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-lg font-medium mb-2 text-foreground">Información General del Examen</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 bg-secondary/30 p-4 rounded-md shadow-sm text-sm">
            <FetchedDetailItem label="NE (Tracking NX1)" value={firstSolicitud.examNe} icon={Info}/>
            <FetchedDetailItem label="Referencia" value={firstSolicitud.examReference} icon={FileText}/>
            <FetchedDetailItem label="De (Colaborador)" value={firstSolicitud.examManager} icon={User}/>
            <FetchedDetailItem label="A (Destinatario)" value={firstSolicitud.examRecipient} icon={Send}/>
            <FetchedDetailItem label="Fecha de Examen" value={firstSolicitud.examDate} icon={CalendarDays}/>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium mb-2 text-foreground">Detalles de Guardado (Primer Solicitud)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 bg-secondary/30 p-4 rounded-md shadow-sm text-sm">
             <FetchedDetailItem label="Guardado por (correo)" value={firstSolicitud.savedBy} icon={Mail}/>
             <FetchedDetailItem label="Fecha y Hora de Guardado" value={firstSolicitud.savedAt} icon={CalendarDays}/>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium mb-3 text-foreground">Solicitudes ({solicitudes.length})</h4>
            <div className="space-y-6">
              {solicitudes.map((solicitud, index) => (
                <div key={solicitud.solicitudId || index} className="p-4 border border-border bg-card rounded-lg shadow">
                  <h5 className="text-md font-semibold mb-3 text-primary">Solicitud ID: {solicitud.solicitudId}</h5>
                  <div className="space-y-3 divide-y divide-border/50">
                    <div className="pt-2">
                        <h6 className="text-sm font-medium text-accent mb-1">Detalles del Monto</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                        <FetchedDetailItem label="Monto Solicitado" value={formatCurrencyFetched(solicitud.monto, solicitud.montoMoneda)} icon={Banknote} />
                        <FetchedDetailItem label="Cantidad en Letras" value={solicitud.cantidadEnLetras} icon={FileText} />
                        </div>
                    </div>
                    <div className="pt-2">
                        <h6 className="text-sm font-medium text-accent mb-1">Información Adicional</h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
                        <FetchedDetailItem label="Consignatario" value={solicitud.consignatario} icon={User} />
                        <FetchedDetailItem label="Declaración Número" value={solicitud.declaracionNumero} icon={Hash} />
                        <FetchedDetailItem label="Unidad Recaudadora" value={solicitud.unidadRecaudadora} icon={Building} />
                        <FetchedDetailItem label="Código 1" value={solicitud.codigo1} icon={Code} />
                        <FetchedDetailItem label="Codigo MUR" value={solicitud.codigo2} icon={Code} />
                        </div>
                    </div>
                    <div className="pt-2">
                        <h6 className="text-sm font-medium text-accent mb-1">Cuenta Bancaria</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                        <FetchedDetailItem label="Banco" value={getBancoDisplayFetched(solicitud)} icon={Landmark} />
                        {solicitud.banco !== 'ACCION POR CHEQUE/NO APLICA BANCO' && (
                            <>
                            <FetchedDetailItem label="Número de Cuenta" value={solicitud.numeroCuenta} icon={Hash} />
                            <FetchedDetailItem label="Moneda de la Cuenta" value={getMonedaCuentaDisplayFetched(solicitud)} icon={Banknote} />
                            </>
                        )}
                        </div>
                    </div>
                    <div className="pt-2">
                        <h6 className="text-sm font-medium text-accent mb-1">Beneficiario del Pago</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                        <FetchedDetailItem label="Elaborar Cheque A" value={solicitud.elaborarChequeA} icon={User} />
                        <FetchedDetailItem label="Elaborar Transferencia A" value={solicitud.elaborarTransferenciaA} icon={User} />
                        </div>
                    </div>
                    <div className="pt-2">
                        <h6 className="text-sm font-medium text-accent mb-1">Documentación y Estados</h6>
                        <div className="space-y-1">
                            <CheckboxDetailItemFetched label="Impuestos pagados por el cliente" checked={solicitud.impuestosPagadosCliente} />
                            {solicitud.impuestosPagadosCliente && (
                            <div className="ml-6 pl-2 border-l border-dashed text-xs">
                                <FetchedDetailItem label="R/C No." value={solicitud.impuestosPagadosRC} />
                                <FetchedDetailItem label="T/B No." value={solicitud.impuestosPagadosTB} />
                                <FetchedDetailItem label="Cheque No." value={solicitud.impuestosPagadosCheque} />
                            </div>
                            )}
                            <CheckboxDetailItemFetched label="Impuestos pendientes de pago por el cliente" checked={solicitud.impuestosPendientesCliente} />
                            <CheckboxDetailItemFetched label="Se añaden documentos adjuntos" checked={solicitud.documentosAdjuntos} />
                            <CheckboxDetailItemFetched label="Constancias de no retención" checked={solicitud.constanciasNoRetencion} />
                            {solicitud.constanciasNoRetencion && (
                            <div className="ml-6 pl-2 border-l border-dashed text-xs">
                                <CheckboxDetailItemFetched label="1%" checked={solicitud.constanciasNoRetencion1} />
                                <CheckboxDetailItemFetched label="2%" checked={solicitud.constanciasNoRetencion2} />
                            </div>
                            )}
                        </div>
                    </div>
                    <div className="pt-2">
                        <h6 className="text-sm font-medium text-accent mb-1">Comunicación</h6>
                        <FetchedDetailItem label="Correos de Notificación" value={solicitud.correo} icon={Mail} />
                        <FetchedDetailItem label="Observación" value={solicitud.observation} icon={MessageSquare} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DatabasePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [searchTermNE, setSearchTermNE] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedSolicitudes, setFetchedSolicitudes] = useState<SolicitudRecord[] | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || authLoading) return;

    if (!user || !user.isStaticUser) {
      router.push('/');
    }
  }, [user, authLoading, router, isClient]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchTermNE.trim()) {
      setError("Por favor, ingrese un NE para buscar.");
      setFetchedSolicitudes(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setFetchedSolicitudes(null);

    try {
      const solicitudsCollectionRef = collection(db, "Solicitudes de Cheque");
      const q = query(solicitudsCollectionRef, where("examNe", "==", searchTermNE.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs.map(doc => {
          const docData = doc.data() as SolicitudRecord;
          // Convert Firestore Timestamps to Date objects
          return {
            ...docData,
            examDate: docData.examDate instanceof FirestoreTimestamp ? docData.examDate.toDate() : docData.examDate,
            savedAt: docData.savedAt instanceof FirestoreTimestamp ? docData.savedAt.toDate() : docData.savedAt,
          };
        });
        setFetchedSolicitudes(data as SolicitudRecord[]);
      } else {
        setError("No se encontraron solicitudes para el NE: " + searchTermNE);
      }
    } catch (err: any) {
      console.error("Error fetching documents from Firestore: ", err);
      let userFriendlyError = "Error al buscar las solicitudes. Intente de nuevo.";
      if (err.code === 'permission-denied') {
        userFriendlyError = "No tiene permisos para acceder a esta información.";
      } else if (err.code === 'failed-precondition') {
         userFriendlyError = "Error de consulta: asegúrese de tener índices creados en Firestore para 'examNe' en la colección 'Solicitudes de Cheque'.";
      }
      setError(userFriendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (fetchedSolicitudes && fetchedSolicitudes.length > 0) {
      const firstSolicitud = fetchedSolicitudes[0];
      const examDataForExport = {
        ne: firstSolicitud.examNe,
        reference: firstSolicitud.examReference,
        manager: firstSolicitud.examManager,
        recipient: firstSolicitud.examRecipient,
        date: firstSolicitud.examDate instanceof FirestoreTimestamp 
              ? firstSolicitud.examDate.toDate() 
              : firstSolicitud.examDate, // Already a Date if converted on fetch
        savedBy: firstSolicitud.savedBy,
        savedAt: firstSolicitud.savedAt instanceof FirestoreTimestamp 
              ? firstSolicitud.savedAt.toDate() 
              : firstSolicitud.savedAt, // Already a Date
        products: fetchedSolicitudes.map(s => ({
          ...s,
          // Ensure any Timestamps within individual solicituds are also converted if not done at fetch
          // For SolicitudRecord, examDate and savedAt are top-level.
          // If SolicitudData had its own Timestamps, they'd need conversion here or on fetch.
        })) 
      };
      downloadExcelFile(examDataForExport);
    } else {
      alert("No hay datos de examen para exportar. Realice una búsqueda primero.");
    }
  };

  if (!isClient || authLoading || (!user || (user && !user.isStaticUser))) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="py-2 md:py-5">
        <Card className="w-full max-w-4xl mx-auto custom-shadow">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-foreground">Base de Datos de Solicitudes de Cheque</CardTitle>
            <CardDescription className="text-muted-foreground">
              Busque por NE (Seguimiento NX1) para ver todas las solicitudes asociadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3 mb-6">
              <Input
                type="text"
                placeholder="Ingrese NE (Ej: NX1-12345)"
                value={searchTermNE}
                onChange={(e) => setSearchTermNE(e.target.value)}
                className="flex-grow"
                aria-label="Buscar por NE"
              />
              <Button type="submit" className="btn-primary w-full sm:w-auto" disabled={isLoading}>
                <Search className="mr-2 h-4 w-4" /> {isLoading ? 'Buscando...' : 'Ejecutar Búsqueda'}
              </Button>
              <Button type="button" onClick={handleExport} variant="outline" className="w-full sm:w-auto" disabled={!fetchedSolicitudes || isLoading}>
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
            </form>

            {isLoading && (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Cargando solicitudes...</p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-destructive/10 text-destructive border border-destructive/30 rounded-md text-center">
                {error}
              </div>
            )}

            {fetchedSolicitudes && !isLoading && <FetchedExamDisplay solicitudes={fetchedSolicitudes} />}

            {!fetchedSolicitudes && !isLoading && !error && searchTermNE && (
                 <div className="mt-4 p-4 bg-yellow-500/10 text-yellow-700 border border-yellow-500/30 rounded-md text-center">
                    Inicie una búsqueda para ver resultados o verifique el NE ingresado.
                 </div>
            )}
             {!fetchedSolicitudes && !isLoading && !error && !searchTermNE && (
                 <div className="mt-4 p-4 bg-blue-500/10 text-blue-700 border border-blue-500/30 rounded-md text-center">
                    Ingrese un NE para buscar solicitudes de cheque.
                 </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

    