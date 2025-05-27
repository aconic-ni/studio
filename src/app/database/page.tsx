
"use client";
import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search, Download, Eye, Calendar as CalendarIcon, MessageSquare, Info as InfoIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp as FirestoreTimestamp, doc, getDoc, orderBy, updateDoc, serverTimestamp } from 'firebase/firestore';
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
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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

interface SearchResultsTableProps {
  solicitudes: SolicitudRecord[];
  searchType: SearchType;
  searchTerm?: string;
  currentUserRole?: string;
  onUpdatePaymentStatus: (solicitudId: string, status: string | null, message?: string) => Promise<void>;
  onOpenMessageDialog: (solicitudId: string) => void;
}

const SearchResultsTable: React.FC<SearchResultsTableProps> = ({
  solicitudes,
  searchType,
  searchTerm,
  currentUserRole,
  onUpdatePaymentStatus,
  onOpenMessageDialog
}) => {
  const router = useRouter();
  const { toast } = useToast();

  if (!solicitudes || solicitudes.length === 0) {
    let message = "No se encontraron solicitudes para los criterios ingresados.";
    if (searchType === "ne" && searchTerm) message = `No se encontraron solicitudes para el NE: ${searchTerm}`;
    else if (searchType === "solicitudId" && searchTerm) message = `No se encontró la solicitud con ID: ${searchTerm}`;
    return <p className="text-muted-foreground text-center py-4">{message}</p>;
  }

  const getTitle = () => {
    if (searchType === "ne" && searchTerm) return `Solicitudes para NE: ${searchTerm}`;
    if (searchType === "solicitudId" && solicitudes.length > 0) return `Detalle Solicitud ID: ${solicitudes[0].solicitudId}`;
    if (searchType === "manager" && searchTerm) return `Solicitudes del Gestor: ${searchTerm}`;
    if (searchType === "dateToday") return `Solicitudes de Hoy (${format(new Date(), "PPP", { locale: es })})`;
    if (searchType === "dateSpecific" && searchTerm) return `Solicitudes del ${searchTerm}`;
    if (searchType === "dateRange" && searchTerm) return `Solicitudes para el rango: ${searchTerm}`;
    return "Solicitudes Encontradas";
  };

  return (
    <Card className="mt-6 w-full custom-shadow">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-semibold text-foreground">{getTitle()}</CardTitle>
        <CardDescription className="text-muted-foreground">Se encontraron {solicitudes.length} solicitud(es) asociadas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto table-container rounded-lg border">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado de Pago</TableHead>
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
                  <TableCell className="px-4 py-3 whitespace-nowrap text-sm">
                    {currentUserRole === 'calificador' ? (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={solicitud.paymentStatus === 'Pagado'}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              onUpdatePaymentStatus(solicitud.solicitudId, 'Pagado');
                            } else {
                              // If turning off, and current status is "Pagado", clear it.
                              // If current status is an error, unchecking the switch doesn't clear the error.
                              // Error is cleared by submitting an empty message or another action.
                              if (solicitud.paymentStatus === 'Pagado') {
                                onUpdatePaymentStatus(solicitud.solicitudId, null);
                              }
                            }
                          }}
                          aria-label="Marcar como pagado"
                        />
                        <Button variant="ghost" size="icon" onClick={() => onOpenMessageDialog(solicitud.solicitudId)} aria-label="Añadir mensaje de error">
                          <MessageSquare className="h-5 w-5 text-muted-foreground hover:text-primary" />
                        </Button>
                        {/* Badge for calificador to see current state clearly */}
                        {solicitud.paymentStatus === 'Pagado' && (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Pagado</Badge>
                        )}
                        {solicitud.paymentStatus && solicitud.paymentStatus.startsWith('Error:') && (
                            <Badge variant="destructive">{solicitud.paymentStatus}</Badge>
                        )}
                      </div>
                    ) : ( // For revisor and other roles
                      <div className="flex items-center space-x-1">
                        {solicitud.paymentStatus === 'Pagado' ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 flex items-center">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1"/> Pagado
                          </Badge>
                        ) : solicitud.paymentStatus && solicitud.paymentStatus.startsWith('Error:') ? (
                          <Badge variant="destructive" className="flex items-center">
                            <AlertCircle className="h-3.5 w-3.5 mr-1"/> {solicitud.paymentStatus}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pendiente</Badge>
                        )}
                        {(solicitud.paymentStatusLastUpdatedAt || solicitud.paymentStatusLastUpdatedBy) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">
                                <p>Última actualización:</p>
                                {solicitud.paymentStatusLastUpdatedBy && <p>Por: {solicitud.paymentStatusLastUpdatedBy}</p>}
                                {solicitud.paymentStatusLastUpdatedAt && <p>Fecha: {format(solicitud.paymentStatusLastUpdatedAt instanceof FirestoreTimestamp ? solicitud.paymentStatusLastUpdatedAt.toDate() : solicitud.paymentStatusLastUpdatedAt, "Pp", { locale: es })}</p>}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    )}
                  </TableCell>
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
  const { toast } = useToast();

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

  // State for message dialog
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [currentSolicitudIdForMessage, setCurrentSolicitudIdForMessage] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');


  const handleUpdatePaymentStatus = useCallback(async (solicitudId: string, status: string | null, message?: string) => {
    if (!user || !user.email) {
      toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
      return;
    }
    const docRef = doc(db, "SolicitudCheques", solicitudId);
    try {
      let newStatus = status;
      if (message && message.trim() !== '') {
        newStatus = `Error: ${message.trim()}`;
      } else if (message === '' && status && status.startsWith('Error:')) { // If clearing message for an error status
        newStatus = null; // Or some default "Pending" status
      }


      await updateDoc(docRef, {
        paymentStatus: newStatus,
        paymentStatusLastUpdatedAt: serverTimestamp(),
        paymentStatusLastUpdatedBy: user.email,
      });
      toast({ title: "Éxito", description: `Estado de pago actualizado para ${solicitudId}.` });
      // Refresh data to show updated status
      setFetchedSolicitudes(prev =>
        prev?.map(s =>
          s.solicitudId === solicitudId
            ? { ...s,
                paymentStatus: newStatus || undefined, // Ensure undefined if null
                paymentStatusLastUpdatedAt: new Date(), // Approximate client-side, Firestore actualizes
                paymentStatusLastUpdatedBy: user.email!
              }
            : s
        ) || null
      );
    } catch (err) {
      console.error("Error updating payment status: ", err);
      toast({ title: "Error", description: "No se pudo actualizar el estado de pago.", variant: "destructive" });
    }
  }, [user, toast]);

  const openMessageDialog = (solicitudId: string) => {
    setCurrentSolicitudIdForMessage(solicitudId);
    // Pre-fill message if current status is an error message
    const currentSolicitud = fetchedSolicitudes?.find(s => s.solicitudId === solicitudId);
    if (currentSolicitud?.paymentStatus && currentSolicitud.paymentStatus.startsWith("Error: ")) {
      setMessageText(currentSolicitud.paymentStatus.substring("Error: ".length));
    } else {
      setMessageText('');
    }
    setIsMessageDialogOpen(true);
  };

  const handleSaveMessage = async () => {
    if (currentSolicitudIdForMessage) {
      // If messageText is empty, it means user wants to clear the error or not set one.
      // If it's empty and current status was an error, we clear the status.
      // If it has text, we set the error status.
      const currentSolicitud = fetchedSolicitudes?.find(s => s.solicitudId === currentSolicitudIdForMessage);
      if (messageText.trim() === '' && currentSolicitud?.paymentStatus?.startsWith('Error:')) {
        await handleUpdatePaymentStatus(currentSolicitudIdForMessage, null); // Clears the error
      } else if (messageText.trim() !== '') {
        await handleUpdatePaymentStatus(currentSolicitudIdForMessage, `Error: ${messageText.trim()}`, messageText.trim());
      }
    }
    setIsMessageDialogOpen(false);
    setMessageText('');
    setCurrentSolicitudIdForMessage(null);
  };


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || authLoading) return;
    if (!user || (!user.isStaticUser && user.role !== 'revisor' && user.role !== 'calificador')) {
      router.push('/');
    }
  }, [user, authLoading, router, isClient]);

  const handleSearch = async (e?: FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    setError(null);
    setFetchedSolicitudes(null);
    setCurrentSearchTermForDisplay('');

    const solicitudsCollectionRef = collection(db, "SolicitudCheques");
    let q;
    let termForDisplay = searchTermText.trim();

    try {
      switch (searchType) {
        case "ne":
          if (!searchTermText.trim()) { setError("Por favor, ingrese un NE para buscar."); setIsLoading(false); return; }
          q = query(solicitudsCollectionRef, where("examNe", "==", searchTermText.trim()), orderBy("examDate", "desc"));
          termForDisplay = searchTermText.trim();
          break;
        case "solicitudId":
          if (!searchTermText.trim()) { setError("Por favor, ingrese un ID de Solicitud para buscar."); setIsLoading(false); return; }
          const docRef = doc(db, "SolicitudCheques", searchTermText.trim());
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const docData = docSnap.data();
            const data = {
                ...docData,
                solicitudId: docSnap.id,
                examDate: (docData.examDate as FirestoreTimestamp).toDate(),
                savedAt: (docData.savedAt as FirestoreTimestamp).toDate(),
                paymentStatusLastUpdatedAt: docData.paymentStatusLastUpdatedAt ? (docData.paymentStatusLastUpdatedAt as FirestoreTimestamp).toDate() : undefined,
            } as SolicitudRecord;
            setFetchedSolicitudes([data]);
          } else { setError("No se encontró la solicitud con ID: " + searchTermText.trim()); }
          setIsLoading(false);
          setCurrentSearchTermForDisplay(searchTermText.trim());
          return;
        case "manager":
          if (!searchTermText.trim()) { setError("Por favor, ingrese un nombre de Gestor para buscar."); setIsLoading(false); return; }
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
          if (!selectedDate) { setError("Por favor, seleccione una fecha específica."); setIsLoading(false); return; }
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
          if (!startDate || !endDate) { setError("Por favor, seleccione una fecha de inicio y fin para el rango."); setIsLoading(false); return; }
          if (endDate < startDate) { setError("La fecha de fin no puede ser anterior a la fecha de inicio."); setIsLoading(false); return; }
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
          setError("Tipo de búsqueda no válido."); setIsLoading(false); return;
      }

      setCurrentSearchTermForDisplay(termForDisplay);

      if (q) {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs.map(doc => {
            const docData = doc.data() as Omit<SolicitudRecord, 'examDate' | 'savedAt' | 'paymentStatusLastUpdatedAt'> & { examDate: FirestoreTimestamp | Date, savedAt: FirestoreTimestamp | Date, paymentStatusLastUpdatedAt?: FirestoreTimestamp | Date };
            return {
              ...docData,
              solicitudId: doc.id,
              examDate: docData.examDate instanceof FirestoreTimestamp ? docData.examDate.toDate() : docData.examDate as Date,
              savedAt: docData.savedAt instanceof FirestoreTimestamp ? docData.savedAt.toDate() : docData.savedAt as Date,
              paymentStatusLastUpdatedAt: docData.paymentStatusLastUpdatedAt instanceof FirestoreTimestamp ? docData.paymentStatusLastUpdatedAt.toDate() : (docData.paymentStatusLastUpdatedAt ? docData.paymentStatusLastUpdatedAt as Date : undefined),
            } as SolicitudRecord;
          });
          setFetchedSolicitudes(data);
        } else { setError("No se encontraron solicitudes para los criterios ingresados."); }
      }
    } catch (err: any) {
      console.error("Error fetching documents from Firestore: ", err);
      let userFriendlyError = "Error al buscar las solicitudes. Intente de nuevo.";
      if (err.code === 'permission-denied') { userFriendlyError = "No tiene permisos para acceder a esta información."; }
      else if (err.code === 'failed-precondition') { userFriendlyError = "Error de consulta: asegúrese de tener los índices necesarios creados en Firestore para los campos y orden seleccionados. La creación de índices puede tardar unos minutos en activarse. Detalle del error: " + err.message; }
      setError(userFriendlyError);
    } finally { setIsLoading(false); }
  };

  const handleExport = () => {
    if (fetchedSolicitudes && fetchedSolicitudes.length > 0) {
      const headers = ["ID Solicitud", "Fecha de Examen", "Monto", "Moneda Monto", "Gestor", "NE Examen", "Referencia Examen", "Destinatario Examen", "Estado de Pago", "Actualizado Por (Pago)", "Fecha Actualización (Pago)"];
      const dataToExport = fetchedSolicitudes.map(s => ({
        "ID Solicitud": s.solicitudId,
        "Fecha de Examen": s.examDate instanceof Date ? format(s.examDate, "yyyy-MM-dd HH:mm", { locale: es }) : 'N/A',
        "Monto": s.monto,
        "Moneda Monto": s.montoMoneda,
        "Gestor": s.examManager,
        "NE Examen": s.examNe,
        "Referencia Examen": s.examReference || 'N/A',
        "Destinatario Examen": s.examRecipient,
        "Estado de Pago": s.paymentStatus || 'Pendiente',
        "Actualizado Por (Pago)": s.paymentStatusLastUpdatedBy || 'N/A',
        "Fecha Actualización (Pago)": s.paymentStatusLastUpdatedAt ? format(s.paymentStatusLastUpdatedAt instanceof FirestoreTimestamp ? s.paymentStatusLastUpdatedAt.toDate() : s.paymentStatusLastUpdatedAt, "yyyy-MM-dd HH:mm", { locale: es }) : 'N/A',
      }));
      downloadExcelFileFromTable(dataToExport, headers, `Reporte_Solicitudes_${searchType}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else { setError("No hay datos para exportar. Realice una búsqueda primero."); }
  };

  const renderSearchInputs = () => {
    switch (searchType) {
      case "ne":
      case "solicitudId":
      case "manager":
        return <Input type="text" placeholder={searchType === "ne" ? "Ingrese NE (Ej: NX1-12345)" : searchType === "solicitudId" ? "Ingrese ID Solicitud Completo" : "Ingrese Nombre del Gestor"} value={searchTermText} onChange={(e) => setSearchTermText(e.target.value)} className="flex-grow" aria-label="Término de búsqueda" />;
      case "dateToday": return <p className="text-sm text-muted-foreground flex-grow items-center flex h-10">Se buscarán las solicitudes de hoy.</p>;
      case "dateSpecific":
        return (
          <Popover>
            <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal flex-grow", !selectedDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}</Button></PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus locale={es} /></PopoverContent>
          </Popover>
        );
      case "dateRange":
        return (
          <div className="flex flex-col sm:flex-row gap-2 flex-grow">
            <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full sm:w-1/2 justify-start text-left font-normal", !startDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{startDate ? format(startDate, "PPP", { locale: es }) : <span>Fecha Inicio</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus locale={es} /></PopoverContent></Popover>
            <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full sm:w-1/2 justify-start text-left font-normal", !endDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{endDate ? format(endDate, "PPP", { locale: es }) : <span>Fecha Fin</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus locale={es} /></PopoverContent></Popover>
          </div>
        );
      default: return null;
    }
  };

  if (!isClient || authLoading || (!user || (!user.isStaticUser && user.role !== 'revisor' && user.role !== 'calificador'))) {
    return <div className="min-h-screen flex items-center justify-center grid-bg"><Loader2 className="h-12 w-12 animate-spin text-white" /></div>;
  }

  return (
    <AppShell>
      <div className="py-2 md:py-5">
        <Card className="w-full max-w-4xl mx-auto custom-shadow">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-foreground">Base de Datos de Solicitudes de Cheque</CardTitle>
            <CardDescription className="text-muted-foreground">Seleccione un tipo de búsqueda e ingrese los criterios.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Select value={searchType} onValueChange={(value) => { setSearchType(value as SearchType); setSearchTermText(''); setSelectedDate(undefined); setStartDate(undefined); setEndDate(undefined); setFetchedSolicitudes(null); setError(null); setCurrentSearchTermForDisplay(''); }}>
                  <SelectTrigger className="w-full sm:w-[200px] shrink-0"><SelectValue placeholder="Tipo de búsqueda" /></SelectTrigger>
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
                <Button type="submit" className="btn-primary w-full sm:w-auto" disabled={isLoading}><Search className="mr-2 h-4 w-4" /> {isLoading ? 'Buscando...' : 'Ejecutar Búsqueda'}</Button>
                <Button type="button" onClick={handleExport} variant="outline" className="w-full sm:w-auto" disabled={!fetchedSolicitudes || isLoading || (fetchedSolicitudes && fetchedSolicitudes.length === 0)}><Download className="mr-2 h-4 w-4" /> Exportar Tabla</Button>
              </div>
            </form>

            {isLoading && <div className="flex justify-center items-center py-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-3 text-muted-foreground">Cargando solicitudes...</p></div>}
            {error && <div className="mt-4 p-4 bg-destructive/10 text-destructive border border-destructive/30 rounded-md text-center">{error}</div>}
            {fetchedSolicitudes && !isLoading && <SearchResultsTable solicitudes={fetchedSolicitudes} searchType={searchType} searchTerm={currentSearchTermForDisplay} currentUserRole={user?.role} onUpdatePaymentStatus={handleUpdatePaymentStatus} onOpenMessageDialog={openMessageDialog} />}
            {!fetchedSolicitudes && !isLoading && !error && !currentSearchTermForDisplay && <div className="mt-4 p-4 bg-blue-500/10 text-blue-700 border border-blue-500/30 rounded-md text-center">Seleccione un tipo de búsqueda e ingrese los criterios para ver resultados.</div>}
          </CardContent>
        </Card>
      </div>
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Mensaje de Error para Solicitud</DialogTitle>
            <DialogDescription>
              Solicitud ID: {currentSolicitudIdForMessage}. Si guarda un mensaje, el estado se marcará como "Error".
              Si guarda un mensaje vacío y el estado actual es un error, se limpiará el estado de error.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Escriba el mensaje de error aquí..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsMessageDialogOpen(false); setMessageText(''); setCurrentSolicitudIdForMessage(null);}}>Cancelar</Button>
            <Button onClick={handleSaveMessage}>Guardar Mensaje</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
