
"use client";
import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search, Download, Banknote, User, FileText, Landmark, Hash, Building, Code, MessageSquare, Mail } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import type { ExamDocument, SolicitudData } from '@/types';
import { downloadExcelFile } from '@/lib/fileExporter'; 
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Square } from 'lucide-react';

const FetchedDetailItem: React.FC<{ label: string; value?: string | number | null | boolean | FirestoreTimestamp; icon?: React.ElementType }> = ({ label, value, icon: Icon }) => {
  let displayValue: string;
  if (typeof value === 'boolean') {
    displayValue = value ? 'Sí' : 'No';
  } else if (value instanceof FirestoreTimestamp) {
    displayValue = value.toDate().toLocaleString('es-NI', { dateStyle: 'long', timeStyle: 'medium' });
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

const getBancoDisplayFetched = (solicitud: SolicitudData) => {
    if (solicitud.banco === 'ACCION POR CHEQUE/NO APLICA BANCO') return 'Acción por Cheque / No Aplica Banco';
    if (solicitud.banco === 'Otros') return solicitud.bancoOtros || 'Otros (No especificado)';
    return solicitud.banco;
};
  
const getMonedaCuentaDisplayFetched = (solicitud: SolicitudData) => {
    if (solicitud.monedaCuenta === 'Otros') return solicitud.monedaCuentaOtros || 'Otros (No especificado)';
    return solicitud.monedaCuenta;
};

const FetchedExamDetails: React.FC<{ exam: ExamDocument }> = ({ exam }) => {
  return (
    <Card className="mt-6 w-full custom-shadow">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-semibold text-foreground">Detalles del Examen: {exam.ne}</CardTitle>
        <CardDescription className="text-muted-foreground">
          Información del examen recuperada de la base de datos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-lg font-medium mb-2 text-foreground">Información General del Examen</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 bg-secondary/30 p-4 rounded-md shadow-sm text-sm">
            <FetchedDetailItem label="NE (Tracking NX1)" value={exam.ne} />
            <FetchedDetailItem label="Referencia" value={exam.reference} />
            <FetchedDetailItem label="De (Colaborador)" value={exam.manager} />
            <FetchedDetailItem label="A (Destinatario)" value={exam.recipient} />
            <FetchedDetailItem label="Fecha de Examen" value={exam.date instanceof Date ? exam.date.toLocaleDateString('es-NI') : (exam.date as FirestoreTimestamp)?.toDate().toLocaleDateString('es-NI')} />
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium mb-2 text-foreground">Detalles de Guardado</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 bg-secondary/30 p-4 rounded-md shadow-sm text-sm">
             <FetchedDetailItem label="Guardado por (correo)" value={exam.savedBy} />
             <FetchedDetailItem label="Fecha y Hora de Guardado" value={exam.savedAt} />
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium mb-3 text-foreground">Solicitudes ({exam.solicitudes?.length || 0})</h4>
          {exam.solicitudes && exam.solicitudes.length > 0 ? (
            <div className="space-y-6">
              {exam.solicitudes.map((solicitud, index) => (
                <div key={solicitud.id || index} className="p-4 border border-border bg-card rounded-lg shadow">
                  <h5 className="text-md font-semibold mb-3 text-primary">Solicitud {index + 1}</h5>
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
                        <FetchedDetailItem label="Código 2" value={solicitud.codigo2} icon={Code} />
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
          ) : (
            <p className="text-muted-foreground">No hay solicitudes registradas en este examen.</p>
          )}
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
  const [fetchedExam, setFetchedExam] = useState<ExamDocument | null>(null);
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
      setFetchedExam(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setFetchedExam(null);

    try {
      const examDocRef = doc(db, "examenesPrevios", searchTermNE.trim());
      const docSnap = await getDoc(examDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as ExamDocument;
        if (data.date && data.date instanceof FirestoreTimestamp) {
            data.date = data.date.toDate();
        }
        setFetchedExam(data);
      } else {
        setError("Archivo erróneo o no ha sido creado por gestor para el NE: " + searchTermNE);
      }
    } catch (err: any) {
      console.error("Error fetching document from Firestore: ", err);
      let userFriendlyError = "Error al buscar el examen. Intente de nuevo.";
      if (err.code === 'permission-denied') {
        userFriendlyError = "No tiene permisos para acceder a esta información.";
      }
      setError(userFriendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (fetchedExam) {
      downloadExcelFile({ ...fetchedExam, products: fetchedExam.solicitudes });
    } else {
      alert("No hay datos de examen para exportar. Realice una búsqueda primero.");
    }
  };

  if (!isClient || authLoading || (!user || (user && !user.isStaticUser))) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg"> {/* Ensure grid-bg for consistency */}
        <Loader2 className="h-12 w-12 animate-spin text-white" /> {/* text-white for grid-bg */}
      </div>
    );
  }

  return (
    <AppShell>
      <div className="py-2 md:py-5">
        <Card className="w-full max-w-4xl mx-auto custom-shadow">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-foreground">Base de Datos de Exámenes Previos</CardTitle>
            <CardDescription className="text-muted-foreground">
              Busque exámenes previos guardados por su número NE (Seguimiento NX1).
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
              <Button type="button" onClick={handleExport} variant="outline" className="w-full sm:w-auto" disabled={!fetchedExam || isLoading}>
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
            </form>

            {isLoading && (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Cargando examen...</p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-destructive/10 text-destructive border border-destructive/30 rounded-md text-center">
                {error}
              </div>
            )}

            {fetchedExam && !isLoading && <FetchedExamDetails exam={fetchedExam} />}

            {!fetchedExam && !isLoading && !error && searchTermNE && (
                 <div className="mt-4 p-4 bg-yellow-500/10 text-yellow-700 border border-yellow-500/30 rounded-md text-center">
                    Inicie una búsqueda para ver resultados o verifique el NE ingresado.
                 </div>
            )}
             {!fetchedExam && !isLoading && !error && !searchTermNE && (
                 <div className="mt-4 p-4 bg-blue-500/10 text-blue-700 border border-blue-500/30 rounded-md text-center">
                    Ingrese un NE para buscar un examen previo.
                 </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
