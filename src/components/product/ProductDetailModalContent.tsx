import type { Product } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProductDetailModalContentProps {
  product: Product;
  onClose: () => void;
}

const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
  <div>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className="text-base text-foreground">{String(value || 'N/A')}</p>
  </div>
);

export function ProductDetailModalContent({ product, onClose }: ProductDetailModalContentProps) {
  let statusBadges: React.ReactNode[] = [];
  if (product.isConform) statusBadges.push(<Badge key="conform" variant="default" className="bg-green-500/80 hover:bg-green-500/70 text-white">Conforme a factura</Badge>);
  if (product.isExcess) statusBadges.push(<Badge key="excess" variant="destructive" className="bg-red-500/80 hover:bg-red-500/70">Se encontró excedente</Badge>);
  if (product.isMissing) statusBadges.push(<Badge key="missing" variant="secondary" className="bg-yellow-500/80 hover:bg-yellow-500/70 text-black">Se encontró faltante</Badge>);
  if (product.isFault) statusBadges.push(<Badge key="fault" variant="outline" className="bg-gray-500/80 hover:bg-gray-500/70 text-white">Se encontró avería</Badge>);
  if (statusBadges.length === 0) statusBadges.push(<span key="no_status" className="text-sm text-muted-foreground">Sin estado específico</span>);

  return (
    <>
      <ScrollArea className="h-[65vh] pr-4"> {/* Adjust height as needed */}
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem label="Número de Item" value={product.itemNumber} />
                <DetailItem label="Peso" value={product.weight} />
                <div className="sm:col-span-2">
                    <DetailItem label="Descripción" value={product.description} />
                </div>
                <DetailItem label="Código HS Sugerido" value={product.hsCode} />
                <DetailItem label="Marca" value={product.brand} />
                <DetailItem label="Modelo" value={product.model} />
                <DetailItem label="Unidad de Medida" value={product.unitMeasure} />
                <DetailItem label="Serie" value={product.serial} />
                <DetailItem label="Origen" value={product.origin} />
                <DetailItem label="Numeración de Bultos" value={product.numberPackages} />
                <DetailItem label="Cantidad de Bultos" value={product.quantityPackages} />
                <DetailItem label="Cantidad de Unidades" value={product.quantityUnits} />
                <DetailItem label="Estado de Mercancía" value={product.packagingCondition} />
                <div className="sm:col-span-2">
                    <DetailItem label="Observación" value={product.observation} />
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Estado General</p>
                    <div className="flex flex-wrap gap-2 mt-1">{statusBadges}</div>
                </div>
            </div>
        </div>
      </ScrollArea>
      <DialogFooter className="mt-6">
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}
