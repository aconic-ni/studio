
"use client";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/context/AppContext';
import type { SolicitudData } from '@/types';
import { Eye, Edit3, Trash2, MoreHorizontal, FileText, AlertTriangle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation'; // Import useRouter

export function ProductTable() {
  const { solicitudes, openAddProductModal, deleteSolicitud } = useAppContext();
  const router = useRouter(); // Initialize useRouter

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

  const renderStatusBadges = (solicitud: SolicitudData) => {
    const badges = [];
    if (solicitud.documentosAdjuntos) badges.push(<Badge key="docs" variant="outline" className="bg-blue-100 text-blue-800 whitespace-nowrap flex items-center"><FileText className="h-3 w-3 mr-1" /> Docs</Badge>);
    if (solicitud.impuestosPendientesCliente) badges.push(<Badge key="impuestos" variant="outline" className="bg-orange-100 text-orange-800 whitespace-nowrap flex items-center"><AlertTriangle className="h-3 w-3 mr-1"/> Imp. Pend.</Badge>);
    if (solicitud.constanciasNoRetencion) badges.push(<Badge key="retencion" variant="outline" className="bg-purple-100 text-purple-800 whitespace-nowrap flex items-center"><FileText className="h-3 w-3 mr-1" /> No Ret.</Badge>);

    if (badges.length === 0) {
      return <Badge variant="outline">Sin Observaciones</Badge>;
    }
    return <div className="flex flex-wrap gap-1">{badges}</div>;
  };


  if (solicitudes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay solicitudes añadidas. Haga clic en "Añadir Nueva Solicitud" para comenzar.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto table-container rounded-lg border">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</TableHead>
            <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beneficiario</TableHead>
            <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banco</TableHead>
            <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Estado</TableHead>
            <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white divide-y divide-gray-200">
          {solicitudes.map((solicitud) => (
            <TableRow key={solicitud.id} className="hover:bg-muted/50">
              <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(solicitud.monto, solicitud.montoMoneda)}</TableCell>
              <TableCell className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{getBeneficiarioText(solicitud)}</TableCell>
              <TableCell className="px-4 py-3 text-sm text-gray-500">{solicitud.banco === 'ACCION POR CHEQUE/NO APLICA BANCO' ? 'No Aplica' : (solicitud.banco === 'Otros' ? solicitud.bancoOtros : solicitud.banco) || 'N/A'}</TableCell>
              <TableCell className="px-4 py-3 text-sm text-gray-500">{renderStatusBadges(solicitud)}</TableCell>
              <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/examiner/solicitud/${solicitud.id}`)}>
                      <Eye className="mr-2 h-4 w-4" /> Ver
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openAddProductModal(solicitud)}>
                      <Edit3 className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      if (confirm('¿Está seguro de que desea eliminar esta solicitud?')) {
                        deleteSolicitud(solicitud.id);
                      }
                    }} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
