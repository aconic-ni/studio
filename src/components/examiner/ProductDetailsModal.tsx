
"use client";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppContext } from '@/context/AppContext';
import type { SolicitudData, ExamData } from '@/types';
import { X, CheckSquare, Square, Banknote, Landmark, Hash, User, FileText, Mail, MessageSquare, Building, Code, Printer, CalendarDays, Info, Send, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Helper component for displaying detail items
const DetailItem: React.FC<{ label: string; value?: string | number | null | boolean; icon?: React.ElementType; className?: string }> = ({ label, value, icon: Icon, className }) => {
  let displayValue: string;
  if (typeof value === 'boolean') {
    displayValue = value ? 'Sí' : 'No';
  } else if (value instanceof Date) {
    displayValue = format(value, "PPP", { locale: es });
  }
   else {
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

export function ProductDetailsModal() {
  const { examData, solicitudToView, isProductDetailModalOpen, closeProductDetailModal } = useAppContext();

  if (!isProductDetailModalOpen || !solicitudToView) {
    return null;
  }

  const s = solicitudToView; // Alias for brevity

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

  const getBancoDisplay = () => {
    if (s.banco === 'ACCION POR CHEQUE/NO APLICA BANCO') return 'Acción por Cheque / No Aplica Banco';
    if (s.banco === 'Otros') return s.bancoOtros || 'Otros (No especificado)';
    return s.banco;
  };

  const getMonedaCuentaDisplay = () => {
    if (s.monedaCuenta === 'Otros') return s.monedaCuentaOtros || 'Otros (No especificado)';
    return s.monedaCuenta;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isProductDetailModalOpen} onOpenChange={(open) => { if (!open) closeProductDetailModal(); }}>
      <DialogContent className="max-w-3xl w-full p-0 printable-solicitud-detail-modal-area">
        <ScrollArea className="max-h-[85vh]">
          <div className="p-6">
            <DialogHeader className="mb-4" data-no-print="true">
              <DialogTitle className="text-xl font-semibold text-foreground">Detalles de la Solicitud</DialogTitle>
              <button
                onClick={closeProductDetailModal}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                aria-label="Cerrar"
              >
                <X className="h-6 w-6" />
              </button>
            </DialogHeader>

            {examData && (
              <div className="mb-6 p-4 border border-border rounded-md bg-secondary/30">
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
                  <DetailItem label="Monto Solicitado" value={formatCurrency(s.monto, s.montoMoneda)} icon={Banknote} />
                  <DetailItem label="Cantidad en Letras" value={s.cantidadEnLetras} icon={FileText} className="md:col-span-2"/>
                </div>
              </div>

              <div className="pt-3">
                <h4 className="text-md font-medium text-primary mb-1">Información Adicional de Solicitud</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
                  <DetailItem label="Consignatario" value={s.consignatario} icon={Users} />
                  <DetailItem label="Declaración Número" value={s.declaracionNumero} icon={Hash} />
                  <DetailItem label="Unidad Recaudadora" value={s.unidadRecaudadora} icon={Building} />
                  <DetailItem label="Código 1" value={s.codigo1} icon={Code} />
                  <DetailItem label="Código 2" value={s.codigo2} icon={Code} />
                </div>
              </div>

              <div className="pt-3">
                <h4 className="text-md font-medium text-primary mb-1">Cuenta Bancaria</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    <DetailItem label="Banco" value={getBancoDisplay()} icon={Landmark} />
                    {s.banco !== 'ACCION POR CHEQUE/NO APLICA BANCO' && (
                        <>
                        <DetailItem label="Número de Cuenta" value={s.numeroCuenta} icon={Hash} />
                        <DetailItem label="Moneda de la Cuenta" value={getMonedaCuentaDisplay()} icon={Banknote} />
                        </>
                    )}
                 </div>
              </div>

              <div className="pt-3">
                <h4 className="text-md font-medium text-primary mb-1">Beneficiario del Pago</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  <DetailItem label="Elaborar Cheque A" value={s.elaborarChequeA} icon={User} />
                  <DetailItem label="Elaborar Transferencia A" value={s.elaborarTransferenciaA} icon={User} />
                </div>
              </div>

              <div className="pt-3">
                <h4 className="text-md font-medium text-primary mb-1">Detalles Adicionales y Documentación</h4>
                <div className="space-y-1">
                    <CheckboxDetailItem label="Impuestos pagados por el cliente" checked={s.impuestosPagadosCliente} />
                    {s.impuestosPagadosCliente && (
                    <div className="ml-6 pl-2 border-l border-dashed">
                        <DetailItem label="R/C No." value={s.impuestosPagadosRC} />
                        <DetailItem label="T/B No." value={s.impuestosPagadosTB} />
                        <DetailItem label="Cheque No." value={s.impuestosPagadosCheque} />
                    </div>
                    )}
                    <CheckboxDetailItem label="Impuestos pendientes de pago por el cliente" checked={s.impuestosPendientesCliente} />
                    <CheckboxDetailItem label="Se añaden documentos adjuntos" checked={s.documentosAdjuntos} />
                    <CheckboxDetailItem label="Constancias de no retención" checked={s.constanciasNoRetencion} />
                    {s.constanciasNoRetencion && (
                    <div className="ml-6 pl-2 border-l border-dashed">
                        <CheckboxDetailItem label="1%" checked={s.constanciasNoRetencion1} />
                        <CheckboxDetailItem label="2%" checked={s.constanciasNoRetencion2} />
                    </div>
                    )}
                </div>
              </div>

              <div className="pt-3">
                <h4 className="text-md font-medium text-primary mb-1">Comunicación y Observaciones</h4>
                <DetailItem label="Correos de Notificación" value={s.correo} icon={Mail} />
                <DetailItem label="Observación" value={s.observation} icon={MessageSquare} />
              </div>
            </div>

            <DialogFooter className="mt-6 gap-3" data-no-print="true">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Imprimir
              </Button>
              <Button variant="outline" onClick={closeProductDetailModal}>Cerrar</Button>
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
