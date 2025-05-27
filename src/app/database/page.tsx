
"use client";
import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search, Download, Eye, Calendar as CalendarIcon } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp as FirestoreTimestamp, doc, getDoc, orderBy } from 'firebase/firestore';
import type { SolicitudRecord } from '@/types';
import { downloadExcelFileFromTable } from '@/lib/fileExporter';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';

type SearchType = "ne" | "solicitudId" | "manager" | "dateToday" | "dateSpecific" | "dateRange";

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

const SearchResultsTable: React.FC<{ solicitudes: SolicitudRecord[], searchType: SearchType, searchTerm?: string }> = ({ solicitudes, searchType, searchTerm }) => {
  const router = useRouter();

  if (!solicitudes || solicitudes.length === 0) {
    let message = "No se encontraron solicitudes para los criterios ingresados.";
    if (searchType === "ne" && searchTerm) message = `No se encontraron solicitudes para el NE: ${searchTerm}`;
    else if (searchType === "solicitudId" && searchTerm) message = `No se encontró la solicitud con ID: ${searchTerm}`;
    // Add more specific messages for other search types if desired
    return <p className="text-muted-foreground text-center py-4">{message}</p>;
  }
  
  const getTitle = () => {
    if (searchType === "ne" && searchTerm) return `Solicitudes para NE: ${searchTerm}`;
    if (searchType === "solicitudId" && solicitudes.length > 0) return `Detalle Solicitud ID: ${solicitudes[0].solicitudId}`;
    if (searchType === "manager" && searchTerm) return `Solicitudes del Gestor: ${searchTerm}`;
    if (searchType === "dateToday") return `Solicitudes de Hoy (${format(new Date(), "PPP", { locale: es })})`;
    if (searchType === "dateSpecific" && searchTerm) return `Solicitudes del ${searchTerm}`; // searchTerm here is the formatted date
    if (searchType === "dateRange" && searchTerm) return `Solicitudes para el rango: ${searchTerm}`; // searchTerm here is the formatted date range
    return "Solicitudes Encontradas";
  };


  return (
    <Card className="mt-6 w-full custom-shadow">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-semibold text-foreground">
          {getTitle()}
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
                 <TableHead className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Gestor</TableHead>
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
                  <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{solicitud.examManager}</TableCell>
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
  
  const [searchType, setSearchType] = useState<SearchType>("ne");
  const [searchTermText, setSearchTermText] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedSolicitudes, setFetchedSolicitudes] = useState<SolicitudRecord[] | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [currentSearchTermForDisplay, setCurrentSearchTermForDisplay] = useState('');


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || authLoading) return;

    if (!user || (!user.isStaticUser && user.role !== 'revisor')) {
      router.push('/'); 
    }
  }, [user, authLoading, router, isClient]);

  const handleSearch = async (e?: FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    setError(null);
    setFetchedSolicitudes(null);
    setCurrentSearchTermForDisplay(''); // Reset for new search

    const solicitudsCollectionRef = collection(db, "SolicitudCheques");
    let q;
    let termForDisplay = searchTermText.trim(); // Default for text searches

    try {
      switch (searchType) {
        case "ne":
          if (!searchTermText.trim()) {
            setError("Por favor, ingrese un NE para buscar.");
            setIsLoading(false); return;
          }
          q = query(solicitudsCollectionRef, where("examNe", "==", searchTermText.trim()), orderBy("examDate", "desc"));
          termForDisplay = searchTermText.trim();
          break;
        case "solicitudId":
          if (!searchTermText.trim()) {
            setError("Por favor, ingrese un ID de Solicitud para buscar.");
            setIsLoading(false); return;
          }
          const docRef = doc(db, "SolicitudCheques", searchTermText.trim());
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const docData = docSnap.data();
            const data = { 
                ...docData, 
                solicitudId: docSnap.id,
                examDate: (docData.examDate as FirestoreTimestamp).toDate(),
                savedAt: (docData.savedAt as FirestoreTimestamp).toDate(),
            } as SolicitudRecord;
            setFetchedSolicitudes([data]);
          } else {
            setError("No se encontró la solicitud con ID: " + searchTermText.trim());
          }
          setIsLoading(false);
          setCurrentSearchTermForDisplay(searchTermText.trim());
          return; 
        case "manager":
          if (!searchTermText.trim()) {
            setError("Por favor, ingrese un nombre de Gestor para buscar.");
            setIsLoading(false); return;
          }
          q = query(solicitudsCollectionRef, where("examManager", "==", searchTermText.trim()), orderBy("examDate", "desc"));
          termForDisplay = searchTermText.trim();
          break;
        case "dateToday":
          const todayStart = startOfDay(new Date());
          const todayEnd = endOfDay(new Date());
          q = query(solicitudsCollectionRef, 
            where("examDate", ">=", FirestoreTimestamp.fromDate(todayStart)),
            where("examDate", "<=", FirestoreTimestamp.fromDate(todayEnd)),
            orderBy("examDate", "desc")
          );
          termForDisplay = format(new Date(), "PPP", { locale: es });
          break;
        case "dateSpecific":
          if (!selectedDate) {
            setError("Por favor, seleccione una fecha específica.");
            setIsLoading(false); return;
          }
          const specificDayStart = startOfDay(selectedDate);
          const specificDayEnd = endOfDay(selectedDate);
          q = query(solicitudsCollectionRef, 
            where("examDate", ">=", FirestoreTimestamp.fromDate(specificDayStart)),
            where("examDate", "<=", FirestoreTimestamp.fromDate(specificDayEnd)),
            orderBy("examDate", "desc")
          );
          termForDisplay = format(selectedDate, "PPP", { locale: es });
          break;
        case "dateRange":
          if (!startDate || !endDate) {
            setError("Por favor, seleccione una fecha de inicio y fin para el rango.");
            setIsLoading(false); return;
          }
          if (endDate < startDate) {
            setError("La fecha de fin no puede ser anterior a la fecha de inicio.");
            setIsLoading(false); return;
          }
          const rangeStart = startOfDay(startDate);
          const rangeEnd = endOfDay(endDate);
          q = query(solicitudsCollectionRef, 
            where("examDate", ">=", FirestoreTimestamp.fromDate(rangeStart)),
            where("examDate", "<=", FirestoreTimestamp.fromDate(rangeEnd)),
            orderBy("examDate", "desc")
          );
          termForDisplay = `${format(startDate, "P", { locale: es })} - ${format(endDate, "P", { locale: es })}`;
          break;
        default:
          setError("Tipo de búsqueda no válido.");
          setIsLoading(false); return;
      }

      setCurrentSearchTermForDisplay(termForDisplay); // Set for display before async call

      if (q) {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs.map(doc => {
            const docData = doc.data() as Omit<SolicitudRecord, 'examDate' | 'savedAt'> & { examDate: FirestoreTimestamp | Date, savedAt: FirestoreTimestamp | Date };
            return {
              ...docData,
              solicitudId: doc.id,
              examDate: docData.examDate instanceof FirestoreTimestamp ? docData.examDate.toDate() : docData.examDate as Date,
              savedAt: docData.savedAt instanceof FirestoreTimestamp ? docData.savedAt.toDate() : docData.savedAt as Date,
            } as SolicitudRecord;
          });
          setFetchedSolicitudes(data);
        } else {
          setError("No se encontraron solicitudes para los criterios ingresados.");
        }
      }
    } catch (err: any) {
      console.error("Error fetching documents from Firestore: ", err);
      let userFriendlyError = "Error al buscar las solicitudes. Intente de nuevo.";
      if (err.code === 'permission-denied') {
        userFriendlyError = "No tiene permisos para acceder a esta información.";
      } else if (err.code === 'failed-precondition') {
         userFriendlyError = "Error de consulta: asegúrese de tener los índices necesarios creados en Firestore para los campos y orden seleccionados. La creación de índices puede tardar unos minutos en activarse. Detalle del error: " + err.message;
      }
      setError(userFriendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (fetchedSolicitudes && fetchedSolicitudes.length > 0) {
      const headers = ["ID Solicitud", "Fecha de Examen", "Monto", "Moneda Monto", "Gestor", "NE Examen", "Referencia Examen", "Destinatario Examen"];
      const dataToExport = fetchedSolicitudes.map(s => ({
        "ID Solicitud": s.solicitudId,
        "Fecha de Examen": s.examDate instanceof Date ? format(s.examDate, "yyyy-MM-dd HH:mm", { locale: es }) : 'N/A',
        "Monto": s.monto, // Export raw number
        "Moneda Monto": s.montoMoneda,
        "Gestor": s.examManager,
        "NE Examen": s.examNe,
        "Referencia Examen": s.examReference || 'N/A',
        "Destinatario Examen": s.examRecipient,
      }));
      downloadExcelFileFromTable(dataToExport, headers, `Reporte_Solicitudes_${searchType}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else {
      setError("No hay datos para exportar. Realice una búsqueda primero.");
    }
  };
  
  const renderSearchInputs = () => {
    switch (searchType) {
      case "ne":
      case "solicitudId":
      case "manager":
        return (
          <Input
            type="text"
            placeholder={
              searchType === "ne" ? "Ingrese NE (Ej: NX1-12345)" :
              searchType === "solicitudId" ? "Ingrese ID Solicitud Completo" :
              "Ingrese Nombre del Gestor"
            }
            value={searchTermText}
            onChange={(e) => setSearchTermText(e.target.value)}
            className="flex-grow"
            aria-label="Término de búsqueda"
          />
        );
      case "dateToday":
        return <p className="text-sm text-muted-foreground flex-grow items-center flex h-10">Se buscarán las solicitudes de hoy.</p>;
      case "dateSpecific":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal flex-grow",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
        );
      case "dateRange":
        return (
          <div className="flex flex-col sm:flex-row gap-2 flex-grow">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-1/2 justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP", { locale: es }) : <span>Fecha Inicio</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus locale={es} />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-1/2 justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP", { locale: es }) : <span>Fecha Fin</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus locale={es} />
              </PopoverContent>
            </Popover>
          </div>
        );
      default:
        return null;
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
              Seleccione un tipo de búsqueda e ingrese los criterios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Select value={searchType} onValueChange={(value) => {
                  setSearchType(value as SearchType);
                  setSearchTermText('');
                  setSelectedDate(undefined);
                  setStartDate(undefined);
                  setEndDate(undefined);
                  setFetchedSolicitudes(null);
                  setError(null);
                  setCurrentSearchTermForDisplay('');
                }}>
                  <SelectTrigger className="w-full sm:w-[200px] shrink-0">
                    <SelectValue placeholder="Tipo de búsqueda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ne">Por NE</SelectItem>
                    <SelectItem value="solicitudId">Por ID Solicitud</SelectItem>
                    <SelectItem value="manager">Por Gestor</SelectItem>
                    <SelectItem value="dateToday">Por Fecha (Hoy)</SelectItem>
                    <SelectItem value="dateSpecific">Por Fecha (Específica)</SelectItem>
                    <SelectItem value="dateRange">Por Fecha (Rango)</SelectItem>
                  </SelectContent>
                </Select>
                {renderSearchInputs()}
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button type="submit" className="btn-primary w-full sm:w-auto" disabled={isLoading}>
                  <Search className="mr-2 h-4 w-4" /> {isLoading ? 'Buscando...' : 'Ejecutar Búsqueda'}
                </Button>
                <Button 
                  type="button" 
                  onClick={handleExport} 
                  variant="outline" 
                  className="w-full sm:w-auto" 
                  disabled={!fetchedSolicitudes || isLoading || (fetchedSolicitudes && fetchedSolicitudes.length === 0) }
                >
                  <Download className="mr-2 h-4 w-4" /> Exportar Tabla
                </Button>
              </div>
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
            
            {fetchedSolicitudes && !isLoading && <SearchResultsTable solicitudes={fetchedSolicitudes} searchType={searchType} searchTerm={currentSearchTermForDisplay}/>}
            
            {!fetchedSolicitudes && !isLoading && !error && !currentSearchTermForDisplay && (
                 <div className="mt-4 p-4 bg-blue-500/10 text-blue-700 border border-blue-500/30 rounded-md text-center">
                    Seleccione un tipo de búsqueda e ingrese los criterios para ver resultados.
                 </div>
            )}
             {!fetchedSolicitudes && !isLoading && !error && currentSearchTermForDisplay && ( // This case might be covered by SearchResultsTable's empty message
                 <div className="mt-4 p-4 bg-yellow-500/10 text-yellow-700 border border-yellow-500/30 rounded-md text-center">
                    No se encontraron resultados para "{currentSearchTermForDisplay}". Verifique los criterios.
                 </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
