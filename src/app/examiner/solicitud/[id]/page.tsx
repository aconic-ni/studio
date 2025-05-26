
"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import type { ExamData, SolicitudData } from '@/types';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Printer, CheckSquare, Square, Banknote, Landmark, Hash, User, FileText, Mail, MessageSquare, Building, Code, CalendarDays, Info, Send, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

// Helper components (can be moved to a shared file if reused extensively)
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
    <div className={className || "py-1"}>
      <p className="text-xs font-medium text-muted-foreground flex items-center">
        {Icon && <Icon className="h-3.5 w-3.5 mr-1.5 text-primary/70" />}
        {label}
      </p>
      <p className="text-sm text-foreground">{displayValue}</p>
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
        router.push('/examiner'); // Redirect if not found
      }
      setLoading(false);
    } else if (solicitudes.length === 0 && !loading) {
      // Edge case: context might not be ready on direct load
      // Potentially fetch data here if context is empty, or rely on Auth guard to redirect
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


  if (loading) {
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
          <p className="text-xl mb-4">Solicitud no encontrada.</p>
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
                {/* PDF Download can be re-added here if PDF generation is fixed */}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {examData && (
              <div className="mb-6 p-4 border border-border rounded-md bg-secondary/30 card-print-styles">
                <h3 className="text-lg font-semibold mb-2 text-primary">Información General del Examen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  <DetailItem label="A (Destinatario)" value={examData.recipient} icon={Send} />
                  <DetailItem label="De (Colaborador)" value={examData.manager} icon={User} />
                  <DetailItem label="Fecha de Examen" value={examData.date ? format(new Date(examData.date), "PPP", { locale: es }) : 'N/A'} icon={CalendarDays} />
                  <DetailItem label="NE (Tracking NX1)" value={examData.ne} icon={Info} />
                  <DetailItem label="Referencia" value={examData.reference} icon={FileText} />
                </div>
              </div>
            )}

            <div className="space-y-3 divide-y divide-border">
              <div className="pt-2">
                <h4 className="text-md font-medium text-primary mb-1">Detalles del Monto</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  <DetailItem label="Monto Solicitado" value={formatCurrency(solicitud.monto, solicitud.montoMoneda)} icon={Banknote} />
                  <DetailItem label="Cantidad en Letras" value={solicitud.cantidadEnLetras} icon={FileText} className="md:col-span-2"/>
                </div>
              </div>

              <div className="pt-3">
                <h4 className="text-md font-medium text-primary mb-1">Información Adicional de Solicitud</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
                  <DetailItem label="Consignatario" value={solicitud.consignatario} icon={Users} />
                  <DetailItem label="Declaración Número" value={solicitud.declaracionNumero} icon={Hash} />
                  <DetailItem label="Unidad Recaudadora" value={solicitud.unidadRecaudadora} icon={Building} />
                  <DetailItem label="Código 1" value={solicitud.codigo1} icon={Code} />
                  <DetailItem label="Código 2" value={solicitud.codigo2} icon={Code} />
                </div>
              </div>

              <div className="pt-3">
                <h4 className="text-md font-medium text-primary mb-1">Cuenta Bancaria</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
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
                <h4 className="text-md font-medium text-primary mb-1">Beneficiario del Pago</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  <DetailItem label="Elaborar Cheque A" value={solicitud.elaborarChequeA} icon={User} />
                  <DetailItem label="Elaborar Transferencia A" value={solicitud.elaborarTransferenciaA} icon={User} />
                </div>
              </div>

              <div className="pt-3">
                <h4 className="text-md font-medium text-primary mb-1">Detalles Adicionales y Documentación</h4>
                <div className="space-y-1">
                    <CheckboxDetailItem label="Impuestos pagados por el cliente" checked={solicitud.impuestosPagadosCliente} />
                    {solicitud.impuestosPagadosCliente && (
                    <div className="ml-6 pl-2 border-l border-dashed">
                        <DetailItem label="R/C No." value={solicitud.impuestosPagadosRC} />
                        <DetailItem label="T/B No." value={solicitud.impuestosPagadosTB} />
                        <DetailItem label="Cheque No." value={solicitud.impuestosPagadosCheque} />
                    </div>
                    )}
                    <CheckboxDetailItem label="Impuestos pendientes de pago por el cliente" checked={solicitud.impuestosPendientesCliente} />
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

              <div className="pt-3">
                <h4 className="text-md font-medium text-primary mb-1">Comunicación y Observaciones</h4>
                <DetailItem label="Correos de Notificación" value={solicitud.correo} icon={Mail} />
                <DetailItem label="Observación" value={solicitud.observation} icon={MessageSquare} />
              </div>
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
