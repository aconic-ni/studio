
"use client";
import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search, Download, Eye } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import type { SolicitudRecord, ExportableExamData } from '@/types';
import { downloadExcelFile } from '@/lib/fileExporter';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

const SearchResultsTable: React.FC<{ solicitudes: SolicitudRecord[] }> = ({ solicitudes }) => {
  const router = useRouter();

  if (!solicitudes || solicitudes.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No se encontraron solicitudes para este NE.</p>;
  }

  return (
    <Card className="mt-6 w-full custom-shadow">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-semibold text-foreground">
          Solicitudes Encontradas para NE: {solicitudes[0]?.examNe || 'Desconocido'}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Se encontraron {solicitudes.length} solicitud(es) asociadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto table-container rounded-lg border">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID Solicitud</TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha de Examen</TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Monto</TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card divide-y divide-border">
              {solicitudes.map((solicitud) => (
                <TableRow key={solicitud.solicitudId} className="hover:bg-muted/50">
                  <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">{solicitud.solicitudId}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                    {solicitud.examDate instanceof FirestoreTimestamp 
                      ? format(solicitud.examDate.toDate(), "PPP", { locale: es }) 
                      : (solicitud.examDate instanceof Date ? format(solicitud.examDate, "PPP", { locale: es }) : 'N/A')}
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{formatCurrencyFetched(solicitud.monto, solicitud.montoMoneda)}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => router.push(`/examiner/solicitud/${solicitud.solicitudId}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" /> Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

    if (!user || (!user.isStaticUser && user.role !== 'revisor')) {
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
      const solicitudsCollectionRef = collection(db, "SolicitudCheques");
      const q = query(solicitudsCollectionRef, where("examNe", "==", searchTermNE.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs.map(doc => {
          const docData = doc.data() as Omit<SolicitudRecord, 'examDate' | 'savedAt'> & { examDate: FirestoreTimestamp | Date, savedAt: FirestoreTimestamp | Date };
          return {
            ...docData,
            solicitudId: doc.id, // Ensure solicitudId is the document ID
            examDate: docData.examDate instanceof FirestoreTimestamp ? docData.examDate.toDate() : docData.examDate as Date,
            savedAt: docData.savedAt instanceof FirestoreTimestamp ? docData.savedAt.toDate() : docData.savedAt as Date,
          } as SolicitudRecord;
        });
        setFetchedSolicitudes(data);
      } else {
        setError("No se encontraron solicitudes para el NE: " + searchTermNE);
      }
    } catch (err: any) {
      console.error("Error fetching documents from Firestore: ", err);
      let userFriendlyError = "Error al buscar las solicitudes. Intente de nuevo.";
      if (err.code === 'permission-denied') {
        userFriendlyError = "No tiene permisos para acceder a esta información.";
      } else if (err.code === 'failed-precondition') {
         userFriendlyError = "Error de consulta: asegúrese de tener índices creados en Firestore para 'examNe' en la colección 'SolicitudCheques'. Puede tardar unos minutos en activarse después de crearlo.";
      }
      setError(userFriendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (fetchedSolicitudes && fetchedSolicitudes.length > 0) {
      const firstSolicitud = fetchedSolicitudes[0];
      const examDataForExport: ExportableExamData = {
        ne: firstSolicitud.examNe,
        reference: firstSolicitud.examReference || '',
        manager: firstSolicitud.examManager,
        recipient: firstSolicitud.examRecipient,
        date: firstSolicitud.examDate instanceof FirestoreTimestamp 
              ? firstSolicitud.examDate.toDate() 
              : (firstSolicitud.examDate instanceof Date ? firstSolicitud.examDate : new Date()), 
        savedBy: firstSolicitud.savedBy,
        savedAt: firstSolicitud.savedAt instanceof FirestoreTimestamp 
              ? firstSolicitud.savedAt.toDate() 
              : (firstSolicitud.savedAt instanceof Date ? firstSolicitud.savedAt : new Date()), 
        products: fetchedSolicitudes.map(s => ({ 
          id: s.solicitudId,
          monto: s.monto,
          montoMoneda: s.montoMoneda,
          cantidadEnLetras: s.cantidadEnLetras,
          consignatario: s.consignatario,
          declaracionNumero: s.declaracionNumero,
          unidadRecaudadora: s.unidadRecaudadora,
          codigo1: s.codigo1,
          codigo2: s.codigo2, // Codigo MUR
          banco: s.banco,
          bancoOtros: s.bancoOtros,
          numeroCuenta: s.numeroCuenta,
          monedaCuenta: s.monedaCuenta,
          monedaCuentaOtros: s.monedaCuentaOtros,
          elaborarChequeA: s.elaborarChequeA,
          elaborarTransferenciaA: s.elaborarTransferenciaA,
          impuestosPagadosCliente: s.impuestosPagadosCliente,
          impuestosPagadosRC: s.impuestosPagadosRC,
          impuestosPagadosTB: s.impuestosPagadosTB,
          impuestosPagadosCheque: s.impuestosPagadosCheque,
          impuestosPendientesCliente: s.impuestosPendientesCliente,
          documentosAdjuntos: s.documentosAdjuntos,
          constanciasNoRetencion: s.constanciasNoRetencion,
          constanciasNoRetencion1: s.constanciasNoRetencion1,
          constanciasNoRetencion2: s.constanciasNoRetencion2,
          correo: s.correo,
          observation: s.observation,
        }))
      };
      downloadExcelFile(examDataForExport);
    } else {
      alert("No hay datos de examen para exportar. Realice una búsqueda primero.");
    }
  };

  if (!isClient || authLoading || (!user || (!user.isStaticUser && user.role !== 'revisor'))) {
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
              <Button type="button" onClick={handleExport} variant="outline" className="w-full sm:w-auto" disabled={!fetchedSolicitudes || isLoading || (fetchedSolicitudes && fetchedSolicitudes.length === 0) }>
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

            {fetchedSolicitudes && !isLoading && <SearchResultsTable solicitudes={fetchedSolicitudes} />}
            
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
