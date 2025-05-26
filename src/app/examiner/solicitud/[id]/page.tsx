
"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import type { SolicitudData } from '@/types';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Printer, CheckSquare, Square, Banknote, Landmark, Hash, User, FileText, Mail, MessageSquare, Building, Code, CalendarDays, Info, Send, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

const DetailItem: React.FC<{ label: string; value?: string | number | null | boolean; icon?: React.ElementType; className?: string }> = ({ label, value, icon: Icon, className }) => {
  let displayValue: string;
  if (typeof value === 'boolean') {
    displayValue = value ? 'Sí' : 'No';
  } else if (value instanceof Date) {
    displayValue = format(value, "PPP", { locale: es });
  } else {
    displayValue = String(value ?? 'N/A');
  }

  return (
    <div className={cn("py-1 flex items-baseline", className)}>
      <p className="text-xs font-medium text-muted-foreground flex items-center shrink-0">
        {Icon && <Icon className="h-3.5 w-3.5 mr-1.5 text-primary/70" />}
        {label}:&nbsp;
      </p>
      <p className="text-sm text-foreground break-words">{displayValue}</p>
    </div>
  );
};

const CheckboxDetailItem: React.FC<{ label: string; checked?: boolean; subLabel?: string }> = ({ label, checked, subLabel }) => (
  <div className="flex items-center py-1">
    {checked ? <CheckSquare className="h-4 w-4 text-green-600 mr-2" /> : <Square className="h-4 w-4 text-muted-foreground mr-2" />}
    <span className="text-sm text-foreground">{label}</span>
    {subLabel && <span className="text-xs text-muted-foreground ml-1">{subLabel}</span>}
  </div>
);


export default function SolicitudDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { examData, solicitudes } = useAppContext();
  const [solicitud, setSolicitud] = useState<SolicitudData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const solicitudId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (solicitudId && solicitudes.length > 0) {
      const foundSolicitud = solicitudes.find(s => s.id === solicitudId);
      if (foundSolicitud) {
        setSolicitud(foundSolicitud);
      } else {
        toast({ title: "Error", description: "Solicitud no encontrada.", variant: "destructive" });
        router.push('/examiner');
      }
      setLoading(false);
    } else if (solicitudes.length === 0 && !loading && solicitudId) {
      toast({ title: "Información no disponible", description: "Los datos de la solicitud no están cargados. Intente volver a la lista.", variant: "default" });
      router.push('/examiner');
      setLoading(false);
    }
  }, [solicitudId, solicitudes, router, toast, loading]);


  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount?: number | string, currency?: string) => {
    if (amount === undefined || amount === null || amount === '') return 'N/A';
    const num = Number(amount);
    if (isNaN(num)) return String(amount);
    let prefix = '';
    if (currency === 'cordoba') prefix = 'C$';
    else if (currency === 'dolar') prefix = 'US$';
    else if (currency === 'euro') prefix = '€';
    return `${prefix}${num.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getBancoDisplay = (s: SolicitudData) => {
    if (s.banco === 'ACCION POR CHEQUE/NO APLICA BANCO') return 'Acción por Cheque / No Aplica Banco';
    if (s.banco === 'Otros') return s.bancoOtros || 'Otros (No especificado)';
    return s.banco;
  };

  const getMonedaCuentaDisplay = (s: SolicitudData) => {
    if (s.monedaCuenta === 'Otros') return s.monedaCuentaOtros || 'Otros (No especificado)';
    return s.monedaCuenta;
  };


  if (loading && !solicitud) {
    return (
      <AppShell>
        <div className="flex justify-center items-center h-screen">
          <p>Cargando detalle de la solicitud...</p>
        </div>
      </AppShell>
    );
  }

  if (!solicitud) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-screen text-center">
          <p className="text-xl mb-4">Solicitud no encontrada o datos no disponibles.</p>
          <Button onClick={() => router.push('/examiner')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Lista de Solicitudes
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="solicitud-detail-print-area py-2 md:py-5">
        <Card className="w-full max-w-4xl mx-auto custom-shadow card-print-styles">
          <CardHeader className="no-print">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl md:text-2xl font-semibold text-foreground">Detalle de Solicitud</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push('/examiner')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Lista
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" /> Imprimir
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-6 w-full">
              <Image
                src="/imagenes/HEADERSOLICITUDDETAIL.svg"
                alt="Header Solicitud Detail"
                width={800}
                height={100}
                className="w-full h-auto object-contain"
                data-ai-hint="company logo banner"
              />
            </div>

            <div className="grid grid-cols-[auto,1fr] gap-x-3 items-center mb-4 p-4 border rounded-md bg-secondary/5 card-print-styles">
                <Label htmlFor="solicitudIdDisplay" className="flex items-center text-sm text-muted-foreground">
                  <Info className="mr-2 h-4 w-4 text-primary/70" />
                  ID de Solicitud
                </Label>
                <Input
                  id="solicitudIdDisplay"
                  value={solicitud.id}
                  readOnly
                  disabled
                  className="bg-muted/50 cursor-not-allowed text-sm text-foreground"
                />
            </div>

            {examData && (
              <div className="mb-6 p-4 border border-border rounded-md bg-secondary/30 card-print-styles">
                <h3 className="text-lg font-semibold mb-2 text-primary">Solicitud de Cheque</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0">
                  <DetailItem label="A" value={examData.recipient} icon={Send} />
                  <DetailItem label="De" value={examData.manager} icon={User} />
                  <DetailItem label="Fecha de Examen" value={examData.date ? format(new Date(examData.date), "PPP", { locale: es }) : 'N/A'} icon={CalendarDays} />
                  <DetailItem label="NE (Tracking NX1)" value={examData.ne} icon={Info} />
                  <DetailItem label="Referencia" value={examData.reference || 'N/A'} icon={FileText} className="md:col-span-2"/>
                </div>
              </div>
            )}

            {/* New wrapper for solicitud-specific details */}
            <div className="mb-6 p-4 border border-border rounded-md bg-secondary/30 card-print-styles">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad de:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 items-start mb-3">
                <div className="flex items-baseline py-1">
                  <Banknote className="h-4 w-4 mr-1.5 text-primary shrink-0" />
                  <p className="text-sm text-foreground break-words">{formatCurrency(solicitud.monto, solicitud.montoMoneda)}</p>
                </div>
                <div className="flex items-baseline py-1">
                  <FileText className="h-4 w-4 mr-1.5 text-primary shrink-0" />
                  <p className="text-sm text-foreground break-words">{solicitud.cantidadEnLetras || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-3 divide-y divide-border">
                <div className="pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
                    <DetailItem label="Consignatario" value={solicitud.consignatario} icon={Users} />
                    <DetailItem label="Declaración Número" value={solicitud.declaracionNumero} icon={Hash} />
                    <DetailItem label="Unidad Recaudadora" value={solicitud.unidadRecaudadora} icon={Building} />
                    <DetailItem label="Código 1" value={solicitud.codigo1} icon={Code} />
                    <DetailItem label="Codigo MUR" value={solicitud.codigo2} icon={Code} />
                  </div>
                </div>

                <div className="pt-3">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 items-start">
                      <DetailItem label="Banco" value={getBancoDisplay(solicitud)} icon={Landmark} />
                      {solicitud.banco !== 'ACCION POR CHEQUE/NO APLICA BANCO' && (
                          <>
                          <DetailItem label="Número de Cuenta" value={solicitud.numeroCuenta} icon={Hash} />
                          <DetailItem label="Moneda de la Cuenta" value={getMonedaCuentaDisplay(solicitud)} icon={Banknote} />
                          </>
                      )}
                   </div>
                </div>

                <div className="pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    <DetailItem label="Elaborar Cheque A" value={solicitud.elaborarChequeA} icon={User} />
                    <DetailItem label="Elaborar Transferencia A" value={solicitud.elaborarTransferenciaA} icon={User} />
                  </div>
                </div>

                <div className="pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <div className="space-y-1">
                      <CheckboxDetailItem label="Impuestos pendientes de pago por el cliente" checked={solicitud.impuestosPendientesCliente} />
                      <CheckboxDetailItem label="Impuestos pagados por el cliente mediante:" checked={solicitud.impuestosPagadosCliente} />
                      {solicitud.impuestosPagadosCliente && (
                        <div className="ml-6 pl-2 border-l border-dashed">
                          <DetailItem label="R/C No." value={solicitud.impuestosPagadosRC} />
                          <DetailItem label="T/B No." value={solicitud.impuestosPagadosTB} />
                          <DetailItem label="Cheque No." value={solicitud.impuestosPagadosCheque} />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <CheckboxDetailItem label="Se añaden documentos adjuntos" checked={solicitud.documentosAdjuntos} />
                      <CheckboxDetailItem label="Constancias de no retención" checked={solicitud.constanciasNoRetencion} />
                      {solicitud.constanciasNoRetencion && (
                        <div className="ml-6 pl-2 border-l border-dashed">
                          <CheckboxDetailItem label="1%" checked={solicitud.constanciasNoRetencion1} />
                          <CheckboxDetailItem label="2%" checked={solicitud.constanciasNoRetencion2} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <DetailItem label="Correos de Notificación" value={solicitud.correo} icon={Mail} />
                  <DetailItem label="Observación" value={solicitud.observation} icon={MessageSquare} />
                </div>
              </div>
            </div> {/* End of new wrapper for solicitud-specific details */}


            <div className="mt-6 w-full">
              <Image
                src="/imagenes/FOOTERSOLICITUDETAIL.svg"
                alt="Footer Solicitud Detail"
                width={800}
                height={100}
                className="w-full h-auto object-contain"
                data-ai-hint="company seal official"
              />
            </div>

            <div className="mt-8 flex justify-end space-x-3 no-print">
                <Button variant="outline" onClick={() => router.push('/examiner')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Lista
                </Button>
                <Button onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" /> Imprimir
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
