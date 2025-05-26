
"use client";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppContext, ExamStep } from '@/context/AppContext';
import { downloadTxtFile, downloadExcelFile } from '@/lib/fileExporter';
import type { SolicitudData } from '@/types';
import { Download, Check, ArrowLeft, FileType, User, Landmark, FileText } from 'lucide-react'; 
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

import { useState, useEffect } from 'react';


// Helper component for displaying detail items in Preview
const PreviewDetailItem: React.FC<{ label: string; value?: string | number | null | boolean, icon?: React.ElementType }> = ({ label, value, icon: Icon }) => {
  let displayValue: string;
  if (typeof value === 'boolean') {
    displayValue = value ? 'Sí' : 'No';
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


export function PreviewScreen() {
  const { examData, solicitudes, setCurrentStep } = useAppContext();

  if (!examData) {
    return (
       <Card className="w-full max-w-5xl mx-auto custom-shadow">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-semibold text-foreground">Vista Previa de la Solicitud de Cheque</CardTitle>
          <CardDescription className="text-muted-foreground">Cargando datos del examen...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-10 text-muted-foreground">
            No se encontraron datos del examen. Por favor, inicie una nueva solicitud.
            <Button onClick={() => setCurrentStep(ExamStep.INITIAL_INFO)} className="mt-4">
              Ir al Inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleConfirm = () => {
    setCurrentStep(ExamStep.SUCCESS);
  };

  const handleDownloadExcel = () => {
    if (examData) {
      downloadExcelFile({ ...examData, products: solicitudes });
    }
  };
  
  const handleDownloadTxt = () => {
     if (examData) {
      downloadTxtFile(examData, solicitudes);
    }
  }

  const formatCurrency = (amount?: number | string, currency?: string) => {
    if (amount === undefined || amount === null || amount === '') return 'N/A';
    const num = Number(amount);
    if (isNaN(num)) return 'Inválido';
    let prefix = '';
    if (currency === 'cordoba') prefix = 'C$';
    else if (currency === 'dolar') prefix = 'US$';
    else if (currency === 'euro') prefix = '€';
    return `${prefix}${num.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getBeneficiarioText = (solicitud: SolicitudData) => {
    if (solicitud.elaborarChequeA && solicitud.elaborarTransferenciaA) {
      return `Cheque: ${solicitud.elaborarChequeA}, Transf: ${solicitud.elaborarTransferenciaA}`;
    }
    if (solicitud.elaborarChequeA) return `Cheque: ${solicitud.elaborarChequeA}`;
    if (solicitud.elaborarTransferenciaA) return `Transf: ${solicitud.elaborarTransferenciaA}`;
    return 'N/A';
  };

  const renderSolicitudStatusBadges = (solicitud: SolicitudData) => {
    const badges = [];
    if (solicitud.documentosAdjuntos) badges.push(<Badge key="docs" variant="outline" size="sm" className="bg-blue-100 text-blue-800 whitespace-nowrap"><FileType className="h-3 w-3 mr-1" /> Docs</Badge>);
    if (solicitud.impuestosPendientesCliente) badges.push(<Badge key="impuestos" variant="outline" size="sm" className="bg-orange-100 text-orange-800 whitespace-nowrap"><Download className="h-3 w-3 mr-1"/> Imp. Pend.</Badge>); // Icon changed to Download for example
    if (solicitud.constanciasNoRetencion) badges.push(<Badge key="retencion" variant="outline" size="sm" className="bg-purple-100 text-purple-800 whitespace-nowrap"><FileType className="h-3 w-3 mr-1" /> No Ret.</Badge>);
    
    if (badges.length === 0) {
      return <Badge variant="outline" size="sm">Sin Observaciones</Badge>;
    }
    return <div className="flex flex-wrap gap-1">{badges}</div>;
  };


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
            <div><span className="font-semibold text-foreground/80">NE:</span> {examData.ne}</div>
            <div><span className="font-semibold text-foreground/80">Referencia:</span> {examData.reference || 'N/A'}</div>
            <div><span className="font-semibold text-foreground/80">De:</span> {examData.manager}</div>
            <div><span className="font-semibold text-foreground/80">A:</span> {examData.recipient}</div>
            <div><span className="font-semibold text-foreground/80">Fecha:</span> {examData.date ? format(new Date(examData.date), "PPP", { locale: es }) : 'N/A'}</div>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium mb-3 text-foreground">Solicitudes ({solicitudes.length})</h4>
          {solicitudes.length > 0 ? (
            <div className="space-y-6">
              {solicitudes.map((solicitud, index) => (
                <div key={solicitud.id} className="p-4 border border-border bg-card rounded-lg shadow">
                  <h5 className="text-md font-semibold mb-3 text-primary">
                    Solicitud {index + 1}
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                    <PreviewDetailItem label="Monto" value={formatCurrency(solicitud.monto, solicitud.montoMoneda)} icon={Download}/> {/* Icon changed for example */}
                    <PreviewDetailItem label="Beneficiario" value={getBeneficiarioText(solicitud)} icon={User}/>
                    <PreviewDetailItem label="Banco" value={solicitud.banco === 'ACCION POR CHEQUE/NO APLICA BANCO' ? 'No Aplica Banco' : (solicitud.banco === 'Otros' ? solicitud.bancoOtros : solicitud.banco)} icon={Landmark}/>
                     <div className="md:col-span-2 lg:col-span-3">
                        <PreviewDetailItem label="Cantidad en Letras" value={solicitud.cantidadEnLetras} icon={FileText}/>
                     </div>
                     <div className="md:col-span-full pt-2 mt-2 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground">Estado General Solicitud</p>
                        <div>{renderSolicitudStatusBadges(solicitud)}</div>
                    </div>
                    <div className="md:col-span-full pt-2 mt-2 border-t border-border">
                        <PreviewDetailItem label="Observación" value={solicitud.observation} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No hay solicitudes para mostrar.</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-border mt-6">
            <Button variant="outline" onClick={() => setCurrentStep(ExamStep.PRODUCT_LIST)} className="hover:bg-accent/50 w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Lista de Solicitudes
            </Button>
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-end gap-3">
                <Button variant="outline" onClick={handleDownloadTxt} className="hover:bg-accent/50 w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" /> Descargar TXT
                </Button>
                <Button variant="outline" onClick={handleDownloadExcel} className="hover:bg-accent/50 w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" /> Descargar Excel
                </Button>
                {/* PDF Download functionality is temporarily disabled to prevent client-side exceptions.
                    When re-enabling, ensure all client-side rendering issues are resolved.
                <DynamicClientPDFDownload examData={examData} solicitudes={solicitudes} />
                */}
                <Button onClick={handleConfirm} className="btn-primary w-full sm:w-auto">
                    <Check className="mr-2 h-4 w-4" /> Confirmar Solicitud
                </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

    