import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { EMAIL_RECIPIENTS, SHAREPOINT_IMAGE_LINK } from '@/lib/constants';

interface SuccessModalContentProps {
  managerName: string;
  onStartNew: () => void;
  onReviewPrevious: () => void;
}

export function SuccessModalContent({ managerName, onStartNew, onReviewPrevious }: SuccessModalContentProps) {
  return (
    <div className="p-6 text-center">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">¡Operación Exitosa!</h3>
      <div className="mb-6">
        <a
          href={SHAREPOINT_IMAGE_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
        >
          Añadir imágenes del predio acá
        </a>
        <p className="text-muted-foreground text-sm mt-2">
          Se notificó a:<br/> {EMAIL_RECIPIENTS.join(', ')}.<br/>
          Gracias por tu desempeño {managerName}.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Button onClick={onStartNew} className="w-full">Empezar de Nuevo</Button>
        <Button onClick={onReviewPrevious} variant="secondary" className="w-full">Revisar Examen Previo</Button>
      </div>
    </div>
  );
}
