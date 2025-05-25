
"use client";
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppContext } from '@/context/AppContext';
import type { SolicitudFormData } from './FormParts/zodSchemas';
import { solicitudSchema } from './FormParts/zodSchemas';
import type { SolicitudData } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { X, Hash, Weight, FileText, Tag, Puzzle, Ruler, Fingerprint, Globe, Barcode, Package, Box, ShieldCheck, MessageSquare, Banknote, Info, Building, Code, Landmark, Mail, FilePlus, DollarSign, Euro, ListFilter } from 'lucide-react';
// Placeholder for numberToWords, actual implementation would be more complex
// import { numberToWords } from '@/lib/numberToWords';


export function AddProductModal() {
  const {
    isAddProductModalOpen,
    closeAddProductModal,
    addProduct, // This will now add a SolicitudData
    updateProduct, // This will now update a SolicitudData
    editingProduct // This will be a SolicitudData
  } = useAppContext();
  const { user } = useAuth();
  const [showBancoOtros, setShowBancoOtros] = useState(false);
  const [showMonedaCuentaOtros, setShowMonedaCuentaOtros] = useState(false);

  const form = useForm<SolicitudFormData>({
    resolver: zodResolver(solicitudSchema),
    defaultValues: {
      monto: undefined,
      montoMoneda: 'cordoba',
      cantidadEnLetras: '',
      declaracionNumero: '',
      unidadRecaudadora: '',
      codigo1: '',
      codigo2: '',
      banco: undefined,
      bancoOtros: '',
      numeroCuenta: '',
      monedaCuenta: undefined,
      monedaCuentaOtros: '',
      elaborarChequeA: '',
      elaborarTransferenciaA: '',
      impuestosPagadosCliente: false,
      impuestosPagadosRC: '',
      impuestosPagadosTB: '',
      impuestosPagadosCheque: '',
      impuestosPendientesCliente: false,
      documentosAdjuntos: false,
      constanciasNoRetencion: false,
      constanciasNoRetencion1: false,
      constanciasNoRetencion2: false,
      correo: user?.email || '',
      observation: '',
    },
  });

  const watchedBanco = form.watch("banco");
  const watchedMonedaCuenta = form.watch("monedaCuenta");
  const watchedImpuestosPagados = form.watch("impuestosPagadosCliente");
  const watchedConstanciasNoRetencion = form.watch("constanciasNoRetencion");
  // const watchedMonto = form.watch("monto");
  // const watchedMontoMoneda = form.watch("montoMoneda");

  useEffect(() => {
    setShowBancoOtros(watchedBanco === 'Otros');
  }, [watchedBanco]);

  useEffect(() => {
    setShowMonedaCuentaOtros(watchedMonedaCuenta === 'Otros');
  }, [watchedMonedaCuenta]);

  // useEffect(() => {
  //   if (watchedMonto && watchedMontoMoneda) {
  //     // Placeholder: Implement actual numberToWords logic here
  //     // form.setValue("cantidadEnLetras", numberToWords(Number(watchedMonto), watchedMontoMoneda));
  //     form.setValue("cantidadEnLetras", `Cantidad en letras para ${watchedMonto} ${watchedMontoMoneda} (auto)`);
  //   } else {
  //     form.setValue("cantidadEnLetras", "");
  //   }
  // }, [watchedMonto, watchedMontoMoneda, form]);


  useEffect(() => {
    if (isAddProductModalOpen) {
      const defaultCorreo = user?.email || '';
      if (editingProduct) {
        form.reset({
          ...editingProduct,
          monto: editingProduct.monto !== undefined ? Number(editingProduct.monto) : undefined,
          correo: editingProduct.correo || defaultCorreo,
        } as SolicitudFormData); // Cast to SolicitudFormData
        setShowBancoOtros(editingProduct.banco === 'Otros');
        setShowMonedaCuentaOtros(editingProduct.monedaCuenta === 'Otros');
      } else {
        form.reset({
          monto: undefined,
          montoMoneda: 'cordoba',
          cantidadEnLetras: '',
          declaracionNumero: '',
          unidadRecaudadora: '',
          codigo1: '',
          codigo2: '',
          banco: undefined,
          bancoOtros: '',
          numeroCuenta: '',
          monedaCuenta: undefined,
          monedaCuentaOtros: '',
          elaborarChequeA: '',
          elaborarTransferenciaA: '',
          impuestosPagadosCliente: false,
          impuestosPagadosRC: '',
          impuestosPagadosTB: '',
          impuestosPagadosCheque: '',
          impuestosPendientesCliente: false,
          documentosAdjuntos: false,
          constanciasNoRetencion: false,
          constanciasNoRetencion1: false,
          constanciasNoRetencion2: false,
          correo: defaultCorreo,
          observation: '',
        });
        setShowBancoOtros(false);
        setShowMonedaCuentaOtros(false);
      }
    }
  }, [editingProduct, form, isAddProductModalOpen, user]);

  function onSubmit(data: SolicitudFormData) {
    const solicitudData = {
        ...data,
        monto: data.monto !== undefined ? Number(data.monto) : undefined,
    };

    if (editingProduct && editingProduct.id) {
      updateProduct({ ...solicitudData, id: editingProduct.id } as SolicitudData);
    } else {
      addProduct(solicitudData as Omit<SolicitudData, 'id'>);
    }
    closeAddProductModal();
  }

  if (!isAddProductModalOpen) return null;

  return (
    <Dialog open={isAddProductModalOpen} onOpenChange={(open) => !open && closeAddProductModal()}>
      <DialogContent className="max-w-4xl w-full p-0"> {/* Increased width */}
        <ScrollArea className="max-h-[85vh]">
        <div className="p-6">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {editingProduct ? 'Editar Solicitud' : 'Nueva solicitud'}
          </DialogTitle>
           <button
            onClick={closeAddProductModal}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6 text-muted-foreground" />
          </button>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Section 1: Monto y Cantidad */}
            <div className="space-y-4 p-4 border rounded-md">
              <h4 className="text-md font-medium text-primary mb-2">Detalles del Monto</h4>
              <FormField control={form.control} name="monto" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-sm">
                    <DollarSign className="mr-2 h-4 w-4 text-primary" />
                    Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad de:
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} value={field.value ?? ''} className="w-2/3" /></FormControl>
                    <FormField control={form.control} name="montoMoneda" render={({ field: selectField }) => (
                      <Select onValueChange={selectField.onChange} defaultValue={selectField.value}>
                        <FormControl><SelectTrigger className="w-1/3"><SelectValue placeholder="Moneda" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="cordoba">C$ (Córdobas)</SelectItem>
                          <SelectItem value="dolar">US$ (Dólares)</SelectItem>
                          <SelectItem value="euro">€ (Euros)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}/>
                  </div>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="cantidadEnLetras" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Cantidad en letras</FormLabel>
                  <FormControl><Textarea rows={2} placeholder="Ej: UN MIL CÓRDOBAS NETOS CON 00/100" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>

            {/* Section 2: Detalles de la Solicitud */}
            <div className="space-y-4 p-4 border rounded-md">
              <h4 className="text-md font-medium text-primary mb-2">Información Adicional de Solicitud</h4>
              <FormField control={form.control} name="declaracionNumero" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Hash className="mr-2 h-4 w-4 text-primary" />Declaracion Número</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage />
                </FormItem>
              )}/>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="unidadRecaudadora" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Building className="mr-2 h-4 w-4 text-primary" />Unidad recaudadora</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="codigo1" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Code className="mr-2 h-4 w-4 text-primary" />Codigo</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="codigo2" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Code className="mr-2 h-4 w-4 text-primary" />Codigo</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage />
                  </FormItem>
                )}/>
              </div>
            </div>

            {/* Section 3: Cuenta Bancaria */}
            <div className="space-y-4 p-4 border rounded-md">
               <h4 className="text-md font-medium text-primary mb-3">Cuenta</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="banco" render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center"><Landmark className="mr-2 h-4 w-4 text-primary" />Banco</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un banco" /></SelectTrigger></FormControl>
                            <SelectContent>
                            {["BAC", "BANPRO", "BANCENTRO", "FICOSHA", "AVANZ", "ATLANTIDA", "Otros"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    {showBancoOtros && (
                        <FormField control={form.control} name="bancoOtros" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><FilePlus className="mr-2 h-4 w-4 text-primary" />Especifique Otro Banco</FormLabel>
                            <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}/>
                    )}
                     <FormField control={form.control} name="numeroCuenta" render={({ field }) => (
                        <FormItem className={showBancoOtros ? '' : 'md:col-span-1'}>
                            <FormLabel className="flex items-center"><ListFilter className="mr-2 h-4 w-4 text-primary" />Numero de cuenta</FormLabel>
                            <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="monedaCuenta" render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center"><Banknote className="mr-2 h-4 w-4 text-primary" />Moneda de la cuenta</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccione moneda" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="cordoba">C$ (Córdobas)</SelectItem>
                                <SelectItem value="dolar">US$ (Dólares)</SelectItem>
                                <SelectItem value="euro">€ (Euros)</SelectItem>
                                <SelectItem value="Otros">Otros</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    {showMonedaCuentaOtros && (
                        <FormField control={form.control} name="monedaCuentaOtros" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><FilePlus className="mr-2 h-4 w-4 text-primary" />Especifique Otra Moneda</FormLabel>
                            <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}/>
                    )}
                </div>
            </div>

            {/* Section 4: Beneficiarios */}
             <div className="space-y-4 p-4 border rounded-md">
                <h4 className="text-md font-medium text-primary mb-2">Beneficiario del Pago</h4>
                <FormField control={form.control} name="elaborarChequeA" render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center"><Tag className="mr-2 h-4 w-4 text-primary" />Elaborar cheque a</FormLabel>
                    <FormControl><Input {...field} placeholder="Nombre del beneficiario del cheque" value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="elaborarTransferenciaA" render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center"><Tag className="mr-2 h-4 w-4 text-primary" />Elaborar transferencia a</FormLabel>
                    <FormControl><Input {...field} placeholder="Nombre del beneficiario de la transferencia" value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}/>
            </div>
            
            {/* Section 5: Checkboxes y sub-campos */}
            <div className="space-y-4 p-4 border rounded-md">
              <h4 className="text-md font-medium text-primary mb-3">Detalles Adicionales y Documentación</h4>
              <FormField control={form.control} name="impuestosPagadosCliente" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel>Impuestos pagados por el cliente mediante:</FormLabel>
                  </FormItem>
              )}/>
              {watchedImpuestosPagados && (
                  <div className="ml-8 mt-2 space-y-3 grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded-md bg-secondary/30">
                  <FormField control={form.control} name="impuestosPagadosRC" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">R/C</FormLabel><FormControl><Input placeholder="No. R/C" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="impuestosPagadosTB" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">T/B</FormLabel><FormControl><Input placeholder="No. T/B" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="impuestosPagadosCheque" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">Cheque</FormLabel><FormControl><Input placeholder="No. Cheque" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  </div>
              )}

              <FormField control={form.control} name="impuestosPendientesCliente" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel>Impuestos pendientes de pago por el cliente</FormLabel>
                  </FormItem>
              )}/>
              <FormField control={form.control} name="documentosAdjuntos" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel>Se añaden documentos adjuntos</FormLabel>
                  </FormItem>
              )}/>
              <FormField control={form.control} name="constanciasNoRetencion" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel>Constancias de no retencion</FormLabel>
                  </FormItem>
              )}/>
              {watchedConstanciasNoRetencion && (
                <div className="ml-8 mt-2 space-x-6 flex p-3 border rounded-md bg-secondary/30">
                    <FormField control={form.control} name="constanciasNoRetencion1" render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="text-sm font-normal">1%</FormLabel>
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="constanciasNoRetencion2" render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="text-sm font-normal">2%</FormLabel>
                        </FormItem>
                    )}/>
                </div>
              )}
            </div>

            {/* Section 6: Otros */}
            <div className="space-y-4 p-4 border rounded-md">
                <h4 className="text-md font-medium text-primary mb-2">Comunicación y Observaciones</h4>
                <FormField control={form.control} name="correo" render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-primary" />Correo (separar con ; para múltiples)</FormLabel>
                    <FormControl><Input {...field} placeholder="usuario@ejemplo.com; otro@ejemplo.com" value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="observation" render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center"><MessageSquare className="mr-2 h-4 w-4 text-primary" />Observación</FormLabel>
                    <FormControl><Textarea rows={3} {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}/>
            </div>

            <DialogFooter className="pt-6 gap-3">
              <Button type="button" variant="outline" onClick={closeAddProductModal}>Cancelar</Button>
              <Button type="submit" className="btn-primary">{editingProduct ? 'Guardar Cambios' : 'Guardar Solicitud'}</Button>
            </DialogFooter>
          </form>
        </Form>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
