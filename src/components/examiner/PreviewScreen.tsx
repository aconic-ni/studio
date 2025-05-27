
"use client";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppContext, SolicitudStep } from '@/context/AppContext';
import { downloadTxtFile, downloadDetailedExcelFile } from '@/lib/fileExporter'; 
import type { SolicitudData } from '@/types';
import { Download, Check, ArrowLeft, FileType, User, Landmark, FileText, Banknote, Hash, Users, Mail, MessageSquare, Building, Code, CalendarDays, Info, Send, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
// PDF Download is commented out due to unresolved errors
// import dynamic from 'next/dynamic';
// const DynamicClientPDFDownload = dynamic(() => import('@/components/pdf/ClientPDFDownload').then(mod => mod.ClientPDFDownload), { ssr: false, loading: () => <Button variant="outline" disabled><FileType className="mr-2 h-4 w-4" /> Cargando PDF...</Button> });


const PreviewDetailItem: React.FC<{ label: string; value?: string | number | null | boolean, icon?: React.ElementType, className?: string }> = ({ label, value, icon: Icon, className }) => {
  let displayValue: string;
  if (typeof value === 'boolean') {
    displayValue = value ? 'Sí' : 'No';
  } else {
    displayValue = String(value ?? 'N/A');
  }

  return (
    <div className={cn("py-1", className)}>
      <p className="text-xs font-medium text-muted-foreground flex items-center">
         {Icon && <Icon className="h-3.5 w-3.5 mr-1.5 text-primary/70" />}
         {label}
      </p>
      <p className="text-sm text-foreground break-words">{displayValue}</p>
    </div>
  );
};

const CheckboxPreviewItem: React.FC<{ label: string; checked?: boolean; subLabel?: string }> = ({ label, checked, subLabel }) => (
  <div className="flex items-center py-1">
    {checked ? <CheckSquare className="h-4 w-4 text-green-600 mr-2" /> : <Square className="h-4 w-4 text-muted-foreground mr-2" />}
    <span className="text-sm text-foreground">{label}</span>
    {subLabel && <span className="text-xs text-muted-foreground ml-1">{subLabel}</span>}
  </div>
);

const formatCurrencyPreview = (amount?: number | string, currency?: string) => {
    if (amount === undefined || amount === null || amount === '') return 'N/A';
    const num = Number(amount);
    if (isNaN(num)) return String(amount);
    let prefix = '';
    if (currency === 'cordoba') prefix = 'C$';
    else if (currency === 'dolar') prefix = 'US$';
    else if (currency === 'euro') prefix = '€';
    return `${prefix}${num.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getBancoDisplayPreview = (solicitud: SolicitudData) => {
    if (solicitud.banco === 'ACCION POR CHEQUE/NO APLICA BANCO') return 'Acción por Cheque / No Aplica Banco';
    if (solicitud.banco === 'Otros') return solicitud.bancoOtros || 'Otros (No especificado)';
    return solicitud.banco;
};
  
const getMonedaCuentaDisplayPreview = (solicitud: SolicitudData) => {
    if (solicitud.monedaCuenta === 'Otros') return solicitud.monedaCuentaOtros || 'Otros (No especificado)';
    return solicitud.monedaCuenta;
};


export function PreviewScreen() {
  const { initialContextData, solicitudes, setCurrentStep } = useAppContext();

  if (!initialContextData) {
    return (
       <Card className="w-full max-w-5xl mx-auto custom-shadow">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-semibold text-foreground">Vista Previa de la Solicitud de Cheque</CardTitle>
          <CardDescription className="text-muted-foreground">Cargando datos iniciales...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-10 text-muted-foreground">
            No se encontraron datos iniciales. Por favor, inicie una nueva solicitud.
            <Button onClick={() => setCurrentStep(SolicitudStep.INITIAL_DATA)} className="mt-4">
              Ir al Inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleConfirm = () => {
    setCurrentStep(SolicitudStep.SUCCESS);
  };

  const handleDownloadExcel = () => {
    if (initialContextData) {
      downloadDetailedExcelFile({ ...initialContextData, products: solicitudes });
    }
  };
  
  const handleDownloadTxt = () => {
     if (initialContextData) {
      downloadTxtFile(initialContextData, solicitudes);
    }
  }

  return (
    <Card className="w-full max-w-5xl mx-auto custom-shadow">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-semibold text-foreground">Vista Previa de la Solicitud de Cheque</CardTitle>
        <CardDescription className="text-muted-foreground">Revise la información antes de confirmar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-lg font-medium mb-2 text-foreground">Informacion General</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 bg-secondary/30 p-4 rounded-md shadow-sm text-sm">
            <PreviewDetailItem label="A (Destinatario)" value={initialContextData.recipient} icon={Send} />
            <PreviewDetailItem label="De (Usuario)" value={initialContextData.manager} icon={User} />
            <PreviewDetailItem label="Fecha de Solicitud" value={initialContextData.date ? format(new Date(initialContextData.date), "PPP", { locale: es }) : 'N/A'} icon={CalendarDays} />
            <PreviewDetailItem label="NE (Tracking NX1)" value={initialContextData.ne} icon={Info} />
            <PreviewDetailItem label="Referencia" value={initialContextData.reference || 'N/A'} icon={FileText} />
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium mb-3 text-foreground">Solicitudes ({solicitudes.length})</h4>
          {solicitudes.length > 0 ? (
            <ScrollArea className="h-[400px] w-full">
              <div className="space-y-6 pr-4">
                {solicitudes.map((solicitud, index) => (
                  <div key={solicitud.id} className="p-4 border border-border bg-card rounded-lg shadow">
                    <h5 className="text-md font-semibold mb-3 text-primary">
                      Solicitud {index + 1} ({solicitud.id})
                    </h5>
                    <div className="space-y-3 divide-y divide-border/50">
                      
                      <div className="pt-2">
                        <h6 className="text-sm font-medium text-accent mb-1">Detalles del Monto</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                          <PreviewDetailItem label="Monto Solicitado" value={formatCurrencyPreview(solicitud.monto, solicitud.montoMoneda)} icon={Banknote} />
                          <PreviewDetailItem label="Cantidad en Letras" value={solicitud.cantidadEnLetras} icon={FileText} className="md:col-span-2"/>
                        </div>
                      </div>

                      
                      <div className="pt-3">
                        <h6 className="text-sm font-medium text-accent mb-1">Información Adicional</h6>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
                           <PreviewDetailItem label="Consignatario" value={solicitud.consignatario} icon={Users} />
                           <PreviewDetailItem label="Declaración Número" value={solicitud.declaracionNumero} icon={Hash} />
                           <PreviewDetailItem label="Unidad Recaudadora" value={solicitud.unidadRecaudadora} icon={Building} />
                           <PreviewDetailItem label="Código 1" value={solicitud.codigo1} icon={Code} />
                           <PreviewDetailItem label="Codigo MUR" value={solicitud.codigo2} icon={Code} />
                         </div>
                      </div>

                      
                      <div className="pt-3">
                        <h6 className="text-sm font-medium text-accent mb-1">Cuenta Bancaria</h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 items-start">
                          <PreviewDetailItem label="Banco" value={getBancoDisplayPreview(solicitud)} icon={Landmark} />
                          {solicitud.banco !== 'ACCION POR CHEQUE/NO APLICA BANCO' && (
                            <>
                              <PreviewDetailItem label="Número de Cuenta" value={solicitud.numeroCuenta} icon={Hash} />
                              <PreviewDetailItem label="Moneda de la Cuenta" value={getMonedaCuentaDisplayPreview(solicitud)} icon={Banknote} />
                            </>
                          )}
                        </div>
                      </div>

                      
                      <div className="pt-3">
                        <h6 className="text-sm font-medium text-accent mb-1">Beneficiario del Pago</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                          <PreviewDetailItem label="Elaborar Cheque A" value={solicitud.elaborarChequeA} icon={User} />
                          <PreviewDetailItem label="Elaborar Transferencia A" value={solicitud.elaborarTransferenciaA} icon={User} />
                        </div>
                      </div>

                      
                      <div className="pt-3">
                        <h6 className="text-sm font-medium text-accent mb-1">Documentación y Estados</h6>
                        <div className="space-y-1">
                            <CheckboxPreviewItem label="Impuestos pagados por el cliente" checked={solicitud.impuestosPagadosCliente} />
                            {solicitud.impuestosPagadosCliente && (
                            <div className="ml-6 pl-2 border-l border-dashed text-xs">
                                <PreviewDetailItem label="R/C No." value={solicitud.impuestosPagadosRC} />
                                <PreviewDetailItem label="T/B No." value={solicitud.impuestosPagadosTB} />
                                <PreviewDetailItem label="Cheque No." value={solicitud.impuestosPagadosCheque} />
                            </div>
                            )}
                            <CheckboxPreviewItem label="Impuestos pendientes de pago por el cliente" checked={solicitud.impuestosPendientesCliente} />
                            <CheckboxPreviewItem label="Se añaden documentos adjuntos" checked={solicitud.documentosAdjuntos} />
                            <CheckboxPreviewItem label="Constancias de no retención" checked={solicitud.constanciasNoRetencion} />
                            {solicitud.constanciasNoRetencion && (
                            <div className="ml-6 pl-2 border-l border-dashed text-xs">
                                <CheckboxPreviewItem label="1%" checked={solicitud.constanciasNoRetencion1} />
                                <CheckboxPreviewItem label="2%" checked={solicitud.constanciasNoRetencion2} />
                            </div>
                            )}
                        </div>
                      </div>
                      
                      
                      <div className="pt-3">
                        <h6 className="text-sm font-medium text-accent mb-1">Comunicación</h6>
                        <PreviewDetailItem label="Correos de Notificación" value={solicitud.correo} icon={Mail} />
                        <PreviewDetailItem label="Observación" value={solicitud.observation} icon={MessageSquare} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground">No hay solicitudes para mostrar.</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-border mt-6">
            <Button variant="outline" onClick={() => setCurrentStep(SolicitudStep.PRODUCT_LIST)} className="hover:bg-accent/50 w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Lista de Solicitudes
            </Button>
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-end gap-3">
                <Button variant="outline" onClick={handleDownloadTxt} className="hover:bg-accent/50 w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" /> Descargar TXT
                </Button>
                <Button variant="outline" onClick={handleDownloadExcel} className="hover:bg-accent/50 w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" /> Descargar Excel
                </Button>
                {/* <DynamicClientPDFDownload examData={initialContextData} solicitudes={solicitudes} className="w-full sm:w-auto"/> */}
                <Button onClick={handleConfirm} className="btn-primary w-full sm:w-auto">
                    <Check className="mr-2 h-4 w-4" /> Confirmar Solicitud
                </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
